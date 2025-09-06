import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/theme';
import { apiClient } from '../../services/api';
import { User } from '../../types/auth';

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total_users: 0,
    vip_users: 0,
    admin_users: 0,
    regular_users: 0,
  });

  useEffect(() => {
    loadUsersData();
  }, []);

  const loadUsersData = async () => {
    setLoading(true);
    try {
      // Load users and stats
      const [usersData, statsData] = await Promise.all([
        apiClient.getAdminUsers(),
        apiClient.getAdminStats()
      ]);
      
      setUsers(usersData);
      setStats({
        total_users: statsData.total_users || 0,
        vip_users: statsData.vip_users || 0,
        admin_users: usersData.filter((u: User) => u.role === 'admin').length,
        regular_users: usersData.filter((u: User) => u.role === 'user').length,
      });
    } catch (error) {
      console.error('Error loading users data:', error);
      Alert.alert('Hata', 'Kullanıcı verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsersData();
    setRefreshing(false);
  };

  const handleUpdateRole = (userId: string, currentRole: string, username: string) => {
    const roleOptions = [
      { label: 'Kullanıcı', value: 'user' },
      { label: 'VIP', value: 'vip' },
      { label: 'Admin', value: 'admin' },
    ];

    Alert.alert(
      'Rol Güncelle',
      `${username} kullanıcısının rolünü değiştirin:`,
      [
        { text: 'İptal', style: 'cancel' },
        ...roleOptions.map(role => ({
          text: `${role.label} ${currentRole === role.value ? '(Mevcut)' : ''}`,
          onPress: () => currentRole !== role.value ? updateUserRole(userId, role.value) : null,
          style: currentRole === role.value ? 'default' : 'default'
        }))
      ]
    );
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.updateUserRole(userId, newRole);
      Alert.alert('Başarılı!', 'Kullanıcı rolü güncellendi.');
      await loadUsersData(); // Refresh data
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Hata', 'Kullanıcı rolü güncellenemedi.');
    }
  };

  const handleUpdateCredits = (userId: string, currentCredits: number, username: string) => {
    Alert.alert(
      'Kredi Güncelle',
      `${username} kullanıcısının mevcut kredisi: ${currentCredits}\n\nYeni kredi miktarı seçin:`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: '0 Kredi', onPress: () => updateUserCredits(userId, 0) },
        { text: '100 Kredi', onPress: () => updateUserCredits(userId, 100) },
        { text: '500 Kredi', onPress: () => updateUserCredits(userId, 500) },
        { text: '1000 Kredi', onPress: () => updateUserCredits(userId, 1000) },
        { text: '5000 Kredi', onPress: () => updateUserCredits(userId, 5000) },
      ]
    );
  };

  const updateUserCredits = async (userId: string, credits: number) => {
    try {
      await apiClient.updateUserCredits(userId, credits);
      Alert.alert('Başarılı!', 'Kullanıcı kredisi güncellendi.');
      await loadUsersData(); // Refresh data
    } catch (error) {
      console.error('Error updating user credits:', error);
      Alert.alert('Hata', 'Kullanıcı kredisi güncellenemedi.');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return colors.error;
      case 'vip': return colors.warning;
      default: return colors.primary;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'vip': return 'VIP';
      default: return 'Kullanıcı';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const filteredUsers = users.filter(user => 
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
        <Text style={styles.headerTitle}>Kullanıcı Yönetimi</Text>
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
        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Kullanıcı İstatistikleri</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="people" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{stats.total_users}</Text>
              <Text style={styles.statLabel}>Toplam</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="star" size={24} color={colors.warning} />
              <Text style={styles.statNumber}>{stats.vip_users}</Text>
              <Text style={styles.statLabel}>VIP</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="admin-panel-settings" size={24} color={colors.error} />
              <Text style={styles.statNumber}>{stats.admin_users}</Text>
              <Text style={styles.statLabel}>Admin</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="person" size={24} color={colors.success} />
              <Text style={styles.statNumber}>{stats.regular_users}</Text>
              <Text style={styles.statLabel}>Kullanıcı</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Kullanıcı ara..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Users List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kullanıcılar</Text>
            <Text style={styles.sectionSubtitle}>({filteredUsers.length} kullanıcı)</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
            </View>
          ) : filteredUsers.length > 0 ? (
            <View style={styles.usersList}>
              {filteredUsers.map((userData) => (
                <View key={userData.id} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.username}>{userData.username}</Text>
                        <View style={[
                          styles.roleBadge, 
                          { backgroundColor: getRoleBadgeColor(userData.role) }
                        ]}>
                          <Text style={styles.roleBadgeText}>
                            {getRoleText(userData.role)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.userEmail}>{userData.email}</Text>
                      <View style={styles.userStats}>
                        <Text style={styles.creditsText}>
                          💳 {userData.credits} kredi
                        </Text>
                        <Text style={styles.joinedText}>
                          Katılım: {formatDate(userData.created_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.userActions}>
                    <Pressable
                      style={[styles.actionButton, styles.roleButton]}
                      onPress={() => handleUpdateRole(userData.id, userData.role, userData.username)}
                    >
                      <MaterialIcons name="admin-panel-settings" size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                        Rol
                      </Text>
                    </Pressable>
                    
                    <Pressable
                      style={[styles.actionButton, styles.creditsButton]}
                      onPress={() => handleUpdateCredits(userData.id, userData.credits, userData.username)}
                    >
                      <MaterialIcons name="account-balance-wallet" size={16} color={colors.success} />
                      <Text style={[styles.actionButtonText, { color: colors.success }]}>
                        Kredi
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Kullanıcı bulunamadı</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Arama kriterlerinize uygun kullanıcı yok' : 'Henüz kullanıcı bulunmuyor'}
              </Text>
            </View>
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
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
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
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
  creditsText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
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
  roleButton: {
    borderColor: colors.primary,
  },
  creditsButton: {
    borderColor: colors.success,
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
});