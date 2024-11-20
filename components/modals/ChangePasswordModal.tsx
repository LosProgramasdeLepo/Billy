import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface ChangePasswordModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string, confirmPassword: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isVisible, onClose, onSubmit }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const isValidPassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasMinLength = password.length >= 8;
    return hasUpperCase && hasMinLength;
  };

  const getPasswordError = () => {
    if (password.trim() !== "" && !isValidPassword(password)) {
      if (password.length < 8) {
        return "La contraseña debe tener al menos 8 caracteres";
      }
      if (!/[A-Z]/.test(password)) {
        return "La contraseña debe tener al menos una mayúscula";
      }
    }
    return "";
  };

  const getConfirmPasswordError = () => {
    if (confirmPassword.trim() !== "" && password !== confirmPassword) {
      return "Las contraseñas no coinciden";
    }
    return "";
  };

  const isFormValid = () => {
    return password.trim() !== "" && isValidPassword(password) && confirmPassword.trim() !== "" && password === confirmPassword;
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const handleSubmit = () => {
    onSubmit(password, confirmPassword);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Nueva contraseña</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={30} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { borderColor: getPasswordError() ? "#FF0000" : "black" }]}
                placeholder="Contraseña"
                placeholderTextColor="#999"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
                <Ionicons name={passwordVisible ? "eye-off" : "eye"} size={24} color="black" />
              </TouchableOpacity>
            </View>
            {getPasswordError() && <ThemedText style={styles.errorText}>{getPasswordError()}</ThemedText>}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { borderColor: getConfirmPasswordError() ? "#FF0000" : "black" }]}
                placeholder="Repetir Contraseña"
                placeholderTextColor="#999"
                secureTextEntry={!confirmPasswordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.eyeButton}>
                <Ionicons name={confirmPasswordVisible ? "eye-off" : "eye"} size={24} color="black" />
              </TouchableOpacity>
            </View>
            {getConfirmPasswordError() && <ThemedText style={styles.errorText}>{getConfirmPasswordError()}</ThemedText>}
          </View>

          <TouchableOpacity
            style={[styles.button, !isFormValid() && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid()}
          >
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>
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
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
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
  inputContainer: {
    position: "relative",
    width: "100%",
  },
  input: {
    backgroundColor: "white",
    width: "100%",
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 10,
  },
  eyeButton: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -18 }],
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
