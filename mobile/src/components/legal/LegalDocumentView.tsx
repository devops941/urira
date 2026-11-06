import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

export interface LegalDocumentViewProps {
  initialTab?: 'terms' | 'privacy';
}

export const LegalDocumentView: React.FC<LegalDocumentViewProps> = ({
  initialTab = 'terms',
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  const topPadding =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight || 28) + 8
      : Math.max(insets.top, 20) + 4;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(protected)/home');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color="#12372A" />
        </TouchableOpacity>

        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'terms' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('terms')}
          activeOpacity={0.8}
        >
          <FileText
            size={16}
            color={activeTab === 'terms' ? '#FFFFFF' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'terms' && styles.tabTextActive,
            ]}
          >
            Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'privacy' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('privacy')}
          activeOpacity={0.8}
        >
          <ShieldCheck
            size={16}
            color={activeTab === 'privacy' ? '#FFFFFF' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'privacy' && styles.tabTextActive,
            ]}
          >
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Document Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'terms' ? (
          /* ================= TERMS & CONDITIONS ================= */
          <View style={styles.documentBody}>
            {/* Hero Header */}
            <View style={styles.heroCard}>
              <View style={styles.heroIconBox}>
                <Scale size={24} color="#12372A" />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Terms and Conditions</Text>
                <Text style={styles.heroSubtitle}>
                  Effective: November 2026 • Version 1.0.0
                </Text>
              </View>
            </View>

            {/* Medical Disclaimer Alert */}
            <View style={styles.warningBanner}>
              <AlertTriangle size={20} color="#D97706" style={{ marginTop: 2 }} />
              <View style={styles.bannerContent}>
                <Text style={styles.warningTitle}>Important Medical Disclaimer</Text>
                <Text style={styles.warningText}>
                  UYIRA is a preventative wellness companion, lifestyle tracker, and AI health assistant. It is <Text style={styles.boldText}>NOT</Text> a licensed medical healthcare provider and is not intended to diagnose, treat, cure, or prevent any acute disease. In case of medical emergencies, dial local emergency services immediately.
                </Text>
              </View>
            </View>

            {/* Section 1 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Acceptance of Terms</Text>
              </View>
              <Text style={styles.paragraph}>
                By creating an account, downloading, or using the UYIRA mobile application and wellness services, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to all terms, please discontinue using the service immediately.
              </Text>
            </View>

            {/* Section 2 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>2</Text>
                </View>
                <Text style={styles.sectionHeading}>User Account & Data Authenticity</Text>
              </View>
              <Text style={styles.paragraph}>
                To provide accurate BMI calculations, metabolic burn rates (TDEE), and Dynamic Living Avatar simulations, you agree to provide authentic health metrics (such as age, height, weight, hydration, and activity). You are solely responsible for safeguarding your login credentials and for all activities occurring under your account.
              </Text>
            </View>

            {/* Section 3 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>3</Text>
                </View>
                <Text style={styles.sectionHeading}>AI Wellness Assistant Usage</Text>
              </View>
              <Text style={styles.paragraph}>
                The integrated UYIRA AI Assistant provides lifestyle guidance, nutritional suggestions, and wellness tips based on standard scientific parameters. All recommendations are educational and should not replace consultation with certified healthcare professionals or dietitians.
              </Text>
            </View>

            {/* Section 4 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>Dynamic Health Avatar & Vitality Engine</Text>
              </View>
              <Text style={styles.paragraph}>
                Your Living Health Avatar and Vitality Score (0–100%) reflect genuine logged activity across 4 core health pillars: Steps, Hydration, Nutrition, and Sleep. Scores reset at midnight to motivate continuous healthy habits.
              </Text>
            </View>

            {/* Section 5 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>5</Text>
                </View>
                <Text style={styles.sectionHeading}>Limitation of Liability</Text>
              </View>
              <Text style={styles.paragraph}>
                UYIRA and its developers shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the platform or reliance on lifestyle suggestions.
              </Text>
            </View>

            {/* Contact Box */}
            <View style={styles.contactCard}>
              <Mail size={20} color="#16A34A" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Questions regarding Terms?</Text>
                <Text style={styles.contactSub}>Reach out to support@uyirahealth.com</Text>
              </View>
            </View>
          </View>
        ) : (
          /* ================= PRIVACY POLICY ================= */
          <View style={styles.documentBody}>
            {/* Hero Header */}
            <View style={styles.heroCard}>
              <View style={[styles.heroIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Lock size={24} color="#16A34A" />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Privacy Policy</Text>
                <Text style={styles.heroSubtitle}>
                  Your Health Data Is Private & Secure • November 2026
                </Text>
              </View>
            </View>

            {/* Privacy Guarantee Banner */}
            <View style={[styles.warningBanner, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <CheckCircle2 size={20} color="#16A34A" style={{ marginTop: 2 }} />
              <View style={styles.bannerContent}>
                <Text style={[styles.warningTitle, { color: '#15803D' }]}>
                  UYIRA Privacy Guarantee
                </Text>
                <Text style={[styles.warningText, { color: '#166534' }]}>
                  We do <Text style={styles.boldText}>NOT</Text> sell your biometric or personal health data to insurance agencies, advertisers, or third-party data brokers. Your health metrics belong entirely to you.
                </Text>
              </View>
            </View>

            {/* Section 1 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.numberBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.numberBadgeText, { color: '#15803D' }]}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Information We Collect</Text>
              </View>
              <Text style={styles.paragraph}>
                We collect personal information necessary to deliver personalized wellness tracking:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Account Credentials:</Text> Full name, verified email, and phone number.</Text>
                <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Biometric Baseline:</Text> Height, weight, biological sex, and date of birth.</Text>
                <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Daily Activity Logs:</Text> Steps, water intake, meal logs, and sleep duration.</Text>
                <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Safety Contacts:</Text> Optional emergency contact name and phone number.</Text>
              </View>
            </View>

            {/* Section 2 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.numberBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.numberBadgeText, { color: '#15803D' }]}>2</Text>
                </View>
                <Text style={styles.sectionHeading}>How We Use Your Health Data</Text>
              </View>
              <Text style={styles.paragraph}>
                Your data is exclusively utilized to:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Compute live BMI and daily Basal Metabolic Rate (BMR).</Text>
                <Text style={styles.bulletItem}>• Power your real-time 3D Dynamic Living Avatar and Vitality score.</Text>
                <Text style={styles.bulletItem}>• Generate personalized AI wellness recommendations.</Text>
                <Text style={styles.bulletItem}>• Provide longitudinal health history charts and PDF reports.</Text>
              </View>
            </View>

            {/* Section 3 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.numberBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.numberBadgeText, { color: '#15803D' }]}>3</Text>
                </View>
                <Text style={styles.sectionHeading}>Data Encryption & Storage Security</Text>
              </View>
              <Text style={styles.paragraph}>
                All health logs are secured with industry-standard TLS/SSL encryption in transit and AES-256 encryption at rest on MongoDB Atlas servers. Authentication is managed through secure JSON Web Tokens (JWT) stored safely in encrypted storage on your mobile device.
              </Text>
            </View>

            {/* Section 4 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.numberBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.numberBadgeText, { color: '#15803D' }]}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>Your Rights & Data Portability</Text>
              </View>
              <Text style={styles.paragraph}>
                You retain complete control of your data. You may at any time export your comprehensive health analytics as a PDF report, update your measurements in your Health Profile, or request permanent deletion of your account and records.
              </Text>
            </View>

            {/* Contact Box */}
            <View style={styles.contactCard}>
              <Mail size={20} color="#16A34A" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Privacy Office Contact</Text>
                <Text style={styles.contactSub}>privacy@uyirahealth.com</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 105,
    height: 36,
  },
  headerSpacer: {
    width: 38,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: '#12372A',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  documentBody: {
    gap: 14,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#12372A',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  bannerContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E8F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#12372A',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#12372A',
    flex: 1,
  },
  paragraph: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginTop: 2,
  },
  bulletList: {
    marginTop: 8,
    gap: 6,
  },
  bulletItem: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 19,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 12,
    marginTop: 6,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  contactSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 1,
  },
});

