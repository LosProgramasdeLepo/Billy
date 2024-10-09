import React, { useState, useCallback } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { addCategory } from '@/api/api';
import { useAppContext } from '@/hooks/useAppContext';

interface AddCategoryModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCategoryAdded: () => void;
  sortedCategories: any[];
}

const gradients = [
  ['#F1B267', '#EEF160'],
  ['#7E91F7', '#41D9FA'],
  ['#F77EE4', '#B06ECF'],
  ['#CBEC48', '#50B654'],
  ['#48ECE2', '#62D29C'],
  ['#FF9A8B', '#FF6A88'],
  ['#66A6FF', '#89F7FE'],
  ['#FDCB6E', '#FF7979'],
  ['#7ED56F', '#28B485'],
  ['#D4FC79', '#96E6A1'],
  ['#84FAB0', '#8FD3F4'],
  ['#FA709A', '#FEE140'],
  ['#43E97B', '#38F9D7'],
  ['#F6D365', '#FDA085'],
  ['#5EE7DF', '#B490CA'],
  ['#D299C2', '#FEF9D7'],
  ['#6A11CB', '#2575FC'],
  ['#FF867A', '#FF8C7F'],
  ['#FFD26F', '#3677FF'],
  ['#72EDF2', '#5151E5']
];

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isVisible, onClose, onCategoryAdded, sortedCategories }) => {
  const { currentProfileId } = useAppContext();

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(gradients[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = useCallback((text: string) => {
    setName(text);
    setErrorMessage('');
  }, []);

  const validateCategoryName = useCallback(() => {
    const categoryExists = sortedCategories.some(
      category => category && category.name && category.name.toLowerCase() === name.toLowerCase()
    );
    if (categoryExists) {
      setErrorMessage('Ya existe una categoría con ese nombre');
      return false;
    }
    return true;
  }, [name, sortedCategories]);

  const handleAddCategory = useCallback(async () => {
    if (!validateCategoryName() || isSubmitting) return;
    setIsSubmitting(true);
    await addCategory(currentProfileId??"", name, JSON.stringify(selectedGradient), parseFloat(limit));
    setName('');
    setLimit('');
    setSelectedGradient(gradients[0]);
    onCategoryAdded();
    setIsSubmitting(false);
    onClose();
  }, [validateCategoryName, isSubmitting, currentProfileId, name, limit, selectedGradient, onCategoryAdded, onClose]);

  const renderGradientItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[ styles.gradientItem, { backgroundColor: item[0] }, selectedGradient === item && styles.selectedGradient ]}
      onPress={() => setSelectedGradient(item)}
    />
  );

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
        <Text style={styles.title}>Crear una categoría</Text>

          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={handleNameChange} 
            placeholder="Ingresar nombre"
          />
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            value={limit} 
            onChangeText={setLimit} 
            placeholder="Ingresar límite"
          />

          <FlatList
            data={gradients}
            renderItem={renderGradientItem}
            keyExtractor={(index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gradientList}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleAddCategory}>
              <Text style={styles.buttonText}>Crear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#4B00B8',
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gradientList: {
    marginBottom: 20,
  },
  gradientItem: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  selectedGradient: {
    borderWidth: 2,
    borderColor: '#4B00B8',
  },
});

export default AddCategoryModal;