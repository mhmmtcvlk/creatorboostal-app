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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';
import { GradientButton } from '../components/GradientButton';
import { apiClient } from '../services/api';
import { Notification } from '../types/notification';

const NOTIFICATION_ICONS = {
  vip_approved: 'star',
  boost_activated: 'trending-up',
  boost_expiring: 'schedule',
  new_message: 'message',
  forum_reply: 'forum',
  credits_earned: 'stars',
};

const NOTIFICATION_COLORS = {
  vip_approved: colors.warning,
  boost_activated: colors.primary,
  boost_expiring: colors.error,
  new_message: colors.accent,
  forum_reply: colors.success,
  credits_earned: colors.warning,
};

export default function Notifications() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await apiClient.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Mock data for demo
      const mockNotifications: Notification[] = [
        {
          id: '1',
          user_id: user?.id || '',
          type: 'credits_earned',
          title: 'Kredi Kazandınız!',
          title_en: 'Credits Earned!',
          message: 'Reklam izlediğiniz için 5 kredi kazandınız.',
          message_en: 'You earned 5 credits for watching an ad.',
          is_read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          user_id: user?.id || '',
          type: 'boost_activated',
          title: 'Boost Aktifleşti!',
          title_en: 'Boost Activated!',
          message: 'Instagram hesabınız 24 saat boyunca boost alacak.',
          message_en: 'Your Instagram account will be boosted for 24 hours.',
          is_read: false,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          user_id: user?.id || '',
          type: 'new_message',
          title: 'Yeni Mesaj',
          title_en: 'New Message',
          message: 'Admin sizinle iletişime geçmek istiyor.',
          message_en: 'Admin wants to contact you.',
          is_read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          user_id: user?.id || '',
          type: 'forum_reply',
          title: 'Forum Cevabı',
          title_en: 'Forum Reply',
          message: 'Konunuza yeni bir cevap geldi.',
          message_en: 'You have a new reply to your topic.',
          is_read: true,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await apiClient.markNotificationRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'boost_activated':
      case 'boost_expiring':
        router.push('/(tabs)/discover');
        break;
      case 'new_message':
        Alert.alert('Mesaj', 'Mesajlar sayfası yakında aktif olacak');
        break;
      case 'forum_reply':
        router.push('/(tabs)/forum');
        break;
      case 'credits_earned':
        router.push('/(tabs)/credits');
        break;
      case 'vip_approved':
        Alert.alert('VIP', 'VIP sayfası yakında aktif olacak');
        break;
    }
  };

  const handleMarkAllRead = async () => {
    Alert.alert(
      'Tümünü Okundu İşaretle',
      'Tüm bildirimleri okundu olarak işaretlemek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Evet', 
          onPress: () => {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            Alert.alert('Başarılı', 'Tüm bildirimler okundu olarak işaretlendi');
          }
        }
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const renderNotification = (notification: Notification) => {
    const title = language === 'tr' ? notification.title : notification.title_en;
    const message = language === 'tr' ? notification.message : notification.message_en;
    const icon = NOTIFICATION_ICONS[notification.type];
    const color = NOTIFICATION_COLORS[notification.type];

    return (
      <Pressable
        key={notification.id}
        style={[styles.notificationCard, !notification.is_read && styles.unreadCard]}
        onPress={() => handleNotificationPress(notification)}
        android_ripple={{ color: colors.primary + '20' }}
      >
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <MaterialIcons name={icon as any} size={20} color={color} />
          </View>
          
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>{title}</Text>
            <Text style={styles.notificationTime}>{formatTime(notification.created_at)}</Text>
          </View>
          
          {!notification.is_read && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {message}
        </Text>
      </Pressable>
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Tümünü Okundu İşaretle</Text>
          </Pressable>
        )}
      </View>

      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <LinearGradient
          colors={colors.gradient.primary}
          style={styles.statsGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Toplam</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Okunmamış</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{notifications.length - unreadCount}</Text>
            <Text style={styles.statLabel}>Okunmuş</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
          </View>
        ) : notifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {notifications.map(renderNotification)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Bildirim yok</Text>
            <Text style={styles.emptySubtitle}>
              Henüz hiç bildiriminiz bulunmuyor. Aktiviteleriniz için bildirimler buraya gelecek.
            </Text>
          </View>
        )}

        {/* Notification Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Bildirim Ayarları</Text>
          <View style={styles.settingsList}>
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('Bilgi', 'Ayarlar yakında aktif olacak')}>
              <View style={styles.settingIcon}>
                <MaterialIcons name="notifications" size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingTitle}>Push Bildirimleri</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
            
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('Bilgi', 'Ayarlar yakında aktif olacak')}>
              <View style={styles.settingIcon}>
                <MaterialIcons name="email" size={20} color={colors.success} />
              </View>
              <Text style={styles.settingTitle}>E-posta Bildirimleri</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
            
            <Pressable style={styles.settingItem} onPress={() => Alert.alert('Bilgi', 'Ayarlar yakında aktif olacak')}>
              <View style={styles.settingIcon}>
                <MaterialIcons name="schedule" size={20} color={colors.warning} />
              </View>
              <Text style={styles.settingTitle}>Sessiz Saatler</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
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
    flex: 1,
    textAlign: 'center',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  statsHeader: {
    margin: 16,
  },
  statsGradient: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  scrollView: {
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
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
    lineHeight: 20,
  },
  notificationsList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  settingsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  settingsList: {
    gap: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '20',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
});