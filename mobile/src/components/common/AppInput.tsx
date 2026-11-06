import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  required?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  required,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = (): string => {
    if (error) return colors.borderError;
    if (isFocused) return colors.borderFocus;
    return colors.borderSubtle;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredAsterisk}>*</Text>}
        </View>
      )}

      <View style={[styles.inputContainer, { borderColor: getBorderColor() }]}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            disabled={!onRightIconPress}
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            accessibilityRole={onRightIconPress ? 'button' : undefined}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  requiredAsterisk: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 3,
  },
  inputContainer: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
    fontSize: 15,
  },
  leftIconContainer: {
    marginRight: 10,
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 2,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
});

