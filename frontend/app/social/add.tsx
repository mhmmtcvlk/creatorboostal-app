import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    placeholder: '@kullaniciadi',
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: 'twitter',
    color: '#1DA1F2',
    placeholder: '@kullaniciadi',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'tiktok',
    color: '#000000',
    placeholder: '@kullaniciadi',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    placeholder: 'Kanal Adı',
  },
];

export default function AddSocialAccount() {
  const { user } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    description: '',
    followers_count: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.username.trim() || !formData.display_name.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı ve görünen ad gerekli');
      return;
    }

    setLoading(true);
    try {
      await apiClient.createSocialAccount({
        platform: selectedPlatform.id as any,
        username: formData.username.replace('@', ''),
        display_name: formData.display_name,
        description: formData.description,
        followers_count: formData.followers_count,
      });

      Alert.alert(
        'Başarılı!', 
        'Sosyal medya hesabınız eklendi ve artık boost edilebilir!',
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Hesap eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      username: '',
      display_name: '',
      description: '',
      followers_count: 0,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sosyal Hesap Ekle</Text>
        <Pressable onPress={clearForm} style={styles.clearButton}>
          <MaterialIcons name="clear-all" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={colors.gradient.primary}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="add-circle" size={64} color="white" />
          <Text style={styles.heroTitle}>Sosyal Hesabını Ekle</Text>
          <Text style={styles.heroSubtitle}>
            Hesabını ekle ve boost özelliğinden yararlan
          </Text>
        </LinearGradient>

        {/* Platform Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Seç</Text>
          <View style={styles.platformsList}>
            {PLATFORMS.map((platform) => (
              <Pressable
                key={platform.id}
                style={[
                  styles.platformCard,
                  selectedPlatform.id === platform.id && styles.selectedPlatformCard
                ]}
                onPress={() => setSelectedPlatform(platform)}
              >
                <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                  <Ionicons name={platform.icon as any} size={24} color={platform.color} />
                </View>
                <Text style={[
                  styles.platformName,
                  selectedPlatform.id === platform.id && styles.selectedText
                ]}>
                  {platform.name}
                </Text>
                {selectedPlatform.id === platform.id && (
                  <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Account Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
          
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kullanıcı Adı *</Text>
              <TextInput
                style={styles.textInput}
                placeholder={selectedPlatform.placeholder}
                placeholderTextColor={colors.textSecondary}
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Görünen Ad *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Profilde görünen isim"
                placeholderTextColor={colors.textSecondary}
                value={formData.display_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, display_name: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Açıklama</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Hesabınız hakkında kısa bir açıklama..."
                placeholderTextColor={colors.textSecondary}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Takipçi Sayısı</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Mevcut takipçi sayınız"
                placeholderTextColor={colors.textSecondary}
                value={formData.followers_count.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, followers_count: parseInt(text) || 0 }))}
                keyboardType="numeric"
              />
            </View>
          </div>
        </View>

        {/* Preview Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Önizleme</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewIcon, { backgroundColor: selectedPlatform.color + '20' }]}>
                <Ionicons name={selectedPlatform.icon as any} size={20} color={selectedPlatform.color} />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>
                  {formData.display_name || 'Görünen Ad'}
                </Text>
                <Text style={styles.previewUsername}>
                  @{formData.username || 'kullaniciadi'}
                </Text>
              </View>
              <View style={styles.previewStats}>
                <Text style={styles.previewFollowers}>{formData.followers_count}</Text>
                <Text style={styles.previewLabel}>Takipçi</Text>
              </div>
            </div>
            {formData.description && (
              <Text style={styles.previewDescription}>{formData.description}</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <GradientButton
            title={loading ? 'Ekleniyor...' : 'Hesap Ekle'}
            onPress={handleSubmit}
            disabled={loading}
            size="large"
            style={styles.submitButton}
          />
          
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>İptal</Text>
          </Pressable>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>İpuçları</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <MaterialIcons name="lightbulb" size={16} color={colors.warning} />
              <Text style={styles.tipText}>
                Gerçek takipçi sayınızı girin, bu boost performansını etkiler
              </Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="security" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Sadece hesap bilgileri alınır, şifre veya kişisel veri istenmez
              </Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="trending-up" size={16} color={colors.primary} />
              <Text style={styles.tipText}>
                Boost ettikten sonra hesabınız keşfet sayfasında öne çıkar
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  clearButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  platformsList: {
    gap: 12,
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedPlatformCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  platformName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  selectedText: {
    color: colors.primary,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  previewUsername: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  previewStats: {
    alignItems: 'center',
  },
  previewFollowers: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  previewDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  tipsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});