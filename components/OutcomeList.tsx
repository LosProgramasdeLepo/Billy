import React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { removeOutcome, OutcomeData } from '../api/api';
import moment from 'moment';
import { useAppContext } from '@/hooks/useAppContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatNumber } from '@/lib/utils';

interface OutcomeListProps {
  category?: string;
  showDateSeparators?: boolean;
}

export const OutcomeList: React.FC<OutcomeListProps> = ({ category, showDateSeparators = false }) => {
  const { outcomeData, categoryData, currentProfileId, refreshOutcomeData, refreshCategoryData, refreshBalanceData } = useAppContext();

  // For deleting
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeData | null>(null);

  const filteredOutcomeData = useMemo(() => {
    return outcomeData?.filter(outcome => outcome.category === category) || [];
  }, [outcomeData, category]);

  const sortedOutcomeData = useMemo(() => {
    const dataToSort = category ? filteredOutcomeData : outcomeData;
    return dataToSort?.slice().sort((a, b) => 
      new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime()
    ) ?? [];
  }, [outcomeData, filteredOutcomeData, category]);

  const groupedOutcomeData = useMemo(() => {
    if (!showDateSeparators) return null;

    const grouped = sortedOutcomeData.reduce((acc, outcome) => {
      const date = moment(outcome.created_at).startOf('day').format('YYYY-MM-DD');
      if (!acc[date]) acc[date] = [];
      acc[date].push(outcome);
      return acc;
    }, {} as Record<string, OutcomeData[]>);

    return Object.entries(grouped).map(([date, outcomes]) => ({
      date,
      data: outcomes,
    }));
  }, [sortedOutcomeData, showDateSeparators]);

  // Remove category
  const handleLongPress = useCallback((outcome: OutcomeData) => {
    setSelectedOutcome(outcome);
    Alert.alert("Eliminar gasto", "¿Está seguro de que quiere eliminar el gasto?", [{text: "Cancelar", style: "cancel"}, {text: "Eliminar", style: "destructive",
      onPress: async () => {
        if (outcome) handleRemoveOutcome(currentProfileId??"", outcome.id ?? "0");
      }
    }]);
  }, [outcomeData]);

  const handleRemoveOutcome = async (profile: string, id: string) => {
    await removeOutcome(profile, id);
    refreshOutcomeData();
    refreshCategoryData();
    refreshBalanceData();
  };

  const getCategoryIcon = useCallback((categoryID: string) => {
    const category = categoryData?.find(c => c.id === categoryID);
    return category?.icon || 'cash-multiple';
  }, [categoryData]);

  const renderItem = useCallback(({ item }: { item: OutcomeData | { date: string } }) => {
    if ('date' in item) {
      return (
        <View style={styles.dateHeader}>
          <ThemedText style={styles.dateHeaderText}>{moment(item.date).format('DD MMMM YYYY')}</ThemedText>
        </View>
      );
    }

    return (
      <TouchableOpacity onLongPress={() => handleLongPress(item)}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Icon name={getCategoryIcon(item.category)} size={24} color="red"/>
          </View>
          <View style={styles.textContainer}>
            <ThemedText style={styles.description}>{item.description}</ThemedText>
            <ThemedText style={styles.date}>{moment(item.created_at ?? "").format('HH:mm')}</ThemedText>
          </View>
          <ThemedText style={styles.amount}>- ${formatNumber(item.amount)}</ThemedText>
        </View>
      </TouchableOpacity>
    );
  }, [handleLongPress, getCategoryIcon]);

  const keyExtractor = useCallback((item: OutcomeData | { date: string }) => {
    if ('date' in item) return item.date;
    return item.id?.toString() || '';
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={showDateSeparators ? groupedOutcomeData?.flatMap(group => [{ date: group.date }, ...group.data]) : sortedOutcomeData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
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
  textContainer: {
    flex: 1,
  },
  description: {
    fontSize: 18,
    color: '#555',
    fontWeight: '400',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
  },
  dateHeader: {
    paddingHorizontal: 8,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
});
