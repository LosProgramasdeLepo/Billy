import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Image, TouchableOpacity, Text, ImageStyle } from "react-native";
import { Platform, StatusBar } from "react-native";
import { getProfilePictureUrl } from "@/api/api";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppContext } from "@/hooks/useAppContext";

interface BillyHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: string;
}

export const BillyHeader: React.FC<BillyHeaderProps> = ({ title, subtitle, icon }) => {
  const { user, profileData, currentProfileId, userProfilePicture } = useAppContext();
  const navigation = useNavigation();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const currentProfile = profileData?.find((profile) => profile.id === currentProfileId);
  const profileName = currentProfile ? currentProfile.name : "Profile";

  const fetchProfilePicture = useCallback(async () => {
    if (!user?.email || !currentProfile) return;
    try {
      const url = await getProfilePictureUrl(user.email);
      setProfilePicture(url);
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      setProfilePicture(null);
    }
  }, [user?.email, currentProfile]);

  useEffect(() => {
    const timer = setTimeout(fetchProfilePicture, 500);
    return () => clearTimeout(timer);
  }, [fetchProfilePicture]);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.overlapGroup}>
        <Text style={styles.profileName}>{profileName}</Text>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/images/Billy/logo1.png")} style={styles.logoBilly as ImageStyle} />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("UserProfileScreen" as never)}>
          <Image
            source={userProfilePicture ? { uri: userProfilePicture } : require("../assets/images/icons/UserIcon.png")}
            style={styles.usuario}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.textIconContainer}>
        <View style={styles.tituloContainer}>
          {title && <Text style={styles.tituloTexto}>{title}</Text>}
          {subtitle && <Text style={styles.subtituloTexto}>{subtitle}</Text>}
        </View>
        {icon && <Icon name={icon} size={40} color="#FFFFFF" />}
      </View>
    </View>
  );
};

const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 40 : (StatusBar.currentHeight ?? 0) + 10;

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: STATUSBAR_HEIGHT,
    paddingHorizontal: 10,
  },
  overlapGroup: {
    height: 55,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -3,
    alignItems: "center",
  },
  logoBilly: {
    width: 100,
    height: 50,
    resizeMode: "contain",
  },
  profileName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "ArialRoundedMTBold",
    maxWidth: 120,
    lineHeight: 26,
  },
  usuario: {
    width: 50,
    height: 50,
    borderRadius: 23.5,
    resizeMode: "cover",
  },
  tituloContainer: {
    marginHorizontal: 5,
  },
  tituloTexto: {
    color: "#ffffff",
    fontSize: 28,
    fontFamily: "ArialRoundedMTBold",
    letterSpacing: -1.6,
    marginVertical: 5,
  },
  subtituloTexto: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: -0.12,
  },
  textIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default BillyHeader;
