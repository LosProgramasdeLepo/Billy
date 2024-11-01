import React, { useCallback } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { OutcomeList } from "../OutcomeList";
import { CategoryData } from "@/api/api";

interface CategoryDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedCategory: CategoryData | null;
}
const CategoryDetailsModal: React.FC<CategoryDetailsModalProps> = ({ isVisible, onClose, selectedCategory }) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!selectedCategory) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={handleClose}>
      <View style={styles.detailsModalBackground}>
        <View style={styles.detailsModalContainer}>
          <Text style={styles.detailsModalTitle}>
            {selectedCategory.name} (${selectedCategory.spent?.toFixed(2) || 0})
          </Text>
          <OutcomeList category={selectedCategory.id} />
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  detailsModalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  detailsModalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  detailsModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#FF0000",
    padding: 10,
    borderRadius: 5,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default React.memo(CategoryDetailsModal);
