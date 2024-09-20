import React from 'react';
import { useState } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { getBalance, ProfileData, removeProfile } from '../api/api';

import { FontAwesome } from '@expo/vector-icons';

interface ProfileListProps {
  profileData: ProfileData[] | null;
  refreshData: () => void;
}

export const ProfileList: React.FC<ProfileListProps> = ({ profileData, refreshData }) => {

  // For deleting
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);

  // Remove category
  const handleLongPress = (profile: ProfileData) => {
    setSelectedProfile(profile);
    Alert.alert("Eliminar perfil", "¿Está seguro de que quiere eliminar el perfil?", [{text: "Cancelar", style: "cancel"}, {text: "Eliminar", style: "destructive",
      onPress: async () => {
        if (profile) {
          handleRemoveProfile(profile.id ?? 0)
        }
      }
    }]);
  };

  const renderItem = ({ item }: { item: ProfileData }) => (
    <TouchableOpacity onLongPress={() => handleLongPress(item)}>
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <FontAwesome name="dollar" size={24} color="green" />
            </View>
            <View style={styles.textContainer}>
                <ThemedText style={styles.description}>{item.name}</ThemedText>
            </View>
            <ThemedText style={styles.amount}>+ ${item.balance.toFixed(2)}</ThemedText>
        </View>
    </TouchableOpacity>
  );

  const handleRemoveProfile = async (id: string) => {
    await removeProfile(id);
    refreshData();  // Actualiza los datos después de eliminar
  };

  return (
    <View style={styles.container}>
      <FlatList
          data={profileData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || ''}
          showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    description: {
        fontSize: 18,
        color: '#555',
        fontWeight: '400',
    },
    date: {
        fontSize: 12,
        color: '#888',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'green',
    },
});