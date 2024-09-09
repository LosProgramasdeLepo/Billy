import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddButton = ({ }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} >
        <Icon name="add" size={24} color="#000000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', // Positioning the button at the bottom right
    bottom: 20,
    right: 20,
  },
  button: {
    backgroundColor: '#FFFFFF', 
    width: 60,                  
    height: 60,                 
    borderRadius: 30,           
    justifyContent: 'center',   
    alignItems: 'center',       
    shadowColor: '#000',        
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3,         
    shadowRadius: 4,            
    elevation: 4,               
  },
});

export default AddButton;