import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BillyHeader } from "@/components/BillyHeader";
import TemporalExpenseModal from "@/components/modals/TemporalExpenseModal";

export default function Temporal() {
  const [personCount, setPersonCount] = useState(4);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const refreshTransactions = () => {
    // Esta función se implementará cuando se agregue la API
    console.log("Refrescando transacciones...");
  };

  return (
    <LinearGradient colors={["#4B00B8", "#20014E"]} style={styles.gradientContainer}>
      <BillyHeader title="Sala Temporal" />
      <View style={styles.contentContainer}>
        <ScrollView>
          <View style={styles.whiteContainer}>
            <View style={styles.infoCard}>
              <View style={styles.personas}>
                <TextInput
                  style={styles.input}
                  value={`Cantidad de personas: ${personCount}`}
                  editable={false}
                />
                <TouchableOpacity onPress={() => setPersonCount(prev => prev + 1)}>
                  <Text style={styles.addButton}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.gastos}>
                <TextInput
                  style={styles.input}
                  value="Gastos"
                  editable={false}
                />
                <TouchableOpacity onPress={handleOpenModal}>
                  <Text style={styles.addButton}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

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

              <View style={styles.transactionCard}>
                <View>
                  <Text style={styles.transactionTitle}>Starbucks</Text>
                  <Text style={styles.transactionSubtitle}>
                    <Text style={styles.pagadoPor}>Pagado por </Text>
                    <Text style={styles.pagador}>Juan Gómez</Text>
                  </Text>
                </View>
                <Text style={styles.amount}>- $ 1.000,00</Text>
              </View>

              <View style={styles.transactionCard}>
                <View>
                  <Text style={styles.transactionTitle}>Helado</Text>
                  <Text style={styles.transactionSubtitle}>
                    <Text style={styles.pagadoPor}>Pagado por </Text>
                    <Text style={styles.pagador}>Juan Gómez</Text>
                  </Text>
                </View>
                <Text style={styles.amount}>- $ 500,00</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <TemporalExpenseModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        refreshTransactions={refreshTransactions}
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
    paddingHorizontal: 20,
  },
  whiteContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
  },
  personas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 1, 161, 0.08)',
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  gastos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 1, 161, 0.08)',
    borderRadius: 20,
    padding: 10,
  },
  input: {
    fontSize: 16,
    color: '#222B45',
    flex: 1,
  },
  addButton: {
    fontSize: 24,
    color: '#4B00B8',
    marginLeft: 10,
  },
  debtCard: {
    backgroundColor: '#FFFFFF',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  debtText: {
    fontSize: 16,
    color: '#3B3B3B',
  },
  precio: {
    fontSize: 16,
    color: '#3B3B3B',
  },
  separator: {
    height: 1,
    backgroundColor: '#DDD',
    marginHorizontal: 10,
  },
  movimientos: {
    width: '100%',
    marginBottom: 20,
  },
  movimientosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  movimientosTitle: {
    fontSize: 15,
    color: '#222222',
  },
  verMas: {
    fontSize: 12,
    color: '#4B00B8',
    textDecorationLine: 'underline',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
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
    color: '#3C3C3C',
  },
  transactionSubtitle: {
    fontSize: 12,
  },
  pagadoPor: {
    color: '#666666',
  },
  pagador: {
    color: '#4B00B8',
  },
  amount: {
    fontSize: 14,
    color: '#FF0000',
  },
});
