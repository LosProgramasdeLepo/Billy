import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, Animated, Alert, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import MlkitOcr from "react-native-mlkit-ocr";
import { processOcrResults, getBillParticipants } from "../../api/api";

interface TemporalExpenseModalProps {
  isVisible: boolean;
  onClose: () => void;
  refreshTransactions: () => void;
  billId: string;
}

const TemporalExpenseModal = ({ isVisible, onClose, refreshTransactions, billId }: TemporalExpenseModalProps) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketScanned, setTicketScanned] = useState(false);
  const [errors, setErrors] = useState({
    description: false,
    amount: false,
  });

  useEffect(() => {
    const loadParticipants = async () => {
      if (billId) {
        const billParticipants = await getBillParticipants(billId);
        setParticipants(billParticipants);
        Alert.alert(
          "Participantes Disponibles",
          `Participantes en esta cuenta:\n\n${billParticipants.map(p => `• ${p}`).join('\n')}`,
          [{ text: "OK" }]
        );
      }
    };
    loadParticipants();
  }, [billId]);

  const toggleParticipant = (participant: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participant) 
        ? prev.filter(p => p !== participant)
        : [...prev, participant]
    );
  };

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

            <Text style={styles.participantsTitle}>Participantes:</Text>
            <View style={styles.participantsContainer}>
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <TouchableOpacity 
                    key={participant}
                    style={[
                      styles.participantItem,
                      selectedParticipants.includes(participant) && styles.participantItemSelected
                    ]}
                    onPress={() => toggleParticipant(participant)}
                  >
                    <Text style={[
                      styles.participantText,
                      selectedParticipants.includes(participant) && styles.participantTextSelected
                    ]}>
                      {participant}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noParticipantsText}>No hay participantes para elegir aún</Text>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.acceptButton, selectedParticipants.length === 0 && styles.acceptButtonDisabled]} 
              onPress={handleSubmit}
              disabled={selectedParticipants.length === 0}
            >
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
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#FFFFFF",
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
  participantsContainer: {
    marginTop: 10,
    marginBottom: 20,
    maxHeight: 200,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 20,
    marginBottom: 10,
  },
  participantItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  participantItemSelected: {
    backgroundColor: "#4B00B8",
    borderColor: "#4B00B8",
  },
  participantText: {
    fontSize: 16,
    color: "#000000",
  },
  participantTextSelected: {
    color: "#FFFFFF",
  },
  noParticipantsText: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  acceptButtonDisabled: {
    backgroundColor: "#CCCCCC",
  }
});

export default TemporalExpenseModal;
