import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { CategoryData } from "@/api/api";

export type RootStackParamList = {
  Home: undefined;
  CategoriesScreen: undefined;
  TransactionsScreen: undefined;
  CategoryDetailsScreen: { category: CategoryData };
};

export type NavigationProp<T extends keyof RootStackParamList> = StackNavigationProp<RootStackParamList, T>;

export type RoutePropType<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;
