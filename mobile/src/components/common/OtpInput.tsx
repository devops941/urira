import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  length?: number;
  error?: string;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  error,
  autoFocus = true,
}) => {
  const hiddenInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 150);
    }
  }, [autoFocus]);

  const handlePress = () => {
    hiddenInputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    // Only accept numbers and truncate to specified length
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(cleaned);
  };

  const digits = value.split('');

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.slotsRow}>
        {Array.from({ length }).map((_, index) => {
          const char = digits[index] || '';
          const isFocused = value.length === index;
          const isFilled = !!char;

          return (
            <View
              key={index}
              style={[
                styles.slot,
                isFocused && styles.slotFocused,
                isFilled && styles.slotFilled,
                error && styles.slotError,
              ]}
            >
              <Text style={styles.digitText}>{char}</Text>
            </View>
          );
        })}
      </Pressable>

      {/* Hidden text input overlay capturing native keyboard & paste events */}
      <TextInput
        ref={hiddenInputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        style={styles.hiddenInput}
        caretHidden
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  slot: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
  },
  slotFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  slotError: {
    borderColor: colors.error,
  },
  digitText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
});

