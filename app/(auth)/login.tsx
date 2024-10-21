import React, { useState } from 'react';
import { View, StyleSheet, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getUser, logIn } from '@/api/api';
import { useAppContext } from '@/hooks/useAppContext';
import { Alert } from 'react-native';
import { requestPasswordReset } from '../../api/api';  

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState('');  
  const [errorMessage, setErrorMessage] = useState('');
  const { setUser } = useAppContext();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async () => {
    try {
      const result = await logIn(email, password);
      if (result.user) { 
        const user = await getUser(email);
        setUser(user);
        navigation.reset({ index: 0, routes: [{ name: '(tabs)' as never }] });
      } else {
        Alert.alert('Login Failed', 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Login Error', 'An error occurred during login');
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      setErrorMessage('Por favor inserte un email');
    } else {
      setErrorMessage('');
      requestPasswordReset(email);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Image style={styles.logo} source={require('../../assets/images/Billy/billy-start.png')}/>
      <View style={styles.whiteContainer}>

        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.title}>Inicio de sesión</ThemedText>
        </View>
        
        <TextInput style={styles.input} placeholder="Mail" placeholderTextColor="#999" value={email} onChangeText={setEmail}/>

        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#999" secureTextEntry={!passwordVisible} value={password} onChangeText={setPassword}/>
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
            <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={24} color="black" />
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        ) : null}

        <TouchableOpacity onPress={handleForgotPassword}>
          <ThemedText style={styles.forgotPassword}>Olvidé mi contraseña</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <ThemedText style={styles.buttonText}>Iniciar Sesión</ThemedText>
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
    flex: 1,
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
    height: '60%',
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    paddingTop: 5,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -16 }], 
  },
  input: {
    borderColor: 'black',
    borderWidth: 1,
    width: '100%',
    padding: 15,
    borderRadius: 25,
    marginBottom: 10,
  },
  forgotPassword: {
    color: 'black',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  loginButton: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
});
