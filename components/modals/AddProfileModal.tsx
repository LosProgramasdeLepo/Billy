import React, { useState } from "react";
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { addProfile, addSharedUsers, addCategory } from "@/api/api";
import { useAppContext } from "@/hooks/useAppContext";

interface AddProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  onProfileAdded: () => void;
}

const AddProfileModal: React.FC<AddProfileModalProps> = ({ isVisible, onClose, onProfileAdded }) => {
  const { user } = useAppContext();

  const [profileName, setProfileName] = useState("");
  const [sharedUsers, setSharedUsers] = useState("");
  const [emailBlocks, setEmailBlocks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({ name: false });

  const handleNameChange = (text: string) => {
    setProfileName(text);
    setErrors((prev) => ({ ...prev, name: !text.trim() }));
  };

  const handleSharedUsersChange = (text: string) => {
    setSharedUsers(text);
    if (text.endsWith(" ")) {
      const email = text.trim();
      if (email && !emailBlocks.includes(email)) {
        setEmailBlocks([...emailBlocks, email]);
        setSharedUsers("");
      }
    }
  };

  const handleAddProfile = async () => {
    if (!profileName.trim()) {
      setErrors((prev) => ({ ...prev, name: true }));
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    if (profileName.trim()) {
      const newProfile = await addProfile(profileName, user?.email ?? "");
      await addCategory(newProfile?.id ?? "", "Otros", JSON.stringify(["#AAAAAA", "#AAAAAA"]), "shape");
      
      if (emailBlocks.length > 0) {
        await addSharedUsers(newProfile?.id ?? "", emailBlocks);
      }
      
      setProfileName("");
      setSharedUsers("");
      setEmailBlocks([]);
      onProfileAdded();
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Crear nuevo perfil</Text>

          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Nombre (obligatorio)"
            value={profileName}
            onChangeText={handleNameChange}
          />

          <View style={[styles.inputContainer, styles.expandableInput]}>
            <View style={styles.emailBlocksContainer}>
              {emailBlocks.map((email, index) => (
                <View key={index} style={styles.emailBlock}>
                  <Text style={styles.emailText}>{email}</Text>
                  <TouchableOpacity
                    onPress={() => setEmailBlocks(emailBlocks.filter((_, i) => i !== index))}
                  >
                    <Text style={styles.removeEmail}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TextInput
                style={styles.emailInput}
                placeholder={emailBlocks.length === 0 ? "Correos (separados por espacios)" : ""}
                value={sharedUsers}
                onChangeText={handleSharedUsersChange}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleAddProfile}>
              <Text style={styles.buttonText}>Crear</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    width: "100%",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  expandableInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    minHeight: 45,
  },
  emailBlocksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emailBlock: {
    backgroundColor: '#E8E8E8',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailText: {
    marginRight: 5,
  },
  removeEmail: {
    fontSize: 18,
    color: '#666',
  },
  emailInput: {
    flex: 1,
    minWidth: 100,
    padding: 0,
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
  inputError: {
    borderColor: "#FF0000",
    borderWidth: 1,
  },
});

export default AddProfileModal;