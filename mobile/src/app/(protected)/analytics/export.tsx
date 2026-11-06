import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  FileText,
  Download,
  Share2,
  Copy,
  Printer,
  ShieldAlert,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { analyticsService } from '../../../services/analytics/analyticsService';
import { colors } from '../../../theme/colors';

export default function ExportScreen() {
  const router = useRouter();
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [openingPdf, setOpeningPdf] = useState(false);
  const [csvPreview, setCsvPreview] = useState<string | null>(null);

  const handleExportCsv = async () => {
    try {
      setDownloadingCsv(true);
      const csvData = await analyticsService.getCsvExportText();
      setCsvPreview(csvData);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `uyira_health_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.alert('CSV exported and downloaded successfully!');
      } else {
        Alert.alert('CSV Ready', 'Health data CSV compiled successfully. You can preview or copy the data below.');
      }
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Failed to export CSV report');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleOpenPrintableReport = async () => {
    try {
      setOpeningPdf(true);
      const htmlContent = await analyticsService.getPrintableReportHtml();

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        } else {
          window.alert('Popup blocked. Please allow popups to view printable report.');
        }
      } else {
        Alert.alert(
          'Clinical Report Generated',
          'Your printable clinical report is ready. Access it from web or browser to print/save as PDF.'
        );
      }
    } catch (err: any) {
      Alert.alert('Report Error', err?.message || 'Failed to generate printable report');
    } finally {
      setOpeningPdf(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Export Health Data" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <Download size={24} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Clinical Records & Exports</Text>
          <Text style={styles.heroSub}>
            Generate standardized clinical records and raw CSV datasets to share with your physician or healthcare team.
          </Text>
        </View>

        {/* Option 1: Printable Clinical PDF Report */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F3EC' }]}>
              <Printer size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Printable Clinical Report (PDF)</Text>
              <Text style={styles.cardSub}>
                Formal patient summary with Vitality score, health metrics, medications, and physician review block.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleOpenPrintableReport}
            disabled={openingPdf}
            activeOpacity={0.8}
          >
            {openingPdf ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <FileText size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Generate & View Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Option 2: CSV Data Export */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Download size={20} color="#0EA5E9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Complete Data Export (CSV)</Text>
              <Text style={styles.cardSub}>
                Raw data table for physical activity, hydration, sleep, and medication events.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#0EA5E9' }]}
            onPress={handleExportCsv}
            disabled={downloadingCsv}
            activeOpacity={0.8}
          >
            {downloadingCsv ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Download size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Download CSV Dataset</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* CSV Preview snippet if loaded */}
        {csvPreview && (
          <View style={styles.previewBox}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>CSV Data Preview</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.previewCodeText}>
                {csvPreview.slice(0, 1200)}...
              </Text>
            </ScrollView>
          </View>
        )}

        {/* Privacy & Medical Notice */}
        <View style={styles.noticeCard}>
          <ShieldAlert size={18} color="#64748B" />
          <Text style={styles.noticeText}>
            Exported documents contain personal health information (PHI). Keep downloaded files confidential and share only with certified healthcare providers.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    alignItems: 'center',
    textAlign: 'center',
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F3EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  cardSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 3,
    lineHeight: 17,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  previewBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  previewHeader: {
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  previewCodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  noticeCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: colors.secondaryText,
    lineHeight: 16,
  },
});

