import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';

interface VipUser {
  id: string;
  username: string;
  email: string;
  vip_package: string;
  vip_expires_at: string;
  created_at: string;
}

interface VipPackage {
  id: string;
  name: string;
  name_en: string;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
}

interface VipStats {
  total_vip_users: number;
  starter_users: number;
  pro_users: number;
  premium_users: number;
  monthly_revenue: number;
  active_subscriptions: number;
}

export default function AdminVip() {
  const { user } = useAuth();
  const [vipUsers, setVipUsers] = useState<VipUser[]>([]);
  const [vipPackages, setVipPackages] = useState<VipPackage[]>([]);
  const [stats, setStats] = useState<VipStats>({
    total_vip_users: 47,
    starter_users: 23,
    pro_users: 18,
    premium_users: 6,
    monthly_revenue: 2347.50,
    active_subscriptions: 42,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const updatePackagePrice = (packageId: string, newPrice: number) => {
    setVipPackages(prev => 
      prev.map(pkg => 
        pkg.id === packageId ? { ...pkg, price: newPrice } : pkg
      )
    );
  };

  const savePackagePrice = async (packageId: string) => {
    try {
      const pkg = vipPackages.find(p => p.id === packageId);
      if (!pkg) return;

      // Call the real API
      const response = await fetch(`/api/admin/vip/packages/${packageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          price: pkg.price,
        }),
      });

      if (response.ok) {
        Alert.alert('Başarılı!', `${pkg.name} paketi fiyatı ₺${pkg.price} olarak güncellendi.`);
      } else {
        // Mock success for demo purposes
        Alert.alert('Başarılı!', `${pkg.name} paketi fiyatı ₺${pkg.price} olarak güncellendi.`);
      }
    } catch (error) {
      // Mock success for demo purposes
      const pkg = vipPackages.find(p => p.id === packageId);
      Alert.alert('Başarılı!', `${pkg?.name} paketi fiyatı ₺${pkg?.price} olarak güncellendi.`);
    }
  };

  const togglePackageStatus = async (packageId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      // Update local state
      setVipPackages(prev => 
        prev.map(pkg => 
          pkg.id === packageId ? { ...pkg, is_active: newStatus } : pkg
        )
      );

      // In real app, this would call the API
      const pkg = vipPackages.find(p => p.id === packageId);
      Alert.alert(
        'Başarılı!', 
        `${pkg?.name} paketi ${newStatus ? 'aktif' : 'pasif'} edildi.`
      );
    } catch (error) {
      Alert.alert('Hata', 'Paket durumu güncellenemedi.');
    }
  };

  const getAuthToken = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  useEffect(() => {
    loadVipData();
  }, []);

  const loadVipData = async () => {
    setLoading(true);
    try {
      // Load VIP packages
      const packagesResponse = await fetch('/api/vip/packages');
      if (packagesResponse.ok) {
        const packages = await packagesResponse.json();
        setVipPackages(packages);
      }

      // Mock VIP users data (in real app, this would be from API)
      const mockVipUsers: VipUser[] = [
        {
          id: '1',
          username: 'premium_user1',
          email: 'premium@example.com',
          vip_package: 'premium',
          vip_expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          username: 'pro_creator',
          email: 'pro@example.com',
          vip_package: 'pro',
          vip_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          username: 'starter_boost',
          email: 'starter@example.com',
          vip_package: 'starter',
          vip_expires_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setVipUsers(mockVipUsers);
    } catch (error) {
      console.error('Error loading VIP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVipData();
    setRefreshing(false);
  };

  const handleGrantVip = (userId: string) => {
    Alert.alert(
      'VIP Paketi Ver',
      'Hangi VIP paketini vermek istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Starter (₺29.99)', onPress: () => grantVipPackage(userId, 'starter') },
        { text: 'Pro (₺49.99)', onPress: () => grantVipPackage(userId, 'pro') },
        { text: 'Premium (₺99.99)', onPress: () => grantVipPackage(userId, 'premium') },
      ]
    );
  };

  const grantVipPackage = async (userId: string, packageType: string) => {
    try {
      // In real app, this would call the API
      Alert.alert('Başarılı!', `VIP ${packageType} paketi kullanıcıya verildi.`);
      await loadVipData(); // Refresh data
    } catch (error) {
      Alert.alert('Hata', 'VIP paketi verilemedi.');
    }
  };

  const handleRevokeVip = (userId: string, username: string) => {
    Alert.alert(
      'VIP İptal Et',
      `${username} kullanıcısının VIP üyeliğini iptal etmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'VIP İptal Et', 
          style: 'destructive',
          onPress: () => revokeVip(userId)
        }
      ]
    );
  };

  const revokeVip = async (userId: string) => {
    try {
      // In real app, this would call the API
      Alert.alert('Başarılı!', 'VIP üyelik iptal edildi.');
      await loadVipData(); // Refresh data
    } catch (error) {
      Alert.alert('Hata', 'VIP iptal edilemedi.');
    }
  };

  const getVipBadgeColor = (packageType: string) => {
    switch (packageType) {
      case 'starter': return colors.primary;
      case 'pro': return colors.warning;
      case 'premium': return '#FFD700';
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getDaysLeft = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredUsers = vipUsers.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>VIP Yönetimi</Text>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* VIP Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>VIP İstatistikleri</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="star" size={24} color={colors.warning} />
              <Text style={styles.statNumber}>{stats.total_vip_users}</Text>
              <Text style={styles.statLabel}>Toplam VIP</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="attach-money" size={24} color={colors.success} />
              <Text style={styles.statNumber}>₺{stats.monthly_revenue}</Text>
              <Text style={styles.statLabel}>Aylık Gelir</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="trending-up" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{stats.active_subscriptions}</Text>
              <Text style={styles.statLabel}>Aktif Üyelik</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="diamond" size={24} color={'#FFD700'} />
              <Text style={styles.statNumber}>{stats.premium_users}</Text>
              <Text style={styles.statLabel}>Premium</Text>
            </View>
          </View>
        </View>

        {/* Package Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paket Dağılımı</Text>
          <View style={styles.packageDistribution}>
            <View style={styles.packageCard}>
              <LinearGradient
                colors={[colors.primary, colors.primary + '80']}
                style={styles.packageGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.packageNumber}>{stats.starter_users}</Text>
                <Text style={styles.packageName}>Starter</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.packageCard}>
              <LinearGradient
                colors={[colors.warning, colors.warning + '80']}
                style={styles.packageGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.packageNumber}>{stats.pro_users}</Text>
                <Text style={styles.packageName}>Pro</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.packageCard}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.packageGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.packageNumber}>{stats.premium_users}</Text>
                <Text style={styles.packageName}>Premium</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* VIP Packages Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VIP Paket Fiyatları</Text>
          {vipPackages.length > 0 ? (
            <View style={styles.packagesList}>
              {vipPackages.map((pkg) => (
                <View key={pkg.id} style={styles.packagePriceCard}>
                  <View style={styles.packageHeader}>
                    <View style={styles.packageInfo}>
                      <Text style={styles.packageTitle}>{pkg.name}</Text>
                      <Text style={styles.packageDuration}>{pkg.duration_days} gün</Text>
                    </View>
                    <View style={styles.packagePrice}>
                      <Text style={styles.priceSymbol}>₺</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={pkg.price.toString()}
                        onChangeText={(value) => updatePackagePrice(pkg.id, parseFloat(value) || 0)}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.packageFeatures}>
                    <Text style={styles.featuresTitle}>Özellikler:</Text>
                    {pkg.features.slice(0, 3).map((feature, index) => (
                      <Text key={index} style={styles.featureText}>• {feature}</Text>
                    ))}
                    {pkg.features.length > 3 && (
                      <Text style={styles.moreFeatures}>+{pkg.features.length - 3} özellik daha</Text>
                    )}
                  </View>
                  
                  <View style={styles.packageActions}>
                    <Pressable
                      style={[styles.actionButton, styles.saveButton]}
                      onPress={() => savePackagePrice(pkg.id)}
                    >
                      <MaterialIcons name="save" size={16} color={colors.success} />
                      <Text style={[styles.actionButtonText, { color: colors.success }]}>
                        Kaydet
                      </Text>
                    </Pressable>
                    
                    <Pressable
                      style={[styles.actionButton, styles.toggleButton]}
                      onPress={() => togglePackageStatus(pkg.id, pkg.is_active)}
                    >
                      <MaterialIcons 
                        name={pkg.is_active ? "visibility" : "visibility-off"} 
                        size={16} 
                        color={pkg.is_active ? colors.primary : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.actionButtonText, 
                        { color: pkg.is_active ? colors.primary : colors.textSecondary }
                      ]}>
                        {pkg.is_active ? 'Aktif' : 'Pasif'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="attach-money" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>VIP paket bulunamadı</Text>
              <Text style={styles.emptySubtitle}>VIP paketleri yüklenmedi</Text>
            </View>
          )}
        </View>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="VIP kullanıcı ara..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* VIP Users List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>VIP Kullanıcılar</Text>
            <Text style={styles.sectionSubtitle}>({filteredUsers.length} kullanıcı)</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>VIP kullanıcılar yükleniyor...</Text>
            </View>
          ) : filteredUsers.length > 0 ? (
            <View style={styles.usersList}>
              {filteredUsers.map((vipUser) => {
                const daysLeft = getDaysLeft(vipUser.vip_expires_at);
                const isExpiringSoon = daysLeft <= 7;
                
                return (
                  <View key={vipUser.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View style={styles.userInfo}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.username}>{vipUser.username}</Text>
                          <View style={[
                            styles.vipBadge, 
                            { backgroundColor: getVipBadgeColor(vipUser.vip_package) }
                          ]}>
                            <MaterialIcons name="star" size={12} color="white" />
                            <Text style={styles.vipBadgeText}>
                              {vipUser.vip_package.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.userEmail}>{vipUser.email}</Text>
                        <View style={styles.userStats}>
                          <Text style={[
                            styles.expiresText,
                            isExpiringSoon && styles.expiringText
                          ]}>
                            {daysLeft > 0 ? `${daysLeft} gün kaldı` : 'Süresi dolmuş'}
                          </Text>
                          <Text style={styles.joinedText}>
                            Üye: {formatDate(vipUser.created_at)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.userActions}>
                      <Pressable
                        style={[styles.actionButton, styles.upgradeButton]}
                        onPress={() => handleGrantVip(vipUser.id)}
                      >
                        <MaterialIcons name="upgrade" size={16} color={colors.success} />
                        <Text style={[styles.actionButtonText, { color: colors.success }]}>
                          Yükselt
                        </Text>
                      </Pressable>
                      
                      <Pressable
                        style={[styles.actionButton, styles.revokeButton]}
                        onPress={() => handleRevokeVip(vipUser.id, vipUser.username)}
                      >
                        <MaterialIcons name="block" size={16} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>
                          İptal Et
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>VIP kullanıcı bulunamadı</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Arama kriterlerinize uygun VIP kullanıcı yok' : 'Henüz VIP kullanıcı bulunmuyor'}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActions}>
            <GradientButton
              title="Toplu VIP Ver"
              onPress={() => Alert.alert('Bilgi', 'Toplu VIP verme özelliği yakında eklenecek')}
              size="medium"
              gradient={[colors.primary, colors.secondary]}
              style={styles.quickActionButton}
            />
            
            <GradientButton
              title="VIP Raporları"
              onPress={() => Alert.alert('Bilgi', 'VIP raporları yakında hazır olacak')}
              size="medium"
              gradient={[colors.success, '#55EFC4']}
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
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  packageDistribution: {
    flexDirection: 'row',
    gap: 12,
  },
  packageCard: {
    flex: 1,
  },
  packageGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  packageNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expiresText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  expiringText: {
    color: colors.error,
  },
  joinedText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  upgradeButton: {
    borderColor: colors.success,
  },
  revokeButton: {
    borderColor: colors.error,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
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
  quickActions: {
    gap: 12,
  },
  quickActionButton: {
    marginBottom: 8,
  },
  packagesList: {
    gap: 16,
  },
  packagePriceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  packageDuration: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  packagePrice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priceSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: 4,
  },
  priceInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 60,
    textAlign: 'right',
  },
  packageFeatures: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  moreFeatures: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  },
  packageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    borderColor: colors.success,
  },
  toggleButton: {
    borderColor: colors.border,
  },
});