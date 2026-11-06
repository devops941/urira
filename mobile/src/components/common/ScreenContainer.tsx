import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  statusBarColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  statusBarColor = colors.surface,
  statusBarStyle = 'dark-content',
}) => {
  const insets = useSafeAreaInsets();

  // Safe top spacing ensuring headers never overlap status bar icons or camera cutouts
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  ) + (Platform.OS === 'android' ? 8 : 4);

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.root, { backgroundColor: statusBarColor, paddingTop: topPadding }]}>
      <StatusBar
        barStyle={statusBarStyle}
        {...(Platform.OS === 'android' ? { backgroundColor: statusBarColor, translucent: true } : {})}
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? topPadding : 0}
      >
        {scrollable ? (
          <ScrollView
            style={[styles.container, style]}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: bottomPadding },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.container, styles.nonScrollContent, style]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  nonScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
