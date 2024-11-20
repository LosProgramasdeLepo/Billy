import React, { useState } from "react";
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, Animated, Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import MlkitOcr from "react-native-mlkit-ocr";
import { processOcrResults } from "../../api/api";

interface TemporalExpenseModalProps {
  isVisible: boolean;
  onClose: () => void;
  refreshTransactions: () => void;
}

const TemporalExpenseModal = ({ isVisible, onClose, refreshTransactions }: TemporalExpenseModalProps) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketScanned, setTicketScanned] = useState(false);
  const [errors, setErrors] = useState({
    description: false,
    amount: false,
  });

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setTicketScanned(false);
    setErrors({
      description: false,
      amount: false,
    });
  };

  const handleScanTicket = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permisos requerido", "Necesitamos permisos para escanear tickets.");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setDescription("Escaneando ticket");
        setAmount("");

        const ocrResult = await MlkitOcr.detectFromUri(result.assets[0].uri);
        const extractedData = processOcrResults(ocrResult);

        setTicketScanned(true);

        if ((await extractedData).total) {
          setAmount((await extractedData).total?.toString() ?? "");
        }
        if ((await extractedData).description) {
          setDescription((await extractedData).description);
        }
      }
    } catch (error) {
      console.error("Error accediendo a la cámara:", error);
      Alert.alert("Error", "No se pudo acceder a la cámara. Por favor, intenta de nuevo.");
      setTicketScanned(false);
      setDescription("");
      setAmount("");
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validar campos
    const newErrors = {
      description: description.trim() === "",
      amount: amount.trim() === "",
    };

    setErrors(newErrors);

    if (newErrors.description || newErrors.amount) {
      Alert.alert("Error", "Por favor complete todos los campos obligatorios");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Gasto temporal:", { amount, description });
      refreshTransactions();
      setAmount("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Error al guardar el gasto:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={handleClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Icon name="close" size={30} color="#000000" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Gasto</Text>

          <View style={styles.contentContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.description && styles.inputError]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción"
                placeholderTextColor="#AAAAAA"
              />
              <TouchableOpacity onPress={handleScanTicket} style={styles.scanButton}>
                <Icon name="document-scanner" size={24} color="#370185" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="Monto"
              placeholderTextColor="#AAAAAA"
            />

            <TouchableOpacity style={styles.acceptButton} onPress={handleSubmit}>
              <Text style={styles.acceptButtonText}>Aceptar</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    top: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#FF0000",
  },
  scanButton: {
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: "#4B00B8",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default TemporalExpenseModal;
