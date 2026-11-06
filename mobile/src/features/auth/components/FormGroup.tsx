import React, { createContext, useContext, ReactNode, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';

interface FormFieldContextValue {
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  hasError: boolean;
  disabled?: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue>({
  isFocused: false,
  setIsFocused: () => {},
  hasError: false,
});

interface FormGroupProps {
  children: ReactNode;
  hasError?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const FormGroup: React.FC<FormGroupProps> & {
  Label: React.FC<{ children: ReactNode; required?: boolean; style?: TextStyle }>;
  Input: React.FC<TextInputProps & { leftIcon?: ReactNode; rightIcon?: ReactNode; onRightIconPress?: () => void }>;
  Password: React.FC<TextInputProps & { leftIcon?: ReactNode }>;
  Error: React.FC<{ message?: string | null }>;
  HelperText: React.FC<{ children: ReactNode }>;
} = ({ children, hasError = false, disabled = false, style }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <FormFieldContext.Provider value={{ isFocused, setIsFocused, hasError, disabled }}>
      <View style={[styles.groupContainer, style]}>{children}</View>
    </FormFieldContext.Provider>
  );
};

const Label: React.FC<{ children: ReactNode; required?: boolean; style?: TextStyle }> = ({
  children,
  required,
  style,
}) => {
  return (
    <View style={styles.labelRow}>
      <Text style={[styles.labelText, style]}>{children}</Text>
      {required && <Text style={styles.requiredAsterisk}>*</Text>}
    </View>
  );
};

const Input: React.FC<
  TextInputProps & { leftIcon?: ReactNode; rightIcon?: ReactNode; onRightIconPress?: () => void }
> = ({ leftIcon, rightIcon, onRightIconPress, style, onFocus, onBlur, ...props }) => {
  const { isFocused, setIsFocused, hasError, disabled } = useContext(FormFieldContext);

  const getBorderColor = () => {
    if (hasError) return colors.borderError;
    if (isFocused) return colors.borderFocus;
    return '#E2E8F0';
  };

  return (
    <View
      style={[
        styles.inputWrapper,
        { borderColor: getBorderColor() },
        disabled && styles.disabledInput,
      ]}
    >
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <TextInput
        style={[styles.inputField, style]}
        placeholderTextColor="#94A3B8"
        selectionColor={colors.primary}
        editable={!disabled}
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
          style={styles.rightIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
};

const Password: React.FC<TextInputProps & { leftIcon?: ReactNode }> = ({ leftIcon, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      secureTextEntry={!showPassword}
      autoCapitalize="none"
      autoCorrect={false}
      leftIcon={leftIcon}
      rightIcon={
        showPassword ? (
          <EyeOff size={18} color="#94A3B8" />
        ) : (
          <Eye size={18} color="#94A3B8" />
        )
      }
      onRightIconPress={() => setShowPassword((prev) => !prev)}
      {...props}
    />
  );
};

const Error: React.FC<{ message?: string | null }> = ({ message }) => {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
};

const HelperText: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <Text style={styles.helperText}>{children}</Text>;
};

FormGroup.Label = Label;
FormGroup.Input = Input;
FormGroup.Password = Password;
FormGroup.Error = Error;
FormGroup.HelperText = HelperText;

const styles = StyleSheet.create({
  groupContainer: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  requiredAsterisk: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 3,
  },
  inputWrapper: {
    height: 50,
    borderWidth: 1.2,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  disabledInput: {
    backgroundColor: '#F8FAFC',
    opacity: 0.7,
  },
  inputField: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
    fontSize: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 8,
    padding: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
