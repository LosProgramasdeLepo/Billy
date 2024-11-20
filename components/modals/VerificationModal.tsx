import React from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface VerificationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  verificationCode,
  setVerificationCode,
}) => {
  const getVerificationError = () => {
    if (verificationCode.trim() !== "" && verificationCode.length !== 6) {
      return "El código debe tener 6 caracteres";
    }
    return "";
  };

  const isFormValid = () => {
    return verificationCode.trim() !== "" && verificationCode.length === 6;
  };

  const handleSubmit = () => {
    onSubmit(verificationCode);
    setVerificationCode("");
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Ingrese el código</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={30} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor: getVerificationError() ? "#FF0000" : "black" }]}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Código de verificación"
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor="#999"
            />
            {getVerificationError() && <Text style={styles.errorText}>{getVerificationError()}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, !isFormValid() && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid()}
          >
            <Text style={styles.buttonText}>Verificar</Text>
          </TouchableOpacity>
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
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "white",
    width: "100%",
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 10,
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginLeft: 15,
    marginTop: -10,
  },
  button: {
    backgroundColor: "#370185",
    borderRadius: 24,
    padding: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
