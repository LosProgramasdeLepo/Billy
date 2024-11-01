import React, { useEffect } from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "@/hooks/useAppContext";
import { getUser } from "@/api/api";

export default function Start() {
  const navigation = useNavigation();
  const { setUser } = useAppContext();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        if (session) {
          const parsedSession = JSON.parse(session);
          if (parsedSession && parsedSession.user && parsedSession.user.email) {
            const user = await getUser(parsedSession.user.email);
            setUser(user);
            navigation.reset({ index: 0, routes: [{ name: "(tabs)" as never }] });
          } else await AsyncStorage.removeItem("userSession");
        }
      } catch (error) {
        console.error("Error checking session:", error);
        await AsyncStorage.removeItem("userSession");
      }
    };

    checkSession();
  }, [navigation, setUser]);

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require("../../assets/images/Billy/billy-start.png")} />
      <View style={styles.whiteContainer}>
        <ThemedText style={styles.title}>Manejar tu plata nunca fue tan fácil</ThemedText>
        <ThemedText style={styles.subtitle}>Llevá el control de tus ingresos y gastos de manera simple y rápida.</ThemedText>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("login" as never)}>
          <ThemedText style={styles.buttonText}>Iniciar Sesión</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("signup" as never)}>
          <ThemedText style={styles.secondaryButtonText}>Registrarme</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#4B00B8",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "60%",
    resizeMode: "contain",
    marginBottom: 20,
  },
  whiteContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: "100%",
    alignItems: "center",
  },
  title: {
    paddingTop: 5,
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "black",
    textAlign: "center",
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: "black",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
  },
  secondaryButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
});
