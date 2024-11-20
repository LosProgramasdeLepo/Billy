import React, { useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "@react-navigation/native";
import { requestPasswordReset, updateUserPassword, verifyPasswordResetCode } from "@/api/api";
import { VerificationModal } from "@/components/modals/VerificationModal";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [isPasswordChangeModalVisible, setIsPasswordChangeModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getEmailError = () => {
    if (email.trim() !== "" && !isValidEmail(email)) {
      return "Ingresa un email válido";
    }
    return "";
  };

  const isFormValid = () => {
    return email.trim() !== "" && isValidEmail(email);
  };

  const handleSubmit = async () => {
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setIsVerificationModalVisible(true);
      } else {
        Alert.alert("Error", result.error || "No se pudo enviar el código de verificación.");
      }
    } catch (error) {
      console.error("Error solicitando restablecimiento de contraseña:", error);
      Alert.alert("Error", "Ocurrió un error al solicitar el restablecimiento de contraseña.");
    }
  };

  const handleVerificationSubmit = async () => {
    try {
      const { success, error } = await verifyPasswordResetCode(email, verificationCode);
      if (!success) throw new Error(error || "No se pudo verificar el código de restablecimiento.");
      setIsVerificationModalVisible(false);
      setIsPasswordChangeModalVisible(true);
    } catch (error) {
      console.error("Error verificando código de restablecimiento:", error);
      Alert.alert("Error", "No se pudo verificar el código de restablecimiento. Por favor, inténtelo de nuevo.");
    }
  };

  const handlePasswordSubmit = async (newPassword: string) => {
    try {
      const { success, error } = await updateUserPassword(newPassword);
      if (!success) throw new Error(error || "No se pudo actualizar la contraseña.");
      setIsPasswordChangeModalVisible(false);
      Alert.alert("Éxito", "Contraseña actualizada correctamente", [{ text: "OK", onPress: () => navigation.navigate("login" as never) }]);
    } catch (error) {
      console.error("Error actualizando contraseña:", error);
      Alert.alert("Error", "No se pudo actualizar la contraseña. Por favor, inténtelo de nuevo.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.contentContainer}>
        <Image style={styles.logo} source={require("../../assets/images/Billy/billy-start.png")} />
        <View style={styles.whiteContainer}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ThemedText style={styles.backButtonText}>{"<"}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.title}>Recuperar contraseña</ThemedText>
          </View>

          <TextInput
            style={[styles.input, { borderColor: getEmailError() ? "#FF0000" : "black" }]}
            placeholder="Mail"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {getEmailError() && <ThemedText style={styles.errorText}>{getEmailError()}</ThemedText>}

          <TouchableOpacity
            style={[styles.button, !isFormValid() && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid()}
          >
            <ThemedText style={styles.buttonText}>Enviar código</ThemedText>
          </TouchableOpacity>

          <VerificationModal
            isVisible={isVerificationModalVisible}
            onClose={() => setIsVerificationModalVisible(false)}
            onSubmit={handleVerificationSubmit}
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
          />

          <ChangePasswordModal
            isVisible={isPasswordChangeModalVisible}
            onClose={() => setIsPasswordChangeModalVisible(false)}
            onSubmit={handlePasswordSubmit}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#4B00B8",
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  logo: {
    width: "100%",
    height: "50%",
    resizeMode: "contain",
    marginBottom: -30,
  },
  whiteContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    marginTop: 10,
  },
  backButton: {
    position: "absolute",
    left: 10,
    bottom: 15,
  },
  backButtonText: {
    color: "black",
    fontSize: 30,
  },
  title: {
    paddingTop: 5,
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
    marginBottom: 20,
  },
  input: {
    borderColor: "black",
    borderWidth: 1,
    width: "100%",
    padding: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginLeft: 15,
    marginTop: -10,
  },
  button: {
    backgroundColor: "black",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
