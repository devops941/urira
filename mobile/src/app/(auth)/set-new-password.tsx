import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react-native';
import { AuthLayout } from '../../features/auth/components/AuthLayout';
import { FormGroup } from '../../features/auth/components/FormGroup';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import {
  resetPasswordFormSchema,
  ResetPasswordFormValues,
} from '../../features/auth/schemas/authSchemas';
import { authApiService } from '../../features/auth/services/authService';
import { extractApiErrorMessage } from '../../services/api/apiErrorHandler';
import { colors } from '../../theme/colors';

export default function SetNewPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resetAuthToken?: string }>();
  const resetAuthToken = params.resetAuthToken || '';

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('newPassword') || '';

  const hasMinLength = watchedPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(watchedPassword);
  const hasLowercase = /[a-z]/.test(watchedPassword);
  const hasNumber = /[0-9]/.test(watchedPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(watchedPassword);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!resetAuthToken) {
      setApiError('Reset authorization token is missing or expired. Please start over.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      await authApiService.resetPassword({
        resetAuthToken,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      router.replace({
        pathname: '/(auth)/login',
        params: { resetSuccess: 'true' },
      });
    } catch (err) {
      const msg = extractApiErrorMessage(err, 'Failed to update password. Please try again.');
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout showBack onBackPress={() => router.replace('/(auth)/login')}>
      {/* Center Illustration Matching Design */}
      <AuthLayout.Illustration
        source={require('../../../assets/images/illustration_new_password.png')}
        size={135}
      />

      <AuthLayout.Title>Create New Password</AuthLayout.Title>
      <AuthLayout.Subtitle>
        Set a strong new password for your account.
      </AuthLayout.Subtitle>

      <ErrorMessage message={apiError} />

      <AuthLayout.Content>
        {/* New Password */}
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormGroup hasError={!!errors.newPassword}>
              <FormGroup.Password
                placeholder="New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon={<Lock size={18} color="#94A3B8" />}
              />
              <FormGroup.Error message={errors.newPassword?.message} />
            </FormGroup>
          )}
        />

        {/* Confirm New Password */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormGroup hasError={!!errors.confirmPassword}>
              <FormGroup.Password
                placeholder="Confirm New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon={<Lock size={18} color="#94A3B8" />}
              />
              <FormGroup.Error message={errors.confirmPassword?.message} />
            </FormGroup>
          )}
        />

        {/* Password Policy Card Matching Reference UI */}
        <View style={styles.policyCard}>
          <Text style={styles.policyHeader}>Password must include:</Text>
          <View style={styles.policyList}>
            <PolicyItem label="Minimum 8 characters" passed={hasMinLength} />
            <PolicyItem label="At least one uppercase letter (A-Z)" passed={hasUppercase} />
            <PolicyItem label="At least one lowercase letter (a-z)" passed={hasLowercase} />
            <PolicyItem label="At least one number (0-9)" passed={hasNumber} />
            <PolicyItem label="At least one special character (!@#$...)" passed={hasSpecial} />
          </View>
        </View>

        {/* Reset Password Button */}
        <AppButton
          title="Reset Password"
          variant="primary"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitBtn}
        />
      </AuthLayout.Content>

      <AuthLayout.Footer>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.backLinkRow}
        >
          <ArrowLeft size={16} color={colors.primary} />
          <Text style={styles.backLinkText}>Back to Login</Text>
        </TouchableOpacity>
      </AuthLayout.Footer>
    </AuthLayout>
  );
}

const PolicyItem: React.FC<{ label: string; passed: boolean }> = ({ label, passed }) => {
  return (
    <View style={styles.policyRow}>
      <CheckCircle2
        size={14}
        color={passed ? colors.success : '#CBD5E1'}
        style={{ marginRight: 6 }}
      />
      <Text style={[styles.policyText, passed && styles.policyTextPassed]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  policyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginVertical: 10,
  },
  policyHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  policyList: {
    gap: 6,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  policyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  policyTextPassed: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 14,
    width: '100%',
  },
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
