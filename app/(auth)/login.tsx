import React, { useState } from 'react';
import { View, StyleSheet, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { addCategory, addProfile, changeCurrentProfile, getUser, logIn, updateUserPassword, verifyPasswordResetCode } from '@/api/api';
import { useAppContext } from '@/hooks/useAppContext';
import { Alert } from 'react-native';
import { requestPasswordReset } from '../../api/api';  
import { VerificationModal } from '@/components/modals/VerificationModal';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState('');  
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [isPasswordChangeModalVisible, setIsPasswordChangeModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const { setUser } = useAppContext();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async () => {
    try {
      const { user, error } = await logIn(email, password);
      if (error) {
        Alert.alert('Login Failed', 'Invalid email or password');
        return;
      }
      
      if (!user) {
        Alert.alert('Login Error', 'User not found. Please check your email and try again.');
        return;
      }
  
      const userData = await getUser(email);
      if (!userData) {
        Alert.alert('Login Error', 'User data not found. Please try again.');
        return;
      }

      // Create default profile if it doesn't exist
      if (!userData.my_profiles || userData.my_profiles.length === 0) {
        const newProfile = await addProfile('Default', email);
        if (newProfile?.id) await changeCurrentProfile(email, newProfile.id);
        await addCategory(newProfile?.id ?? "", "Otros", JSON.stringify(['#AAAAAA', '#AAAAAA']), "shape");
      }

      setUser(userData);
  
      navigation.reset({ index: 0, routes: [{ name: '(tabs)' as never }] });
    } 
    
    catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Login Error', 'An error occurred during login. Please try again.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Por favor inserte un email');
      return;
    }
    setErrorMessage('');
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        Alert.alert('Código enviado', 'Se ha enviado un código de verificación a su email.');
        setIsVerificationModalVisible(true);
      } 
      else Alert.alert('Error', result.error || 'No se pudo enviar el código de verificación.');
    } 
    catch (error) {
      console.error('Error requesting password reset:', error);
      Alert.alert('Error', 'Ocurrió un error al solicitar el restablecimiento de contraseña.');
    }
  };

  const handleVerificationSubmit = async () => {
    try {
      const { success, error } = await verifyPasswordResetCode(email, verificationCode);
      if (!success) throw new Error(error || 'Failed to verify password reset code.');
      setIsVerificationModalVisible(false);
      setIsPasswordChangeModalVisible(true);
    } 
    catch (error) {
      console.error('Error verifying reset code:', error);
      Alert.alert('Error', 'Failed to verify reset code. Please try again.');
    }
  };

  const handlePasswordSubmit = async (newPassword: string) => {
    try {
      const { success, error } = await updateUserPassword(newPassword);
      if (!success) throw new Error(error || 'Failed to update password.');
      setIsPasswordChangeModalVisible(false);
    } 
    catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'Failed to update password. Please try again.');
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

        <VerificationModal
          isVisible={isVerificationModalVisible}
          onClose={() => setIsVerificationModalVisible(false)}
          onSubmit={handleVerificationSubmit}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
        />

        <ChangePasswordModal
          isVisible={isPasswordChangeModalVisible}
          onClose={() => setIsPasswordChangeModalVisible(false)}
          onSubmit={handlePasswordSubmit}
        />
        
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
