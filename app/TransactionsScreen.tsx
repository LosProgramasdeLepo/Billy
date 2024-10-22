import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { TransactionList } from '@/components/TransactionList';
import { BillyHeader } from '@/components/BillyHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '@/hooks/useAppContext';

export default function TransactionsScreen() {
  const { currentProfileId, incomeData, outcomeData, refreshIncomeData, refreshOutcomeData, refreshCategoryData, refreshProfileData } = useAppContext();

  const fetchData = useCallback(async () => {
    await refreshProfileData();
    await Promise.all([refreshCategoryData(), refreshIncomeData(), refreshOutcomeData()]);
  }, [refreshProfileData, refreshCategoryData, refreshIncomeData, refreshOutcomeData]);

  useFocusEffect(useCallback(() => {
    fetchData();
  }, [fetchData]));

  const memoizedTransactionList = useMemo(() => (
    <TransactionList scrollEnabled={true} showHeader={false} timeRange='all'/>
  ), [incomeData, outcomeData, refreshIncomeData, refreshOutcomeData, refreshCategoryData, currentProfileId]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4B00B8', '#20014E']} style={styles.gradientContainer}>
        <BillyHeader/>
        <View style={styles.contentContainer}>
          {memoizedTransactionList}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    marginHorizontal: '2.5%',
    padding: 15,
  },
});