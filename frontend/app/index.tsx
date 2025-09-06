import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';
import { GradientButton } from '../components/GradientButton';
import { FakeNotifications } from '../components/FakeNotifications';
import { RotatingSocialIcons } from '../components/RotatingSocialIcons';

const { width } = Dimensions.get('window');

const FEATURE_CARDS = [
  {
    id: 'boost',
    titleKey: 'home.boostYourAccount',
    icon: 'trending-up',
    gradient: colors.gradient.primary,
    route: '/boost/create',
  },
  {
    id: 'discover',
    titleKey: 'home.discoverAccounts',
    icon: 'search',
    gradient: colors.gradient.secondary,
    route: '/(tabs)/discover',
  },
  {
    id: 'forum',
    titleKey: 'home.joinForum',
    icon: 'forum',
    gradient: ['#00B894', '#55EFC4'],
    route: '/(tabs)/forum',
  },
  {
    id: 'vip',
    titleKey: 'home.becomeVip',
    icon: 'star',
    gradient: ['#FDCB6E', '#E17055'],
    route: '/vip/packages',
  },
];

export default function Index() {
  const { isAuthenticated, user, loading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [loading, isAuthenticated]);

  const handleLanguageToggle = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  };

  const handleFeaturePress = (route: string) => {
    if (isAuthenticated) {
      router.push(route as any);
    } else {
      router.push('/auth/login');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={colors.gradient.primary}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="trending-up" size={24} color="white" />
          </LinearGradient>
          <Text style={styles.logoText}>CreatorBoostal</Text>
        </View>
        
        <View style={styles.headerActions}>
          <Pressable
            style={styles.languageButton}
            onPress={handleLanguageToggle}
          >
            <Text style={styles.languageText}>
              {language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
            </Text>
          </Pressable>
          
          {!isAuthenticated && (
            <Pressable
              style={styles.loginButton}
              onPress={() => router.push('/auth/login')}
            >
              <Ionicons name="log-in-outline" size={20} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#6C5CE7', '#A29BFE', '#FD79A8']}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            {/* Rotating Social Icons */}
            <View style={styles.rotatingIconsContainer}>
              <RotatingSocialIcons />
            </View>
            
            <Text style={styles.heroTitle}>{t('home.welcome')}</Text>
            <Text style={styles.heroSubtitle}>{t('home.subtitle')}</Text>
            
            {!isAuthenticated ? (
              <View style={styles.heroActions}>
                <GradientButton
                  title={t('auth.register')}
                  onPress={() => router.push('/auth/register')}
                  size="large"
                  style={styles.heroButton}
                />
                <GradientButton
                  title={t('auth.login')}
                  onPress={() => router.push('/auth/login')}
                  size="large"
                  variant="secondary"
                  style={styles.heroButton}
                />
              </View>
            ) : (
              <View style={styles.welcomeBack}>
                <Text style={styles.welcomeText}>
                  Hoş geldin, {user?.username}!
                </Text>
                <Text style={styles.creditsText}>
                  💰 {user?.credits} kredi
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Özellikler</Text>
          <View style={styles.featuresGrid}>
            {FEATURE_CARDS.map((feature) => (
              <Pressable
                key={feature.id}
                style={styles.featureCard}
                onPress={() => handleFeaturePress(feature.route)}
                android_ripple={{ color: colors.primary + '20' }}
              >
                <LinearGradient
                  colors={feature.gradient}
                  style={styles.featureGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons 
                    name={feature.icon as any} 
                    size={32} 
                    color="white" 
                  />
                </LinearGradient>
                <Text style={styles.featureTitle}>
                  {t(feature.titleKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Fake Notifications */}
        <FakeNotifications />

        {/* Follow Creator Section */}
        <View style={styles.followSection}>
          <LinearGradient
            colors={['#E17055', '#FDCB6E']}
            style={styles.followCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="heart" size={40} color="white" />
            <View style={styles.followContent}>
              <Text style={styles.followTitle}>Destekçiyi Takip Et!</Text>
              <Text style={styles.followSubtitle}>
                @mhmmtcvlk'ı takip et ve 10 kredi kazan
              </Text>
            </View>
            <GradientButton
              title="Takip Et"
              onPress={() => {
                if (isAuthenticated) {
                  // Handle follow creator
                } else {
                  router.push('/auth/login');
                }
              }}
              size="small"
              gradient={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            />
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Platform İstatistikleri</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12,543</Text>
              <Text style={styles.statLabel}>Aktif Kullanıcı</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>8,291</Text>
              <Text style={styles.statLabel}>Boost Edilen Hesap</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>1,456</Text>
              <Text style={styles.statLabel}>VIP Üye</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>987</Text>
              <Text style={styles.statLabel}>Forum Konusu</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 CreatorBoosta. Tüm hakları saklıdır.
          </Text>
          <View style={styles.socialLinks}>
            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-instagram" size={24} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-twitter" size={24} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-tiktok" size={24} color={colors.primary} />
            </Pressable>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  languageText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  loginButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    padding: 24,
    margin: 16,
    borderRadius: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  rotatingIconsContainer: {
    marginBottom: 20,
  },
  rotatingIconsContainer: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  heroActions: {
    gap: 12,
    width: '100%',
  },
  heroButton: {
    width: '100%',
  },
  welcomeBack: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
  },
  creditsText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  featuresSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (width - 48) / 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  followSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  followCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  followContent: {
    flex: 1,
  },
  followTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  followSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    padding: 8,
  },
});