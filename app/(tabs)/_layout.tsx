import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TabNavigator = () => {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, focused, size }) => {
          let iconName: IconName | undefined;
          if (route.name === "index") iconName = focused ? "home" : "home-outline";
          else if (route.name === "statistics") iconName = focused ? "stats-chart" : "stats-chart-outline";
          else if (route.name === "calendar") iconName = focused ? "calendar" : "calendar-outline";
          else if (route.name === "temporal") iconName = focused ? "calculator" : "calculator-outline";
          else if (route.name === "profiles") iconName = focused ? "people" : "people-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4B00B8",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 2,
          borderTopColor: "#e0e0e0",
          elevation: 0,
          height: Platform.OS === "android" ? 60 : 80,
          paddingBottom: Platform.OS === "android" ? 5 : 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarSafeAreaInsets: {
          bottom: Platform.OS === "android" ? 10 : 20,
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="statistics" options={{ title: "Estadísticas" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendario" }} />
      <Tabs.Screen name="temporal" options={{ title: "Dividir cuenta" }} />
      <Tabs.Screen name="profiles" options={{ title: "Perfiles" }} />
    </Tabs>
  );
};

export default TabNavigator;
