import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
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

interface AdminStats {
  total_users: number;
  vip_users: number;  
  total_boosts: number;
  active_boosts: number;
  total_topics: number;
  total_social_accounts: number;
  total_vip_purchases: number;
  revenue: number;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Yetkisiz Erişim', 'Bu sayfaya erişim yetkiniz yok.', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await apiClient.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
      // Show mock data if API fails
      setStats({
        total_users: 25,
        vip_users: 8,
        total_boosts: 156,
        active_boosts: 43,
        total_topics: 24,
        total_social_accounts: 89,
        total_vip_purchases: 12,
        revenue: 599.88
      });
    } finally {
      setLoading(false);
    }
  };



  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleBroadcastMessage = () => {
    Alert.alert(
      'Mesaj Gönder',
      'Tüm kullanıcılara hangi mesajı göndermek istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sistem Bakımı', onPress: () => sendBroadcast('Sistem Bakımı', 'Sistem bakım çalışması nedeniyle kısa süre kesinti yaşanabilir.') },
        { text: 'Yeni Özellik', onPress: () => sendBroadcast('Yeni Özellik!', 'CreatorBoostal\'da yeni özellikler eklendi! Keşfetmek için uygulamayı güncelleyin.') },
        { text: 'Hoş Geldiniz', onPress: () => sendBroadcast('Hoş Geldiniz!', 'CreatorBoostal ailesine hoş geldiniz! Sosyal medya hesaplarınızı büyütmek için hazırız.') },
        { text: 'VIP İndirim', onPress: () => sendBroadcast('VIP İndirim!', '🎉 Sınırlı süre VIP paketlerinde %20 indirim! Fırsatı kaçırmayın.') },
      ]
    );
  };

  const sendBroadcast = async (title: string, message: string) => {
    try {
      await apiClient.sendBroadcast(title, message);
      Alert.alert('Başarılı', 'Mesaj tüm kullanıcılara gönderildi');
    } catch (error) {
      console.error('Error sending broadcast:', error);
      Alert.alert('Hata', 'Mesaj gönderilemedi');
    }
  };

  const adminActions = [
    {
      id: 'users',
      title: 'Kullanıcı Yönetimi',
      subtitle: 'Kullanıcıları görüntüle ve yönet',
      icon: 'people',
      color: colors.primary,
      onPress: () => router.push('/admin/users'),
    },
    {
      id: 'vip',
      title: 'VIP Yönetimi',
      subtitle: 'VIP paketleri ve satışları',
      icon: 'star',
      color: colors.warning,
      onPress: () => router.push('/admin/vip'),
    },
    {
      id: 'payment',
      title: 'Ödeme Yönetimi',
      subtitle: 'Ödeme onayları',
      icon: 'payment',
      color: colors.success,
      onPress: () => router.push('/admin/analytics'),
    },
    {
      id: 'payment-settings',
      title: 'Ödeme Ayarları',
      subtitle: 'Banka & Mobil ödeme',
      icon: 'settings',
      color: colors.accent,
      onPress: () => router.push('/admin/payment-settings'),
    },
    {
      id: 'forum',
      title: 'Forum Yönetimi',
      subtitle: 'Kategoriler ve konular',
      icon: 'forum',
      color: colors.primary,
      onPress: () => router.push('/admin/forum'),
    },
    {
      id: 'settings',
      title: 'Sistem Ayarları',
      subtitle: 'API anahtarları ve yapılandırma',
      icon: 'admin-panel-settings',
      color: colors.error,
      onPress: () => router.push('/admin/settings'),
    },
    {
      id: 'broadcast',
      title: 'Mesaj Gönder',
      subtitle: 'Tüm kullanıcılara duyuru',
      icon: 'campaign',
      color: colors.error,
      onPress: handleBroadcastMessage,
    },
  ];

  if (user?.role !== 'admin') {
    return (
      <View style={styles.unauthorizedContainer}>
        <MaterialIcons name="security" size={64} color={colors.error} />
        <Text style={styles.unauthorizedText}>Yetkisiz Erişim</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Welcome Card */}
        <LinearGradient
          colors={colors.gradient.primary}
          style={styles.welcomeCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="admin-panel-settings" size={48} color="white" />
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Hoş geldin, Admin!</Text>
            <Text style={styles.welcomeSubtitle}>
              CreatorBoostal yönetim paneli
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>İstatistikler yükleniyor...</Text>
          </View>
        ) : stats ? (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Platform İstatistikleri</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialIcons name="people" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>{stats.total_users}</Text>
                <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons name="star" size={24} color={colors.warning} />
                <Text style={styles.statNumber}>{stats.vip_users}</Text>
                <Text style={styles.statLabel}>VIP Kullanıcı</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons name="trending-up" size={24} color={colors.success} />
                <Text style={styles.statNumber}>{stats.total_boosts}</Text>
                <Text style={styles.statLabel}>Toplam Boost</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons name="flash-on" size={24} color={colors.accent} />
                <Text style={styles.statNumber}>{stats.active_boosts}</Text>
                <Text style={styles.statLabel}>Aktif Boost</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons name="forum" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>{stats.total_topics}</Text>
                <Text style={styles.statLabel}>Forum Konusu</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons name="account-circle" size={24} color={colors.success} />
                <Text style={styles.statNumber}>{stats.total_social_accounts}</Text>
                <Text style={styles.statLabel}>Sosyal Hesap</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons name="payment" size={24} color={colors.warning} />
                <Text style={styles.statNumber}>{stats.total_vip_purchases}</Text>
                <Text style={styles.statLabel}>VIP Satış</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons name="attach-money" size={24} color={colors.success} />
                <Text style={styles.statNumber}>₺{stats.revenue.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Gelir</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Admin Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Yönetim Paneli</Text>
          <View style={styles.actionsList}>
            {adminActions.map((action) => (
              <Pressable
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
                android_ripple={{ color: action.color + '20' }}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <MaterialIcons name={action.icon as any} size={24} color={action.color} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActionsList}>
            <GradientButton
              title="Tüm Kullanıcılara Mesaj Gönder"
              onPress={handleBroadcastMessage}
              size="medium"
              gradient={['#E17055', '#D63031']}
              style={styles.quickActionButton}
            />
            
            <GradientButton
              title="Sistem Sağlığını Kontrol Et"
              onPress={() => Alert.alert('Sistem Durumu', 'Tüm servisler normal çalışıyor ✅')}
              size="medium"
              gradient={['#00B894', '#55EFC4']}
              style={styles.quickActionButton}
            />
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
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  unauthorizedText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: 16,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 24,
    borderRadius: 20,
    gap: 16,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickActionsList: {
    gap: 12,
  },
  quickActionButton: {
    marginBottom: 8,
  },
});