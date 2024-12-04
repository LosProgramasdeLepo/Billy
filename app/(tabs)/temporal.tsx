import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, AppState, AppStateStatus } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BillyHeader } from "@/components/BillyHeader";
import TemporalExpenseModal from "@/components/modals/TemporalExpenseModal";
import AddPersonModal from "@/components/modals/AddPersonModal";
import { createBill, deleteBill, addParticipantToBill, getBillParticipants, getBillTransactions, calculateDebts } from "@/api/api";
import { formatNumber } from "@/lib/utils";
import { useAppContext } from "@/hooks/useAppContext";

interface Transaction {
  id: string | number;
  title: string;
  paidBy: string;
  amount: number;
  date: Date;
}

export default function Temporal() {
  const { user } = useAppContext();

  const [personCount, setPersonCount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPersonModalVisible, setIsPersonModalVisible] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [billId, setBillId] = useState<string | null>(null);
  const [debts, setDebts] = useState<{ [participant: string]: { [payer: string]: number } } | null>(null);

  useEffect(() => {
    const initializeBill = async () => {
      const newBillId = await createBill(0, [user?.name || "Usuario"]);
      if (newBillId) {
        setBillId(newBillId);
        refreshTransactions();
      }
    };

    initializeBill();

    // Manejar el cambio de estado de la aplicación
    const subscription = AppState.addEventListener("change", async (nextAppState: AppStateStatus) => {
      if (nextAppState === "background") {
        // La aplicación está en segundo plano o se está cerrando
        if (billId) {
          await deleteBill(billId);
          setBillId(null);
          setPersonCount(0);
          setTransactions([]);
        }
      }
    });

    // Limpieza cuando el componente se desmonta
    return () => {
      subscription.remove();
      if (billId) {
        deleteBill(billId);
      }
    };
  }, [user]);

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

  const refreshTransactions = async () => {
    if (billId) {
      try {
        const transactions = await getBillTransactions(billId);
        setTransactions(
          transactions.map((transaction) => ({
            id: transaction.id,
            title: transaction.description,
            paidBy: transaction.paidBy || "Desconocido",
            amount: transaction.amount,
            date: new Date(transaction.date),
          }))
        );
      } catch (error) {
        console.error("Error al obtener las transacciones:", error);
        Alert.alert("Error", "No se pudieron cargar los movimientos");
      }
    }
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
        setPersonCount((prev) => prev + 1);
        handleClosePersonModal();
      } else {
        Alert.alert("Error", "No se pudo agregar al participante ya que ya existe uno con el mismo nombre en esta cuenta", [
          { text: "OK" },
        ]);
      }
    }
  };

  const showParticipantsList = async () => {
    if (billId) {
      const participants = await getBillParticipants(billId);
      const message =
        participants.length === 0 ? "Todavía no se agregaron participantes." : `${participants.map((p) => `• ${p}`).join("\n")}`;

      Alert.alert("Participantes actuales", message, [{ text: "OK" }]);
    }
  };

  const refreshDebts = async () => {
    if (billId) {
      const participants = await getBillParticipants(billId);
      if (participants.length === 0) {
        setDebts(null); // O puedes establecer un estado que indique que no hay deudas
        return; // Salir de la función si no hay participantes
      }

      const calculatedDebts = await calculateDebts(billId);
      setDebts(calculatedDebts);
    }
  };

  useEffect(() => {
    refreshDebts();
  }, [transactions]);

  return (
    <LinearGradient colors={["#4B00B8", "#20014E"]} style={styles.gradientContainer}>
      <BillyHeader />
      <View style={styles.contentContainer}>
        <View style={styles.whiteContainer}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.infoCard}>
              <View style={styles.personas}>
                <TouchableOpacity onPress={showParticipantsList}>
                  <TextInput style={styles.input} value={`Cantidad de personas: ${personCount}`} editable={false} />
                </TouchableOpacity>
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

            <View style={styles.debtCard}>
              {debts &&
                Object.entries(debts).map(([debtor, payerDebts]) =>
                  Object.entries(payerDebts).map(
                    ([payer, amount], index) =>
                      amount > 0 && (
                        <React.Fragment key={`${debtor}-${payer}-${index}`}>
                          <View style={styles.debtItem}>
                            <Text style={styles.debtText}>
                              {payer} le debe a {debtor}
                            </Text>
                            <Text style={styles.precio}>${formatNumber(amount)}</Text>
                          </View>
                          <View style={styles.separator} />
                        </React.Fragment>
                      )
                  )
                )}
              {(!debts || Object.keys(debts).length === 0) && <Text style={styles.noDebtsText}>No hay deudas pendientes.</Text>}
            </View>

            <View style={styles.sectionSeparator} />

            <View style={styles.movimientos}>
              <View style={styles.movimientosHeader}>
                <Text style={styles.movimientosTitle}>Todos los movimientos:</Text>
              </View>

              {transactions.length === 0 ? (
                <Text style={styles.noMovimientosText}>Todavía no se agregaron movimientos.</Text>
              ) : (
                transactions.map((transaction, index) => (
                  <View key={index} style={styles.transactionCard}>
                    <View>
                      <Text style={styles.transactionTitle}>{transaction.title}</Text>
                      <Text style={styles.transactionSubtitle}>
                        <Text style={styles.pagadoPor}>Pagado por </Text>
                        <Text style={styles.pagador}>{transaction.paidBy}</Text>
                      </Text>
                    </View>
                    <Text style={styles.amount}>- $ {transaction.amount}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.sectionSeparator} />

            <TouchableOpacity style={styles.floatingButton} onPress={handleReset}>
              <Text style={styles.floatingButtonText}>Finalizar cuenta</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <TemporalExpenseModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        refreshTransactions={refreshTransactions}
        billId={billId || ""}
      />

      <AddPersonModal isVisible={isPersonModalVisible} onClose={handleClosePersonModal} onAddPerson={handleAddPerson} />
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
    marginBottom: 15,
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
    paddingHorizontal: 5,
  },
  addButton: {
    fontSize: 24,
    color: "#4B00B8",
    marginLeft: 10,
    paddingHorizontal: 5,
  },
  debtCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 15,
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
    width: "100%",
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
    marginBottom: 15,
  },
  floatingButtonText: {
    fontSize: 16,
    color: "#4B00B8",
    textAlign: "center",
  },
  noDebtsText: {
    textAlign: "center",
    color: "#666",
    padding: 20,
    fontStyle: "italic",
  },
  noMovimientosText: {
    textAlign: "center",
    color: "#666",
    padding: 10,
    fontStyle: "italic",
  },
  sectionSeparator: {
    height: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    marginBottom: 10,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
});
