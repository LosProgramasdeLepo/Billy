// app/components/modals/PaymentModal.tsx
import React from "react";
import { Modal, View, Text, Button, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

interface PaymentModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isVisible, onClose }) => {
  const handlePayment = () => {
    // TODO: redirigir con la API hacia mp.
    console.log("Payment processed");
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Sumate a la version Pro!</Text>
            <Ionicons name="star-outline" size={24} color="#FFD700" style={styles.crownIcon} />
          </View>
          <Text style={styles.message}>
            Obtene perfiles ilimitados, colores de customización y mucho más!
          </Text>
          <Button color="#4B00B8" title="Me sumo ahora mismo" onPress={handlePayment} />
          <View style={{ marginVertical: 5 }} />
          <Button color="#4B00B8" title="No gracias" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  message: {
    marginVertical: 10,
    textAlign: "center",
  },
  crownIcon: {
    marginLeft: 10,
  },
});

export default PaymentModal;