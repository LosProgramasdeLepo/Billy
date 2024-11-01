import React, { useEffect, useState } from "react";
import { View, Modal, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { ThemedText } from "./../ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { formatNumber } from "@/lib/utils";
import { getProfilePictureUrl } from "@/api/api";

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
  const [participantAvatars, setParticipantAvatars] = useState<Record<string, string>>({});
  const payerEmail = expense.sharedOutcomeData?.users?.[0] || expense.paidBy;

  const truncateText = (text: string, maxLength: number = 12) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        if (expense.sharedOutcomeData?.users) {
          const avatars: Record<string, string> = {};
          for (const email of expense.sharedOutcomeData.users) {
            const url = await getProfilePictureUrl(email);
            avatars[email] = url || "";
          }
          setParticipantAvatars(avatars);
        }
      } catch (error) {
        console.error("Error fetching avatars:", error);
      }
    };

    fetchAvatars();
  }, [expense.sharedOutcomeData?.users]);

  const handleMarkAsPaid = async () => {
    Alert.alert(
      "Confirmación",
      "¿Estás seguro que quieres saldar la deuda?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sí",
          onPress: async () => {
            setIsPaying(true);
            try {
              await onMarkAsPaid(currentUser, expense.id, true);
            } catch (error) {
              console.error("Error al marcar como pagado:", error);
              Alert.alert("Error", "No se pudo marcar como pagado. Inténtalo de nuevo.");
            } finally {
              setIsPaying(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const amountPerParticipant = expense.sharedOutcomeData ? expense.amount / expense.sharedOutcomeData.users.length : expense.amount;

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <LinearGradient colors={["#ffffff", "#f0f0f0"]} style={styles.modalView}>
          <View style={styles.headerContainer}>
            <ThemedText style={styles.modalTitle}>{expense.description}</ThemedText>
            <ThemedText style={styles.monto}>${formatNumber(expense.amount)}</ThemedText>
          </View>

          <Image source={expense.categoryIcon} style={styles.iconoCategoria} />

          <ThemedText style={styles.label}>Quién Pagó:</ThemedText>
          <View style={styles.payerInfo}>
            <Image
              source={
                participantAvatars[payerEmail] ? { uri: participantAvatars[payerEmail] } : require("@/assets/images/icons/UserIcon.png")
              }
              style={styles.userIcon}
            />
            <ThemedText style={styles.value}>{expense.paidBy}</ThemedText>
          </View>

          <ThemedText style={styles.label}>Participantes:</ThemedText>
          {expense.sharedOutcomeData ? (
            expense.sharedOutcomeData.userNames.map((userName, index) => {
              const isPaid = expense.sharedOutcomeData?.has_paid[index] ?? false;
              const userEmail = expense.sharedOutcomeData?.users[index] ?? "";
              return (
                <View key={index} style={styles.participantRow}>
                  <View style={styles.userInfoColumn}>
                    <Image
                      source={
                        participantAvatars[userEmail]
                          ? { uri: participantAvatars[userEmail] }
                          : require("@/assets/images/icons/UserIcon.png")
                      }
                      style={styles.userIcon}
                    />
                    <ThemedText style={styles.value}>{truncateText(userName)}</ThemedText>
                  </View>
                  <View style={styles.amountColumn}>
                    <ThemedText style={styles.amountText}>${formatNumber(amountPerParticipant)}</ThemedText>
                  </View>
                  <View style={styles.statusColumn}>
                    <ThemedText style={isPaid ? styles.paidText : styles.pendingText}>{isPaid ? "Pagado" : "Pendiente"}</ThemedText>
                  </View>
                </View>
              );
            })
          ) : (
            <ThemedText style={[styles.value, { paddingHorizontal: 20 }]}>{expense.participants.join(", ")}</ThemedText>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <ThemedText style={styles.closeButtonText}>Cerrar</ThemedText>
            </TouchableOpacity>
            {expense.sharedOutcomeData && !expense.sharedOutcomeData.has_paid[expense.sharedOutcomeData.users.indexOf(currentUser)] && (
              <TouchableOpacity style={styles.payButton} onPress={handleMarkAsPaid} disabled={isPaying}>
                <ThemedText style={styles.payButtonText}>{isPaying ? "Procesando..." : "Saldar deuda"}</ThemedText>
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
    marginBottom: 10,
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
    color: "#000000",
  },
  iconoCategoria: {
    width: 30,
    height: 25,
    position: "absolute",
    top: 70,
    right: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  payerInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userInfoColumn: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
  },
  amountColumn: {
    width: "25%",
    alignItems: "flex-start",
  },
  statusColumn: {
    width: "25%",
    alignItems: "flex-end",
  },
  userIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  value: {
    fontSize: 16,
    color: "#333333",
    flex: 1,
  },
  amountText: {
    fontSize: 16,
    color: "#333333",
    textAlign: "right",
  },
  paidText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
    textAlign: "right",
  },
  pendingText: {
    fontSize: 16,
    color: "#F44336",
    fontWeight: "500",
    textAlign: "right",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
  },
  closeButton: {
    padding: 10,
    backgroundColor: "#4B00B8",
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  payButton: {
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
  },
  payButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
});
