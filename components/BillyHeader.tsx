import React from 'react';
import { StyleSheet, Alert, View, Image, TouchableOpacity, Text, ImageStyle } from 'react-native';
import { Platform, StatusBar } from 'react-native';
import { logOut } from '@/api/api';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '@/hooks/useAppContext';

interface BillyHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: string;
}

export const BillyHeader: React.FC<BillyHeaderProps> = React.memo(({ title, subtitle, icon }) => {
  const { profileData, currentProfileId } = useAppContext();
  const navigation = useNavigation();
  
  const handleLogout = async () => {
    const result = await logOut();
    if (result.error) Alert.alert('Logout Error', result.error);
    navigation.navigate('start' as never);
  };

  const currentProfile = profileData?.find(profile => profile.id === currentProfileId);
  const profileName = currentProfile ? currentProfile.name : 'Profile';

  return (
    <View style={styles.headerContainer}>
      <View>
        <View style={styles.overlapGroup}>
          <View>
            <Image source={require('../assets/images/Billy/logo2.png')} style={styles.logoBilly as ImageStyle}/>
            <Text style={styles.profileName}>{profileName}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Image source={require('../assets/images/icons/UserIcon.png')} style={styles.usuario as ImageStyle} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.textIconContainer}>
        <View style={styles.tituloContainer}>
          {title && <Text style={styles.tituloTexto}>{title}</Text>}
          {subtitle && <Text style={styles.subtituloTexto}>{subtitle}</Text>}
        </View>
        {icon && (
          <Icon name={icon} size={40} color="#FFFFFF" />
        )}
      </View>
    </View>
  );
});

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 40 : (StatusBar.currentHeight ?? 0) + 10;

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: STATUSBAR_HEIGHT,
    paddingHorizontal: 10,
  },
  overlapGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    height: 65,
    position: 'relative',
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
  },
  logoBilly: {
    width: 80,
    height: 40,
  },
  profileName: {
    color: '#3d2b7e',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -15,
    fontFamily: 'ArialRoundedMTBold',
  },
  usuario: {
    width: 47,
    height: 47,
    resizeMode: 'contain',
  },
  tituloContainer: {
    marginHorizontal: 5,
  },
  tituloTexto: {
    color: '#ffffff',
    fontSize: 32,
    fontFamily: 'ArialRoundedMTBold',
    letterSpacing: -1.6,
    marginVertical: 5,
  },
  subtituloTexto: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.12,
  },
  textIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default BillyHeader;
