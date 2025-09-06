import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { VipCrown } from '../../components/VipCrown';
import { router } from 'expo-router';

export default function ProfileTab() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const handleLanguageToggle = () => {
    const newLanguage = language === 'tr' ? 'en' : 'tr';
    setLanguage(newLanguage);
  };

  const getVipStatusColor = () => {
    if (!user?.vip_package) return colors.textSecondary;
    switch (user.vip_package) {
      case 'starter': return colors.primary;
      case 'pro': return colors.warning;
      case 'premium': return '#FFD700';
      default: return colors.textSecondary;
    }
  };

  const getVipStatusText = () => {
    if (!user?.vip_package) return 'Ücretsiz Üye';
    switch (user.vip_package) {
      case 'starter': return '👑 VIP Starter';
      case 'pro': return '👑 VIP Pro';
      case 'premium': return '👑 VIP Premium';
      default: return 'Ücretsiz Üye';
    }
  };

  const isVipUser = () => {
    return user?.vip_package && user.vip_package !== 'none';
  };

  const menuItems = [
    {
      id: 'vip',
      title: 'VIP Paketler',
      subtitle: 'Özel özelliklerden yararlan',
      icon: 'star',
      color: colors.warning,
      onPress: () => router.push('/vip/packages'),
    },
    {
      id: 'boost',
      title: 'Boost Oluştur',
      subtitle: 'Hesaplarını öne çıkar',
      icon: 'trending-up',
      color: colors.primary,
      onPress: () => router.push('/boost/create'),
    },
    {
      id: 'social',
      title: 'Sosyal Hesap Ekle',
      subtitle: 'Yeni hesap bağla',
      icon: 'add-circle',
      color: colors.success,
      onPress: () => router.push('/social/add'),
    },
    {
      id: 'notifications',
      title: 'Bildirimler',
      subtitle: 'Bildirim ayarları',
      icon: 'notifications',
      color: colors.accent,
      onPress: () => Alert.alert('Bilgi', 'Bildirim sayfası yakında aktif olacak'),
    },
    {
      id: 'security',
      title: 'Güvenlik',
      subtitle: 'Şifre ve güvenlik ayarları',
      icon: 'security',
      color: colors.textSecondary,
      onPress: () => Alert.alert('Bilgi', 'Güvenlik sayfası yakında aktif olacak'),
    },
    {
      id: 'help',
      title: 'Yardım & Destek',
      subtitle: 'SSS ve iletişim',
      icon: 'help',
      color: colors.primary,
      onPress: () => Alert.alert('Bilgi', 'Destek sayfası yakında aktif olacak'),
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <Pressable style={styles.settingsButton}>
          <MaterialIcons name="settings" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <LinearGradient
          colors={isVipUser() ? ['#FFD700', '#FFA500'] : colors.gradient.primary}
          style={styles.profileCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
              
              {/* VIP Crown Badge */}
              {isVipUser() && (
                <View style={styles.crownBadge}>
                  <VipCrown 
                    size="small" 
                    vipLevel={user?.vip_package as any}
                    animated={true}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{user?.username}</Text>
                {isVipUser() && (
                  <VipCrown 
                    size="medium" 
                    vipLevel={user?.vip_package as any}
                    animated={true}
                  />
                )}
              </View>
              <Text style={styles.email}>{user?.email}</Text>
              <View style={styles.statusContainer}>
                <Text style={[styles.vipStatus, { color: isVipUser() ? '#FFD700' : 'rgba(255,255,255,0.9)' }]}>
                  {getVipStatusText()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="account-balance-wallet" size={20} color="white" />
              <Text style={styles.statNumber}>{user?.credits || 0}</Text>
              <Text style={styles.statLabel}>Kredi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="calendar-today" size={20} color="white" />
              <Text style={styles.statNumber}>
                {user?.created_at ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
              </Text>
              <Text style={styles.statLabel}>Gün</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name={user?.role === 'admin' ? 'admin-panel-settings' : 'person'} size={20} color="white" />
              <Text style={styles.statNumber}>{user?.role === 'admin' ? 'Admin' : 'Üye'}</Text>
              <Text style={styles.statLabel}>Rol</Text>
            </View>
          </View>

          {/* VIP Benefits Preview */}
          {isVipUser() && (
            <View style={styles.vipBenefits}>
              <Text style={styles.vipBenefitsTitle}>🎉 VIP Ayrıcalıkları Aktif</Text>
              <Text style={styles.vipBenefitsText}>
                • Boost önceliği • AI yardımcısı • Özel destek • Gelişmiş analitikler
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActions}>
            {user?.role === 'admin' && (
              <Pressable style={styles.quickAction} onPress={() => router.push('/admin')}>
                <LinearGradient
                  colors={['#E17055', '#D63031']}
                  style={styles.quickActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="admin-panel-settings" size={20} color="white" />
                </LinearGradient>
                <Text style={styles.quickActionText}>Admin</Text>
              </Pressable>
            )}
            
            <Pressable style={styles.quickAction} onPress={() => router.push('/boost/create')}>
              <LinearGradient
                colors={colors.gradient.primary}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="trending-up" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Boost</Text>
            </Pressable>
            
            <Pressable style={styles.quickAction} onPress={() => router.push('/vip/packages')}>
              <LinearGradient
                colors={['#FDCB6E', '#E17055']}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="star" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.quickActionText}>VIP</Text>
            </Pressable>
            
            <Pressable style={styles.quickAction} onPress={() => router.push('/(tabs)/credits')}>
              <LinearGradient
                colors={['#00B894', '#55EFC4']}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="stars" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Krediler</Text>
            </Pressable>
            
            <Pressable style={styles.quickAction} onPress={() => Alert.alert('Bilgi', 'Mesajlar sayfası yakında aktif olacak')}>
              <LinearGradient
                colors={['#A29BFE', '#6C5CE7']}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="message" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Mesajlar</Text>
            </Pressable>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          
          {/* Language Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                <MaterialIcons name="language" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dil</Text>
                <Text style={styles.settingSubtitle}>
                  {language === 'tr' ? 'Türkçe' : 'English'}
                </Text>
              </View>
            </View>
            
            <Pressable onPress={handleLanguageToggle} style={styles.languageButton}>
              <Text style={styles.languageButtonText}>
                {language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
              </Text>
            </Pressable>
          </View>
          
          {/* Notifications Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accent + '20' }]}>
                <MaterialIcons name="notifications" size={20} color={colors.accent} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Bildirimler</Text>
                <Text style={styles.settingSubtitle}>Push bildirimler</Text>
              </View>
            </View>
            
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menü</Text>
          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                android_ripple={{ color: colors.primary + '10' }}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                  <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <GradientButton
            title="Çıkış Yap"
            onPress={handleLogout}
            gradient={['#E17055', '#D63031']}
            size="large"
            style={styles.logoutButton}
          />
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CreatorBoostal v1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Tüm hakları saklıdır</Text>
          {user?.created_at && (
            <Text style={styles.footerText}>
              Üyelik: {formatDate(user.created_at)}
            </Text>
          )}
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
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  crownBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  profileInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  vipBenefits: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  vipBenefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  vipBenefitsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
  },
  languageButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});