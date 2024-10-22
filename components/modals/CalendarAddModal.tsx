import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, Animated, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addIncome, addOutcome, fetchCategories, CategoryData } from '../../api/api';
import { styles } from '../estilos/calendarStyles';
import { useAppContext } from '@/hooks/useAppContext';


interface CobroPagoPopUpProps {
  isVisible: boolean;
  onClose: () => void;
  initialType: 'Income' | 'Outcome';
  refreshTransactions: () => void;
}

const CalendarAddModal = ({ isVisible, onClose, initialType, refreshTransactions }: CobroPagoPopUpProps) => {
  const { refreshIncomeData, refreshOutcomeData, refreshCategoryData, refreshBalanceData, currentProfileId } = useAppContext();

  const [type, setType] = useState<'Income' | 'Outcome'>(initialType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [bubbleAnimation] = useState(new Animated.Value(initialType === 'Outcome' ? 0 : 1));
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateType, setDateType] = useState('Fecha Exacta');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [recurrence, setRecurrence] = useState('Nunca');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isVisible) fetchCategories(currentProfileId || "").then(categories => setCategories(categories || []));
  }, [isVisible, currentProfileId]);

  useEffect(() => {
    // Actualizar la posición del bubble cuando cambia initialType
    Animated.timing(bubbleAnimation, {
      toValue: initialType === 'Income' ? 0 : 1,
      duration: 0, // Sin animación para el cambio inicial
      useNativeDriver: false,
    }).start();
    setType(initialType === 'Income' ? 'Income' : 'Outcome');
  }, [initialType]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  async function handleSubmit(): Promise<void> {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!selectedCategory && type === 'Outcome') {
      Alert.alert("Error de categoría", "Por favor, selecciona una categoría antes de continuar.", [{ text: "OK" }]);
      return;
    }

    if (dateType === 'Periodo') {
      if (startDate >= endDate) {
        Alert.alert("Error de fecha", "La fecha 'Desde' debe ser anterior a la fecha 'Hasta'.", [{ text: "OK" }]);
        return;
      }
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber)) {
      Alert.alert("Error de monto", "Por favor, ingresa un monto válido.", [{ text: "OK" }]);
      return;
    }

    if (type === 'Income') {
      await addIncome(currentProfileId || "", amountNumber, description, date);
      refreshIncomeData();
    } 
    
    else {
      await addOutcome(currentProfileId || "", selectedCategory, amountNumber, description, date);
      refreshOutcomeData();
    }

    refreshCategoryData();
    refreshBalanceData();
    refreshTransactions();
    setAmount('');
    setDescription('');
    setDate(new Date());
    setStartDate(new Date());
    setEndDate(new Date());
    setSelectedCategory('');
    setRecurrence('Nunca');
    setIsSubmitting(false);
    onClose();
  }

  const switchType = useCallback((newType: 'Income' | 'Outcome') => {
    setType(newType);
    Animated.timing(bubbleAnimation, {
      toValue: newType === 'Outcome' ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [bubbleAnimation]);
  
  const bubbleInterpolation = bubbleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '48%'],
  });

  const getTextColor = (buttonType: 'Income' | 'Outcome') => {
    return type === buttonType ? '#000000' : '#FFFFFF';
  };

  const renderTypeSelector = useMemo(() => (
    <View style={styles.typeSelector}>
      <View style={[styles.bubbleBackground, { backgroundColor: '#B39CD4' }]}>
        <Animated.View style={[styles.bubble, { left: bubbleInterpolation }]}/>
      </View>

      <TouchableOpacity style={styles.typeButton} onPress={() => switchType('Income')}>
        <Text style={[styles.typeButtonText, { color: getTextColor('Income') }]}>Ingreso</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.typeButton} onPress={() => switchType('Outcome')}>
        <Text style={[styles.typeButtonText, { color: getTextColor('Outcome') }]}>Gasto</Text>
      </TouchableOpacity>
    </View>
  ), [bubbleInterpolation, switchType, getTextColor]);

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={30} color="#000000"/>
          </TouchableOpacity>
          
          <View style={styles.contentContainer}>
            {renderTypeSelector}

            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción"
              placeholderTextColor="#AAAAAA"
            />

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="Monto"
              placeholderTextColor="#AAAAAA"
            />

            {type === 'Outcome' && (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCategory}
                  onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  >
                  <Picker.Item label="Selecciona una categoría" value=""/>
                  {categories.map((category) => (
                    <Picker.Item key={category.id} label={category.name} value={category.id} />
                  ))}
                </Picker>
              </View>
            )}

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={dateType}
                onValueChange={(itemValue) => setDateType(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Fecha Exacta" value="Fecha Exacta" />
                <Picker.Item label="Periodo" value="Periodo" />
              </Picker>
            </View>

            {dateType === 'Fecha Exacta' ? (
              <>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                  <Text style={[styles.datePickerText, !date && styles.placeholderText]}>
                    {date ? date.toDateString() : 'Fecha'}
                  </Text>
                  <Icon name="calendar-today" size={24} color="#007BFF" style={styles.datePickerIcon}/>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker 
                    value={date} 
                    mode="date" 
                    display="default" 
                    onChange={handleDateChange}
                  />
                )}
              </>
            ) : (
              <>
                <Text style={styles.dateLabel}>Desde:</Text>
                <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.datePickerButton}>
                  <Text style={[styles.datePickerText, !startDate && styles.placeholderText]}>
                    {startDate ? startDate.toDateString() : 'Fecha de inicio'}
                  </Text>
                  <Icon name="calendar-today" size={24} color="#007BFF" style={styles.datePickerIcon}/>
                </TouchableOpacity>
                
                {showStartDatePicker && (
                  <DateTimePicker 
                    value={startDate} 
                    mode="date" 
                    display="default" 
                    onChange={handleStartDateChange}
                  />
                )}

                <Text style={styles.dateLabel}>Hasta:</Text>
                <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.datePickerButton}>
                  <Text style={[styles.datePickerText, !endDate && styles.placeholderText]}>
                    {endDate ? endDate.toDateString() : 'Fecha de fin'}
                  </Text>
                  <Icon name="calendar-today" size={24} color="#007BFF" style={styles.datePickerIcon}/>
                </TouchableOpacity>
                
                {showEndDatePicker && (
                  <DateTimePicker 
                    value={endDate} 
                    mode="date" 
                    display="default" 
                    onChange={handleEndDateChange}
                  />
                )}
              </>
            )}

            <Text style={styles.dateLabel}>Recurrencia:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={recurrence}
                onValueChange={(itemValue) => setRecurrence(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Nunca" value="Nunca" />
                <Picker.Item label="Semanal" value="Semanal" />
                <Picker.Item label="Mensual" value="Mensual" />
                <Picker.Item label="Anual" value="Anual" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.acceptButton} onPress={handleSubmit}>
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CalendarAddModal;
