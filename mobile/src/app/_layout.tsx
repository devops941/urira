import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { AppLoader } from '../components/common/AppLoader';

export default function RootLayout() {
  const { isAuthenticated, isInitialized, initAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(protected)';

    if (!isAuthenticated && inProtectedGroup) {
      // Redirect unauthenticated user to welcome
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect authenticated user to home placeholder
      router.replace('/(protected)/home');
    }
  }, [isAuthenticated, isInitialized, segments]);

  if (!isInitialized) {
    return <AppLoader message="Initializing UYIRA Health..." />;
  }

  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}

