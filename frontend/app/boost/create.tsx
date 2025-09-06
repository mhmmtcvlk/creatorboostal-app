import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';

interface SocialAccount {
  id: string;
  platform: 'instagram' | 'twitter' | 'tiktok' | 'youtube';
  username: string;
  display_name: string;
  followers_count: number;
  user_id: string;
}

interface BoostDuration {
  hours: number;
  label: string;
  credits: number;
  description: string;
  effectiveness: string;
}

const BOOST_DURATIONS: BoostDuration[] = [
  { hours: 1, label: '1 Saat', credits: 10, description: 'Hızlı görünürlük artışı', effectiveness: 'Düşük' },
  { hours: 6, label: '6 Saat', credits: 50, description: 'Günün büyük kısmında öne çıkma', effectiveness: 'Orta' },
  { hours: 12, label: '12 Saat', credits: 90, description: 'Yarım gün sürekli görünürlük', effectiveness: 'İyi' },
  { hours: 24, label: '1 Gün', credits: 150, description: 'Tam gün boost etkisi', effectiveness: 'Yüksek' },
  { hours: 72, label: '3 Gün', credits: 400, description: '3 gün sürekli öncelik', effectiveness: 'Çok Yüksek' },
  { hours: 168, label: '1 Hafta', credits: 800, description: 'Maximum etki 7 gün', effectiveness: 'Maximum' },
];

export default function CreateBoost() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(BOOST_DURATIONS[0]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [boostAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await apiClient.discoverAccounts(0, 50);
      // Filter user's own accounts (in a real app, we'd have a separate endpoint)
      const userAccounts = data.slice(0, 5); // Mock user accounts
      setAccounts(userAccounts);
      
      // Auto-select first account if available
      if (userAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(userAccounts[0]);
        console.log('✅ Auto-selected first account:', userAccounts[0]);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleCreateBoost = async () => {
    console.log('🚀 handleCreateBoost called');
    console.log('Selected account:', selectedAccount);
    console.log('Selected duration:', selectedDuration);
    console.log('User credits:', user?.credits);
    
    if (!selectedAccount) {
      console.log('❌ No account selected');
      Alert.alert('Hata', 'Lütfen boost etmek istediğiniz hesabı seçin');
      return;
    }

    if ((user?.credits || 0) < selectedDuration.credits) {
      console.log('❌ Insufficient credits');
      Alert.alert(
        'Yetersiz Kredi',
        `Bu boost için ${selectedDuration.credits} kredi gerekli. Mevcut krediniz: ${user?.credits || 0}`,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Kredi Kazan', onPress: () => router.push('/(tabs)/credits') }
        ]
      );
      return;
    }

    console.log('✅ Showing confirmation alert');
    Alert.alert(
      'Boost Oluştur',
      `${selectedAccount.display_name} hesabını ${selectedDuration.label} boyunca ${selectedDuration.credits} kredi karşılığında boost etmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Boost Et', onPress: createBoost }
      ]
    );
  };

  const createBoost = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      await apiClient.createBoost({
        social_account_id: selectedAccount.id,
        duration_hours: selectedDuration.hours,
        credits_spent: selectedDuration.credits,
      });

      // Show success animation
      setShowSuccess(true);
      startBoostAnimation();

      Alert.alert(
        '🚀 Boost Aktif!',
        `${selectedAccount.display_name} hesabınız ${selectedDuration.label} boyunca boost edildi! Keşfet sayfasında öne çıkacak.`,
        [
          { text: 'Keşfet Sayfasına Git', onPress: () => router.push('/(tabs)/discover') },
          { text: 'Tamam', onPress: () => setShowSuccess(false) }
        ]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Boost oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const startBoostAnimation = () => {
    Animated.sequence([
      Animated.timing(boostAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(boostAnimation, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'camera';
      case 'twitter': return 'alternate-email';
      case 'tiktok': return 'music-note';
      case 'youtube': return 'play-circle';
      default: return 'public';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return '#E4405F';
      case 'twitter': return '#1DA1F2';
      case 'tiktok': return '#000000';
      case 'youtube': return '#FF0000';
      default: return colors.primary;
    }
  };

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'Düşük': return colors.textSecondary;
      case 'Orta': return colors.warning;
      case 'İyi': return colors.primary;
      case 'Yüksek': return colors.success;
      case 'Çok Yüksek': return '#9B59B6';
      case 'Maximum': return '#E74C3C';
      default: return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Boost Oluştur</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={colors.gradient.primary}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[
            styles.heroContent,
            {
              transform: [{
                scale: boostAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                })
              }]
            }
          ]}>
            <MaterialIcons name="trending-up" size={48} color="white" />
            <Text style={styles.heroTitle}>Hesabını Boost Et</Text>
            <Text style={styles.heroSubtitle}>
              Keşfet sayfasında öne çık ve daha fazla takipçiye ulaş
            </Text>
            
            {/* Credits Display */}
            <View style={styles.creditsDisplay}>
              <MaterialIcons name="account-balance-wallet" size={20} color="white" />
              <Text style={styles.creditsText}>Mevcut Kredi: {user?.credits || 0}</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Account Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Seç</Text>
          <Text style={styles.debugText}>
            Selected Account: {selectedAccount ? selectedAccount.display_name : 'NONE'}
          </Text>
          
          {accounts.length > 0 ? (
            <View style={styles.accountsList}>
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  style={[
                    styles.accountCard,
                    selectedAccount?.id === account.id && styles.selectedAccountCard
                  ]}
                  onPress={() => {
                    console.log('🎯 Account selected:', account.display_name, account.id);
                    setSelectedAccount(account);
                  }}
                >
                  <View style={[
                    styles.platformIcon, 
                    { backgroundColor: getPlatformColor(account.platform) + '20' }
                  ]}>
                    <MaterialIcons 
                      name={getPlatformIcon(account.platform) as any} 
                      size={24} 
                      color={getPlatformColor(account.platform)} 
                    />
                  </View>
                  
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.display_name}</Text>
                    <Text style={styles.accountUsername}>@{account.username}</Text>
                    <Text style={styles.accountFollowers}>
                      {account.followers_count.toLocaleString()} takipçi
                    </Text>
                  </View>
                  
                  {selectedAccount?.id === account.id && (
                    <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="add-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Henüz hesap eklenmemiş</Text>
              <Text style={styles.emptySubtitle}>
                Boost etmek için önce bir sosyal medya hesabı eklemelisiniz
              </Text>
              <GradientButton
                title="Hesap Ekle"
                onPress={() => router.push('/social/add')}
                size="medium"
                style={styles.addButton}
              />
            </View>
          )}
        </View>

        {/* Duration Selection - ALWAYS SHOW FOR DEBUG */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boost Süresi & Bilgileri</Text>
          <Text style={styles.sectionDescription}>
            Boost süresi ne kadar uzun olursa, hesabınız o kadar uzun süre keşfet sayfasında öne çıkar
          </Text>
          
          <View style={styles.durationsList}>
            {BOOST_DURATIONS.map((duration) => (
              <Pressable
                key={duration.hours}
                style={[
                  styles.durationCard,
                  selectedDuration.hours === duration.hours && styles.selectedDurationCard
                ]}
                onPress={() => {
                  console.log('🕐 Duration selected:', duration.label);
                  setSelectedDuration(duration);
                }}
              >
                <View style={styles.durationHeader}>
                  <Text style={[
                    styles.durationLabel,
                    selectedDuration.hours === duration.hours && styles.selectedText
                  ]}>
                    {duration.label}
                  </Text>
                  <View style={[
                    styles.effectivenessBadge,
                    { backgroundColor: getEffectivenessColor(duration.effectiveness) + '20' }
                  ]}>
                    <Text style={[
                      styles.effectivenessText,
                      { color: getEffectivenessColor(duration.effectiveness) }
                    ]}>
                      {duration.effectiveness}
                    </Text>
                  </View>
                </View>
                
                <Text style={[
                  styles.durationCredits,
                  selectedDuration.hours === duration.hours && styles.selectedText
                ]}>
                  {duration.credits} Kredi
                </Text>
                
                <Text style={styles.durationDescription}>
                  {duration.description}
                </Text>
                
                {selectedDuration.hours === duration.hours && (
                  <View style={styles.selectedIndicator}>
                    <MaterialIcons name="check" size={16} color={colors.primary} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Boost Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boost Nasıl Çalışır?</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <MaterialIcons name="visibility" size={24} color={colors.primary} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Görünürlük Artışı</Text>
                <Text style={styles.infoDescription}>
                  Hesabınız keşfet sayfasında üst sıralarda yer alır
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="people" size={24} color={colors.success} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Daha Fazla Etkileşim</Text>
                <Text style={styles.infoDescription}>
                  Daha çok kişi hesabınızı keşfeder ve takip eder
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="trending-up" size={24} color={colors.warning} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Organik Büyüme</Text>
                <Text style={styles.infoDescription}>
                  Boost süresi dolduktan sonra da etki devam eder
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Boost Summary - ALWAYS SHOW FOR DEBUG */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boost Özeti</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hesap:</Text>
              <Text style={styles.summaryValue}>
                {selectedAccount ? selectedAccount.display_name : 'Seçilmedi'}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Süre:</Text>
              <Text style={styles.summaryValue}>{selectedDuration.label}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Maliyet:</Text>
              <Text style={styles.summaryValue}>{selectedDuration.credits} Kredi</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Etkinlik:</Text>
              <Text style={[
                styles.summaryValue,
                { color: getEffectivenessColor(selectedDuration.effectiveness) }
              ]}>
                {selectedDuration.effectiveness}
              </Text>
            </View>

            {/* Create Boost Button */}
            <GradientButton
              title={loading ? 'Boost Oluşturuluyor...' : '🚀 Boost Oluştur'}
              onPress={handleCreateBoost}
              disabled={loading || !selectedAccount}
              size="large"
              style={styles.createButton}
            />
          </View>
        </View>

        {/* Success Modal */}
        <Modal
          visible={showSuccess}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccess(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[
              styles.successModal,
              {
                transform: [{
                  scale: boostAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }
            ]}>
              <LinearGradient
                colors={['#00B894', '#55EFC4']}
                style={styles.successContent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="rocket-launch" size={64} color="white" />
                <Text style={styles.successTitle}>Boost Aktif! 🚀</Text>
                <Text style={styles.successMessage}>
                  Hesabınız keşfet sayfasında öne çıkarıldı!
                </Text>
                <GradientButton
                  title="Keşfet Sayfasına Git"
                  onPress={() => {
                    setShowSuccess(false);
                    router.push('/(tabs)/discover');
                  }}
                  gradient={['white', 'white']}
                  textColor={colors.success}
                  size="medium"
                  style={styles.successButton}
                />
              </LinearGradient>
            </Animated.View>
          </View>
        </Modal>
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
  placeholder: {
    width: 40,
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
  heroContent: {
    alignItems: 'center',
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
    marginBottom: 16,
  },
  creditsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  creditsText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  debugText: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  accountsList: {
    gap: 12,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedAccountCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  accountUsername: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  accountFollowers: {
    fontSize: 12,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addButton: {
    flex: 1,
  },
  durationsList: {
    gap: 12,
  },
  durationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  selectedDurationCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  effectivenessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  effectivenessText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  durationCredits: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 4,
  },
  durationDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedText: {
    color: colors.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary + '20',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  createButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModal: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  successContent: {
    padding: 32,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  successButton: {
    width: 200,
  },
});