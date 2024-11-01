import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { AppProvider } from './providers/AppProvider';
import { useFonts } from 'expo-font';
import { ActivityIndicator } from 'react-native';
import { View } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    'ArialRoundedMTBold': require('../assets/fonts/arialroundedmtbold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4B00B8" />
      </View>
    );
  }

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
          <Stack.Screen name="(auth)" options={{ headerShown: false }}/>
          <Stack.Screen name="CategoriesScreen" options={{ headerShown: false }}/>
          <Stack.Screen name="TransactionsScreen" options={{ headerShown: false }}/>
          <Stack.Screen name="CategoryDetailsScreen" options={{ headerShown: false }}/>
          <Stack.Screen name="UserProfileScreen" options={{ headerShown: false }}/>
        </Stack>
      </ThemeProvider>
    </AppProvider>
  );
}

export function Root() {
  return <Redirect href="/(auth)/start"/>;
}