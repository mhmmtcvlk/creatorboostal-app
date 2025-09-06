import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { VipCrown } from '../../components/VipCrown';
import { apiClient } from '../../services/api';

interface VipPackage {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  description: string;
}

export default function VipPackages() {
  const { user, refreshUser } = useAuth();
  const [packages, setPackages] = useState<VipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<VipPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const data = await apiClient.getVipPackages();
      setPackages(data);
    } catch (error) {
      console.error('Error loading VIP packages:', error);
      Alert.alert('Hata', 'VIP paketleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (vipPackage: VipPackage) => {
    setSelectedPackage(vipPackage);
    setShowPaymentModal(true);
  };

  const processPurchase = async (paymentMethod: 'bank_transfer' | 'crypto') => {
    if (!selectedPackage) return;

    setPurchasing(true);
    try {
      const response = await apiClient.purchaseVipPackage(selectedPackage.id, paymentMethod);
      
      setShowPaymentModal(false);
      
      if (paymentMethod === 'bank_transfer') {
        Alert.alert(
          '💳 Ödeme Bilgileri',
          `Paket: ${selectedPackage.name}\nTutar: ₺${selectedPackage.price}\n\n🏦 Banka Bilgileri:\nZiraat Bankası\nIBAN: TR123456789012345678901234\nAd: CreatorBoostal Ltd.\n\n📱 Telegram'dan ödeme dekontu gönderin:\n@CreatorBoostalBot`,
          [
            { text: 'Telegram Aç', onPress: () => openTelegram() },
            { text: 'Kopyala', onPress: () => copyPaymentInfo() },
            { text: 'Tamam' }
          ]
        );
      } else {
        Alert.alert(
          '₿ Crypto Ödeme',
          `Paket: ${selectedPackage.name}\nTutar: ₺${selectedPackage.price}\n\n💰 Bitcoin Adresi:\nbc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4\n\n📱 Telegram'dan işlem hash'i gönderin:\n@CreatorBoostalBot`,
          [
            { text: 'Telegram Aç', onPress: () => openTelegram() },
            { text: 'Adresi Kopyala', onPress: () => copyCryptoAddress() },
            { text: 'Tamam' }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Satın alma işlemi başlatılamadı');
    } finally {
      setPurchasing(false);
    }
  };

  const openTelegram = async () => {
    const telegramUrl = 'https://t.me/CreatorBoostalBot';
    const supported = await Linking.canOpenURL(telegramUrl);
    
    if (supported) {
      await Linking.openURL(telegramUrl);
    } else {
      Alert.alert('Hata', 'Telegram uygulaması bulunamadı');
    }
  };

  const copyPaymentInfo = () => {
    // In a real app, you would copy to clipboard
    Alert.alert('Kopyalandı!', 'Ödeme bilgileri panoya kopyalandı');
  };

  const copyCryptoAddress = () => {
    // In a real app, you would copy to clipboard
    Alert.alert('Kopyalandı!', 'Bitcoin adresi panoya kopyalandı');
  };

  const isCurrentPackage = (pkg: VipPackage) => {
    return user?.vip_package === pkg.name.toLowerCase();
  };

  const getPackageGradient = (pkg: VipPackage) => {
    if (pkg.name.toLowerCase().includes('starter')) {
      return ['#3498DB', '#2980B9'];
    } else if (pkg.name.toLowerCase().includes('pro')) {
      return ['#F39C12', '#E67E22'];
    } else if (pkg.name.toLowerCase().includes('premium')) {
      return ['#FFD700', '#FFA500'];
    }
    return colors.gradient.primary;
  };

  const getVipLevel = (pkg: VipPackage): 'starter' | 'pro' | 'premium' => {
    if (pkg.name.toLowerCase().includes('pro')) return 'pro';
    if (pkg.name.toLowerCase().includes('premium')) return 'premium';
    return 'starter';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>VIP Paketler</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <VipCrown size="large" vipLevel="premium" animated={true} />
          <Text style={styles.heroTitle}>VIP Ol, Öne Çık!</Text>
          <Text style={styles.heroSubtitle}>
            Özel ayrıcalıklarla sosyal medya oyununu bir üst seviyeye taşı
          </Text>
          
          {user?.vip_package && user.vip_package !== 'none' && (
            <View style={styles.currentVipBadge}>
              <MaterialIcons name="verified" size={16} color="white" />
              <Text style={styles.currentVipText}>
                Mevcut Paket: {user.vip_package.toUpperCase()}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* VIP Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 VIP Ayrıcalıkları</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <MaterialIcons name="flash-on" size={24} color={colors.warning} />
              <Text style={styles.benefitText}>Boost önceliği - Herkesten önce!</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="psychology" size={24} color={colors.primary} />
              <Text style={styles.benefitText}>AI yardımcısı - Akıllı öneriler</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="support-agent" size={24} color={colors.success} />
              <Text style={styles.benefitText}>7/24 özel destek</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="analytics" size={24} color={colors.accent} />
              <Text style={styles.benefitText}>Gelişmiş analitikler</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="verified" size={24} color={colors.error} />
              <Text style={styles.benefitText}>Özel VIP rozet</Text>
            </View>
          </View>
        </View>

        {/* Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💎 Paket Seçenekleri</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Paketler yükleniyor...</Text>
            </View>
          ) : (
            <View style={styles.packagesList}>
              {packages.filter(pkg => pkg.is_active).map((pkg) => (
                <View key={pkg.id} style={styles.packageCard}>
                  {pkg.is_popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>EN POPÜLER</Text>
                    </View>
                  )}
                  
                  <LinearGradient
                    colors={getPackageGradient(pkg)}
                    style={styles.packageHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <VipCrown size="medium" vipLevel={getVipLevel(pkg)} animated={true} />
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>₺{pkg.price}</Text>
                      <Text style={styles.duration}>/{pkg.duration_days} gün</Text>
                    </View>
                  </LinearGradient>

                  <View style={styles.packageBody}>
                    <Text style={styles.packageDescription}>{pkg.description}</Text>
                    
                    <View style={styles.featuresList}>
                      {pkg.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <MaterialIcons name="check-circle" size={16} color={colors.success} />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    {isCurrentPackage(pkg) ? (
                      <View style={styles.currentPackageButton}>
                        <MaterialIcons name="verified" size={20} color={colors.success} />
                        <Text style={styles.currentPackageText}>Aktif Paket</Text>
                      </View>
                    ) : (
                      <GradientButton
                        title={`${pkg.name} Satın Al`}
                        onPress={() => handlePurchase(pkg)}
                        gradient={getPackageGradient(pkg)}
                        size="medium"
                        style={styles.purchaseButton}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Ödeme Seçenekleri</Text>
          <View style={styles.paymentInfo}>
            <View style={styles.paymentMethod}>
              <MaterialIcons name="account-balance" size={24} color={colors.primary} />
              <View style={styles.paymentText}>
                <Text style={styles.paymentTitle}>Banka Havalesi</Text>
                <Text style={styles.paymentDescription}>Türk bankalarından güvenli transfer</Text>
              </View>
            </View>
            
            <View style={styles.paymentMethod}>
              <MaterialIcons name="currency-bitcoin" size={24} color={colors.warning} />
              <View style={styles.paymentText}>
                <Text style={styles.paymentTitle}>Kripto Para</Text>
                <Text style={styles.paymentDescription}>Bitcoin ile hızlı ödeme</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.securityNote}>
            <MaterialIcons name="security" size={20} color={colors.success} />
            <Text style={styles.securityText}>
              🔒 Tüm ödemeler güvenli ve şifrelidir. Telegram üzerinden onay alırsınız.
            </Text>
          </View>
        </View>

        {/* Payment Modal */}
        <Modal
          visible={showPaymentModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.paymentModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ödeme Yöntemi Seçin</Text>
                <Pressable onPress={() => setShowPaymentModal(false)}>
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              {selectedPackage && (
                <View style={styles.packageSummary}>
                  <Text style={styles.summaryTitle}>{selectedPackage.name}</Text>
                  <Text style={styles.summaryPrice}>₺{selectedPackage.price}</Text>
                  <Text style={styles.summaryDuration}>{selectedPackage.duration_days} gün</Text>
                </View>
              )}

              <View style={styles.paymentOptions}>
                <GradientButton
                  title="🏦 Banka Havalesi"
                  onPress={() => processPurchase('bank_transfer')}
                  disabled={purchasing}
                  size="large"
                  gradient={[colors.primary, colors.secondary]}
                  style={styles.paymentOptionButton}
                />
                
                <GradientButton
                  title="₿ Bitcoin"
                  onPress={() => processPurchase('crypto')}
                  disabled={purchasing}
                  size="large"
                  gradient={[colors.warning, colors.error]}
                  style={styles.paymentOptionButton}
                />
              </View>
            </View>
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
  heroTitle: {
    fontSize: 28,
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
    lineHeight: 22,
  },
  currentVipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  currentVipText: {
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
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  packagesList: {
    gap: 16,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  packageHeader: {
    alignItems: 'center',
    padding: 24,
  },
  packageName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  duration: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
  packageBody: {
    padding: 20,
  },
  packageDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  featuresList: {
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  currentPackageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '20',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  currentPackageText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  purchaseButton: {
    marginTop: 8,
  },
  paymentInfo: {
    gap: 12,
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  paymentText: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.success + '10',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  paymentModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  packageSummary: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  summaryPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  summaryDuration: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOptionButton: {
    marginBottom: 8,
  },
});