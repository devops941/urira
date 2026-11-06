import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { AppInput, AppInputProps } from './AppInput';
import { colors } from '../../theme/colors';

export interface PasswordInputProps extends Omit<AppInputProps, 'rightIcon' | 'onRightIconPress' | 'secureTextEntry'> {}

export const PasswordInput: React.FC<PasswordInputProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AppInput
      secureTextEntry={!showPassword}
      rightIcon={
        showPassword ? (
          <EyeOff size={20} color={colors.textSecondary} />
        ) : (
          <Eye size={20} color={colors.textSecondary} />
        )
      }
      onRightIconPress={() => setShowPassword((prev) => !prev)}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
    />
  );
};

