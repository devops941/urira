import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { AppLoader } from '../../components/common/AppLoader';
import { profileService } from '../../services/health/profileService';

export default function ProtectedLayout() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (!hasCheckedOnboarding) {
      (async () => {
        try {
          const profile = await profileService.getProfile();
          if (profile?.profilePhoto) {
            useAuthStore.getState().updateUser({ profilePhoto: profile.profilePhoto });
          }
          const isOnboardingRoute = segments.includes('onboarding');

          if (!profile?.isOnboardingCompleted && !isOnboardingRoute) {
            router.replace('/(protected)/onboarding');
          } else if (profile?.isOnboardingCompleted && isOnboardingRoute) {
            router.replace('/(protected)/home');
          }
        } catch {
          // Fail-safe to allow dashboard access if network blips
        } finally {
          setHasCheckedOnboarding(true);
        }
      })();
    }
  }, [isAuthenticated, isInitialized, hasCheckedOnboarding, segments]);

  if (!isInitialized || (isAuthenticated && !hasCheckedOnboarding)) {
    return <AppLoader message="Preparing your health dashboard..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    />
  );
}

