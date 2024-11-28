import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BillyHeader } from "@/components/BillyHeader";
import TemporalExpenseModal from "@/components/modals/TemporalExpenseModal";
import AddPersonModal from "@/components/modals/AddPersonModal";
import { createBill, deleteBill, addParticipantToBill, getBillParticipants } from "@/api/api";

interface Transaction {
  id: string | number;
  title: string;
  paidBy: string;
  amount: number;
}

export default function Temporal() {
  const [personCount, setPersonCount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPersonModalVisible, setIsPersonModalVisible] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [billId, setBillId] = useState<string | null>(null);

  useEffect(() => {
    const initializeBill = async () => {
      const newBillId = await createBill(0, []);
      if (newBillId) {
        setBillId(newBillId);
      }
    };

    initializeBill();
  }, []);

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleReset = async () => {
    if (billId) {
      const deleteSuccess = await deleteBill(billId);
      if (!deleteSuccess) {
        Alert.alert("Error", "No se pudo borrar la cuenta actual");
        return;
      }
    }
    
    setPersonCount(0);
    setTransactions([]);
    
    // Crear nuevo bill
    const newBillId = await createBill(0, []);
    if (newBillId) {
      setBillId(newBillId);
    } else {
      Alert.alert("Error", "No se pudo crear una nueva cuenta");
    }
  };

  const refreshTransactions = () => {
    // Esta función se implementará cuando se agregue la API
    console.log("Refrescando transacciones...");
  };

  const handleOpenPersonModal = () => {
    setIsPersonModalVisible(true);
  };

  const handleClosePersonModal = () => {
    setIsPersonModalVisible(false);
  };

  const handleAddPerson = async (name: string) => {
    if (billId) {
      const success = await addParticipantToBill(billId, name);
      if (success) {
        setPersonCount(prev => prev + 1);
        
        // Obtener la lista actualizada de participantes
        const participants = await getBillParticipants(billId);
        
        // Mostrar el pop-up con la lista de participantes
        Alert.alert(
          "Participantes Actuales",
          `Participantes hasta ahora:\n\n${participants.map(p => `• ${p}`).join('\n')}`,
          [{ text: "OK", onPress: handleClosePersonModal }]
        );
      } else {
        Alert.alert(
          "Error", 
          "No se pudo agregar al participante ya que ya existe uno con el mismo nombre en esta cuenta",
          [{ text: "OK" }]
        );
      }
    }
  };

  return (
    <LinearGradient colors={["#4B00B8", "#20014E"]} style={styles.gradientContainer}>
      <BillyHeader />
      <View style={styles.contentContainer}>
        <View style={styles.whiteContainer}>
          <ScrollView>
            <View style={styles.infoCard}>
              <View style={styles.personas}>
                <TextInput style={styles.input} value={`Cantidad de personas: ${personCount}`} editable={false} />
                <TouchableOpacity onPress={handleOpenPersonModal}>
                  <Text style={styles.addButton}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.gastos}>
                <TextInput style={styles.input} value="Gastos" editable={false} />
                <TouchableOpacity onPress={handleOpenModal}>
                  <Text style={styles.addButton}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.floatingButton} onPress={handleReset}>
              <Text style={styles.floatingButtonText}>Borrar</Text>
            </TouchableOpacity>

            <View style={styles.debtCard}>
              <View style={styles.debtItem}>
                <Text style={styles.debtText}>Olivia debe a Juan</Text>
                <Text style={styles.precio}>$500,00</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.debtItem}>
                <Text style={styles.debtText}>Pilar debe a Juan</Text>
                <Text style={styles.precio}>$500,00</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.debtItem}>
                <Text style={styles.debtText}>Maria debe a Juan</Text>
                <Text style={styles.precio}>$500,00</Text>
              </View>
            </View>

            <View style={styles.movimientos}>
              <View style={styles.movimientosHeader}>
                <Text style={styles.movimientosTitle}>Todos los movimientos:</Text>
                <TouchableOpacity>
                  <Text style={styles.verMas}>Ver más</Text>
                </TouchableOpacity>
              </View>

              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View>
                    <Text style={styles.transactionTitle}>{transaction.title}</Text>
                    <Text style={styles.transactionSubtitle}>
                      <Text style={styles.pagadoPor}>Pagado por </Text>
                      <Text style={styles.pagador}>{transaction.paidBy}</Text>
                    </Text>
                  </View>
                  <Text style={styles.amount}>- $ {transaction.amount}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <TemporalExpenseModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        refreshTransactions={refreshTransactions}
        billId={billId || ""}
      />

      <AddPersonModal
        isVisible={isPersonModalVisible}
        onClose={handleClosePersonModal}
        onAddPerson={handleAddPerson}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: "2.5%",
  },
  whiteContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    elevation: 3,
    minHeight: "100%",
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
  },
  personas: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(66, 1, 161, 0.08)",
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  gastos: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(66, 1, 161, 0.08)",
    borderRadius: 20,
    padding: 10,
  },
  input: {
    fontSize: 16,
    color: "#222B45",
    flex: 1,
  },
  addButton: {
    fontSize: 24,
    color: "#4B00B8",
    marginLeft: 10,
  },
  debtCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
    padding: 10,
  },
  debtItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  debtText: {
    fontSize: 16,
    color: "#3B3B3B",
  },
  precio: {
    fontSize: 16,
    color: "#3B3B3B",
  },
  separator: {
    height: 1,
    backgroundColor: "#DDD",
    marginHorizontal: 10,
  },
  movimientos: {
    width: "100%",
    marginBottom: 20,
  },
  movimientosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  movimientosTitle: {
    fontSize: 15,
    color: "#222222",
  },
  verMas: {
    fontSize: 12,
    color: "#4B00B8",
    textDecorationLine: "underline",
  },
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 10,
  },
  transactionTitle: {
    fontSize: 16,
    color: "#3C3C3C",
  },
  transactionSubtitle: {
    fontSize: 12,
  },
  pagadoPor: {
    color: "#666666",
  },
  pagador: {
    color: "#4B00B8",
  },
  amount: {
    fontSize: 14,
    color: "#FF0000",
  },
  floatingButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    width: "100%",
    height: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  floatingButtonText: {
    fontSize: 16,
    color: "#4B00B8",
    textAlign: "center",
  },
});
