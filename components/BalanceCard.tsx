import React from "react";
import { useMemo } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { useAppContext } from "@/hooks/useAppContext";
import { formatNumber } from "@/lib/utils";

export const BalanceCard = () => {
  const { incomeData, outcomeData, balance } = useAppContext();

  const colorScheme = useColorScheme();

  const textColor = useMemo(() => (colorScheme === "dark" ? "#3B3B3B" : "#3B3B3B"), [colorScheme]);

  const { totalIncome, totalOutcome } = useMemo(() => {
    const income = incomeData?.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) || 0;
    const outcome = outcomeData?.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) || 0;
    return { totalIncome: income, totalOutcome: outcome };
  }, [incomeData, outcomeData]);

  const formattedBalance = useMemo(() => (balance !== null ? formatNumber(balance) : "0.00"), [balance]);
  const formattedIncomes = useMemo(() => (totalIncome ? formatNumber(totalIncome) : "0.00"), [incomeData]);
  const formattedOutcomes = useMemo(() => (totalOutcome ? formatNumber(totalOutcome) : "0.00"), [outcomeData]);

  const formatBalanceWithSmallerDecimals = (value: string) => {
    const parts = value.split(",");
    return (
      <ThemedText type="title" style={[styles.balanceAmount, { color: textColor }]}>
        ${parts[0]}
        <ThemedText style={styles.decimalPart}>,{parts[1] || "00"}</ThemedText>
      </ThemedText>
    );
  };

  return (
    <View style={styles.box}>
      <LinearGradient colors={["rgba(0, 0, 0, 0.08)", "rgba(0, 0, 0, 0.08)"]} style={styles.balanceCard}>
        <ThemedText type="subtitle" style={[styles.balanceTotalText, { color: textColor }]}>
          Balance total:
        </ThemedText>
        {formatBalanceWithSmallerDecimals(formattedBalance)}
        <View style={styles.ingresosGastosCard}>
          <View style={styles.ingresosCard}>
            <View style={styles.ingresoPlata}>
              <ThemedText style={[styles.textWrapper, { color: textColor }]}>Ingresos</ThemedText>
              <ThemedText style={[styles.amount, { color: textColor }]}>${formattedIncomes}</ThemedText>
            </View>
          </View>
          <View style={styles.gastosCard}>
            <View style={styles.gastoPlata}>
              <ThemedText style={[styles.textWrapper, { color: textColor }]}>Gastos</ThemedText>
              <ThemedText style={[styles.amount, { color: textColor }]}>${formattedOutcomes}</ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    height: 200,
    width: 350,
    marginTop: 20,
    alignSelf: "center",
    marginBottom: 20,
    alignItems: "center",
  },
  balanceCard: {
    height: 200,
    width: "100%",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  balanceTotalText: {
    fontSize: 14,
    fontWeight: "400",
    position: "absolute",
    top: 40,
    left: 27,
    letterSpacing: -0.28,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: "400",
    position: "absolute",
    top: 60,
    left: 27,
    letterSpacing: -2,
    lineHeight: 48,
  },
  ingresosGastosCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: 120,
    left: 15,
    width: 300,
  },
  ingresosCard: {
    backgroundColor: "rgba(66, 1, 161, 0.08)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    height: 52,
    width: 141,
    justifyContent: "center",
    alignItems: "center",
  },
  gastosCard: {
    backgroundColor: "rgba(66, 1, 161, 0.08)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    height: 52,
    width: 141,
    justifyContent: "center",
    alignItems: "center",
  },
  ingresoPlata: {
    alignItems: "center",
  },
  gastoPlata: {
    alignItems: "center",
  },
  textWrapper: {
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: -0.5,
  },
  amount: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: -0.7,
    marginTop: -10,
  },
  decimalPart: {
    fontSize: 24,
    fontWeight: "400",
    letterSpacing: -1,
  },
});
