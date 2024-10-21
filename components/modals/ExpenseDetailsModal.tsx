import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ThemedText } from './../ThemedText';
import { LinearGradient } from 'expo-linear-gradient';

interface ExpenseDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  expense: {
    id: string;
    amount: number;
    description: string;
    paidBy: string;
    participants: string[];
    categoryIcon: any;
  };
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({ isVisible, onClose, expense }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <LinearGradient colors={['#ffffff', '#f0f0f0']} style={styles.modalView}>
          <View style={styles.headerContainer}>
            <ThemedText style={styles.modalTitle}>{expense.description}</ThemedText>
            <ThemedText style={styles.monto}>${expense.amount.toFixed(2)}</ThemedText>
          </View>
          <Image source={expense.categoryIcon} style={styles.iconoCategoria} />
          <ThemedText style={styles.label}>Quien Pagó:</ThemedText>
          <ThemedText style={styles.value}>{expense.paidBy}</ThemedText>
          <ThemedText style={styles.label}>Participantes:</ThemedText>
          <ThemedText style={styles.value}>{expense.participants.join(', ')}</ThemedText>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={styles.closeButtonText}>Cerrar</ThemedText>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#4B00B8',
  },
  monto: {
    fontSize: 24,
    fontWeight: '400',
    color: '#000000',
  },
  iconoCategoria: {
    width: 31,
    height: 25,
    position: 'absolute',
    top: 70,
    right: 20,
  },
  label: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
    marginTop: 15,
  },
  value: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
    marginLeft: 20,
    marginTop: 5,
  },
  closeButton: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#4B00B8',
    borderRadius: 10,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
