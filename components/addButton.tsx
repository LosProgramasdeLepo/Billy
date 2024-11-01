import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AddTransactionModal from "./modals/AddTransactionModal";

const AddButton = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.button}>
        <Icon name="add" size={24} color="#B29CCA" />
      </TouchableOpacity>
      <AddTransactionModal isVisible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    top: -160,
    left: 30,
  },
  button: {
    position: "absolute",
    top: -70,
    right: 40,
    backgroundColor: "#FFFFFF",
    width: 75,
    height: 75,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    elevation: 4,
  },
});

export default AddButton;
