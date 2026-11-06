import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, CheckSquare, Square } from 'lucide-react-native';
import { AuthLayout } from '../../features/auth/components/AuthLayout';
import { FormGroup } from '../../features/auth/components/FormGroup';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { registerFormSchema, RegisterFormValues } from '../../features/auth/schemas/authSchemas';
import { authApiService } from '../../features/auth/services/authService';
import { extractApiErrorMessage } from '../../services/api/apiErrorHandler';
import { colors } from '../../theme/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false as any,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const response = await authApiService.register(values);
      router.push({
        pathname: '/(auth)/verify-registration-otp',
        params: {
          userId: response.userId,
          recipient: response.recipient,
          channel: response.channel,
        },
      });
    } catch (err) {
      const message = extractApiErrorMessage(err, 'Failed to create account. Please try again.');
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout showBack onBackPress={() => router.replace('/(auth)/welcome')}>
      <AuthLayout.Title>Create Account</AuthLayout.Title>
      <AuthLayout.Subtitle>
        Join UYIRA and start your healthier journey today.
      </AuthLayout.Subtitle>

      <ErrorMessage message={apiError} />

      <AuthLayout.Content>
        {/* Full Name */}
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormGroup hasError={!!errors.fullName}>
              <FormGroup.Input
                placeholder="Full Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon={<User size={18} color="#94A3B8" />}
              />
              <FormGroup.Error message={errors.fullName?.message} />
            </FormGroup>
          )}
        />

        {/* Email Address */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormGroup hasError={!!errors.email}>
              <FormGroup.Input
                placeholder="Email Address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={18} color="#94A3B8" />}
              />
              <FormGroup.Error message={errors.email?.message} />
            </FormGroup>
          )}
        />

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormGroup hasError={!!errors.password}>
              <FormGroup.Password
                placeholder="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon={<Lock size={18} color="#94A3B8" />}
              />
              <FormGroup.Error message={errors.password?.message} />
            </FormGroup>
          )}
        />

        {/* Confirm Password */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormGroup hasError={!!errors.confirmPassword}>
              <FormGroup.Password
                placeholder="Confirm Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon={<Lock size={18} color="#94A3B8" />}
              />
              <FormGroup.Error message={errors.confirmPassword?.message} />
            </FormGroup>
          )}
        />

        {/* Terms & Conditions Checkbox */}
        <Controller
          control={control}
          name="termsAccepted"
          render={({ field: { onChange, value } }) => (
            <View style={styles.termsWrapper}>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  onPress={() => onChange(!value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !!value }}
                  activeOpacity={0.7}
                  style={styles.checkboxTouch}
                >
                  {value ? (
                    <CheckSquare size={18} color={colors.primary} />
                  ) : (
                    <Square size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text
                    style={styles.termsBoldLink}
                    onPress={() => router.push('/(auth)/terms')}
                  >
                    Terms & Conditions
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.termsBoldLink}
                    onPress={() => router.push('/(auth)/privacy')}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
              {errors.termsAccepted && (
                <Text style={styles.termsError}>{errors.termsAccepted.message}</Text>
              )}
            </View>
          )}
        />

        {/* Create Account Button */}
        <AppButton
          title="Create Account"
          variant="primary"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitBtn}
        />

        {/* Social Sign Up (Google & Apple) - Commented out per request */}
        {/*
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
          <View style={styles.socialIconContainer}>
            <Text style={styles.googleIcon}>G</Text>
          </View>
          <Text style={styles.socialButtonText}>Sign up with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
          <View style={styles.socialIconContainer}>
            <Text style={styles.appleIcon}></Text>
          </View>
          <Text style={styles.socialButtonText}>Sign up with Apple</Text>
        </TouchableOpacity>
        */}
      </AuthLayout.Content>

      <AuthLayout.Footer>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={styles.loginLinkRow}
          activeOpacity={0.7}
        >
          <Text style={styles.footerText}>Already have an account? </Text>
          <Text style={styles.footerLink}>Login</Text>
        </TouchableOpacity>
      </AuthLayout.Footer>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  termsWrapper: {
    marginVertical: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxTouch: {
    padding: 2,
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  termsBold: {
    color: colors.primary,
    fontWeight: '600',
  },
  termsBoldLink: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  termsError: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 26,
  },
  submitBtn: {
    marginTop: 8,
    width: '100%',
  },
  loginLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
