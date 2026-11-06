import React, { ReactNode } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageSourcePropType,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { colors } from '../../../theme/colors';

interface AuthLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  onBackPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AuthLayout: React.FC<AuthLayoutProps> & {
  Header: React.FC<{ logoSize?: number }>;
  Illustration: React.FC<{ source: ImageSourcePropType; size?: number }>;
  Title: React.FC<{ children: ReactNode; style?: StyleProp<TextStyle> }>;
  Subtitle: React.FC<{ children: ReactNode; style?: StyleProp<TextStyle> }>;
  Content: React.FC<{ children: ReactNode; style?: StyleProp<ViewStyle> }>;
  Footer: React.FC<{ children: ReactNode; style?: StyleProp<ViewStyle> }>;
} = ({ children, showBack = false, onBackPress, style }) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  // Separate footer from main body content so it pins neatly at bottom
  const childrenArray = React.Children.toArray(children);
  const footerIndex = childrenArray.findIndex(
    (child) =>
      React.isValidElement(child) &&
      (child.type === Footer || (child.type as any)?.displayName === 'AuthLayoutFooter')
  );

  let bodyElements = childrenArray;
  let footerElement: React.ReactNode = null;

  if (footerIndex !== -1) {
    footerElement = childrenArray[footerIndex];
    bodyElements = childrenArray.filter((_, idx) => idx !== footerIndex);
  }

  return (
    <ScreenContainer contentContainerStyle={[styles.container, style]}>
      {/* Top Header Row with Back Button and Centered Logo */}
      <View style={styles.topHeaderRow}>
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.centeredLogoBox}>
          <Image
            source={require('../../../../assets/images/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.backPlaceholder} />
      </View>

      {/* Main Content/Form Body - Vertically Centered */}
      <View style={styles.mainBody}>
        {bodyElements}
      </View>

      {/* Footer docked gracefully at bottom */}
      {footerElement ? (
        footerElement
      ) : (
        <View style={styles.footerPlaceholder} />
      )}
    </ScreenContainer>
  );
};

const Header: React.FC<{ logoSize?: number }> = () => {
  return null;
};

const Illustration: React.FC<{ source: ImageSourcePropType; size?: number }> = ({
  source,
  size = 140,
}) => {
  return (
    <View style={styles.illustrationWrapper}>
      <View style={[styles.illustrationCircle, { width: size + 20, height: size + 20 }]}>
        <Image
          source={source}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const Title: React.FC<{ children: ReactNode; style?: StyleProp<TextStyle> }> = ({ children, style }) => {
  return <Text style={[styles.title, style]}>{children}</Text>;
};

const Subtitle: React.FC<{ children: ReactNode; style?: StyleProp<TextStyle> }> = ({ children, style }) => {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
};

const Content: React.FC<{ children: ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => {
  return <View style={[styles.content, style]}>{children}</View>;
};

const Footer: React.FC<{ children: ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => {
  return <View style={[styles.footer, style]}>{children}</View>;
};
Footer.displayName = 'AuthLayoutFooter';

AuthLayout.Header = Header;
AuthLayout.Illustration = Illustration;
AuthLayout.Title = Title;
AuthLayout.Subtitle = Subtitle;
AuthLayout.Content = Content;
AuthLayout.Footer = Footer;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 4,
    paddingBottom: 16,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 42,
    height: 42,
  },
  centeredLogoBox: {
    alignItems: 'center',
  },
  brandLogo: {
    width: 145,
    height: 52,
  },
  mainBody: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  illustrationCircle: {
    borderRadius: 999,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
  },
  footer: {
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  footerPlaceholder: {
    height: 42,
  },
});
