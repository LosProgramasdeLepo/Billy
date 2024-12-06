import React from "react";
import { View, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { formatNumber } from "@/lib/utils";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import moment from "moment";
import "moment/locale/es";

moment.locale("es");

interface TransactionDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  transaction: {
    type: "income" | "outcome";
    amount: number;
    description: string;
    created_at: string;
    categoryIcon?: string;
    categoryName?: string;
  };
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ isVisible, onClose, transaction }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <LinearGradient colors={["#ffffff", "#f0f0f0"]} style={styles.modalView}>
          <View style={styles.headerContainer}>
            <ThemedText style={styles.modalTitle}>{transaction.description}</ThemedText>
            <ThemedText style={[styles.monto, transaction.type === "income" ? styles.incomeAmount : styles.outcomeAmount]}>
              {transaction.type === "income" ? "+" : "-"} ${formatNumber(transaction.amount)}
            </ThemedText>
          </View>

          {transaction.type === "outcome" && transaction.categoryName && (
            <>
              <ThemedText style={styles.label}>Categoría:</ThemedText>
              <ThemedText style={styles.value}>{transaction.categoryName}</ThemedText>
            </>
          )}

          <ThemedText style={styles.label}>Fecha:</ThemedText>
          <ThemedText style={styles.value}>
            {moment(transaction.created_at).format("DD [de] MMMM[,] YYYY [a las] HH:mm")}
          </ThemedText>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <ThemedText style={styles.closeButtonText}>Cerrar</ThemedText>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#4B00B8",
    flex: 1,
    marginRight: 15,
  },
  monto: {
    fontSize: 24,
    fontWeight: "500",
  },
  incomeAmount: {
    color: "#4CAF50",
  },
  outcomeAmount: {
    color: "#F44336",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: "#333333",
    marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 10,
  },
  closeButton: {
    padding: 10,
    backgroundColor: "#4B00B8",
    borderRadius: 10,
    width: "100%",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
});