import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';

interface CreditActivity {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  timestamp: Date;
}

export default function CreditsTab() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [dailyAdsWatched, setDailyAdsWatched] = useState(0);
  const [activities] = useState<CreditActivity[]>([
    {
      id: '1',
      type: 'earned',
      amount: 10,
      description: 'Hoş geldin bonusu',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      type: 'earned',
      amount: 5,
      description: 'Reklam izleme',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      id: '3',
      type: 'spent',
      amount: -24,
      description: 'Instagram hesabı boost (24 saat)',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  ]);

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
    await loadUserData();
    setRefreshing(false);
  };

  const handleWatchAd = async () => {
    if (dailyAdsWatched >= 5) {
      Alert.alert('Limit Doldu', 'Günde maksimum 5 reklam izleyebilirsiniz. Yarın tekrar deneyin.');
      return;
    }

    try {
      // Simulate ad watching
      setTimeout(async () => {
        try {
          const result = await apiClient.watchAd();
          setDailyAdsWatched(prev => prev + 1);
          Alert.alert('Tebrikler!', `5 kredi kazandınız! Toplam krediniz: ${result.total_credits}`);
          await loadUserData();
        } catch (error: any) {
          Alert.alert('Hata', error.response?.data?.detail || 'Bir hata oluştu');
        }
      }, 2000); // Simulate 2 second ad

      Alert.alert('Reklam Oynatılıyor', 'Lütfen bekleyin...');
    } catch (error) {
      Alert.alert('Hata', 'Reklam yüklenemedi');
    }
  };

  const handleFollowCreator = async () => {
    if (user?.is_following_creator) {
      Alert.alert('Bilgi', 'Zaten takip ediyorsunuz!');
      return;
    }

    try {
      const result = await apiClient.followCreator();
      Alert.alert('Tebrikler!', result.message);
      await loadUserData();
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 1000 / 60 / 60);
    
    if (hours < 1) return 'Az önce';
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
  };

  const earnMethods = [
    {
      id: 'ad',
      title: 'Reklam İzle',
      subtitle: `Günlük ${5 - dailyAdsWatched}/5 kalan`,
      icon: 'play-circle',
      reward: '+5 Kredi',
      gradient: colors.gradient.primary,
      disabled: dailyAdsWatched >= 5,
      onPress: handleWatchAd,
    },
    {
      id: 'follow',
      title: 'Creator\'ı Takip Et',
      subtitle: user?.is_following_creator ? 'Tamamlandı' : '@mhmmtcvlk',
      icon: 'favorite',
      reward: '+10 Kredi',
      gradient: ['#E17055', '#FDCB6E'],
      disabled: user?.is_following_creator,
      onPress: handleFollowCreator,
    },
    {
      id: 'invite',
      title: 'Arkadaş Davet Et',
      subtitle: 'Referans kodunu paylaş',
      icon: 'person-add',
      reward: '+25 Kredi',
      gradient: ['#00B894', '#55EFC4'],
      disabled: false,
      onPress: () => Alert.alert('Bilgi', 'Referans sistemi yakında aktif olacak'),
    },
    {
      id: 'daily',
      title: 'Günlük Giriş',
      subtitle: 'Her gün giriş yap',
      icon: 'calendar-today',
      reward: '+3 Kredi',
      gradient: ['#A29BFE', '#6C5CE7'],
      disabled: false,
      onPress: () => Alert.alert('Bilgi', 'Günlük giriş bonusu yakında aktif olacak'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Krediler</Text>
        <View style={styles.creditsBadge}>
          <MaterialIcons name="stars" size={20} color={colors.warning} />
          <Text style={styles.creditsText}>{user?.credits || 0}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Credits Balance Card */}
        <LinearGradient
          colors={colors.gradient.primary}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Toplam Kredin</Text>
            <Text style={styles.balanceAmount}>{user?.credits || 0}</Text>
            <Text style={styles.balanceSubtext}>1 Kredi = 1 Saatlik Boost</Text>
          </View>
          <MaterialIcons name="account-balance-wallet" size={64} color="rgba(255,255,255,0.3)" />
        </LinearGradient>

        {/* Earn Credits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kredi Kazan</Text>
          <View style={styles.earnMethodsList}>
            {earnMethods.map((method) => (
              <Pressable
                key={method.id}
                style={[styles.earnCard, method.disabled && styles.disabledCard]}
                onPress={method.onPress}
                disabled={method.disabled}
                android_ripple={{ color: colors.primary + '20' }}
              >
                <LinearGradient
                  colors={method.disabled ? ['#555', '#555'] : method.gradient}
                  style={styles.earnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons 
                    name={method.icon as any} 
                    size={32} 
                    color={method.disabled ? '#999' : 'white'} 
                  />
                </LinearGradient>
                
                <View style={styles.earnInfo}>
                  <Text style={[styles.earnTitle, method.disabled && styles.disabledText]}>
                    {method.title}
                  </Text>
                  <Text style={[styles.earnSubtitle, method.disabled && styles.disabledText]}>
                    {method.subtitle}
                  </Text>
                </View>
                
                <View style={styles.earnReward}>
                  <Text style={[styles.rewardText, method.disabled && styles.disabledText]}>
                    {method.reward}
                  </Text>
                  {!method.disabled && (
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* VIP Benefits */}
        <View style={styles.section}>
          <LinearGradient
            colors={['#6C5CE7', '#A29BFE']}
            style={styles.vipCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="star" size={40} color="white" />
            <View style={styles.vipContent}>
              <Text style={styles.vipTitle}>VIP Ol, Daha Fazla Kazan!</Text>
              <Text style={styles.vipSubtitle}>
                • Günlük bonus krediler{'\n'}
                • Boost'ta öncelik{'\n'}  
                • Özel ödüller
              </Text>
            </View>
            <GradientButton
              title="Keşfet"
              onPress={() => Alert.alert('Bilgi', 'VIP sayfası yakında aktif olacak')}
              size="small"
              gradient={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            />
          </LinearGradient>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
          <View style={styles.activitiesList}>
            {activities.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={[
                  styles.activityIcon,
                  { backgroundColor: activity.type === 'earned' ? colors.success + '20' : colors.error + '20' }
                ]}>
                  <MaterialIcons 
                    name={activity.type === 'earned' ? 'add' : 'remove'} 
                    size={20} 
                    color={activity.type === 'earned' ? colors.success : colors.error} 
                  />
                </View>
                
                <View style={styles.activityInfo}>
                  <Text style={styles.activityDescription}>
                    {activity.description}
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatTime(activity.timestamp)}
                  </Text>
                </View>
                
                <Text style={[
                  styles.activityAmount,
                  { color: activity.type === 'earned' ? colors.success : colors.error }
                ]}>
                  {activity.amount > 0 ? '+' : ''}{activity.amount}
                </Text>
              </View>
            ))}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
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
  earnMethodsList: {
    gap: 12,
  },
  earnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledCard: {
    opacity: 0.6,
  },
  earnGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  earnSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  earnReward: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    alignContent: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  vipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  vipContent: {
    flex: 1,
  },
  vipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  vipSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});