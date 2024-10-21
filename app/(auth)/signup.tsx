import React, { useState } from 'react';
import { View, StyleSheet, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation } from '@react-navigation/native';
import { signUp } from '@/api/api';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/hooks/useAppContext';

export default function Signup() {
  const navigation = useNavigation();
  const { setUser } = useAppContext();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
  
    try {
      const { error } = await signUp(email, password, name, surname);
      if (error) Alert.alert('Error de registro', 'No se pudo crear la cuenta');
      else {
        Alert.alert(
          'Registro exitoso',
          'Se ha enviado un correo de verificación. Por favor, verifica tu correo antes de iniciar sesión.',
          [{ text: 'OK', onPress: () => navigation.navigate('login' as never) }]
        );
      }
    }

    catch (error) {
      console.error('Error during signup:', error);
      Alert.alert('Error de registro', 'Ocurrió un error durante el registro');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // Ajusta este valor según sea necesario
    >
      <Image source={require('../../assets/images/Billy/billy-signup.png')} style={styles.logo}/>
      <View style={styles.whiteContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={styles.title}>Comenza en Billy</ThemedText>
        </View>
        
        <View style={styles.nameContainer}>
          <TextInput style={styles.miniInput} placeholder="Nombre" placeholderTextColor="#999" value={name} onChangeText={setName}/>
          <TextInput style={styles.miniInput} placeholder="Apellido" placeholderTextColor="#999" value={surname} onChangeText={setSurname}/>
        </View>
        
        <TextInput style={styles.input} placeholder="Mail" placeholderTextColor="#999" value={email} onChangeText={setEmail}/>
        
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#999" secureTextEntry={!passwordVisible} value={password} onChangeText={setPassword}/>
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
            <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Repetir Contraseña" placeholderTextColor="#999" secureTextEntry={!confirmPasswordVisible} value={confirmPassword} onChangeText={setConfirmPassword}/>
          <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.eyeButton}>
            <Ionicons name={confirmPasswordVisible ? 'eye-off' : 'eye'} size={24} color="black" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          <ThemedText style={styles.buttonText}>Registrarme</ThemedText>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#4B00B8',
    justifyContent: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -16 }], 
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  whiteContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    bottom: 15,
  },
  backButtonText: {
    color: 'black',
    fontSize: 30,
  },
  logo: {
    width: '100%',
    height: '47%',
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'transparent',
    width: '100%',
    padding: 15,
    borderRadius: 25,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'black',
  },
  miniInput: {
    backgroundColor: 'transparent',
    width: '49%',
    padding: 15,
    borderRadius: 25,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'black',
  },
  signupButton: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});