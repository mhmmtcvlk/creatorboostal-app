import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { theme } from '../constants/theme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <LanguageProvider>
          <AuthProvider>
            <StatusBar style="light" backgroundColor="#0c0c0c" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/register" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="forum/[id]" />
              <Stack.Screen name="profile/settings" />
              <Stack.Screen name="vip/packages" />
              <Stack.Screen name="boost/create" />
            </Stack>
          </AuthProvider>
        </LanguageProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}