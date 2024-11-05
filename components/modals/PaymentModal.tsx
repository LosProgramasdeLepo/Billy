// app/components/modals/PaymentModal.tsx
import React from "react";
import { Modal, View, Text, Button, StyleSheet } from "react-native";

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
          <Text style={styles.title}>Sumate a la version Pro!</Text>
          <Text style={styles.message}>
            Obtene perfiles ilimitados, colores de customizacion, y mucho más!
          </Text>
          <Button title="Me sumo ahora mismo" onPress={handlePayment} />
          <Button title="No gracias" onPress={onClose} />
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  message: {
    marginVertical: 10,
    textAlign: "center",
  },
});

export default PaymentModal;