import React, { useState } from "react";
import { View, Text, TextInput, Modal, TouchableOpacity, Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { StyleSheet } from "react-native";

interface AddPersonModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAddPerson: (name: string) => void;
}

const AddPersonModal: React.FC<AddPersonModalProps> = ({ isVisible, onClose, onAddPerson }) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (name.trim() === "") {
      Alert.alert("Error", "Por favor ingrese un nombre");
      return;
    }

    setIsSubmitting(true);
    try {
      onAddPerson(name.trim());
      setName("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Nuevo participante</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={30} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre (obligatorio)" placeholderTextColor="#AAAAAA" />

            <TouchableOpacity
              style={[styles.acceptButton, name.trim() === "" && styles.acceptButtonDisabled]}
              onPress={handleSubmit}
              disabled={name.trim() === ""}
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
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  contentContainer: {
    paddingHorizontal: 20,
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
  acceptButton: {
    backgroundColor: "#4B00B8",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
  },
  acceptButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddPersonModal;
