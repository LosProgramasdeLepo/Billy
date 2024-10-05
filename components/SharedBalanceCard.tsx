import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface BalanceCardProps {
  refreshData: () => void;
  sharedUsers: string[];
}

export const SharedBalanceCard: React.FC<BalanceCardProps> = ({ refreshData, sharedUsers }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('Bariloche 2025');
  const [isExpanded, setIsExpanded] = useState(false);


  const handleEditPress = () => {
    setIsEditing(true);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleTitleSubmit = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <LinearGradient
    colors={['#e8e0ff', '#d6c5fc']} 
    start={[0, 0]} 
      end={[1, 1]}
      style={styles.card}
    >
      <View style={styles.titleContainer}>
        <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#666" />
        </TouchableOpacity>
        {isEditing ? (
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            onBlur={handleTitleSubmit}
            onSubmitEditing={handleTitleSubmit}
            autoFocus
          />
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}
      </View>

      <View style={styles.expensesContainer}>
        <View style={styles.expenseItem}>
          <Text style={styles.expenseLabel}>Gastos totales:</Text>
          <View style={styles.expenseValueContainer}>
            <Text style={styles.expenseValue}>$567.00</Text>
          </View>
        </View>
        <View style={styles.expenseItem}>
          <Text style={styles.expenseLabel}>Mis Gastos:</Text>
          <View style={styles.expenseValueContainer}>
            <Text style={styles.expenseValue}>$345.00</Text>
          </View>
        </View>
      </View>

      <View style={styles.expensesContainer}>
        <View style={styles.expenseItem}>
          <Text style={styles.expenseLabel}>Te deben:</Text>
          <View style={styles.expenseValueContainer}>
            <Text style={styles.expenseValue}>$0.00</Text>
          </View>
        </View>
        <View style={styles.expenseItem}>
          <Text style={styles.expenseLabel}>Tu deuda:</Text>
          <View style={styles.expenseValueContainer}>
            <Text style={styles.expenseValue}>$345.00</Text>
          </View>
        </View>
      </View>


      <View style={styles.userDebtSection}>
        <View style={styles.debtEntry}>
          <Text style={styles.debtText}>Tú le debes a Juan Gómez</Text>
          <View style={styles.debtDetailsContainer}>
            <Image
              source={require('@/assets/images/icons/UserIcon.png')}
              style={styles.avatar}
            />
            <Text style={styles.userAmount}>$ 345,00</Text>
            <Image
              source={require('@/assets/images/icons/UserIcon.png')}
              style={styles.avatar}
            />
          </View>
        </View>

       {isExpanded && (
          <View style={styles.debtEntry}>
            <Text style={styles.debtText}>Leticia le debe a Juan Gómez</Text>
            <View style={styles.debtDetailsContainer}>
              <Image
                source={require('@/assets/images/icons/UserIcon.png')}
                style={styles.avatar}
              />
              <Text style={styles.userAmount}>$ 345,00</Text>
              <Image
                source={require('@/assets/images/icons/UserIcon.png')}
                style={styles.avatar}
              />
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={toggleExpanded}>
        <Text style={styles.viewAll}>{isExpanded ? 'Ver menos' : 'Ver todo'}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    margin: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a4a4a',
    flex: 1,
    marginLeft: 8,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    paddingBottom: 2,
    marginLeft: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  expensesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  expenseItem: {
    flex: 1,
    paddingHorizontal: 8,

  },
  expenseLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expenseValueContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    width: '100%',
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  expenseValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userDebtSection: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  debtEntry: {
    marginBottom: 16,
  },
  debtText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    //fontFamily: 'Roboto_700Bold', // Changed font family

  },
  debtDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f3ff',
    borderRadius: 20,
    padding: 8,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  viewAll: {
    textAlign: 'center',
    color: '#6200ee',
    marginTop: 16,
    fontSize: 16,
  },
});