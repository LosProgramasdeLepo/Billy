import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AddTransactionModal from './modals/AddTransactionModal';

const AddButton = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOpenModal = () => setIsModalVisible(true);
  const handleCloseModal = () => setIsModalVisible(false);

  return (
    <View>
      <TouchableOpacity onPress={handleOpenModal} testID="add-button">
        <Icon name="add" size={24} color="black" />
      </TouchableOpacity>
      {isModalVisible && (
        <AddTransactionModal
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          testID="add-transaction-modal"
        />
      )}
    </View>
  );
};

export default AddButton;
