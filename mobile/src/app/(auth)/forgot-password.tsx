import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { AuthLayout } from '../../features/auth/components/AuthLayout';
import { FormGroup } from '../../features/auth/components/FormGroup';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import {
  forgotPasswordFormSchema,
  ForgotPasswordFormValues,
} from '../../features/auth/schemas/authSchemas';
import { authApiService } from '../../features/auth/services/authService';
import { extractApiErrorMessage } from '../../services/api/apiErrorHandler';
import { colors } from '../../theme/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      identifier: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await authApiService.forgotPassword(values.identifier);
      router.push({
        pathname: '/(auth)/verify-reset-otp',
        params: {
          resetSessionId: response.resetSessionId,
          identifier: values.identifier,
        },
      });
    } catch (err) {
      const message = extractApiErrorMessage(err, 'Failed to send reset code. Please try again.');
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout showBack onBackPress={() => router.replace('/(auth)/login')}>
      {/* Center Illustration Matching Design */}
      <AuthLayout.Illustration
        source={require('../../../assets/images/illustration_forgot_password.png')}
        size={135}
      />

      <AuthLayout.Title>Forgot Password?</AuthLayout.Title>
      <AuthLayout.Subtitle>
        Enter your registered email or mobile number to reset your password.
      </AuthLayout.Subtitle>

      <ErrorMessage message={apiError} />

      <AuthLayout.Content>
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

        <AppButton
          title="Send OTP"
          variant="primary"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.sendBtn}
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

const styles = StyleSheet.create({
  sendBtn: {
    marginTop: 8,
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
