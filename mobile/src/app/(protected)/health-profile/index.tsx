import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  User,
  Camera,
  Info,
  Heart,
  AlertCircle,
  ChevronRight,
  Edit3,
  Check,
  X,
  RefreshCw,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { LoadingState } from '../../../components/common/LoadingState';
import { BottomNavBar } from '../../../components/common/BottomNavBar';
import { profileService } from '../../../services/health/profileService';
import { useAuthStore } from '../../../store/authStore';
import { UserHealthProfile } from '../../../types/health';
import { colors } from '../../../theme/colors';

export default function HealthProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<UserHealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err: any) {
      Alert.alert('Notice', 'Unable to retrieve profile data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handlePickPhoto = () => {
    if (Platform.OS === 'web') {
      (async () => {
        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]?.uri) {
            setTempImageUri(result.assets[0].uri);
            setPreviewModalVisible(true);
          }
        } catch (err: any) {
          if (typeof window !== 'undefined') {
            window.alert(err?.message || 'Failed to select photo');
          }
        }
      })();
      return;
    }

    Alert.alert('Profile Photo', 'Select your photo source', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is needed to take a photo.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]?.uri) {
            setTempImageUri(result.assets[0].uri);
            setPreviewModalVisible(true);
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Gallery permission is needed to select a photo.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]?.uri) {
            setTempImageUri(result.assets[0].uri);
            setPreviewModalVisible(true);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadImage = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      const updated = await profileService.uploadAvatar(uri);
      setProfile(updated);
      if (user && updated.profilePhoto) {
        useAuthStore.getState().setUser({
          ...user,
          profilePhoto: updated.profilePhoto,
        });
      }
      setPreviewModalVisible(false);
      setTempImageUri(null);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Profile photo saved successfully!');
      } else {
        Alert.alert('Success', 'Profile photo saved successfully!');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload photo to Cloudinary.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Upload Failed', msg);
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.screenContainer}>
        <AppHeader title="Health Profile" />
        <LoadingState message="Loading health profile..." />
      </View>
    );
  }

  const completion = profile?.completionPercentage ?? 0;
  const userName = profile?.fullName || user?.fullName || 'Health Champion';
  const age = profile?.age;
  const gender = profile?.biologicalSex
    ? profile.biologicalSex === 'FEMALE'
      ? 'Female'
      : profile.biologicalSex === 'MALE'
      ? 'Male'
      : 'Other'
    : null;

  return (
    <View style={styles.screenContainer}>
      <AppHeader title="Health Profile" />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile Card Header matching Mockup */}
        <View style={styles.profileHeaderCard}>
          {/* Circular Avatar with Camera Badge */}
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={handlePickPhoto}
              activeOpacity={0.8}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator color={colors.primary} />
              ) : profile?.profilePhoto ? (
                <Image
                  source={{ uri: profile.profilePhoto }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <User size={46} color={colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handlePickPhoto}
              disabled={uploadingPhoto}
            >
              <Camera size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* User Name & Age */}
          <Text style={styles.userNameText}>{userName}</Text>
          <Text style={styles.userSubtitleText}>
            {age ? `Age: ${age} years` : 'Age: Not set'} | {gender ? gender : 'Gender: Not set'}
          </Text>

          {/* Profile Completion Bar */}
          <View style={styles.completionContainer}>
            <View style={styles.completionTextRow}>
              <Text style={styles.completionLabel}>Profile Completion</Text>
              <Text style={styles.completionValue}>{completion}%</Text>
            </View>
            <View style={styles.completionBarTrack}>
              <View style={[styles.completionBarFill, { width: `${completion}%` }]} />
            </View>
          </View>
        </View>

        {/* 4 Category Section Navigation Cards */}
        <View style={styles.sectionsList}>
          {/* Section 1: Personal Information */}
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() =>
              router.push({
                pathname: '/(protected)/health-profile/edit',
                params: { section: 'personal' },
              })
            }
            activeOpacity={0.75}
          >
            <View style={[styles.sectionIconBox, { backgroundColor: '#E0F2FE' }]}>
              <User size={20} color="#0EA5E9" />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Text style={styles.sectionDetail}>
                {userName} • {gender ? gender : 'Not set'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* Section 2: Physical Information */}
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() =>
              router.push({
                pathname: '/(protected)/health-profile/edit',
                params: { section: 'physical' },
              })
            }
            activeOpacity={0.75}
          >
            <View style={[styles.sectionIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Info size={20} color="#16A34A" />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Physical Information</Text>
              <Text style={styles.sectionDetail}>
                {profile?.heightCm ? `${profile.heightCm} cm` : 'Height not set'} •{' '}
                {profile?.weightKg ? `${profile.weightKg} kg` : 'Weight not set'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* Section 3: Health Preferences */}
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() =>
              router.push({
                pathname: '/(protected)/health-profile/edit',
                params: { section: 'preferences' },
              })
            }
            activeOpacity={0.75}
          >
            <View style={[styles.sectionIconBox, { backgroundColor: '#FFEDD5' }]}>
              <Heart size={20} color="#F97316" />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Health Preferences</Text>
              <Text style={styles.sectionDetail}>
                {profile?.preferredWaterIntakeMl ? `${profile.preferredWaterIntakeMl} ml` : 'Water not set'} •{' '}
                {profile?.preferredStepGoal ? `${profile.preferredStepGoal.toLocaleString()} steps` : 'Steps not set'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* Section 4: Medical & Emergency Info */}
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() =>
              router.push({
                pathname: '/(protected)/health-profile/edit',
                params: { section: 'emergency' },
              })
            }
            activeOpacity={0.75}
          >
            <View style={[styles.sectionIconBox, { backgroundColor: '#FEE2E2' }]}>
              <AlertCircle size={20} color="#E11D48" />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Medical & Emergency Info</Text>
              <Text style={styles.sectionDetail}>
                {profile?.emergencyContactName
                  ? `${profile.emergencyContactName} (${profile.emergencyContactPhone || ''})`
                  : 'Emergency contact & private health notes'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Primary CTA Button: Edit Profile */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() =>
            router.push({
              pathname: '/(protected)/health-profile/edit',
              params: { section: 'personal' },
            })
          }
          activeOpacity={0.85}
        >
          <Edit3 size={18} color="#FFFFFF" style={styles.editBtnIcon} />
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab="profile" />

      {/* Profile Photo Preview & Confirmation Modal */}
      <Modal
        visible={previewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!uploadingPhoto) setPreviewModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Set Profile Photo</Text>
              <TouchableOpacity
                onPress={() => setPreviewModalVisible(false)}
                disabled={uploadingPhoto}
                style={styles.modalCloseBtn}
                accessibilityLabel="Close"
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Preview your photo below. Tap <Text style={{ fontWeight: '700', color: '#16A34A' }}>Save Profile Photo</Text> to confirm and update your avatar.
            </Text>

            {/* Circular Preview */}
            <View style={styles.previewCircleContainer}>
              {tempImageUri ? (
                <Image
                  source={{ uri: tempImageUri }}
                  style={styles.previewCircleImage}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.previewCircleRing} />
            </View>

            {/* Primary Action: Done / Save Button */}
            <TouchableOpacity
              style={styles.savePhotoButton}
              onPress={async () => {
                if (tempImageUri) {
                  await uploadImage(tempImageUri);
                }
              }}
              disabled={uploadingPhoto}
              activeOpacity={0.85}
            >
              {uploadingPhoto ? (
                <View style={styles.buttonInlineRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.savePhotoButtonText}>Saving to Cloudinary...</Text>
                </View>
              ) : (
                <View style={styles.buttonInlineRow}>
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.savePhotoButtonText}>Save Profile Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Secondary Action: Choose Another Photo */}
            <TouchableOpacity
              style={styles.chooseAnotherButton}
              onPress={handlePickPhoto}
              disabled={uploadingPhoto}
              activeOpacity={0.8}
            >
              <Camera size={18} color={colors.primary} />
              <Text style={styles.chooseAnotherButtonText}>Choose Another Photo</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setPreviewModalVisible(false)}
              disabled={uploadingPhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
  },
  profileHeaderCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#C7E5D5',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryText,
  },
  userSubtitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
    marginTop: 3,
    marginBottom: 16,
  },
  completionContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  completionTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },
  completionValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
  completionBarTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  sectionsList: {
    gap: 10,
    marginBottom: 20,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  sectionDetail: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editBtnIcon: {
    marginRight: 8,
  },
  editProfileButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  modalDescription: {
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  previewCircleContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#E8F3EC',
  },
  previewCircleImage: {
    width: '100%',
    height: '100%',
  },
  previewCircleRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  buttonInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  savePhotoButton: {
    width: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  savePhotoButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chooseAnotherButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  chooseAnotherButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  cancelModalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelModalButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
