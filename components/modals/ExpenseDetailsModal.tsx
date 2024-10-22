import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
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
    sharedOutcomeData?: {
      userNames: string[];
      users: string[];
      to_pay: number[];
      has_paid: boolean[];
    };
  };
  currentUser: string;
  onMarkAsPaid: (whoPaid: string, outcomeId: string, paid: boolean) => Promise<void>;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({ isVisible, onClose, expense, currentUser, onMarkAsPaid }) => {
  const [isPaying, setIsPaying] = useState(false);

  const handleMarkAsPaid = async () => {
    Alert.alert(
        "Confirmación",
        "¿Estás seguro que quieres saldar la deuda?",
        [
            {
                text: "Cancelar",
                style: "cancel"
            },
            {
                text: "Sí",
                onPress: async () => {
                    setIsPaying(true);
                    try {
                        await onMarkAsPaid(currentUser, expense.id, true);
                        // Actualizar el estado local si es necesario
                        const updatedHasPaid = [...expense.sharedOutcomeData.has_paid];
                        const userIndex = expense.sharedOutcomeData.users.indexOf(currentUser);
                        if (userIndex !== -1) {
                            updatedHasPaid[userIndex] = true; // Marcamos como pagado
                        }
                        // Actualizamos el estado del componente (si es necesario)
                        setExpense(prev => ({
                            ...prev,
                            sharedOutcomeData: {
                                ...prev.sharedOutcomeData,
                                has_paid: updatedHasPaid,
                            },
                        }));
                    } catch (error) {
                        console.error("Error al marcar como pagado:", error);
                        Alert.alert("Error", "No se pudo marcar como pagado. Inténtalo de nuevo.");
                    } finally {
                        setIsPaying(false);
                    }
                }
            }
        ],
        { cancelable: false }
    );
  };

  const participantCount = expense.sharedOutcomeData ? expense.sharedOutcomeData.users.length - 1 : 0;
  const amountPerParticipant = expense.sharedOutcomeData ? expense.amount / expense.sharedOutcomeData.users.length : 0;

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
          {expense.sharedOutcomeData ? (
            expense.sharedOutcomeData.userNames.map((userName, index) => {
              const isPaid = expense.sharedOutcomeData.has_paid[index];
              return (
                <View key={index} style={styles.participantRow}>
                  <ThemedText style={styles.value}>{userName}</ThemedText>
                  <ThemedText style={styles.value}>$ {amountPerParticipant.toFixed(2)}</ThemedText>
                  <ThemedText style={styles.value}>{isPaid ? 'Pagado' : 'Pendiente'}</ThemedText>
                </View>
              );
            })
          ) : (
            <ThemedText style={styles.value}>{expense.participants.join(', ')}</ThemedText>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <ThemedText style={styles.closeButtonText}>Cerrar</ThemedText>
            </TouchableOpacity>
            {expense.sharedOutcomeData && !expense.sharedOutcomeData.has_paid[expense.sharedOutcomeData.users.indexOf(currentUser)] && (
              <TouchableOpacity style={styles.payButton} onPress={handleMarkAsPaid} disabled={isPaying}>
                <ThemedText style={styles.payButtonText}>{isPaying ? 'Procesando...' : 'Saldar deuda'}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
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
    fontWeight: 'bold',
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
    padding: 10,
    backgroundColor: '#4B00B8',
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  payButton: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
  },
  payButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
  },
});
