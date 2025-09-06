import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
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
import { FakeNotifications } from '../../components/FakeNotifications';
import { apiClient } from '../../services/api';

export default function HomeTab() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 12543,
    boostedAccounts: 8291,
    vipMembers: 1456,
    forumTopics: 987,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await apiClient.getMe();
      updateUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserData();
      // Simulate stats update
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 10),
        boostedAccounts: prev.boostedAccounts + Math.floor(Math.random() * 5),
      }));
    } finally {
      setRefreshing(false);
    }
  };

  const handleFollowCreator = async () => {
    if (user?.is_following_creator) {
      Alert.alert('Bilgi', 'Zaten takip ediyorsunuz!');
      return;
    }

    try {
      const result = await apiClient.followCreator();
      Alert.alert('Başarılı!', result.message);
      await loadUserData(); // Refresh user data
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  const quickActions = [
    {
      id: 'boost',
      title: 'Boost Oluştur',
      icon: 'trending-up',
      gradient: colors.gradient.primary,
      onPress: () => router.push('/boost/create'),
    },
    {
      id: 'vip',
      title: 'VIP Ol',
      icon: 'star',
      gradient: ['#FDCB6E', '#E17055'],
      onPress: () => router.push('/vip/packages'),
    },
    {
      id: 'social',
      title: 'Sosyal Hesap Ekle',
      icon: 'add-circle',
      gradient: ['#00B894', '#55EFC4'],
      onPress: () => router.push('/social/add'),
    },
    {
      id: 'notifications',
      title: 'Bildirimler',
      icon: 'notifications',
      gradient: ['#A29BFE', '#6C5CE7'],
      onPress: () => router.push('/notifications'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hoş geldin,</Text>
          <Text style={styles.usernameText}>{user?.username}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.creditsContainer}>
            <MaterialIcons name="stars" size={16} color={colors.warning} />
            <Text style={styles.creditsText}>{user?.credits || 0}</Text>
          </View>
          
          <Pressable 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications" size={24} color={colors.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* VIP Status Card */}
        {user?.vip_package ? (
          <LinearGradient
            colors={['#6C5CE7', '#A29BFE']}
            style={styles.vipCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="star" size={32} color="white" />
            <View style={styles.vipContent}>
              <Text style={styles.vipTitle}>VIP Üye</Text>
              <Text style={styles.vipSubtitle}>
                {user.vip_package.toUpperCase()} Paketi Aktif
              </Text>
            </View>
            <Pressable onPress={() => router.push('/vip/packages')}>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </Pressable>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#E17055', '#FDCB6E']}
            style={styles.upgradeCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="star-border" size={32} color="white" />
            <View style={styles.vipContent}>
              <Text style={styles.vipTitle}>VIP Ol</Text>
              <Text style={styles.vipSubtitle}>Özel özelliklerden yararlan</Text>
            </View>
            <GradientButton
              title="Keşfet"
              onPress={() => router.push('/vip/packages')}
              size="small"
              gradient={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            />
          </LinearGradient>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
                android_ripple={{ color: colors.primary + '20' }}
              >
                <LinearGradient
                  colors={action.gradient}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name={action.icon as any} size={24} color="white" />
                </LinearGradient>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Follow Creator Section */}
        {!user?.is_following_creator && (
          <View style={styles.section}>
            <LinearGradient
              colors={['#FD79A8', '#FDCB6E']}
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
                onPress={handleFollowCreator}
                size="small"
                gradient={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              />
            </LinearGradient>
          </View>
        )}

        {/* Recent Activity - Fake Notifications */}
        <FakeNotifications />

        {/* Platform Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform İstatistikleri</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalUsers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Aktif Kullanıcı</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.boostedAccounts.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Boost Edilen Hesap</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.vipMembers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>VIP Üye</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.forumTopics.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Forum Konusu</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  creditsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  vipCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  upgradeCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vipContent: {
    flex: 1,
  },
  vipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  vipSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});