import React, { useState } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { addProfile } from '@/api/api';

const EMAIL = "juancito@gmail.com";

interface AddProfileModalProps {
  isVisible: boolean;

  onClose: () => void;
  onProfileAdded: () => void;
}

const AddProfileModal: React.FC<AddProfileModalProps> = ({ isVisible, onClose, onProfileAdded }) => {
  const [profileName, setProfileName] = useState('');

  const handleAddProfile = async () => {
    if (profileName.trim()) {
      await addProfile(profileName, EMAIL);
      setProfileName('');
      onProfileAdded();
      onClose();
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Crear nuevo perfil</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del perfil"
            value={profileName}
            onChangeText={setProfileName}
          />
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#4B00B8',
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddProfileModal;