import React, { useState, useCallback, useEffect } from "react";
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from "react-native";
import { addCategory } from "@/api/api";
import { useAppContext } from "@/hooks/useAppContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface AddCategoryModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCategoryAdded: () => void;
  sortedCategories: any[];
}

const gradients = [
  ["#F1B267", "#EEF160"],
  ["#7E91F7", "#41D9FA"],
  ["#F77EE4", "#B06ECF"],
  ["#CBEC48", "#50B654"],
  ["#48ECE2", "#62D29C"],
  ["#FF9A8B", "#FF6A88"],
  ["#66A6FF", "#89F7FE"],
  ["#FDCB6E", "#FF7979"],
  ["#7ED56F", "#28B485"],
  ["#D4FC79", "#96E6A1"],
  ["#84FAB0", "#8FD3F4"],
  ["#FA709A", "#FEE140"],
  ["#43E97B", "#38F9D7"],
  ["#F6D365", "#FDA085"],
  ["#5EE7DF", "#B490CA"],
  ["#D299C2", "#FEF9D7"],
  ["#6A11CB", "#2575FC"],
  ["#FF867A", "#FF8C7F"],
  ["#FFD26F", "#3677FF"],
  ["#72EDF2", "#5151E5"],
];

const DEFAULT_ICON = "cart-outline";

const icons = [
  "home",
  "food",
  "car",
  "shopping-outline",
  "medical-bag",
  "school",
  "airplane",
  "gift",
  "dumbbell",
  "music",
  "movie",
  "book-open-variant",
  "gamepad-variant",
  "cash",
  "credit-card",
  "piggy-bank",
  "chart-line",
  "account",
  "heart",
  "star",
];

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isVisible, onClose, onCategoryAdded, sortedCategories }) => {
  const { currentProfileId } = useAppContext();

  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedGradient, setSelectedGradient] = useState(gradients[0]);
  const [selectedIcon, setSelectedIcon] = useState(icons[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({ name: false });

  const resetModal = useCallback(() => {
    setName("");
    setLimit("");
    setSelectedGradient(gradients[0]);
    setSelectedIcon(icons[0]);
    setErrorMessage("");
    setErrors({ name: false });
  }, []);

  useEffect(() => {
    if (!isVisible) {
      resetModal();
    }
  }, [isVisible, resetModal]);

  const handleNameChange = useCallback((text: string) => {
    setName(text);
    setErrorMessage("");
    setErrors((prev) => ({ ...prev, name: !text.trim() }));
  }, []);

  const validateCategoryName = useCallback(
    (text: string) => {
      if (!text.trim()) {
        setErrors((prev) => ({ ...prev, name: true }));
        setErrorMessage("");
        return false;
      }
      const categoryExists = sortedCategories.some(
        (category) => category && category.name && category.name.toLowerCase() === text.toLowerCase()
      );
      if (categoryExists) {
        setErrorMessage("Ya existe una categoría con ese nombre");
        return false;
      }
      setErrorMessage("");
      setErrors((prev) => ({ ...prev, name: false }));
      return true;
    },
    [sortedCategories]
  );

  const handleAddCategory = useCallback(async () => {
    if (!validateCategoryName(name) || isSubmitting) return;
    setIsSubmitting(true);
    await addCategory(currentProfileId ?? "", name, JSON.stringify(selectedGradient), selectedIcon || DEFAULT_ICON, parseFloat(limit));
    setName("");
    setLimit("");
    setSelectedGradient(gradients[0]);
    setSelectedIcon(icons[0]);
    onCategoryAdded();
    setIsSubmitting(false);
    onClose();
  }, [validateCategoryName, isSubmitting, currentProfileId, name, limit, selectedGradient, selectedIcon, onCategoryAdded, onClose]);

  const renderGradientItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.gradientItem, { backgroundColor: item[0] }, selectedGradient === item && styles.selectedGradient]}
      onPress={() => setSelectedGradient(item)}
    />
  );

  const renderIconItem = ({ item }: { item: string }) => (
    <TouchableOpacity style={[styles.iconItem, selectedIcon === item && styles.selectedIcon]} onPress={() => setSelectedIcon(item)}>
      <Icon name={item} size={24} color={selectedIcon === item ? "#4B00B8" : "#000"} />
    </TouchableOpacity>
  );

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Crear nueva categoría</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={30} color="#000000" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={handleNameChange}
            placeholder="Nombre (obligatorio)"
            placeholderTextColor="#AAAAAA"
          />
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={limit}
            onChangeText={setLimit}
            placeholder="Límite"
            placeholderTextColor="#AAAAAA"
          />

          <FlatList
            data={icons}
            renderItem={renderIconItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.iconList}
          />

          <FlatList
            data={gradients}
            renderItem={renderGradientItem}
            keyExtractor={(index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gradientList}
          />

          <TouchableOpacity
            style={[styles.acceptButton, (!name.trim() || errors.name) && styles.acceptButtonDisabled]}
            onPress={handleAddCategory}
            disabled={!name.trim() || errors.name}
          >
            <Text style={styles.acceptButtonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    backgroundColor: "#4B00B8",
    padding: 10,
    borderRadius: 5,
    width: "40%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: -12,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  gradientList: {
    marginBottom: 16,
  },
  gradientItem: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  selectedGradient: {
    borderWidth: 2,
    borderColor: "#4B00B8",
  },
  iconList: {
    marginBottom: 16,
  },
  iconItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  selectedIcon: {
    backgroundColor: "#e0e0e0",
    borderWidth: 2,
    borderColor: "#4B00B8",
  },
  inputError: {
    borderColor: "#FF0000",
    borderWidth: 1,
  },
  closeButton: {},
  acceptButton: {
    backgroundColor: "#370185",
    borderRadius: 24,
    padding: 12,
    width: "100%",
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  acceptButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
});

export default AddCategoryModal;
