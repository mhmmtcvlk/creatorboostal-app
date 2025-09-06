import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
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
import { VipPackage } from '../../types/vip';

const PACKAGE_GRADIENTS = {
  starter: ['#6C5CE7', '#A29BFE'],
  pro: ['#FDCB6E', '#E17055'],
  premium: ['#00B894', '#55EFC4'],
};

export default function VipPackages() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [packages, setPackages] = useState<VipPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const data = await apiClient.getVipPackages();
      setPackages(data);
    } catch (error) {
      console.error('Error loading VIP packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (pkg: VipPackage) => {
    Alert.alert(
      'VIP Paket Satın Al',
      `${pkg.name} paketini ${pkg.price}₺ karşılığında satın almak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Satın Al', 
          onPress: () => {
            Alert.alert('Bilgi', 'Ödeme sistemi yakında aktif olacak. Havale/EFT ile ödeme seçeneği gelecek.');
          }
        }
      ]
    );
  };

  const getPackageGradient = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes('starter')) return PACKAGE_GRADIENTS.starter;
    if (key.includes('pro')) return PACKAGE_GRADIENTS.pro;
    if (key.includes('premium')) return PACKAGE_GRADIENTS.premium;
    return colors.gradient.primary;
  };

  const getPackageIcon = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes('starter')) return 'star-border';
    if (key.includes('pro')) return 'star-half';
    if (key.includes('premium')) return 'star';
    return 'star';
  };

  const renderPackage = (pkg: VipPackage) => {
    const isCurrentPackage = user?.vip_package && pkg.name.toLowerCase().includes(user.vip_package);
    const name = language === 'tr' ? pkg.name : pkg.name_en;
    const features = language === 'tr' ? pkg.features : pkg.features_en;

    return (
      <View key={pkg.id} style={styles.packageCard}>
        <LinearGradient
          colors={getPackageGradient(pkg.name)}
          style={styles.packageGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isCurrentPackage && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Mevcut</Text>
            </View>
          )}

          <View style={styles.packageHeader}>
            <MaterialIcons 
              name={getPackageIcon(pkg.name) as any} 
              size={48} 
              color="white" 
            />
            <Text style={styles.packageName}>{name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₺{pkg.price}</Text>
              <Text style={styles.duration}>/{pkg.duration_days} gün</Text>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <MaterialIcons name="check" size={16} color="white" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <GradientButton
            title={isCurrentPackage ? 'Aktif Paket' : 'Satın Al'}
            onPress={() => !isCurrentPackage && handlePurchase(pkg)}
            disabled={isCurrentPackage}
            gradient={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.purchaseButton}
          />
        </LinearGradient>
      </View>
    );
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
          colors={colors.gradient.primary}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="star" size={64} color="white" />
          <Text style={styles.heroTitle}>VIP Ol, Farkı Yaşa!</Text>
          <Text style={styles.heroSubtitle}>
            Özel özelliklerden yararlan ve sosyal medya hesaplarını daha hızlı büyüt
          </Text>
        </LinearGradient>

        {/* Current Status */}
        {user?.vip_package && (
          <View style={styles.currentStatusCard}>
            <View style={styles.statusHeader}>
              <MaterialIcons name="star" size={24} color={colors.warning} />
              <Text style={styles.statusTitle}>Mevcut VIP Durumunuz</Text>
            </View>
            <Text style={styles.statusPackage}>
              {user.vip_package.toUpperCase()} Paket
            </Text>
            <Text style={styles.statusExpiry}>
              {user.vip_expires_at 
                ? `${new Date(user.vip_expires_at).toLocaleDateString('tr-TR')} tarihine kadar geçerli`
                : 'Süresiz'
              }
            </Text>
          </View>
        )}

        {/* Packages */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>Paketleri Karşılaştır</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Paketler yükleniyor...</Text>
            </View>
          ) : (
            <View style={styles.packagesList}>
              {packages.map(renderPackage)}
            </View>
          )}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>VIP Avantajları</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <LinearGradient
                colors={colors.gradient.primary}
                style={styles.benefitIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="psychology" size={20} color="white" />
              </LinearGradient>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>AI Destekli İçerik</Text>
                <Text style={styles.benefitDescription}>
                  Yapay zeka ile kişiselleştirilmiş içerik önerileri
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <LinearGradient
                colors={['#FDCB6E', '#E17055']}
                style={styles.benefitIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="trending-up" size={20} color="white" />
              </LinearGradient>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Boost Önceliği</Text>
                <Text style={styles.benefitDescription}>
                  Hesapların keşfet sayfasında öne çıkar
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <LinearGradient
                colors={['#00B894', '#55EFC4']}
                style={styles.benefitIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="analytics" size={20} color="white" />
              </LinearGradient>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Gelişmiş Analitikler</Text>
                <Text style={styles.benefitDescription}>
                  Detaylı performans raporları ve öngörüler
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <LinearGradient
                colors={['#A29BFE', '#6C5CE7']}
                style={styles.benefitIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="support-agent" size={20} color="white" />
              </LinearGradient>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Öncelikli Destek</Text>
                <Text style={styles.benefitDescription}>
                  7/24 öncelikli müşteri desteği
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Sık Sorulan Sorular</Text>
          <View style={styles.faqList}>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>VIP üyelik nasıl iptal edilir?</Text>
              <Text style={styles.faqAnswer}>
                VIP üyeliğinizi istediğiniz zaman profil ayarlarından iptal edebilirsiniz.
              </Text>
            </View>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Ödeme yöntemleri nelerdir?</Text>
              <Text style={styles.faqAnswer}>
                Kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz.
              </Text>
            </View>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>VIP özellikler hemen aktif olur mu?</Text>
              <Text style={styles.faqAnswer}>
                Ödemeniz onaylandıktan sonra VIP özellikler anında aktif olur.
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  currentStatusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  statusPackage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statusExpiry: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  packagesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
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
    borderRadius: 20,
    overflow: 'hidden',
  },
  packageGradient: {
    padding: 24,
    position: 'relative',
  },
  currentBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 24,
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
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  purchaseButton: {
    marginTop: 8,
  },
  benefitsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  faqSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  faqList: {
    gap: 16,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});