import React, { useState, useCallback, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { fetchIncomes, fetchOutcomes, fetchCategories, fetchBalance, fetchProfiles, getUser, IncomeData, OutcomeData, CategoryData, ProfileData, UserData } from '@/api/api';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [incomeData, setIncomeData] = useState<IncomeData[] | null>(null);
  const [outcomeData, setOutcomeData] = useState<OutcomeData[] | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[] | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [profileData, setProfileData] = useState<ProfileData[] | null>(null);

  const fetchData = useCallback(async (fetchFunction: (id: string) => Promise<any>, setStateFunction: React.Dispatch<React.SetStateAction<any>>, isProfile: boolean = false, isUser: boolean = false) => {
    if (isProfile && user && user.email) {
      const data = await fetchFunction(user.email);
      setStateFunction(data);
    } else if (isUser && user && user.email) {
      const data = await fetchFunction(user.email);
      setStateFunction(data);
    } else if (currentProfileId) {
      const data = await fetchFunction(currentProfileId);
      setStateFunction(data);
    } 
  }, [currentProfileId, user]);

  const refreshIncomeData = useCallback(() => fetchData(fetchIncomes, setIncomeData), [fetchData]);
  const refreshOutcomeData = useCallback(() => fetchData(fetchOutcomes, setOutcomeData), [fetchData]);
  const refreshCategoryData = useCallback(() => fetchData(fetchCategories, setCategoryData), [fetchData]);
  const refreshBalanceData = useCallback(() => fetchData(fetchBalance, setBalance), [fetchData]);
  const refreshProfileData = useCallback(() => fetchData(fetchProfiles, setProfileData, true), [fetchData]);
  const refreshUser = useCallback(() => fetchData(getUser, setUser, false, true), [fetchData]);

  const refreshAllData = useCallback(async () => {    
    if (!user || !currentProfileId) {
      setIncomeData(null);
      setOutcomeData(null);
      setCategoryData(null);
      setProfileData(null);
      setBalance(null);
      return;
    }
    await Promise.all([
      refreshIncomeData(),
      refreshOutcomeData(),
      refreshCategoryData(),
      refreshBalanceData(),
      refreshProfileData()
    ]);
  }, [currentProfileId, refreshIncomeData, refreshOutcomeData, refreshCategoryData, refreshBalanceData, refreshProfileData]);

  useEffect(() => {
    refreshAllData();
  }, [currentProfileId, refreshAllData]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        refreshUser,
        currentProfileId,
        setCurrentProfileId,
        incomeData,
        refreshIncomeData,
        outcomeData,
        refreshOutcomeData,
        categoryData,
        refreshCategoryData,
        balance,
        refreshBalanceData,
        profileData,
        refreshProfileData,
        refreshAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};