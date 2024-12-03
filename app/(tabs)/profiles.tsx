import React, { useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { ProfileList } from "@/components/ProfileList";
import { processInvitation, isUserPro } from "@/api/api";
import AddProfileModal from "@/components/modals/AddProfileModal";
import BillyHeader from "@/components/BillyHeader";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import { useAppContext } from "@/hooks/useAppContext";
import PaymentModal from "@/components/modals/PaymentModal";
import { useDeepLinking } from '@/hooks/useDeepLinking';

export default function Profiles() {
  const { user, setCurrentProfileId, refreshBalanceData, profileData, refreshProfileData } = useAppContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const [isPro, setIsPro] = useState(false);
  useDeepLinking();

  useEffect(() => {
    const checkProStatus = async () => {
      const proStatus = await isUserPro(user?.email || "");
      setIsPro(proStatus);
    };
    checkProStatus();
  }, [user?.email]);

  const isProfileLimitReached = useCallback(async () => {
    return profileData && profileData.length >= 3 && !isPro;
  }, [profileData, isPro]);

  const processInvitationLink = useCallback(async () => {
    const params = route.params as { invitationId?: string } | undefined;
    if (params?.invitationId) {
      try {
        const profileId = await processInvitation(params.invitationId, user?.email || "");
        if (profileId) {
          await refreshProfileData();
          setCurrentProfileId(profileId);
          Alert.alert("Perfil añadido", "Se ha añadido el perfil compartido a tu lista de perfiles.");
          // Limpiar los parámetros de la ruta después de procesar la invitación
          navigation.setParams({ invitationId: undefined } as any);
        }
      } catch (error) {
        console.error("Error procesando la invitación:", error);
        Alert.alert("Error", "No se pudo procesar la invitación.");
      }
    }
  }, [route.params, user?.email, refreshProfileData, setCurrentProfileId, navigation]);

  const clearInvitationParams = useCallback(() => {
    const invitationId = (route.params as { invitationId?: string })?.invitationId;
    if (invitationId) navigation.setParams({ invitationId: undefined } as any);
  }, [navigation]);

  useEffect(() => {
    processInvitationLink();
    clearInvitationParams();
  }, [processInvitationLink, clearInvitationParams]);

  useFocusEffect(
    useCallback(() => {
      refreshBalanceData();
      refreshProfileData();
    }, [refreshBalanceData, refreshProfileData])
  );

  const showPaymentModal = useCallback(() => {
    setIsPaymentModalVisible(true);
  }, []);

  const handleClosePaymentModal = useCallback(() => {
    setIsPaymentModalVisible(false);
  }, []);

  const handleAddProfile = useCallback(() => {
    isProfileLimitReached().then((isLimitReached) => {
      if (isLimitReached) {
        showPaymentModal();
      } else {
        setIsModalVisible(true);
      }
      return isLimitReached;
    });
  }, [isProfileLimitReached, showPaymentModal]);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleProfileAdded = useCallback(() => {
    refreshProfileData();
    handleCloseModal();
  }, [refreshProfileData, handleCloseModal]);

  const memoizedProfileList = useMemo(
    () => <ProfileList onAddProfile={handleAddProfile} isPro={isPro} />,
    [profileData, refreshProfileData, handleAddProfile, isPro]
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4B00B8", "#20014E"]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gradientContainer}>
        <BillyHeader />
        <View style={styles.contentContainer}>{memoizedProfileList}</View>
      </LinearGradient>
      <AddProfileModal isVisible={isModalVisible} onClose={handleCloseModal} onProfileAdded={handleProfileAdded} />
      <PaymentModal isVisible={isPaymentModalVisible} onClose={handleClosePaymentModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  displayText: {
    color: "#FFFFFF",
    textAlign: "left",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
  },
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    marginHorizontal: "2.5%",
  },
});
