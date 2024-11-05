import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAppContext } from "@/hooks/useAppContext";
import {
  updateUserPassword,
  updateUserFullName,
  logOut,
  requestPasswordReset,
  verifyPasswordResetCode,
  uploadProfilePicture,
  getProfilePictureUrl,
  updateUserSharedApp,
} from "@/api/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BillyHeader } from "@/components/BillyHeader";
import { LinearGradient } from "expo-linear-gradient";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";
import { VerificationModal } from "@/components/modals/VerificationModal";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Share } from "react-native";

const EditableField = ({
  label,
  value,
  isEditing,
  editingField,
  fieldName,
  onChangeText,
  onEditField,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  editingField: string;
  fieldName: string;
  onChangeText: (text: string) => void;
  onEditField: (field: string | null) => void;
}) => (
  <View style={styles.infoContainer}>
    <Text style={styles.label}>{label}: </Text>
    <View style={styles.editableField}>
      {isEditing && editingField === fieldName ? (
        <TextInput
          style={[styles.input, styles.visibleInput]}
          value={value}
          onChangeText={onChangeText}
          onBlur={() => onEditField(null)}
          autoFocus
        />
      ) : (
        <Text style={styles.value}>{value || "N/A"}</Text>
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
  const { user, refreshUser, setUserProfilePicture } = useAppContext();
  const navigation = useNavigation();
  const router = useRouter();

  const [userName, setUserName] = useState<string>("");
  const [userSurname, setUserSurname] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isPasswordChangeModalVisible, setIsPasswordChangeModalVisible] = useState(false);
  const [userIcon, setUserIcon] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (user?.email) {
      try {
        await refreshUser();
        const profilePictureUrl = await getProfilePictureUrl(user.email);
        setUserName(user.name || "");
        setUserSurname(user.surname || "");
        setUserEmail(user.email);
        setUserIcon(profilePictureUrl);
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to fetch user data. Please try again.");
      }
    }
  }, [user?.email]);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  useEffect(() => {
    if (user) {
      setUserName(user.name || "");
      setUserSurname(user.surname || "");
      setUserEmail(user.email || "");
    }
  }, [user]);

  const handleEdit = async () => {
    if (isEditing) {
      setIsUpdating(true);
      try {
        await updateUserFullName(user?.email || "", userName, userSurname);
        await refreshUser();
        setIsEditing(false);
        setEditingField(null);
        navigation.goBack();
      } catch (error) {
        setUserName(userName);
        setUserSurname(userSurname);
        setUserEmail(userEmail);
        Alert.alert("Error", "Failed to update user information. Please try again.");
      } finally {
        setIsUpdating(false);
      }
    } else setIsEditing(true);
  };

  const handleChangePassword = async () => {
    try {
      const { success, error } = await requestPasswordReset(user?.email || "");
      if (!success) throw new Error(error || "Failed to request password reset.");
      setIsVerificationModalVisible(true);
    } catch (error) {
      console.error("Error requesting password reset:", error);
      Alert.alert("Error", "cambiar contraseña por ahora no se puede...");
    }
  };

  const handleVerificationSubmit = async () => {
    try {
      const { success, error } = await verifyPasswordResetCode(user?.email || "", verificationCode);
      if (!success) throw new Error(error || "Failed to verify password reset code.");
      setIsVerificationModalVisible(false);
      setIsPasswordChangeModalVisible(true);
    } catch (error) {
      console.error("Error verifying reset code:", error);
      Alert.alert("Error", "Failed to verify reset code. Please try again.");
    }
  };

  const handlePasswordSubmit = async (newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match. Please try again.");
      return;
    }

    try {
      const { success, error } = await updateUserPassword(newPassword);
      if (!success) throw new Error(error || "Failed to update password.");
      setIsPasswordChangeModalVisible(false);
      Alert.alert("Success", "Your password has been updated.");
    } catch (error) {
      console.error("Error updating password:", error);
      Alert.alert("Error", "Failed to update password. Please try again.");
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
      const uploadedUrl = await uploadProfilePicture(user?.email || "", base64Image);
      if (uploadedUrl) {
        setUserIcon(uploadedUrl);
        setUserProfilePicture(uploadedUrl);
      } else Alert.alert("Error", "Failed to upload profile picture. Please try again.");
    }
  };

  const handleEditField = (field: string | null) => {
    setEditingField(field === editingField ? null : field);
  };

  const handleLogout = async () => {
    const result = await logOut();
    if (result.error) {
      Alert.alert("Logout Error", result.error);
    } else {
      router.replace("/(auth)/start");
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleRecommendApp = async () => {
    try {
      await Share.share({
        message: "¡Descubrí Billy! Una app para gestionar tus finanzas individuales y grupales https://billyapp.online",
        title: "Billy - Tu app de finanzas personales y grupales",
        url: "https://billyapp.online",
      });
      await updateUserSharedApp(user?.email || "");
    } catch (error) {
      console.error("Error sharing app:", error);
      Alert.alert("Error", "No se pudo compartir la aplicación. Por favor, intente nuevamente.");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4B00B8", "#20014E"]} style={styles.gradientContainer}>
        <BillyHeader />
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Icon name="arrow-back" size={30} color="#000000" />
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            <View style={styles.iconContainer}>
              <Image source={userIcon ? { uri: userIcon } : require("@/assets/images/icons/UserIcon.png")} style={styles.userIcon} />
            </View>

            <EditableField
              label="Nombre"
              value={userName}
              isEditing={isEditing}
              editingField={editingField || ""}
              fieldName="name"
              onChangeText={setUserName}
              onEditField={handleEditField}
            />

            <EditableField
              label="Apellido"
              value={userSurname}
              isEditing={isEditing}
              editingField={editingField || ""}
              fieldName="surname"
              onChangeText={setUserSurname}
              onEditField={handleEditField}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldValue}>
                <Text style={styles.fieldLabel}>Email: </Text>
                {userEmail}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, isEditing ? styles.saveButton : null, isUpdating ? styles.disabledButton : null]}
              onPress={handleEdit}
              disabled={isUpdating}
            >
              <Text style={styles.buttonText}>{isEditing ? (isUpdating ? "Guardando..." : "Guardar") : "Editar"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
              <Text style={styles.buttonText}>Cambiar Contraseña</Text>
            </TouchableOpacity>

            {!isEditing && (
              <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
                <Text style={styles.buttonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            )}

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
          </View>

          {!isEditing && (
            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity style={[styles.button, styles.recommendButton]} onPress={handleRecommendApp}>
                <Text style={styles.buttonText}>Recomendar App</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  userIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 5,
  },
  changeIconButton: {
    backgroundColor: "#370185",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  changeIconText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: "2.5%",
    marginTop: 10,
  },
  contentContainer: {
    width: "100%",
    padding: 20,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
  value: {
    fontSize: 16,
    flex: 1,
  },
  button: {
    backgroundColor: "#370185",
    borderRadius: 24,
    padding: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  logoutButton: {
    backgroundColor: "#D32F2F",
  },
  editableField: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#370185",
    marginRight: 10,
    padding: 5,
  },
  visibleInput: {
    color: "#000000",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: "50%",
  },
  cameraIconButton: {
    position: "absolute",
    top: "60%",
    left: "53%",
    backgroundColor: "#370185",
    borderRadius: 15,
    padding: 5,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  recommendButton: {
    backgroundColor: "#4CAF50",
  },
});
