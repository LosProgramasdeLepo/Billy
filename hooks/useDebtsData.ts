import { useState, useCallback } from "react";
import { useAppContext } from "./useAppContext";
import { getDebtsToUser, getDebtsFromUser, getTotalToPayForUserInDateRange, DebtData } from "@/api/api";

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