import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Mail,
  Lock,
  CheckSquare,
  Square,
  CheckCircle2,
} from 'lucide-react-native';
import { AuthLayout } from '../../features/auth/components/AuthLayout';
import { FormGroup } from '../../features/auth/components/FormGroup';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { loginFormSchema, LoginFormValues } from '../../features/auth/schemas/authSchemas';
import { useAuthStore } from '../../store/authStore';
import { extractApiErrorMessage } from '../../services/api/apiErrorHandler';
import { colors } from '../../theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verified?: string; resetSuccess?: string }>();
  const { login } = useAuthStore();

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      await login(values.identifier, values.password, values.rememberMe);
      router.replace('/(protected)/home');
    } catch (err: any) {
      if (err?.response?.data?.error?.code === 'ACCOUNT_NOT_VERIFIED') {
        const unverifiedData = err.response.data.error.data;
        router.push({
          pathname: '/(auth)/verify-registration-otp',
          params: {
            userId: unverifiedData?.userId,
            recipient: unverifiedData?.recipient,
            channel: unverifiedData?.channel,
          },
        });
        return;
      }

      const message = extractApiErrorMessage(err, 'Unable to sign in. Please verify your credentials.');
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout showBack onBackPress={() => router.replace('/(auth)/welcome')}>
      <AuthLayout.Title>Welcome Back</AuthLayout.Title>
      <AuthLayout.Subtitle>
        Sign in to continue your wellness journey.
      </AuthLayout.Subtitle>

      {params.verified === 'true' && (
        <View style={styles.noticeBanner}>
          <CheckCircle2 size={16} color={colors.success} />
          <Text style={styles.noticeText}>Account verified successfully! Please sign in.</Text>
        </View>
      )}

      {params.resetSuccess === 'true' && (
        <View style={styles.noticeBanner}>
          <CheckCircle2 size={16} color={colors.success} />
          <Text style={styles.noticeText}>Password reset successfully! Please sign in.</Text>
        </View>
      )}

      <ErrorMessage message={apiError} />

      <AuthLayout.Content>
        {/* Email or Mobile Number */}
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormGroup hasError={!!errors.identifier}>
              <FormGroup.Input
                placeholder="Email or Mobile Number"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={18} color="#94A3B8" />}
              />
              <FormGroup.Error message={errors.identifier?.message} />
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

        {/* Remember Me & Forgot Password Row */}
        <View style={styles.optionsRow}>
          <Controller
            control={control}
            name="rememberMe"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                onPress={() => onChange(!value)}
                style={styles.rememberMeRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!value }}
                activeOpacity={0.7}
              >
                {value ? (
                  <CheckSquare size={18} color={colors.primary} />
                ) : (
                  <Square size={18} color="#94A3B8" />
                )}
                <Text style={styles.rememberMeText}>Remember Me</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            accessibilityRole="link"
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <AppButton
          title="Login"
          variant="primary"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.loginBtn}
        />

        {/* Social Logins (Google & Apple) - Commented out per request */}
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
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
          <View style={styles.socialIconContainer}>
            <Text style={styles.appleIcon}></Text>
          </View>
          <Text style={styles.socialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>
        */}

        {/* Terms & Privacy Notice */}
        <View style={styles.legalDisclaimerRow}>
          <Text style={styles.legalDisclaimerText}>
            By signing in, you agree to UYIRA's{' '}
            <Text
              style={styles.legalLink}
              onPress={() => router.push('/(auth)/terms')}
            >
              Terms & Conditions
            </Text>{' '}
            and{' '}
            <Text
              style={styles.legalLink}
              onPress={() => router.push('/(auth)/privacy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </AuthLayout.Content>

      <AuthLayout.Footer>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={styles.createAccountRow}
          activeOpacity={0.7}
        >
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Text style={styles.footerLink}>Register</Text>
        </TouchableOpacity>
      </AuthLayout.Footer>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBackground,
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberMeText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  loginBtn: {
    marginTop: 12,
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  socialButton: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  socialIconContainer: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 17,
    fontWeight: '800',
    color: '#EA4335',
  },
  appleIcon: {
    fontSize: 20,
    color: '#000000',
    marginBottom: 2,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  legalDisclaimerRow: {
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  legalDisclaimerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  createAccountRow: {
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
