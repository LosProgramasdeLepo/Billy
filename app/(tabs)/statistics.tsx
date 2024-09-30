import React, { useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import StatsComponent from '@/components/StatsComponent';
import { BillyHeader } from "@/components/BillyHeader";
import { Dimensions } from "react-native";

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const Stats = ({ selectedMonth, selectedYear } : {selectedMonth:number, selectedYear:number}) => {

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.monthText}>{months[selectedMonth]} {selectedYear}</Text>
        <StatsComponent month={selectedMonth} year={selectedYear}/>
      </View>
    </View>
  );
};

const App = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [showMonthSelector, setShowMonthSelector] = useState(true);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [selectedButton, setSelectedButton] = useState('month');

  const toggleMonthSelector = () => {
    setSelectedButton('month');
    setShowMonthSelector(true);
    setShowYearSelector(false);
  };

  const toggleYearSelector = () => {
    setSelectedButton('year');
    setShowYearSelector(true);
    setShowMonthSelector(false);
  };

  const nextMonth = () => {
    setSelectedMonth((prev) => (prev + 1) % months.length);
  };

  const prevMonth = () => {
    setSelectedMonth((prev) => (prev - 1 + months.length) % months.length);
  };

  const nextYear = () => {
    setSelectedYear((prev) => prev + 1);
  };

  const prevYear = () => {
    setSelectedYear((prev) => prev - 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4B00B8', '#20014E']} style={styles.gradientContainer}>
        <BillyHeader title="Estadísticas" subtitle="Mirá tu actividad mensual o anual."/>
        {/* zona selector mes año */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity
            onPress={toggleMonthSelector}
            style={[ styles.selectorButton, { backgroundColor: selectedButton === 'month' ? '#4B00B8' : '#fff' } ]}>
            <Text style={[ styles.selectorText, { color: selectedButton === 'month' ? '#fff' : '#4A00E0' } ]}>Mes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleYearSelector}
            style={[ styles.selectorButton, { backgroundColor: selectedButton === 'year' ? '#4B00B8' : '#fff' } ]}>
            <Text style={[ styles.selectorText, { color: selectedButton === 'year' ? '#fff' : '#4A00E0' } ]}> Año </Text>
          </TouchableOpacity>
        </View>

          {showMonthSelector && (
            <View style={styles.selectorContainer}>
              <TouchableOpacity onPress={prevMonth} style={styles.arrowButton}>
                <Text style={styles.arrowText}>{"<"}</Text>
              </TouchableOpacity>
              <Text style={styles.selectorText}>{months[selectedMonth]}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.arrowButton}>
                <Text style={styles.arrowText}>{">"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {showYearSelector && (
            <View style={styles.selectorContainer}>
              <TouchableOpacity onPress={prevYear} style={styles.arrowButton}>
                <Text style={styles.arrowText}>{"<"}</Text>
              </TouchableOpacity>
              <Text style={styles.selectorText}>{selectedYear}</Text>
              <TouchableOpacity onPress={nextYear} style={styles.arrowButton}>
                <Text style={styles.arrowText}>{">"}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Stats selectedMonth={selectedMonth} selectedYear={selectedYear}/>
       
      </LinearGradient>
    </SafeAreaView>
  );
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor:'#3e0196',
  },
  card: {
    width: SCREEN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
    flex: 1
  },
  monthText: {
    fontSize: 28,
    color: '#3e0196',
    textAlign: 'center',
  },
  amountText: {
    fontSize: 48,
    color: '#3c3c3c',
    textAlign: 'center',
    marginVertical: 20,
  },
  categoryList: {
    marginVertical: 10,
  },
  category: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  categoryName: {
    fontSize: 18,
    color: '#3c3c3c',
  },
  categoryAmount: {
    fontSize: 18,
    color: '#3c3c3c',
  },
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  arrowButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  arrowText: {
    fontSize: 24,
    color: '#fff',
  },
  selectorText: {
    fontSize: 18,
    color: '#fff',
    marginHorizontal: 10,
  },
  selectorButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#4B00B8',
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  gradientContainer: {
    flex: 1,
  },
});

export default App;
