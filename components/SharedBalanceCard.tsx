import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  getDebtsToUser,
  getDebtsFromUser,
  getTotalToPayForUserInDateRange,
  DebtData,
  getProfileName,
  updateProfileName,
  redistributeDebts,
  getUsers,
} from "@/api/api";
import { useAppContext } from "@/hooks/useAppContext";
import { formatNumber } from "@/lib/utils";

interface DebtEntryProps {
  name1: string;
  name2: string;
  amount: number;
  avatar1: string;
  avatar2: string;
}

{
  /* Debts data component */
}
export const useDebtsData = () => {
  const { user, currentProfileId } = useAppContext();

  const [totalDebtsToUser, setTotalDebtsToUser] = useState(0);
  const [totalDebtsFromUser, setTotalDebtsFromUser] = useState(0);
  const [totalToPay, setTotalToPay] = useState(0);
  const [debtsToUser, setDebtsToUser] = useState<DebtData[]>([]);
  const [debtsFromUser, setDebtsFromUser] = useState<DebtData[]>([]);

  const refreshDebts = useCallback(async () => {
    try {
      const [debtsToUser, debtsFromUser, totalToPay] = await Promise.all([
        getDebtsToUser(user?.email ?? "", currentProfileId ?? ""),
        getDebtsFromUser(user?.email ?? "", currentProfileId ?? ""),
        getTotalToPayForUserInDateRange(user?.email ?? "", currentProfileId ?? "", new Date("2024-01-01"), new Date("2030-12-31")),
      ]);

      if (debtsToUser && debtsFromUser) {
        setDebtsToUser(debtsToUser);
        setDebtsFromUser(debtsFromUser);
        setTotalDebtsToUser(debtsToUser.reduce((total, debt) => total + debt.amount, 0));
        setTotalDebtsFromUser(debtsFromUser.reduce((total, debt) => total + debt.amount, 0));
      }
      setTotalToPay(totalToPay);
    } catch (error) {
      console.error("Error fetching debts:", error);
    }
  }, [user?.email, currentProfileId]);

  return { debtsToUser, debtsFromUser, totalDebtsToUser, totalDebtsFromUser, totalToPay, refreshDebts };
};

{
  /* Debts entry component */
}
export const DebtEntryComponent: React.FC<DebtEntryProps> = ({ name1, name2, amount, avatar1, avatar2 }) => {
  const defaultAvatar = require("@/assets/images/icons/UserIcon.png");

  return (
    <View style={styles.debtEntry}>
      <Text style={styles.debtText}>
        {name1} le debe(s) a {name2}
      </Text>
      <View style={styles.debtDetailsContainer}>
        <Image source={avatar1 != "NULL" ? { uri: avatar1 } : defaultAvatar} style={styles.avatar} />
        <Text style={styles.userAmount}>$ {formatNumber(amount)}</Text>
        <Image source={avatar2 != "NULL" ? { uri: avatar2 } : defaultAvatar} style={styles.avatar} />
      </View>
    </View>
  );
};

export const DebtEntryComponentToUser: React.FC<DebtEntryProps> = ({ name1, name2, amount, avatar1, avatar2 }) => {
  const defaultAvatar = require("@/assets/images/icons/UserIcon.png");

  return (
    <View style={styles.debtEntry}>
      <Text style={styles.debtText}>{name1} te debe</Text>
      <View style={styles.debtDetailsContainer}>
        <Image source={avatar1 != "NULL" ? { uri: avatar1 } : defaultAvatar} style={styles.avatar} />
        <Text style={styles.userAmount}>$ {formatNumber(amount)}</Text>
        <Image source={avatar2 != "NULL" ? { uri: avatar2 } : defaultAvatar} style={styles.avatar} />
      </View>
    </View>
  );
};

{
  /* Expense item component */
}
const ExpenseItem = React.memo<{ label: string; value: number }>(({ label, value }) => (
  <View style={styles.expenseItem}>
    <Text style={styles.expenseLabel}>{label}</Text>
    <View style={styles.expenseValueContainer}>
      <Text style={styles.expenseValue}>${formatNumber(value)}</Text>
    </View>
  </View>
));

{
  /* Shared balance card component */
}
export const SharedBalanceCard = () => {
  const { outcomeData, currentProfileId, user, refreshBalanceData } = useAppContext();

  const [profileName, setProfileName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(profileName);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const { debtsToUser, debtsFromUser, totalDebtsToUser, totalDebtsFromUser, totalToPay, refreshDebts } = useDebtsData();

  useEffect(() => {
    const fetchUserData = async () => {
      const emails = new Set([...debtsToUser.map((debt) => debt.debtor), ...debtsFromUser.flatMap((debt) => [debt.paid_by, debt.debtor])]);
      const userData = await getUsers(Array.from(emails));
      setUserNames((prevNames) => ({ ...prevNames, ...userData.names }));
      setUserAvatars((prevAvatars) => ({ ...prevAvatars, ...userData.avatars }));
    };
    fetchUserData();
  }, [debtsToUser, debtsFromUser]);

  const { totalOutcome } = useMemo(() => {
    const outcome = outcomeData?.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) || 0;
    return { totalOutcome: outcome };
  }, [outcomeData]);

  const fetchProfileName = useCallback(async () => {
    try {
      setIsLoading(true);
      const name = await getProfileName(currentProfileId ?? "");
      setProfileName(name || "");
    } catch (error) {
      console.error("Error fetching profile name:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentProfileId]);

  useEffect(() => {
    fetchProfileName();
  }, [fetchProfileName]);

  useEffect(() => {
    if (!isLoading) setTitle(profileName);
  }, [profileName, isLoading]);

  useEffect(() => {
    refreshBalanceData();
    refreshDebts();
  }, [refreshBalanceData, refreshDebts]);

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleRedistributeDebts = useCallback(async () => {
    if (currentProfileId) {
      const success = await redistributeDebts(currentProfileId);
      if (success) {
        Alert.alert("Operación exitosa", "Las deudas han sido redistribuidas.");
        refreshDebts();
      } else {
        Alert.alert("Error", "No se pudieron redistribuir las deudas. Por favor, inténtelo de nuevo.");
      }
    }
  }, [currentProfileId, refreshDebts]);

  const handleTitleSubmit = async () => {
    setIsEditing(false);
    try {
      await updateProfileName(currentProfileId ?? "", title);
      setProfileName(title);
    } catch (error) {
      console.error("Error updating profile name:", error);
      setTitle(profileName);
    }
  };

  const hasMoreDebts = debtsToUser.length + debtsFromUser.length > 1;

  return (
    <LinearGradient colors={["#e8e0ff", "#d6c5fc"]} start={[0, 0]} end={[1, 1]} style={styles.card}>
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
        <ExpenseItem label="Gastos totales:" value={totalOutcome} />
        <ExpenseItem label="Mis Gastos:" value={totalToPay} />
      </View>

      <View style={styles.expensesContainer}>
        <ExpenseItem label="Te deben:" value={totalDebtsToUser} />
        <ExpenseItem label="Tu deuda:" value={totalDebtsFromUser} />
      </View>

      <View style={styles.userDebtSection}>
        {isExpanded && (
          <>
            {debtsToUser.map((debt, index) => (
              <DebtEntryComponentToUser
                key={debt.id || index}
                name1={userNames[debt.debtor]}
                name2="Tú"
                amount={debt.amount}
                avatar1={userAvatars[debt.debtor]}
                avatar2={userAvatars[user?.email ?? ""]}
              />
            ))}

            {debtsFromUser.map((debt, index) => (
              <DebtEntryComponent
                key={debt.id || index}
                name1={userNames[debt.paid_by]}
                name2={userNames[debt.debtor]}
                amount={debt.amount}
                avatar1={userAvatars[debt.paid_by]}
                avatar2={userAvatars[debt.debtor]}
              />
            ))}
          </>
        )}
      </View>

      {hasMoreDebts && (
        <TouchableOpacity onPress={toggleExpanded}>
          <Text style={styles.viewAll}>{isExpanded ? "Ocultar deudas" : "Ver deudas"}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.redistributeButton} onPress={handleRedistributeDebts}>
        <Ionicons name="swap-horizontal" size={24} color="#fff" />
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
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4a4a4a",
    flex: 1,
    marginLeft: 8,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#666",
    paddingBottom: 2,
    marginLeft: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  expensesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  expenseItem: {
    flex: 1,
    paddingHorizontal: 8,
  },
  expenseLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  expenseValueContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 8,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  expenseValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  userDebtSection: {
    borderRadius: 12,
    padding: 16,
  },
  debtEntry: {
    marginBottom: 16,
  },
  debtText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  debtDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f3ff",
    borderRadius: 20,
    padding: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  viewAll: {
    textAlign: "center",
    color: "#6200ee",
    fontSize: 16,
    marginTop: -16,
  },
  redistributeButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#6200ee",
    borderRadius: 30,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
