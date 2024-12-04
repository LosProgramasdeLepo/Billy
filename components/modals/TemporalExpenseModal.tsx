import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, Animated, Alert, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import MlkitOcr from "react-native-mlkit-ocr";
import { processOcrResults, getBillParticipants, addOutcomeToBill } from "../../api/api";

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
  const [whoPaid, setWhoPaid] = useState<string>("");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const loadParticipants = async () => {
      if (billId) {
        const billParticipants = await getBillParticipants(billId);
        setParticipants(billParticipants);
      }
    };
    if (isVisible) {
      loadParticipants();
    }
  }, [billId, isVisible]);

  const toggleParticipant = (participant: string) => {
    setSelectedParticipants((prev) => {
      const newSelected = prev.includes(participant) ? prev.filter((p) => p !== participant) : [...prev, participant];

      return newSelected;
    });
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setTicketScanned(false);
    setErrors({
      description: false,
      amount: false,
    });
    setWhoPaid("");
    setSelectedParticipants([]);
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

    const newErrors = {
      description: description.trim() === "",
      amount: amount.trim() === "",
    };

    setErrors(newErrors);

    if (newErrors.description || newErrors.amount || !whoPaid || selectedParticipants.length === 0) {
      Alert.alert("Error", "Por favor complete todos los campos obligatorios y seleccione quién pagó");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await addOutcomeToBill(billId, whoPaid, parseFloat(amount), description, selectedParticipants);

      if (!success) {
        Alert.alert("Error", "No se pudo guardar el gasto");
        return;
      }

      refreshTransactions();
      setAmount("");
      setDescription("");
      setWhoPaid("");
      setSelectedParticipants([]);
      onClose();
    } catch (error) {
      console.error("Error al guardar el gasto:", error);
      Alert.alert("Error", "Ocurrió un error al guardar el gasto");
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
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Nuevo gasto</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Icon name="close" size={30} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.description && styles.inputError, { width: "90%" }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción (obligatorio)"
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
              placeholder="Monto (obligatorio)"
              placeholderTextColor="#AAAAAA"
            />

            <View style={styles.whoPaidContainer}>
              <Text style={styles.participantsTitle}>¿Quién pagó?</Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowPicker(!showPicker)}>
                <Text style={styles.dropdownButtonText}>{whoPaid || "Seleccione quién pagó"}</Text>
                <Icon name={showPicker ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color="#000" />
              </TouchableOpacity>

              {showPicker && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.scrollView} nestedScrollEnabled={true}>
                    {participants.map((participant) => (
                      <TouchableOpacity
                        key={participant}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setWhoPaid(participant);
                          setSelectedParticipants((prev) => (prev.includes(participant) ? prev : [...prev, participant]));
                          setShowPicker(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{participant}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text style={styles.participantsTitle}>Participantes:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.participantsList}>
              <View style={styles.participantsContainer}>
                {participants.map((participant, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.participantButton, selectedParticipants.includes(participant) && styles.participantButtonSelected]}
                    onPress={() => toggleParticipant(participant)}
                  >
                    <Text
                      style={[
                        styles.participantButtonText,
                        selectedParticipants.includes(participant) && styles.participantButtonTextSelected,
                      ]}
                    >
                      {participant}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

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
    right: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#FF0000",
  },
  scanButton: {
    padding: 5,
    marginLeft: 5,
    marginBottom: 16,
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
  participantsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  participantsList: {
    maxHeight: 200,
  },
  participantsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  participantButton: {
    backgroundColor: "#DDDDDD",
    borderRadius: 10,
    padding: 10,
    margin: 5,
  },
  participantButtonSelected: {
    backgroundColor: "#4B00B8",
  },
  participantButtonText: {
    fontSize: 16,
  },
  participantButtonTextSelected: {
    color: "#FFFFFF",
  },
  acceptButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  whoPaidContainer: {
    width: "100%",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#F8F8F8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    height: 60,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    backgroundColor: "#F8F8F8",
    marginBottom: 16,
    marginTop: -10,
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  scrollView: {
    maxHeight: 80,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
});

export default TemporalExpenseModal;
