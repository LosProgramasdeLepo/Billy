import React, { useState } from "react";
import { View, StyleSheet, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { addCategory, addProfile, changeCurrentProfile, getUser, logIn, updateUserPassword, verifyPasswordResetCode } from "@/api/api";
import { useAppContext } from "@/hooks/useAppContext";
import { Alert } from "react-native";
import { requestPasswordReset } from "../../api/api";
import { VerificationModal } from "@/components/modals/VerificationModal";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [isPasswordChangeModalVisible, setIsPasswordChangeModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const { setUser } = useAppContext();

  const isFormValid = () => {
    return email.trim() !== "" && password.trim() !== "";
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async () => {
    try {
      const { user, error } = await logIn(email, password);
      if (error === "Email not validated") {
        Alert.alert("Email no verificado", "Por favor, verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.");
        return;
      }

      else if (error) {
        Alert.alert("Error de inicio de sesión", "Email o contraseña inválidos.");
        return;
      }

      if (!user) {
        Alert.alert("Error de inicio de sesión", "No se encontró información del usuario. Por favor, inténtelo de nuevo.");
        return;
      }

      const userData = await getUser(email);
      if (!userData) {
        Alert.alert("Error de inicio de sesión", "No se encontró información del usuario. Por favor, inténtelo de nuevo.");
        return;
      }

      // Create default profile if it doesn't exist
      if (!userData.my_profiles || userData.my_profiles.length === 0) {
        const newProfile = await addProfile("Default", email);
        if (newProfile?.id) await changeCurrentProfile(email, newProfile.id);
        await addCategory(newProfile?.id ?? "", "Otros", JSON.stringify(["#AAAAAA", "#AAAAAA"]), "shape");
      }

      setUser(userData);

      navigation.reset({ index: 0, routes: [{ name: "(tabs)" as never }] });
    } catch (error) {
      console.error("Error de inicio de sesión:", error);
      Alert.alert("Error de inicio de sesión", "Ocurrió un error al iniciar sesión. Por favor, inténtelo de nuevo.");
    }
  };

  const handleForgotPassword = async () => {
    navigation.navigate("forgot_password" as never);
  };

  const handleVerificationSubmit = async () => {
    try {
      const { success, error } = await verifyPasswordResetCode(email, verificationCode);
      if (!success) throw new Error(error || "Failed to verify password reset code.");
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
      if (!success) throw new Error(error || "Failed to update password.");
      setIsPasswordChangeModalVisible(false);
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
            <ThemedText style={styles.title}>Inicio de sesión</ThemedText>
          </View>

          <TextInput style={styles.input} placeholder="Mail" placeholderTextColor="#999" value={email} onChangeText={setEmail} />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
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

          {errorMessage ? <ThemedText style={styles.errorText}>{errorMessage}</ThemedText> : null}

          <TouchableOpacity onPress={handleForgotPassword}>
            <ThemedText style={styles.forgotPassword}>Olvidé mi contraseña</ThemedText>
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

          <TouchableOpacity
            style={[styles.loginButton, !isFormValid() && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={!isFormValid()}
          >
            <ThemedText style={styles.buttonText}>Iniciar Sesión</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    marginTop: 10,
  },
  container: {
    backgroundColor: "#4B00B8",
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  whiteContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    alignItems: "center",
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
  logo: {
    width: "100%",
    height: "60%",
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    paddingTop: 5,
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
    marginBottom: 20,
  },  
  eyeButton: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -22 }],
  },
  input: {
    borderColor: "black",
    borderWidth: 1,
    width: "100%",
    padding: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  forgotPassword: {
    marginBottom: 10,
    color: "black",
    textDecorationLine: "underline",
  },
  inputContainer: {
    position: "relative",
    width: "100%",
  },
  loginButton: {
    backgroundColor: "black",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
  },
});
