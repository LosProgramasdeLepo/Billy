import React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { removeIncome, IncomeData } from '../api/api';
import { FontAwesome } from '@expo/vector-icons';
import moment from 'moment';
import { useAppContext } from '@/hooks/useAppContext';

interface IncomeListProps {
  layout: string;
  // ... other props
}

export const IncomeList: React.FC<IncomeListProps> = ({ layout, ...props }) => {
  const { incomeData, currentProfileId, refreshIncomeData } = useAppContext();

  // For deleting
  const [selectedIncome, setSelectedIncome] = useState<IncomeData | null>(null);

  const sortedIncomeData = useMemo(() => {
    return incomeData?.slice().sort((a, b) => 
      new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime()
    ) ?? [];
  }, [incomeData]);

  // Remove category
  const handleLongPress = useCallback((income: IncomeData) => {
    setSelectedIncome(income);
    Alert.alert("Eliminar ingreso", "¿Está seguro de que quiere eliminar el ingreso?", [{text: "Cancelar", style: "cancel"}, {text: "Eliminar", style: "destructive",
      onPress: async () => {
        if (income) handleRemoveIncome(currentProfileId??"", income.id ?? "0")
      }
    }]);
  }, [incomeData]);

  const handleRemoveIncome = async (profile: string, id: string) => {
    await removeIncome(profile, id);
    refreshIncomeData();
  };

  const renderItem = useCallback(({ item }: { item: IncomeData }) => (
    <TouchableOpacity onLongPress={() => handleLongPress(item)}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <FontAwesome name="dollar" size={24} color="green"/>
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={styles.description}>{item.description}</ThemedText>
          <ThemedText style={styles.date}>{moment(item.created_at ?? "").format('DD/MM/YYYY')}</ThemedText>
        </View>
        <ThemedText style={styles.amount}>+ ${item.amount.toFixed(2)}</ThemedText>
      </View>
    </TouchableOpacity>
  ), [handleLongPress]);

  const keyExtractor = useCallback((item: IncomeData) => item.id?.toString() || '', []);

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedIncomeData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        paddingHorizontal: 16,
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
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'green',
    },
});
