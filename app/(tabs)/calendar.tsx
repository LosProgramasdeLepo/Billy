import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text, FlatList, Alert } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import CalendarAddModal from '../../components/modals/CalendarAddModal';
import { getOutcomesFromDateRange, getIncomesFromDateRange } from '../../api/api';
import { useFocusEffect } from '@react-navigation/native';
import BillyHeader from "@/components/BillyHeader";
import TimePeriodModal from "@/components/modals/TimePeriodModal";
import { useAppContext } from '@/hooks/useAppContext';
import { TransactionList } from "@/components/TransactionList";

const customArrowLeft = () => {
  return (
    <View style={styles.arrowContainer}>
      <View style={[styles.arrow, styles.arrowLeft]} />
    </View>
  );
};

const customArrowRight = () => {
  return (
    <View style={styles.arrowContainer}>
      <View style={[styles.arrow, styles.arrowRight]} />
    </View>
  );
};

export default function CalendarScreen() {
  const { currentProfileId, refreshIncomeData, refreshOutcomeData } = useAppContext();

  const [markedDates, setMarkedDates] = useState({});
  const [currentDate, setCurrentDate] = useState(moment().format('YYYY-MM-DD'));
  const [key, setKey] = useState(0);
  const [viewMode, setViewMode] = useState('month');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'Income' | 'Outcome'>('Outcome');

  const [isTimePeriodModalVisible, setIsTimePeriodModalVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{start: string, end: string} | null>(null);

  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);

  const years = useMemo(() => {
    const currentYear = moment().year();
    return Array.from({ length: 24 }, (_, i) => currentYear - 20 + i);
  }, []);

  const onYearPress = () => {
    setViewMode('year');
  };

  const onDayPress = useCallback((day: any) => {
    const selectedDate = moment(day.dateString).utc().startOf('day');
    if (selectionStart) {
      const start = moment(selectionStart).utc().startOf('day');
      const end = selectedDate;
      if (end.isBefore(start)) setSelectedRange({ start: end.format('YYYY-MM-DD'), end: start.format('YYYY-MM-DD') });
      else setSelectedRange({ start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') });
      setSelectionStart(null);
    } 
    else setSelectedRange({ start: selectedDate.format('YYYY-MM-DD'), end: selectedDate.format('YYYY-MM-DD') });
  }, [selectionStart]);
  
  const onDayLongPress = useCallback((day: any) => {
    setSelectionStart(day.dateString);
    Alert.alert('Fecha de inicio', `${day.dateString} seleccionada. Ahora seleccione una fecha final.`);
  }, []);

  const handleDayPressIn = useCallback((day: any) => {
    const timeout = setTimeout(() => { onDayLongPress(day); }, 500);
    setLongPressTimeout(timeout);
  }, [onDayLongPress]);

  const handleDayPressOut = useCallback(() => {
    if (longPressTimeout) clearTimeout(longPressTimeout);
  }, [longPressTimeout]);

  const selectYear = useCallback((year: number) => {
    const newDate = moment(currentDate).year(year).format('YYYY-MM-DD');
    setCurrentDate(newDate);
    setViewMode('month');
    setKey(prevKey => prevKey + 1);
  }, [currentDate]);

  const renderCustomHeader = useCallback((date: any) => {
    const month = date.toString('MMMM');
    const year = date.toString('yyyy');
    return (
      <TouchableOpacity onPress={onYearPress} style={styles.customHeaderContainer}>
        <Text style={styles.customHeaderText}>{`${month} ${year}`}</Text>
      </TouchableOpacity>
    );
  }, [onYearPress]);

  const renderYearPicker = useCallback(() => (
    <FlatList
      data={years}
      numColumns={3}
      renderItem={({item}) => (
        <TouchableOpacity onPress={() => selectYear(item)} style={styles.yearItem}>
          <Text style={styles.yearText}>{item}</Text>
        </TouchableOpacity>
      )}
      keyExtractor={item => item.toString()}
      contentContainerStyle={styles.yearPickerContainer}
    />
  ), [years, selectYear]);

  const openModal = useCallback((type: 'Income' | 'Outcome') => {
    setModalType(type);
    setModalVisible(true);
  }, []);

  const processTransactions = useCallback(async () => {
    if (!currentProfileId) return;
    
    const startOfMonth = moment(currentDate).startOf('month').toDate();
    const endOfMonth = moment(currentDate).endOf('month').toDate();
    
    const incomes = await getIncomesFromDateRange(currentProfileId, startOfMonth, endOfMonth);
    const outcomes = await getOutcomesFromDateRange(currentProfileId, startOfMonth, endOfMonth);

    const marked: { [key: string]: { dots: { key: string; color: string }[] } } = {};

    const addDot = (date: string, id: string, color: string) => {
      if (marked[date]) marked[date].dots.push({ key: `${color === '#4CAF50' ? 'Income' : 'Outcome'}-${id}`, color }); 
      else marked[date] = { dots: [{ key: `${color === '#4CAF50' ? 'Income' : 'Outcome'}-${id}`, color }] };
    };

    // Combine income and outcome data
    const allTransactions = [
      ...(Array.isArray(incomes) ? incomes.map(income => ({ ...income, type: 'Income' })) : []),
      ...(Array.isArray(outcomes) ? outcomes.map(outcome => ({ ...outcome, type: 'Outcome' })) : [])
    ];

    // Process all transactions in a single loop
    allTransactions.forEach(transaction => {
      const date = moment(transaction.created_at).format('YYYY-MM-DD');
      const color = transaction.type === 'Income' ? '#4CAF50' : '#F44336';
      addDot(date, transaction.id?.toString() || '', color);
    });

    setMarkedDates(marked);
  }, [currentDate, currentProfileId, getOutcomesFromDateRange]);

  useFocusEffect(
    useCallback(() => {
        if (currentProfileId) processTransactions();
    }, [currentProfileId, refreshIncomeData, refreshOutcomeData])
  );
  
  const memoizedCalendar = useMemo(() => (
    <Calendar
      key={key}
      current={currentDate}
      markedDates={markedDates}
      markingType={'multi-dot'}
      renderArrow={(direction: 'left' | 'right') => direction === 'left' ? customArrowLeft() : customArrowRight()}
      onMonthChange={(month: { dateString: string }) => { setCurrentDate(month.dateString); }}
      renderHeader={renderCustomHeader}
      theme={{ 'stylesheet.calendar.header': { monthText: { ...styles.monthText, color: '#735BF2' } } }}
      onDayPress={onDayPress}
      onDayLongPress={onDayLongPress}
      dayPressAndHold={handleDayPressIn}
      dayPressOut={handleDayPressOut}
    />
  ), [key, currentDate, markedDates, renderCustomHeader, onDayPress]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4B00B8', '#20014E']} start={{x: 1, y: 0}} end={{x: 0, y: 1}} style={styles.gradientContainer}>
          <BillyHeader/>
          <View style={styles.contentContainer}>
            <View style={styles.calendarContainer}>
              {viewMode === 'month' ? memoizedCalendar : renderYearPicker()}
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.buttonCobro} onPress={() => openModal('Income')}>
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                <Text style={styles.buttonTextCobro}>Agregar cobro</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonPago} onPress={() => openModal('Outcome')}>
                <Ionicons name="remove-circle-outline" size={24} color="#370185" />
                <Text style={styles.buttonTextPago}>Agregar pago</Text>
              </TouchableOpacity>
            </View>
            {selectedRange && (
            <View style={styles.transactionListContainer}>
              <TransactionList
                timeRange="custom"
                customStartDate={new Date(selectedRange.start)}
                customEndDate={new Date(selectedRange.end)}
                showHeader={false}
                scrollEnabled={true}
              />
            </View>
          )}
          </View>
          <CalendarAddModal
            isVisible={modalVisible}
            onClose={() => setModalVisible(false)}
            initialType={modalType}
            refreshTransactions={processTransactions}
          />
          {selectedRange && (
            <TimePeriodModal
              isVisible={isTimePeriodModalVisible}
              onClose={() => setIsTimePeriodModalVisible(false)}
              startDate={new Date(selectedRange.start)}
              endDate={new Date(selectedRange.end)}
            />
          )}
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
  transactionListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    marginHorizontal: '2.5%',
  },
  calendarContainer: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
    justifyContent: 'center',
    width: '100%',
  },
  arrowContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 10,
    borderRightWidth: 10,
  },
  arrowLeft: {
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#735BF2',
    borderLeftColor: 'transparent',
  },
  arrowRight: {
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#735BF2',
    borderRightColor: 'transparent',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  customHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#735BF2',
  },
  yearItem: {
    flex: 1,
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#735BF2',
  },
  yearText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  yearPickerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  buttonCobro: {
    backgroundColor: '#370185',
    borderRadius: 12.66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 15,
    width: '48%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonPago: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12.66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    width: '48%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonTextCobro: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
  },
  buttonTextPago: {
    color: '#370185',
    fontSize: 14,
    marginLeft: 10,
  },
});