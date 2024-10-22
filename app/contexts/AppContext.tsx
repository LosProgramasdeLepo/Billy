import { createContext } from 'react';
import { IncomeData, OutcomeData, CategoryData, ProfileData, UserData } from '@/api/api';

export interface AppContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  refreshUser: () => Promise<void>;
  currentProfileId: string | null;
  setCurrentProfileId: (id: string | null) => void;
  incomeData: IncomeData[] | null;
  refreshIncomeData: () => Promise<void>;
  outcomeData: OutcomeData[] | null;
  refreshOutcomeData: () => Promise<void>;
  categoryData: CategoryData[] | null;
  refreshCategoryData: () => Promise<void>;
  balance: number | null;
  refreshBalanceData: () => Promise<void>;
  profileData: ProfileData[] | null;
  refreshProfileData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);