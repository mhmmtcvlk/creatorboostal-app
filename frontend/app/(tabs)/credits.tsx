import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';

interface CreditActivity {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  timestamp: string;
}

interface AdReward {
  credits: number;
  description: string;
  available: boolean;
  cooldown?: number;
}

const AD_REWARDS: AdReward[] = [
  { credits: 5, description: 'Video reklam izle', available: true },
  { credits: 3, description: 'Banner reklam görüntüle', available: true },
  { credits: 10, description: 'Özel teklif reklamı', available: true },
];

export default function CreditsTab() {
  const { user, refreshUser } = useAuth();
  const [activities, setActivities] = useState<CreditActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdReward | null>(null);
  const [adAnimation] = useState(new Animated.Value(0));
  const [dailyAdsWatched, setDailyAdsWatched] = useState(0);
  const [followCreatorUsed, setFollowCreatorUsed] = useState(false);

  useEffect(() => {
    loadActivities();
    checkDailyLimits();
  }, []);

  const loadActivities = async () => {
    // Mock activities for demo
    const mockActivities: CreditActivity[] = [
      { id: '1', type: 'earned', amount: 5, description: 'Video reklam izlendi', timestamp: new Date().toISOString() },
      { id: '2', type: 'spent', amount: 50, description: 'Hesap boost edildi', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: '3', type: 'earned', amount: 10, description: '@mhmmtcvlk takip edildi', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: '4', type: 'earned', amount: 3, description: 'Banner reklam görüntülendi', timestamp: new Date(Date.now() - 10800000).toISOString() },
    ];
    setActivities(mockActivities);
  };

  const checkDailyLimits = () => {
    // In a real app, this would check actual usage from server
    const today = new Date().toDateString();
    const storedDate = localStorage?.getItem('creditsDate');
    const storedAds = localStorage?.getItem('dailyAds');
    const storedFollow = localStorage?.getItem('followCreatorUsed');
    
    if (storedDate !== today) {
      setDailyAdsWatched(0);
      setFollowCreatorUsed(false);
      localStorage?.setItem('creditsDate', today);
      localStorage?.setItem('dailyAds', '0');
      localStorage?.setItem('followCreatorUsed', 'false');
    } else {
      setDailyAdsWatched(parseInt(storedAds || '0'));
      setFollowCreatorUsed(storedFollow === 'true');
    }
  };

  const watchAd = async (adReward: AdReward) => {
    if (dailyAdsWatched >= 5) {
      Alert.alert('Günlük Limit', 'Günde maksimum 5 reklam izleyerek kredi kazanabilirsiniz');
      return;
    }

    setSelectedAd(adReward);
    setShowAdModal(true);
    
    // Simulate ad loading and playing
    Animated.sequence([
      Animated.timing(adAnimation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
    ]).start();

    // Simulate ad completion after 3 seconds
    setTimeout(async () => {
      try {
        await apiClient.watchAd();
        
        const newAdsCount = dailyAdsWatched + 1;
        setDailyAdsWatched(newAdsCount);
        localStorage?.setItem('dailyAds', newAdsCount.toString());
        
        await refreshUser();
        setShowAdModal(false);
        
        Alert.alert(
          '🎉 Kredi Kazandın!',
          `${adReward.credits} kredi hesabına eklendi!\n\nKalan günlük reklam hakkın: ${5 - newAdsCount}`,
          [{ text: 'Harika!' }]
        );
        
        // Add to activities
        const newActivity: CreditActivity = {
          id: Date.now().toString(),
          type: 'earned',
          amount: adReward.credits,
          description: adReward.description,
          timestamp: new Date().toISOString(),
        };
        setActivities(prev => [newActivity, ...prev]);
        
      } catch (error) {
        Alert.alert('Hata', 'Kredi eklenemedi. Lütfen tekrar deneyin.');
      }
      
      adAnimation.setValue(0);
    }, 3000);
  };

  const followCreator = async () => {
    if (followCreatorUsed) {
      Alert.alert('Zaten Kullanıldı', 'Bu günlük ödülü zaten aldınız');
      return;
    }

    Alert.alert(
      '👨‍💼 Yaratıcıyı Takip Et',
      '@mhmmtcvlk hesabını Instagram\'da takip ederek 10 kredi kazan!\n\nTakip ettikten sonra "Tamamladım" butonuna bas.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Instagram Aç', onPress: () => openInstagram() },
        { text: 'Tamamladım', onPress: () => confirmFollow() }
      ]
    );
  };

  const openInstagram = () => {
    // In a real app, this would open Instagram
    Alert.alert('Instagram', 'Instagram uygulaması açılıyor...\n\n@mhmmtcvlk hesabını takip etmeyi unutmayın!');
  };

  const confirmFollow = async () => {
    try {
      await apiClient.followCreator();
      
      setFollowCreatorUsed(true);
      localStorage?.setItem('followCreatorUsed', 'true');
      
      await refreshUser();
      
      Alert.alert(
        '🎉 Tebrikler!',
        '10 kredi kazandın! @mhmmtcvlk\'i takip ettiğin için teşekkürler!',
        [{ text: 'Harika!' }]
      );
      
      // Add to activities
      const newActivity: CreditActivity = {
        id: Date.now().toString(),
        type: 'earned',
        amount: 10,
        description: '@mhmmtcvlk takip edildi',
        timestamp: new Date().toISOString(),
      };
      setActivities(prev => [newActivity, ...prev]);
      
    } catch (error) {
      Alert.alert('Hata', 'Kredi eklenemedi. Lütfen tekrar deneyin.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRemainingAds = () => Math.max(0, 5 - dailyAdsWatched);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Krediler</Text>
        <Pressable style={styles.infoButton}>
          <MaterialIcons name="info" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Credits Balance */}
        <LinearGradient
          colors={colors.gradient.primary}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceContent}>
            <MaterialIcons name="account-balance-wallet" size={48} color="white" />
            <Text style={styles.balanceTitle}>Mevcut Bakiye</Text>
            <Text style={styles.balanceAmount}>{user?.credits || 0} KREDİ</Text>
            <Text style={styles.balanceSubtitle}>
              Boost işlemleri ve premium özellikler için kullan
            </Text>
          </View>
        </LinearGradient>

        {/* Earn Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Kredi Kazan</Text>
          
          {/* Daily Ads */}
          <View style={styles.earnCard}>
            <View style={styles.earnHeader}>
              <View style={styles.earnIcon}>
                <MaterialIcons name="play-circle" size={24} color={colors.error} />
              </View>
              <View style={styles.earnContent}>
                <Text style={styles.earnTitle}>Reklam İzle</Text>
                <Text style={styles.earnDescription}>
                  Günde 5 reklam izleyerek toplam 25 kredi kazan
                </Text>
                <Text style={styles.earnStatus}>
                  Kalan hak: {getRemainingAds()}/5
                </Text>
              </View>
            </View>
            
            <View style={styles.adButtons}>
              {AD_REWARDS.map((adReward, index) => (
                <GradientButton
                  key={index}
                  title={`${adReward.credits} Kredi`}
                  onPress={() => watchAd(adReward)}
                  disabled={getRemainingAds() <= 0}
                  size="small"
                  gradient={getRemainingAds() > 0 ? [colors.error, colors.warning] : [colors.textSecondary, colors.border]}
                  style={styles.adButton}
                />
              ))}
            </View>
          </View>

          {/* Follow Creator */}
          <View style={styles.earnCard}>
            <View style={styles.earnHeader}>
              <View style={[styles.earnIcon, { backgroundColor: colors.accent + '20' }]}>
                <MaterialIcons name="person-add" size={24} color={colors.accent} />
              </View>
              <View style={styles.earnContent}>
                <Text style={styles.earnTitle}>Yaratıcıyı Takip Et</Text>
                <Text style={styles.earnDescription}>
                  @mhmmtcvlk Instagram hesabını takip et ve 10 kredi kazan
                </Text>
                <Text style={[
                  styles.earnStatus,
                  { color: followCreatorUsed ? colors.success : colors.primary }
                ]}>
                  {followCreatorUsed ? 'Tamamlandı ✓' : 'Günlük 1 defa'}
                </Text>
              </View>
            </View>
            
            <GradientButton
              title={followCreatorUsed ? 'Tamamlandı' : 'Takip Et (+10)'}
              onPress={followCreator}
              disabled={followCreatorUsed}
              size="medium"
              gradient={followCreatorUsed ? [colors.success, '#55EFC4'] : [colors.accent, colors.primary]}
              style={styles.followButton}
            />
          </View>

          {/* VIP Bonus */}
          {user?.vip_package && user.vip_package !== 'none' && (
            <View style={styles.vipBonusCard}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.vipBonusGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="star" size={24} color="white" />
                <Text style={styles.vipBonusText}>VIP Bonus: +50% kredi kazancı!</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Credit Store */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Kredi Mağazası</Text>
          <Text style={styles.sectionDescription}>
            Kredi satın almak için VIP paketlerimizi inceleyin
          </Text>
          
          <GradientButton
            title="VIP Paketleri Görüntüle"
            onPress={() => Alert.alert('Bilgi', 'VIP sayfası yakında aktif olacak')}
            size="large"
            gradient={['#FFD700', '#FFA500']}
            style={styles.vipButton}
          />
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Son İşlemler</Text>
          {activities.length > 0 ? (
            <View style={styles.activitiesList}>
              {activities.slice(0, 10).map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={[
                    styles.activityIcon,
                    { backgroundColor: activity.type === 'earned' ? colors.success + '20' : colors.error + '20' }
                  ]}>
                    <MaterialIcons 
                      name={activity.type === 'earned' ? 'add' : 'remove'} 
                      size={16} 
                      color={activity.type === 'earned' ? colors.success : colors.error} 
                    />
                  </View>
                  
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
                  </View>
                  
                  <Text style={[
                    styles.activityAmount,
                    { color: activity.type === 'earned' ? colors.success : colors.error }
                  ]}>
                    {activity.type === 'earned' ? '+' : '-'}{activity.amount}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Henüz işlem yok</Text>
              <Text style={styles.emptyDescription}>
                Kredi kazanmaya başlayın ve geçmişiniz burada görünsün
              </Text>
            </View>
          )}
        </View>

        {/* Ad Modal */}
        <Modal
          visible={showAdModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAdModal(false)}
        >
          <View style={styles.adModalOverlay}>
            <View style={styles.adModal}>
              <LinearGradient
                colors={[colors.error, colors.warning]}
                style={styles.adContent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Animated.View style={[
                  styles.adAnimationContainer,
                  {
                    transform: [{
                      rotate: adAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }
                ]}>
                  <MaterialIcons name="play-circle" size={64} color="white" />
                </Animated.View>
                
                <Text style={styles.adTitle}>Reklam Yükleniyor...</Text>
                <Text style={styles.adSubtitle}>
                  {selectedAd?.credits} kredi kazanmak için lütfen bekleyin
                </Text>
                
                <View style={styles.adProgress}>
                  <Animated.View style={[
                    styles.adProgressFill,
                    {
                      width: adAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    }
                  ]} />
                </View>
              </LinearGradient>
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
  infoButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 12,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  earnCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  earnHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  earnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '20',
    marginRight: 12,
  },
  earnContent: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  earnDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  earnStatus: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  adButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  adButton: {
    flex: 1,
  },
  followButton: {
    marginTop: 8,
  },
  vipBonusCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  vipBonusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  vipBonusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  vipButton: {
    marginTop: 8,
  },
  activitiesList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
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
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  adModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adModal: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    width: '80%',
  },
  adContent: {
    padding: 32,
    alignItems: 'center',
  },
  adAnimationContainer: {
    marginBottom: 16,
  },
  adTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  adSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  adProgress: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  adProgressFill: {
    height: '100%',
    backgroundColor: 'white',
  },
});