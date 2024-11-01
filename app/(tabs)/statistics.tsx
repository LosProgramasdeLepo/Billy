import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import StatsComponent from '@/components/StatsComponent';
import { BillyHeader } from "@/components/BillyHeader";
import { isProfileShared } from "@/api/api";
import { useFocusEffect } from "@react-navigation/native";
import { useAppContext } from "@/hooks/useAppContext";

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const Stats = React.memo(({ selectedMonth, selectedYear, mode }: { selectedMonth: number; selectedYear: number, mode: boolean | null }) => {
  const memoKey = useMemo(() => `${selectedMonth}-${selectedYear}-${mode}`, [selectedMonth, selectedYear, mode]);

  return (
    <View style={styles.statsContainer}>
      <StatsComponent key={memoKey} month={selectedMonth} year={selectedYear} mode={mode}/>
    </View>
  );
});

const App = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedButton, setSelectedButton] = useState<'month' | 'year'>('month');
  const [mode, setMode] = useState<'category' | 'person'>('category');

  const { currentProfileId } = useAppContext();
  const [shared, setShared] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (currentProfileId) isProfileShared(currentProfileId).then(setShared);
    }, [currentProfileId])
  );

  const toggleSelector = (type: 'month' | 'year') => () => {
    setSelectedButton(type);
  };

  const changeDate = (type: 'month' | 'year', increment: number) => () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    if (type === 'month') {
      const newMonth = (selectedMonth + increment + 12) % 12;
      const newYear = selectedYear + Math.floor((selectedMonth + increment) / 12);
      
      if (newYear < currentYear || (newYear === currentYear && newMonth <= currentMonth)) {
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
      }
    } 
    
    else {
      const newYear = selectedYear + increment;
      if (newYear <= currentYear) {
        setSelectedYear(newYear);
        if (newYear === currentYear && selectedMonth > currentMonth) {
          setSelectedMonth(currentMonth);
        }
      }
    }
  };

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'category' ? 'person' : 'category');
  };

  const canGoForward = selectedButton === 'month' 
    ? selectedYear < currentDate.getFullYear() || (selectedYear === currentDate.getFullYear() && selectedMonth < currentDate.getMonth())
    : selectedYear < currentDate.getFullYear();

  return (
    <LinearGradient colors={['#4B00B8', '#20014E']} style={styles.gradientContainer}>
      <BillyHeader/>
      <View style={styles.contentContainer}>
        <View style={styles.selectorWrapper}>
          <View style={styles.selectorContainer}>
            <TouchableOpacity 
              style={[styles.selectorButton, selectedButton === 'month' && styles.selectorButtonActive]} 
              onPress={toggleSelector('month')}
            >
              <Text style={[styles.selectorButtonText, selectedButton === 'month' && styles.selectorButtonTextActive]}>Mes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.selectorButton, selectedButton === 'year' && styles.selectorButtonActive]} 
              onPress={toggleSelector('year')}
            >
              <Text style={[styles.selectorButtonText, selectedButton === 'year' && styles.selectorButtonTextActive]}>Año</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.dateSelector}>
            <TouchableOpacity onPress={changeDate(selectedButton, -1)} style={styles.arrowButton}>
              <Text style={styles.arrowText}>{"<"}</Text>
            </TouchableOpacity>
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateText}>
                {selectedButton === 'month' ? `${months[selectedMonth]} ${selectedYear}` : selectedYear.toString()}
              </Text>
            </View>
            <View style={styles.arrowButton}>
              {canGoForward && (
                <TouchableOpacity onPress={changeDate(selectedButton, 1)}>
                  <Text style={styles.arrowText}>{">"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {shared && (
            <TouchableOpacity onPress={toggleMode} style={styles.circularButton}>
              <Text style={styles.circularButtonText}>
                {mode === 'category' ? 'C' : 'P'}
              </Text>
            </TouchableOpacity>
          )}
          <Stats selectedMonth={selectedMonth} selectedYear={selectedYear} mode={mode === 'category' ? false : true} />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  contentContainer: {
    marginHorizontal: '2.5%',
    flex: 1,
  },
  selectorWrapper: {
    alignItems: 'center',
  },
  selectorContainer: {
    marginTop: 5,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 4,
  },
  selectorButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  selectorButtonActive: {
    backgroundColor: 'white',
  },
  selectorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectorButtonTextActive: {
    color: '#4B00B8',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButton: {
    width: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: '#4B00B8',
  },
  dateTextContainer: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 210,
  },
  dateText: {
    fontSize: 24,
    color: '#4B00B8',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    flex: 1,
  },
  circularButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#87CEFA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
    top: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 3,
  },
  circularButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default App;