import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Vital Signs has been decommissioned per user request.
 * Redirecting safely to the Wellness Hub.
 */
export default function VitalSignsScreen() {
  return <Redirect href="/(protected)/wellness" />;
}
