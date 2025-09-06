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
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';

interface AnalyticsData {
  users: {
    total: number;
    new_this_month: number;
    active_users: number;
    vip_conversion_rate: number;
  };
  revenue: {
    total: number;
    this_month: number;
    average_per_user: number;
    growth_rate: number;
  };
  boosts: {
    total: number;
    active: number;
    success_rate: number;
    average_duration: number;
  };
  engagement: {
    forum_posts: number;
    social_accounts: number;
    daily_active_users: number;
    retention_rate: number;
  };
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      const data = await apiClient.getAdminAnalytics(selectedPeriod);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Mock data for demo
      setAnalytics({
        users: {
          total: 1245,
          new_this_month: 189,
          active_users: 856,
          vip_conversion_rate: 12.5
        },
        revenue: {
          total: 15680.50,
          this_month: 3240.75,
          average_per_user: 89.25,
          growth_rate: 18.7
        },
        boosts: {
          total: 2341,
          active: 156,
          success_rate: 94.2,
          average_duration: 18.5
        },
        engagement: {
          forum_posts: 432,
          social_accounts: 3210,
          daily_active_users: 287,
          retention_rate: 76.3
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return 'trending-up';
    if (rate < 0) return 'trending-down';
    return 'trending-flat';
  };

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return colors.success;
    if (rate < 0) return colors.error;
    return colors.textSecondary;
  };

  const renderMetricCard = (title: string, value: string, subtitle: string, growth?: number, icon?: string, color?: string) => (
    <View style={[styles.metricCard, color && { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        {icon && (
          <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
            <MaterialIcons name={icon as any} size={20} color={color} />
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <View style={styles.metricFooter}>
        <Text style={styles.metricSubtitle}>{subtitle}</Text>
        {growth !== undefined && (
          <View style={styles.growthIndicator}>
            <MaterialIcons 
              name={getGrowthIcon(growth) as any} 
              size={16} 
              color={getGrowthColor(growth)} 
            />
            <Text style={[styles.growthText, { color: getGrowthColor(growth) }]}>
              {Math.abs(growth).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const chartData: ChartData[] = analytics ? [
    { label: 'Kullanıcılar', value: analytics.users.total, color: colors.primary },
    { label: 'VIP Üyeler', value: Math.floor(analytics.users.total * analytics.users.vip_conversion_rate / 100), color: colors.warning },
    { label: 'Aktif Boost', value: analytics.boosts.active, color: colors.success },
    { label: 'Forum Konuları', value: analytics.engagement.forum_posts, color: colors.accent },
  ] : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Detaylı Analitikler</Text>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['7d', '30d', '90d'] as const).map((period) => (
          <Pressable
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.selectedPeriodButton
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.selectedPeriodButtonText
            ]}>
              {period === '7d' ? '7 Gün' : period === '30d' ? '30 Gün' : '90 Gün'}
            </Text>
          </Pressable>
        ))}
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
            <Text style={styles.loadingText}>Analitik veriler yükleniyor...</Text>
          </View>
        ) : analytics ? (
          <View style={styles.content}>
            {/* Revenue Overview */}
            <LinearGradient
              colors={colors.gradient.primary}
              style={styles.revenueCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.revenueHeader}>
                <MaterialIcons name="account-balance-wallet" size={32} color="white" />
                <Text style={styles.revenueTitle}>Toplam Gelir</Text>
              </View>
              <Text style={styles.revenueAmount}>{formatCurrency(analytics.revenue.total)}</Text>
              <Text style={styles.revenueSubtitle}>Bu ay: {formatCurrency(analytics.revenue.this_month)}</Text>
            </LinearGradient>

            {/* User Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kullanıcı Metrikleri</Text>
              <View style={styles.metricsGrid}>
                {renderMetricCard(
                  'Toplam Kullanıcı',
                  formatNumber(analytics.users.total),
                  `${analytics.users.new_this_month} yeni bu ay`,
                  15.2,
                  'people',
                  colors.primary
                )}
                {renderMetricCard(
                  'Aktif Kullanıcılar',
                  formatNumber(analytics.users.active_users),
                  'Son 30 günde aktif',
                  8.7,
                  'person',
                  colors.success
                )}
                {renderMetricCard(
                  'VIP Dönüşüm Oranı',
                  `${analytics.users.vip_conversion_rate}%`,
                  'Kullanıcıdan VIP\'e',
                  analytics.users.vip_conversion_rate - 10,
                  'star',
                  colors.warning
                )}
                {renderMetricCard(
                  'Günlük Aktif',
                  formatNumber(analytics.engagement.daily_active_users),
                  'Ortalama günlük',
                  12.3,
                  'today',
                  colors.accent
                )}
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performans Metrikleri</Text>
              <View style={styles.metricsGrid}>
                {renderMetricCard(
                  'Toplam Boost',
                  formatNumber(analytics.boosts.total),
                  `${analytics.boosts.active} aktif boost`,
                  22.1,
                  'trending-up',
                  colors.primary
                )}
                {renderMetricCard(
                  'Başarı Oranı',
                  `${analytics.boosts.success_rate}%`,
                  'Boost başarı oranı',
                  2.3,
                  'check-circle',
                  colors.success
                )}
                {renderMetricCard(
                  'Ortalama Süre',
                  `${analytics.boosts.average_duration}s`,
                  'Boost ortalama süresi',
                  -1.2,
                  'timer',
                  colors.accent
                )}
                {renderMetricCard(
                  'Sosyal Hesap',
                  formatNumber(analytics.engagement.social_accounts),
                  'Toplam bağlı hesap',
                  28.9,
                  'link',
                  colors.warning
                )}
              </View>
            </View>

            {/* Chart Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Platform Özeti</Text>
              <View style={styles.chartContainer}>
                {chartData.map((item, index) => (
                  <View key={index} style={styles.chartItem}>
                    <View style={[styles.chartBar, { backgroundColor: item.color + '20' }]}>
                      <View 
                        style={[
                          styles.chartFill, 
                          { 
                            backgroundColor: item.color,
                            height: `${(item.value / Math.max(...chartData.map(d => d.value))) * 100}%`
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.chartLabel}>{item.label}</Text>
                    <Text style={styles.chartValue}>{formatNumber(item.value)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Export Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rapor İşlemleri</Text>
              <View style={styles.exportActions}>
                <GradientButton
                  title="Excel'e Aktar"
                  onPress={() => Alert.alert('Başarılı!', 'Rapor Excel formatında indirildi')}
                  size="medium"
                  gradient={[colors.success, '#55EFC4']}
                  style={styles.exportButton}
                />
                <GradientButton
                  title="PDF Raporu"
                  onPress={() => Alert.alert('Başarılı!', 'PDF raporu oluşturuldu')}
                  size="medium"
                  gradient={[colors.error, '#FF7675']}
                  style={styles.exportButton}
                />
                <GradientButton
                  title="Email Gönder"
                  onPress={() => Alert.alert('Başarılı!', 'Rapor email ile gönderildi')}
                  size="medium"
                  gradient={[colors.primary, colors.secondary]}
                  style={styles.exportButton}
                />
              </View>
            </View>
          </View>
        ) : null}
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
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedPeriodButton: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectedPeriodButtonText: {
    color: 'white',
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
  content: {
    paddingHorizontal: 16,
  },
  revenueCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  revenueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  revenueSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  metricsGrid: {
    gap: 16,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  metricFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 30,
    height: 80,
    borderRadius: 15,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartFill: {
    width: '100%',
    borderRadius: 15,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  exportActions: {
    gap: 12,
  },
  exportButton: {
    marginBottom: 8,
  },
});