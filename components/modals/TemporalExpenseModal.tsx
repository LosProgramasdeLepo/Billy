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
          <View style={styles.typeSelector}>
            <View style={[styles.bubbleBackground, { backgroundColor: "#B39CD4" }]}>
              <View style={styles.bubble} />
            </View>
            <View style={styles.typeButton}>
              <Text style={[styles.typeButtonText, { color: "#000000" }]}>Gasto</Text>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }, errors.description && styles.inputError]}
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  typeSelector: {
    flexDirection: "row",
    marginBottom: 16,
    position: "relative",
    width: "100%",
    justifyContent: "center",
    height: 44,
  },
  typeButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bubbleBackground: {
    position: "absolute",
    top: -3,
    bottom: -3,
    left: -6,
    right: -6,
    backgroundColor: "#B39CD4",
    borderRadius: 24,
    overflow: "hidden",
  },
  bubble: {
    position: "absolute",
    top: 3,
    bottom: 3,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
  },
  contentContainer: {
    width: "100%",
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    width: "100%",
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 5,
    top: 2,
    padding: 5,
    zIndex: 1,
  },
  acceptButton: {
    backgroundColor: "#370185",
    borderRadius: 24,
    padding: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButton: {
    padding: 10,
    marginLeft: 10,
  },
  inputError: {
    borderColor: "red",
  },
});

export default TemporalExpenseModal;
