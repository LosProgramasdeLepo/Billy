import React, { useEffect, useState, useCallback } from 'react';
import { Image, StyleSheet, View, Dimensions } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { TransactionList } from '@/components/TransactionList';
import { BalanceCard } from '@/components/BalanceCard';
import { CategoryList } from '@/components/CategoryList';
import AddButton from '@/components/addButton';
import { fetchIncomes, fetchOutcomes, getBalance, IncomeData, OutcomeData, CategoryData, fetchCategories } from '../../api/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [incomeData, setIncomeData] = useState<IncomeData[] | null>(null);
  const [outcomeData, setOutcomeData] = useState<OutcomeData[] | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[] | null>(null);
  const [balance, setBalanceData] = useState<number | null>(null);

  // Recupero información
  async function getIncomeData() {
    const data = await fetchIncomes('0f58d714-0ec2-40df-8dae-668caf357ac3');
    setIncomeData(data);
  };

  async function getOutcomeData() {
    const data = await fetchOutcomes('0f58d714-0ec2-40df-8dae-668caf357ac3');
    setOutcomeData(data);
  };

  async function getCategoryData() {
    const data = await fetchCategories('0f58d714-0ec2-40df-8dae-668caf357ac3');
    setCategoryData(data);
  };
  
  async function getBalanceData() {
    const data = await getBalance('0f58d714-0ec2-40df-8dae-668caf357ac3');
    setBalanceData(data);
  };

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      getIncomeData(),
      getOutcomeData(),
      getBalanceData(),
      getCategoryData()
    ]);
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const totalIncome = incomeData?.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) ?? 0;
  const totalExpenses = outcomeData?.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) ?? 0;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{light: '#4B00B8', dark: '#20014E'}}
      headerImage={
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/Billy/logo1.png')} style={styles.billyLogo}/>
        </View>
      }>
        <>
          <BalanceCard balance={balance} incomes={totalIncome} outcomes={totalExpenses} refreshData={getBalanceData}/>
          <AddButton 
            refreshIncomeData={getIncomeData} 
            refreshOutcomeData={getOutcomeData} 
            refreshCategoryData={getCategoryData}
            categories={categoryData || []}  // Añade esta línea
          />
          <CategoryList 
            categoryData={categoryData} 
            refreshCategoryData={getCategoryData} 
            refreshAllData={refreshAllData}
            showAddButton={true} // Esto es opcional, ya que true es el valor por defecto
          />
          <View>
            <ThemedText style={styles.title}>Actividad reciente</ThemedText>
            <TransactionList 
              incomeData={incomeData} 
              outcomeData={outcomeData} 
              refreshIncomeData={getIncomeData} 
              refreshOutcomeData={getOutcomeData} 
              refreshCategoryData={getCategoryData} 
              scrollEnabled={false}
            />
          </View>
        </>
      


 {/* Botones para Sign Up y Login */}
     {/* <View style={styles.buttonContainer}>
        <Button title="Sign Up" onPress={handleAddUser} />
        {signUpMessage && <Text>{signUpMessage}</Text>}
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} />
        {loginMessage && <Text>{loginMessage}</Text>}
      </View>*/}

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  billyLogo: {
    height: 100,
    width: 100,
    resizeMode: 'contain',
  },
  logoContainer:{
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingTop: 45,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    margin: 10,
    alignItems: 'center',
  }
});