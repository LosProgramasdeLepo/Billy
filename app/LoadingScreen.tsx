import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#4B00B8" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
