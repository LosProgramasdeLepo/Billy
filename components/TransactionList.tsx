import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, FlatList, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { removeIncome, IncomeData, removeOutcome, OutcomeData, getBillParticipants } from '../api/api';
import moment from 'moment';
import 'moment/locale/es';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '@/hooks/useAppContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ExpenseDetailsModal } from './modals/ExpenseDetailsModal';

moment.locale('es');

interface TransactionListProps {
  scrollEnabled?: boolean;
  showHeader?: boolean;
  showDateSeparators?: boolean;
  timeRange: 'all' | 'day' | 'week' | 'month' | 'year' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
}

export const TransactionList: React.FC<TransactionListProps> = ({ scrollEnabled = true, showHeader, showDateSeparators = true, timeRange, customStartDate, customEndDate }) => {
  const { incomeData, outcomeData, categoryData, currentProfileId, refreshIncomeData, refreshOutcomeData, refreshCategoryData, refreshBalanceData } = useAppContext();
  
  const navigation = useNavigation();
  const [selectedTransaction, setSelectedTransaction] = useState<IncomeData | OutcomeData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [paidBy, setPaidBy] = useState<string>('');

  const sortTransactions = useCallback((transactions: (IncomeData | OutcomeData)[]) => {
    return transactions.sort((a, b) => new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime());
  }, []);
  
  const getCategoryIcon = useCallback((categoryID: string) => {
    const category = categoryData?.find(c => c.id === categoryID);
    return category?.icon || 'cash-multiple';
  }, [categoryData]);

  const groupedTransactions = useMemo(() => {
    if (!incomeData || !outcomeData) return [];
    const combined = [
      ...incomeData.map(income => ({ ...income, type: 'income' as const })),
      ...outcomeData.map(outcome => ({ ...outcome, type: 'outcome' as const }))
    ];
    const sorted = sortTransactions(combined);
    
    const filteredTransactions = sorted.filter(transaction => {
      const transactionDate = moment(transaction.created_at).utc().startOf('day');
      switch (timeRange) {
        case 'day':
          return transactionDate.isSame(moment().utc().startOf('day'), 'day');
        case 'week':
          return transactionDate.isSameOrAfter(moment().utc().startOf('week'), 'day');
        case 'month':
          return transactionDate.isSameOrAfter(moment().utc().startOf('month'), 'day');
        case 'year':
          return transactionDate.isSameOrAfter(moment().utc().startOf('year'), 'day');
        case 'custom':
          if (customStartDate && customEndDate) {
            const start = moment(customStartDate).utc().startOf('day');
            const end = moment(customEndDate).utc().endOf('day');
            return transactionDate.isBetween(start, end, 'day', '[]');
          }
          return true;
        default:
          return true;
      }
    });
  
    if (!showDateSeparators) {
      return filteredTransactions;
    }
  
    const grouped = filteredTransactions.reduce((acc, transaction) => {
      const date = moment(transaction.created_at).utc().format('YYYY-MM-DD');
      if (!acc[date]) acc[date] = [];
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, (IncomeData | OutcomeData)[]>);
  
    return Object.entries(grouped).map(([date, transactions]) => ({ date, data: transactions }));
  }, [incomeData, outcomeData, sortTransactions, timeRange, customStartDate, customEndDate, showDateSeparators]);

  const handlePress = useCallback(async (transaction: IncomeData | OutcomeData) => {
    setSelectedTransaction(transaction);
    if ((transaction as OutcomeData).bill_id) {
      const billParticipants = await getBillParticipants((transaction as OutcomeData).bill_id);
      if (billParticipants) {
        setParticipants(billParticipants.map(p => p.email));
        const payer = billParticipants.find(p => p.amount_paid === transaction.amount);
        setPaidBy(payer ? payer.email : 'Desconocido');
      }
    } else {
      setParticipants([]);
      setPaidBy('');
    }
    setModalVisible(true);
  }, []);

  const handleLongPress = useCallback((transaction: IncomeData | OutcomeData) => {
    setSelectedTransaction(transaction);
    Alert.alert("Eliminar transacción", "¿Está seguro de que quiere eliminar la transacción?", [
      {text: "Cancelar", style: "cancel"}, 
      {text: "Eliminar", style: "destructive",
        onPress: async () => {
          if ((transaction as any).type === "income") handleRemoveIncome(currentProfileId ?? "", transaction.id ?? "");
          else handleRemoveOutcome(currentProfileId ?? "", transaction.id ?? "");
        }
      }
    ]);
  }, [currentProfileId]);

  const handleRemoveIncome = async (profile: string, id: string) => {
    await removeIncome(profile, id);
    refreshIncomeData();
    refreshBalanceData();
  };

  const handleRemoveOutcome = async (profile: string, id: string) => {
    await removeOutcome(profile, id);
    refreshOutcomeData();
    refreshCategoryData();
    refreshBalanceData(); 
  };

  const renderTransactionItem = useCallback(({ item }: { item: IncomeData | OutcomeData }) => (
    <TouchableOpacity onPress={() => handlePress(item)} onLongPress={() => handleLongPress(item)}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          {(item as any).type === 'income' ? (
            <Icon name="cash-plus" size={24} color="green" />
          ) : (
            <Icon name={getCategoryIcon((item as OutcomeData).category) || 'help-circle'} size={24} color="red" />
          )}
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={styles.description}>{item.description}</ThemedText>
          <ThemedText style={styles.time}>
            {showDateSeparators ? moment(item.created_at).format('HH:mm') : moment(item.created_at).format('DD/MM/YYYY[,] HH:mm')}
          </ThemedText>
        </View>
        <ThemedText style={[(item as any).type === 'income' ? styles.incomeAmount : styles.outcomeAmount]}>
          {(item as any).type === 'income' ? '+' : '-'} ${item.amount.toFixed(2)}
        </ThemedText>
      </View>
    </TouchableOpacity>
  ), [handlePress, handleLongPress, getCategoryIcon, showDateSeparators]);

  const renderDateHeader = useCallback(({ date }: { date: string }) => (
    <View style={styles.dateHeader}>
      <ThemedText style={styles.dateText}>{moment(date).format('DD [de] MMMM[,] YYYY')}</ThemedText>
    </View>
  ), []);

  const renderItem = useCallback(({ item }: { item: IncomeData | OutcomeData | { date: string, data: (IncomeData | OutcomeData)[] } }) => {
    if ('date' in item) {
      return (
        <>
          {renderDateHeader({ date: item.date })}
          {item.data.map((transaction) => (
            <React.Fragment key={transaction.id}>
              {renderTransactionItem({ item: transaction })}
            </React.Fragment>
          ))}
        </>
      );
    }
    return renderTransactionItem({ item });
  }, [renderDateHeader, renderTransactionItem]);

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.rowContainer}>
          <Text style={styles.transactionsTitle}>Actividad reciente</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionsScreen' as never)}>
            <Text style={styles.viewMoreText}>Ver más</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={groupedTransactions}
        renderItem={renderItem}
        keyExtractor={(item) => 'date' in item ? item.date : item.id?.toString() || ''}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      />
      {selectedTransaction && (
        <ExpenseDetailsModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          expense={{
            id: selectedTransaction.id ?? "",
            amount: selectedTransaction.amount,
            description: selectedTransaction.description,
            paidBy: paidBy,
            participants: participants,
            categoryIcon: getCategoryIcon((selectedTransaction as OutcomeData).category),
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconContainer: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateHeader: {
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  textContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  incomeAmount: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  outcomeAmount: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  viewMoreText: {
    color: '#4B00B8',
    textDecorationLine: 'underline',
  },
  container: {
    flex: 1,
  },
});
