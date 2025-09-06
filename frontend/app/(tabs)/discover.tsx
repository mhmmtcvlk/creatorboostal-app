import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
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
import { SocialAccount } from '../../types/social';

const PLATFORM_ICONS = {
  instagram: 'instagram',
  twitter: 'twitter',
  tiktok: 'tiktok',
  youtube: 'youtube',
};

const PLATFORM_COLORS = {
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  tiktok: '#000000',
  youtube: '#FF0000',
};

export default function DiscoverTab() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await apiClient.discoverAccounts(0, 20);
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  const handleBoost = async (accountId: string) => {
    if (!user) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }

    try {
      await apiClient.createBoost({ social_account_id: accountId, duration_hours: 24 });
      Alert.alert('Başarılı!', 'Hesap 24 saat boost edildi!');
      await loadAccounts(); // Refresh data
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Boost oluşturulamadı');
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderAccount = (account: SocialAccount) => (
    <View key={account.id} style={styles.accountCard}>
      {account.is_featured && (
        <LinearGradient
          colors={['#6C5CE7', '#A29BFE']}
          style={styles.featuredBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="star" size={12} color="white" />
          <Text style={styles.featuredText}>BOOST</Text>
        </LinearGradient>
      )}

      <View style={styles.accountHeader}>
        <View style={styles.profileSection}>
          {account.profile_image ? (
            <Image source={{ uri: account.profile_image }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profilePlaceholder, { backgroundColor: PLATFORM_COLORS[account.platform] + '20' }]}>
              <Ionicons name={PLATFORM_ICONS[account.platform] as any} size={24} color={PLATFORM_COLORS[account.platform]} />
            </View>
          )}
          
          <View style={styles.accountInfo}>
            <Text style={styles.displayName}>{account.display_name}</Text>
            <Text style={styles.username}>@{account.username}</Text>
            <View style={styles.platformTag}>
              <Ionicons name={PLATFORM_ICONS[account.platform] as any} size={12} color={PLATFORM_COLORS[account.platform]} />
              <Text style={[styles.platformText, { color: PLATFORM_COLORS[account.platform] }]}>
                {account.platform.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.followerCount}>{formatFollowers(account.followers_count)}</Text>
          <Text style={styles.followerLabel}>Takipçi</Text>
          <Text style={styles.boostCount}>{account.boost_count} Boost</Text>
        </View>
      </View>

      {account.description && (
        <Text style={styles.description} numberOfLines={2}>
          {account.description}
        </Text>
      )}

      <View style={styles.accountActions}>
        <GradientButton
          title="Boost Et"
          onPress={() => handleBoost(account.id)}
          size="small"
          variant="primary"
          style={styles.boostButton}
        />
        <Pressable style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Görüntüle</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Keşfet</Text>
        <Pressable style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
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
            <Text style={styles.statNumber}>{accounts.length}</Text>
            <Text style={styles.statLabel}>Hesap</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{accounts.filter(a => a.is_featured).length}</Text>
            <Text style={styles.statLabel}>Boost'lu</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.credits || 0}</Text>
            <Text style={styles.statLabel}>Kredin</Text>
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
            <Text style={styles.loadingText}>Hesaplar yükleniyor...</Text>
          </View>
        ) : accounts.length > 0 ? (
          <View style={styles.accountsList}>
            {accounts.map(renderAccount)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Henüz hesap yok</Text>
            <Text style={styles.emptySubtitle}>İlk sosyal medya hesabını ekle!</Text>
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
  addButton: {
    padding: 8,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  },
  accountsList: {
    padding: 16,
    gap: 16,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  platformTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  platformText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statsSection: {
    alignItems: 'flex-end',
  },
  followerCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  followerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  boostCount: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  accountActions: {
    flexDirection: 'row',
    gap: 12,
  },
  boostButton: {
    flex: 1,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
});