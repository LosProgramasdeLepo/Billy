import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addIncome, addOutcome, fetchCategories, CategoryData,isProfileShared, getSharedUsers, getCategoryIdByName, categorizePurchase } from '@/api/api';
import moment from 'moment';
import { useAppContext } from '@/hooks/useAppContext';
import { debounce } from 'lodash';

interface AddTransactionModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isVisible, onClose }) => {
  const { currentProfileId, refreshIncomeData, refreshOutcomeData, refreshCategoryData, refreshBalanceData } = useAppContext();
  
  const [type, setType] = useState<'Income' | 'Outcome'>('Income');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [bubbleAnimation] = useState(new Animated.Value(0));
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [shared, setShared] = useState<boolean | null>(null);
  const [sharedUsers, setSharedUsers] = useState<string[] | null>(null);
  const [selectedSharedUser, setSelectedSharedUser] = useState<string[] | null>(null);
  const [whoPaidIt, setWhoPaidIt] = useState<string[]| null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (currentProfileId) {
      const isShared = await isProfileShared(currentProfileId);
      setShared(isShared);
      
      if (isShared) {
        const users = await getSharedUsers(currentProfileId);
        setSharedUsers(users.map(user => user.email));
      }
    }
  }, [currentProfileId]);
  
  useEffect(() => {
    if (isVisible) {
      fetchProfileData();
      fetchCategories(currentProfileId??"").then(categories => setCategories(categories || []));
    }
  }, [isVisible, currentProfileId, fetchProfileData]);

  const fetchCategoriesData = useCallback(() => {
    fetchCategories(currentProfileId??"").then(categories => setCategories(categories || []));
  }, [currentProfileId]);

  useEffect(() => {
    if (isVisible) fetchCategoriesData();
  }, [isVisible, fetchCategoriesData]);

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    debouncedCategorize(text); // Llama a la función debounced
  };

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (type === 'Income') {
      await addIncome(currentProfileId??"", parseFloat(amount), description, date);
      refreshIncomeData();
    } 
    else {
      let categoryToUse = selectedCategory;
      if (selectedCategory === '') categoryToUse = await getCategoryIdByName(currentProfileId??"", 'Otros') ?? "null";
      if (categoryToUse === "null") return;
      if (shared && whoPaidIt && whoPaidIt.length > 0) {
        await addOutcome(
          currentProfileId??"", 
          categoryToUse || '', 
          parseFloat(amount), 
          description, 
          date, 
          whoPaidIt[0], 
          selectedSharedUser || []
        );
      }
      else {
        await addOutcome(currentProfileId??"", categoryToUse || '', parseFloat(amount), description, date);
      }
      refreshOutcomeData();
      refreshCategoryData();
    }
    refreshBalanceData();
    // Reset form
    setAmount('');
    setDescription('');
    setDate(new Date());
    setSelectedCategory('');
    setIsSubmitting(false);
    onClose();
  }, [type, isSubmitting, amount, description, selectedCategory, refreshIncomeData, refreshOutcomeData, refreshCategoryData, refreshBalanceData, currentProfileId, onClose, shared, whoPaidIt, selectedSharedUser, date]);

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

  // Agregado: función debounced
  const debouncedCategorize = useMemo(() => 
    debounce(async (text: string) => {
      if (text && categories.length > 0) {
        const categorized = await categorizePurchase(text, categories.map(c => c.name));
        if (categorized) {
          const categoryId = await getCategoryIdByName(currentProfileId ?? "", categorized);
          setSelectedCategory(categoryId ?? '');
        }
      }
    }, 500), // Espera 300 ms después de que el usuario deja de escribir
    [categories, currentProfileId]
  );

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
              onChangeText={handleDescriptionChange} // Llama a la función que categoriza
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

          {/* no me la quiero complicar, voy a copiar codigo. Despues optmizo */}
            {type==='Outcome' && shared && (
               <ParticipantSelect
               sharedUsers={sharedUsers}
               onSelect={(users: string[]) => setWhoPaidIt(users)}
               singleSelection={true}
             />
            )}

            {type==='Outcome' && shared && (
               <ParticipantSelect
               sharedUsers={sharedUsers}
               onSelect={(users: string[]) => setSelectedSharedUser(users)}
               singleSelection={false}
               whoPaidIt={whoPaidIt ? whoPaidIt[0] : undefined}
               />
            )}

            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
              <Text style={[styles.datePickerText, !date && styles.placeholderText]}>
                {date ? moment(date).format('DD/MM/YYYY') : 'Fecha'}
              </Text>
              <Icon name="calendar-today" size={24} color="#007BFF" style={styles.datePickerIcon}/>
            </TouchableOpacity>
            
            {showDatePicker && (<DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange}/>)}

            {type === 'Outcome' && (
              <TouchableOpacity style={styles.scanButton}>
                <Text style={styles.scanButtonText}>Escanear ticket</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.acceptButton} onPress={handleSubmit}>
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ParticipantSelect = ({ sharedUsers, onSelect, singleSelection, whoPaidIt }: { sharedUsers: string[] | null; onSelect: (users: string[]) => void, singleSelection: boolean, whoPaidIt?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // const dummyUsers = [
  //   'Alice Johnson',
  //   'Bob Smith',
  //   'Charlie Brown',
  //   'Diana Prince',
  //   'Ethan Hunt',
  //   'Fiona Apple',
  //   'George Clooney',
  //   'Hannah Montana',
  // ];

  const toggleUser = (user: string) => {
    setSelectedUsers(prev => {
      if (singleSelection) {
        return [user];
      }
      return prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user];
    });
  };


  const handleDone = () => {
    onSelect(selectedUsers);
    setIsOpen(false);
    //console.log({selectedUsers});
  };
  // Filter out whoPaidIt from sharedUsers when not in single selection mode
  const displayedUsers = singleSelection ? sharedUsers : sharedUsers?.filter(user => user !== whoPaidIt) || [];

  return (
    <View style={styles.selectContainer}>
      <TouchableOpacity 
        style={styles.selectButton} 
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.selectButtonText}> 
          {singleSelection ? '¿Quién Pago?' : 'Participantes'}
        </Text>
        <Icon name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color="#000" />
      </TouchableOpacity>
      
      {isOpen && (
        <Modal transparent visible={isOpen} animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
          >
            <View style={styles.dropdown}>
              <ScrollView>

                {/* Usar dummyUsers para testear.  */}
                {displayedUsers?.map((user: string) => (
                  <TouchableOpacity
                    key={user}
                    style={styles.option}
                    onPress={() => toggleUser(user)}
                  >
                    <View style={styles.userRow}>
                      <Text style={styles.optionText}>{user}</Text>
                      <View style={[styles.checkbox, selectedUsers.includes(user) && styles.checkedBox]}>
                        {selectedUsers.includes(user) && (
                          <Text style={styles.tick}>✓</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    paddingTop: 40,
  },
  contentContainer: {
    width: '100%',
    padding: 20,
  },
  typeSelector: {
    marginTop: 10,
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    height: 44,
  },
  typeButton: {
    width: '50%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bubbleBackground: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    left: -6,
    right: -6,
    backgroundColor: '#B39CD4',
    borderRadius: 24,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '50%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    width: '100%',
    marginBottom: 16,
  },
  datePickerText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    color: '#AAAAAA',
  },
  datePickerIcon: {
    marginLeft: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1
  },
  acceptButton: {
    backgroundColor: '#370185',
    borderRadius: 24,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButton: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#6A1B9A',
    backgroundColor: 'transparent',
    width: '100%',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#6A1B9A',
    fontSize: 16,
  },
  picker: {
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  pickerItem: {
    fontSize: 16,
    height: 50,
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdown: {
    width: '80%',
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    elevation: 5,
  },
  option: {
    padding: 12,
  },
  optionText: {
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tick: {
    color: '#FFFFFF',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5, // Adjust as needed
  },
  checkedBox: {
    backgroundColor: '#370185',
    borderColor: '#370185',
  },
  doneButton: {
    backgroundColor: '#370185',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default React.memo(AddTransactionModal);
