import React, { useState, useEffect } from 'react';
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
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';
import { SocialAccount } from '../../types/social';

const BOOST_DURATIONS = [
  { hours: 1, credits: 1, label: '1 Saat' },
  { hours: 6, credits: 6, label: '6 Saat' },
  { hours: 12, credits: 12, label: '12 Saat' },
  { hours: 24, credits: 24, label: '1 Gün' },
  { hours: 72, credits: 72, label: '3 Gün' },
  { hours: 168, credits: 168, label: '1 Hafta' },
];

const PLATFORM_ICONS = {
  instagram: 'instagram',
  twitter: 'twitter', 
  tiktok: 'tiktok',
  youtube: 'youtube',
};

export default function CreateBoost() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(BOOST_DURATIONS[3]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    platform: 'instagram' as const,
    username: '',
    display_name: '',
    description: '',
    followers_count: 0,
  });

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

  const handleCreateAccount = async () => {
    if (!newAccount.username.trim() || !newAccount.display_name.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı ve görünen ad gerekli');
      return;
    }

    try {
      const account = await apiClient.createSocialAccount({
        platform: newAccount.platform,
        username: newAccount.username.replace('@', ''),
        display_name: newAccount.display_name,
        description: newAccount.description,
        followers_count: newAccount.followers_count,
      });

      setAccounts(prev => [account, ...prev]);
      setSelectedAccount(account);
      setShowAccountForm(false);
      setNewAccount({
        platform: 'instagram',
        username: '',
        display_name: '',
        description: '',
        followers_count: 0,
      });

      Alert.alert('Başarılı!', 'Sosyal medya hesabınız eklendi');
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Hesap eklenemedi');
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
      });

      // Update user credits
      const updatedUser = await apiClient.getMe();
      updateUser(updatedUser);

      Alert.alert(
        'Boost Başarılı!',
        `${selectedAccount.display_name} hesabınız ${selectedDuration.label} boyunca boost edildi!`,
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Boost oluşturulamadı');
    } finally {
      setLoading(false);
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
        {/* Credits Display */}
        <LinearGradient
          colors={colors.gradient.primary}
          style={styles.creditsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="stars" size={32} color="white" />
          <View style={styles.creditsInfo}>
            <Text style={styles.creditsLabel}>Mevcut Krediniz</Text>
            <Text style={styles.creditsAmount}>{user?.credits || 0}</Text>
          </View>
        </LinearGradient>

        {/* Account Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Seçin</Text>
          
          {accounts.length === 0 ? (
            <View style={styles.emptyAccounts}>
              <MaterialIcons name="add-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Henüz hesap yok</Text>
              <Text style={styles.emptySubtitle}>
                Boost etmek için önce bir sosyal medya hesabı eklemeniz gerekiyor
              </Text>
              <GradientButton
                title="Hesap Ekle"
                onPress={() => setShowAccountForm(true)}
                size="medium"
                style={styles.addAccountButton}
              />
            </View>
          ) : (
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
                  <View style={styles.accountHeader}>
                    <Ionicons 
                      name={PLATFORM_ICONS[account.platform] as any} 
                      size={24} 
                      color={selectedAccount?.id === account.id ? colors.primary : colors.textSecondary} 
                    />
                    <View style={styles.accountInfo}>
                      <Text style={[
                        styles.accountName,
                        selectedAccount?.id === account.id && styles.selectedText
                      ]}>
                        {account.display_name}
                      </Text>
                      <Text style={styles.accountUsername}>@{account.username}</Text>
                    </View>
                    {selectedAccount?.id === account.id && (
                      <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                    )}
                  </View>
                </Pressable>
              ))}
              
              <Pressable
                style={styles.addAccountCard}
                onPress={() => setShowAccountForm(true)}
              >
                <MaterialIcons name="add" size={24} color={colors.primary} />
                <Text style={styles.addAccountText}>Yeni Hesap Ekle</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Duration Selection - ALWAYS SHOW FOR DEBUG */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boost Süresi Seçin</Text>
          <Text style={styles.debugText}>
            Selected Account: {selectedAccount ? selectedAccount.display_name : 'NONE'}
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
                <Text style={[
                  styles.durationLabel,
                  selectedDuration.hours === duration.hours && styles.selectedText
                ]}>
                  {duration.label}
                </Text>
                <Text style={[
                  styles.durationCredits,
                  selectedDuration.hours === duration.hours && styles.selectedText
                ]}>
                  {duration.credits} Kredi
                </Text>
              </Pressable>
            ))}
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
                <Text style={styles.summaryLabel}>Kalan Kredi:</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: (user?.credits || 0) - selectedDuration.credits >= 0 ? colors.success : colors.error }
                ]}>
                  {(user?.credits || 0) - selectedDuration.credits}
                </Text>
              </View>
            </View>

            <GradientButton
              title={loading ? 'Boost Oluşturuluyor...' : 'Boost Oluştur'}
              onPress={handleCreateBoost}
              disabled={loading}
              size="large"
              style={styles.createButton}
            />
          </View>

        {/* Account Form Modal */}
        {showAccountForm && (
          <View style={styles.formOverlay}>
            <View style={styles.formModal}>
              <Text style={styles.formTitle}>Yeni Hesap Ekle</Text>
              
              <View style={styles.platformSelector}>
                {(['instagram', 'twitter', 'tiktok', 'youtube'] as const).map((platform) => (
                  <Pressable
                    key={platform}
                    style={[
                      styles.platformButton,
                      newAccount.platform === platform && styles.selectedPlatform
                    ]}
                    onPress={() => setNewAccount(prev => ({ ...prev, platform }))}
                  >
                    <Ionicons 
                      name={PLATFORM_ICONS[platform] as any} 
                      size={20} 
                      color={newAccount.platform === platform ? 'white' : colors.textSecondary} 
                    />
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.formInput}
                placeholder="@kullaniciadi"
                placeholderTextColor={colors.textSecondary}
                value={newAccount.username}
                onChangeText={(text) => setNewAccount(prev => ({ ...prev, username: text }))}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.formInput}
                placeholder="Görünen Ad"
                placeholderTextColor={colors.textSecondary}
                value={newAccount.display_name}
                onChangeText={(text) => setNewAccount(prev => ({ ...prev, display_name: text }))}
              />

              <TextInput
                style={styles.formInput}
                placeholder="Açıklama (isteğe bağlı)"
                placeholderTextColor={colors.textSecondary}
                value={newAccount.description}
                onChangeText={(text) => setNewAccount(prev => ({ ...prev, description: text }))}
                multiline
              />

              <TextInput
                style={styles.formInput}
                placeholder="Takipçi Sayısı"
                placeholderTextColor={colors.textSecondary}
                value={newAccount.followers_count.toString()}
                onChangeText={(text) => setNewAccount(prev => ({ ...prev, followers_count: parseInt(text) || 0 }))}
                keyboardType="numeric"
              />

              <View style={styles.formButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setShowAccountForm(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </Pressable>
                <GradientButton
                  title="Ekle"
                  onPress={handleCreateAccount}
                  size="medium"
                  style={styles.addButton}
                />
              </View>
            </View>
          </View>
        )}
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
  creditsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  creditsInfo: {
    flex: 1,
  },
  creditsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  creditsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  emptyAccounts: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  addAccountButton: {
    width: 150,
  },
  accountsList: {
    gap: 12,
  },
  accountCard: {
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
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },
  selectedText: {
    color: colors.primary,
  },
  addAccountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addAccountText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  durationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 100,
  },
  selectedDurationCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  durationCredits: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
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
  formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  formModal: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  platformSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  platformButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  selectedPlatform: {
    backgroundColor: colors.primary,
  },
  formInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  addButton: {
    flex: 1,
  },
  debugText: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 8,
    fontWeight: 'bold',
  },
});