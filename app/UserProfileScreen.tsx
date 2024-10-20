import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppContext } from '@/hooks/useAppContext';
import { updateUserPassword, updateUserFullName, logOut, requestPasswordReset, verifyPasswordResetCode, uploadProfilePicture, getProfilePictureUrl} from '@/api/api';
import { useNavigation } from '@react-navigation/native';
import { BillyHeader } from '@/components/BillyHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';
import { VerificationModal } from '@/components/modals/VerificationModal';
import * as ImagePicker from 'expo-image-picker';

const EditableField = ({ label, value, isEditing, editingField, fieldName, onChangeText, onEditField }: { label: string, value: string, isEditing: boolean, editingField: string, fieldName: string, onChangeText: (text: string) => void, onEditField: (field: string | null) => void }) => (
  <View style={styles.infoContainer}>
    <Text style={styles.label}>{label}:</Text>
    <View style={styles.editableField}>
      {isEditing && editingField === fieldName ? (
        <TextInput style={[styles.input, styles.visibleInput]} value={value} onChangeText={onChangeText} onBlur={() => onEditField(null)} autoFocus/>
      ) : (
        <Text style={styles.value}>{value || 'N/A'}</Text>
      )}
      {isEditing && (
        <TouchableOpacity onPress={() => onEditField(fieldName)}>
          <Icon name="edit" size={20} color="#370185" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function UserProfileScreen() {
  
  const { user } = useAppContext();
  const navigation = useNavigation();
  const [userName, setUserName] = useState<string>('');
  const [userSurname, setUserSurname] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isPasswordChangeModalVisible, setIsPasswordChangeModalVisible] = useState(false);
  const [userIcon, setUserIcon] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.email) {
        try {
          const profilePictureUrl = await getProfilePictureUrl(user.email);
          setUserName(user.name || '');
          setUserSurname(user.surname || '');
          setUserEmail(user.email);
          setUserIcon(profilePictureUrl || '@/assets/images/icons/UserIcon.png');
        } 
        catch (error) {
          setUserName('');
          setUserSurname('');
          setUserIcon('@/assets/images/icons/UserIcon.png');
        }
      }
    };
    fetchUserData();
  }, [user?.email]);

  const handleEdit = async () => {
    if (isEditing) {
      setIsUpdating(true);
      try {
        await updateUserFullName(user?.email || '', userName, userSurname);
        
        {/* TODO: falta chequear la parte de email que funcione bien */}
        //   await updateUserEmail(user?.email || '', userEmail);
       
      }
      catch (error) {
        console.error('Error updating user information:', error);
        setUserName(userName);
        setUserSurname(userSurname);
        setUserEmail(userEmail);
      } 
      finally {
        setIsUpdating(false);
      }
    }
    setIsEditing(!isEditing);
    setEditingField(null);
  };

  const handleChangePassword = async () => {
    try {
      const { success, error } = await requestPasswordReset(user?.email || '');
      if (!success) throw new Error(error || 'Failed to request password reset.');
      setIsVerificationModalVisible(true);
    } 
    catch (error) {
      console.error('Error requesting password reset:', error);
      Alert.alert('Error', 'cambiar contraseña por ahora no se puede...');
    }
  };

  const handleVerificationSubmit = async () => {
    try {
      const { success, error } = await verifyPasswordResetCode(user?.email || '', verificationCode);
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
      Alert.alert('Success', 'Your password has been updated.');
    } 
    catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'Failed to update password. Please try again.');
    }
  };

  const handleChangeIcon = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant camera roll permissions to change your icon.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setUserIcon(result.assets[0].uri);
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const uploadedUrl = await uploadProfilePicture(user?.email || '', base64Image);
      if (uploadedUrl) setUserIcon(uploadedUrl);
      else Alert.alert("Error", "Failed to upload profile picture. Please try again.");
    }
  };

  const handleEditField = (field: string | null) => {
    setEditingField(field === editingField ? null : field);
  };

  const handleLogout = async () => {
    const result = await logOut();
    if (result.error) Alert.alert('Logout Error', result.error);
    navigation.navigate('start' as never);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4B00B8', '#20014E']} style={styles.gradientContainer}>
        <BillyHeader title="Perfil de usuario"/>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Icon name="arrow-back" size={30} color="#000000"/>
            </TouchableOpacity>
            
            <View style={styles.contentContainer}>

              <View style={styles.iconContainer}>
                <Image 
                  source={userIcon ? { uri: userIcon } : require('@/assets/images/icons/UserIcon.png')} 
                  style={styles.userIcon} 
                />

                {isEditing && (
                <TouchableOpacity style={styles.changeIconButton} onPress={handleChangeIcon}>
                  <Text style={styles.changeIconText}>Cambiar Icono</Text>
                </TouchableOpacity>
                )}
              </View>
              
              <EditableField label="Nombre" value={userName} isEditing={isEditing} editingField={editingField || ''} fieldName="name" onChangeText={setUserName} onEditField={handleEditField}/>
              
              <EditableField label="Apellido" value={userSurname} isEditing={isEditing} editingField={editingField || ''} fieldName="surname" onChangeText={setUserSurname} onEditField={handleEditField}/>

              <EditableField label="Mail" value={userEmail} isEditing={isEditing} editingField={editingField || ''} fieldName="email" onChangeText={setUserEmail} onEditField={handleEditField}/>

              {isEditing && (
              <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
                <Text style={styles.buttonText}>Cambiar Contraseña</Text>
              </TouchableOpacity>
              )}

              <TouchableOpacity style={[ styles.button, isEditing ? styles.saveButton : null, isUpdating ? styles.disabledButton : null ]} onPress={handleEdit} disabled={isUpdating}>
                <Text style={styles.buttonText}>
                  {isEditing ? (isUpdating ? 'Guardando...' : 'Guardar') : 'Editar'}
                </Text>
              </TouchableOpacity>

              {!isEditing && (
              <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
                <Text style={styles.buttonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
              )}

              <VerificationModal isVisible={isVerificationModalVisible} onClose={() => setIsVerificationModalVisible(false)} onSubmit={handleVerificationSubmit} verificationCode={verificationCode} setVerificationCode={setVerificationCode}/>

              <ChangePasswordModal isVisible={isPasswordChangeModalVisible} onClose={() => setIsPasswordChangeModalVisible(false)} onSubmit={handlePasswordSubmit}/>
            </View>
          </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  changeIconButton: {
    backgroundColor: '#370185',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  changeIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: '2.5%',
  },
  contentContainer: {
    width: '100%',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    flex: 1,
  },
  button: {
    backgroundColor: '#370185',
    borderRadius: 24,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  logoutButton: {
    backgroundColor: '#D32F2F',
  },
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#370185',
    marginRight: 10,
    padding: 5,
  },
  visibleInput: {
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '50%',
  },
});
