import React, { useState } from "react";
import { View, StyleSheet, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "@react-navigation/native";
import { signUp } from "@/api/api";
import { Ionicons } from "@expo/vector-icons";

export default function Signup() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    return password.length >= 8 && hasUpperCase;
  };

  const isFormValid = () => {
    return (
      name.trim() !== "" &&
      surname.trim() !== "" &&
      isValidEmail(email.trim()) &&
      isValidPassword(password.trim()) &&
      confirmPassword.trim() !== "" &&
      password === confirmPassword
    );
  };

  const getPasswordError = () => {
    if (password.trim() === "") return "";
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(password)) return "La contraseña debe tener al menos una mayúscula";
    return "";
  };

  const getConfirmPasswordError = () => {
    if (confirmPassword.trim() === "") return "";
    if (confirmPassword.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(confirmPassword)) return "La contraseña debe tener al menos una mayúscula";
    if (password !== confirmPassword) return "Las contraseñas no coinciden";
    return "";
  };

  const getEmailError = () => {
    if (email.trim() === "") return "";
    if (!isValidEmail(email)) return "Ingresa un email válido";
    return "";
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const handleSignup = async () => {
    if (!isValidPassword(password)) {
      Alert.alert("Error", "La contraseña debe tener al menos 8 caracteres y una mayúscula");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    try {
      const { error } = await signUp(email, password, name, surname);
      if (error) Alert.alert("Error de registro", "No se pudo crear la cuenta");
      else {
        Alert.alert("Registro exitoso", "Se ha enviado un correo de verificación. Por favor, verifica tu correo antes de iniciar sesión.", [
          { text: "OK", onPress: () => navigation.navigate("login" as never) },
        ]);
      }
    } catch (error) {
      console.error("Error during signup:", error);
      Alert.alert("Error de registro", "Ocurrió un error durante el registro");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.contentContainer}>
        <Image source={require("../../assets/images/Billy/billy-signup.png")} style={styles.logo} />
        <View style={styles.whiteContainer}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ThemedText style={styles.backButtonText}>{"<"}</ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.title}>Comenza en Billy</ThemedText>
          </View>

          <View style={styles.nameContainer}>
            <TextInput style={styles.miniInput} placeholder="Nombre" placeholderTextColor="#999" value={name} onChangeText={setName} />
            <TextInput
              style={styles.miniInput}
              placeholder="Apellido"
              placeholderTextColor="#999"
              value={surname}
              onChangeText={setSurname}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { borderColor: getEmailError() ? "#FF0000" : "black" }]}
                placeholder="Mail"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            {getEmailError() && <ThemedText style={styles.errorText}>{getEmailError()}</ThemedText>}
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
            style={[styles.signupButton, !isFormValid() && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={!isFormValid()}
          >
            <ThemedText style={styles.buttonText}>Registrarme</ThemedText>
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
  eyeButton: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -18 }],
  },
  inputContainer: {
    position: "relative",
    width: "100%",
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  whiteContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
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
    height: "50%",
    resizeMode: "contain",
    marginBottom: -30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "transparent",
    width: "100%",
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "black",
    marginBottom: 10,
  },
  inputError: {
    borderColor: "#FF0000",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginLeft: 15,
    marginTop: -10,
  },
  inputGroup: {
    width: "100%",
    minHeight: 80,
  },
  miniInput: {
    backgroundColor: "transparent",
    width: "49%",
    padding: 15,
    borderRadius: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "black",
  },
  signupButton: {
    backgroundColor: "black",
    paddingVertical: 15,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
  },
  signupButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
