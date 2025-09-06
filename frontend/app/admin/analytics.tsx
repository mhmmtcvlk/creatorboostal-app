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
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';

interface PaymentRecord {
  id: string;
  user_id: string;
  username: string;
  package_name: string;
  amount: number;
  payment_method: 'bank_transfer' | 'mobile_payment' | 'crypto';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  proof_image?: string;
  notes?: string;
}

interface PaymentStats {
  total_revenue: number;
  pending_payments: number;
  approved_today: number;
  mobile_payments: number;
  bank_transfers: number;
  crypto_payments: number;
}

export default function PaymentManagement() {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total_revenue: 0,
    pending_payments: 0,
    approved_today: 0,
    mobile_payments: 0,
    bank_transfers: 0,
    crypto_payments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      // Mock data for now - in real app would call API
      const mockPayments: PaymentRecord[] = [
        {
          id: '1',
          user_id: 'user1',
          username: 'ahmet123',
          package_name: 'VIP Pro',
          amount: 49.99,
          payment_method: 'mobile_payment',
          status: 'pending',
          created_at: new Date().toISOString(),
          notes: 'Turkcell Paycell ile ödeme yapıldı'
        },
        {
          id: '2',
          user_id: 'user2', 
          username: 'fatma456',
          package_name: 'VIP Starter',
          amount: 19.99,
          payment_method: 'bank_transfer',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          notes: 'Ziraat Bankası havale dekontu gönderildi'
        },
        {
          id: '3',
          user_id: 'user3',
          username: 'mehmet789',
          package_name: 'VIP Premium',
          amount: 99.99,
          payment_method: 'crypto',
          status: 'approved',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          notes: 'Bitcoin transfer onaylandı'
        }
      ];

      setPaymentRecords(mockPayments);
      
      const mockStats: PaymentStats = {
        total_revenue: 15680.50,
        pending_payments: mockPayments.filter(p => p.status === 'pending').length,
        approved_today: 5,
        mobile_payments: mockPayments.filter(p => p.payment_method === 'mobile_payment').length,
        bank_transfers: mockPayments.filter(p => p.payment_method === 'bank_transfer').length,
        crypto_payments: mockPayments.filter(p => p.payment_method === 'crypto').length,
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading payment data:', error);
      Alert.alert('Hata', 'Ödeme verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaymentData();
    setRefreshing(false);
  };

  const handlePaymentAction = (payment: PaymentRecord, action: 'approve' | 'reject') => {
    Alert.alert(
      action === 'approve' ? 'Ödemeyi Onayla' : 'Ödemeyi Reddet',
      `${payment.username} kullanıcısının ${payment.package_name} paket ödemesini ${action === 'approve' ? 'onaylamak' : 'reddetmek'} istediğinizden emin misiniz?\n\nTutar: ₺${payment.amount}`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: action === 'approve' ? 'Onayla' : 'Reddet', 
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: () => processPayment(payment.id, action)
        }
      ]
    );
  };

  const processPayment = async (paymentId: string, action: 'approve' | 'reject') => {
    setProcessingPayment(true);
    try {
      // In real app, would call API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPaymentRecords(prev => 
        prev.map(payment => 
          payment.id === paymentId 
            ? { ...payment, status: action === 'approve' ? 'approved' : 'rejected' }
            : payment
        )
      );

      Alert.alert(
        'Başarılı!',
        `Ödeme ${action === 'approve' ? 'onaylandı' : 'reddedildi'}. Kullanıcı bilgilendirildi.`
      );
      
      await loadPaymentData(); // Refresh stats
    } catch (error) {
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi');
    } finally {
      setProcessingPayment(false);
    }
  };

  const showPaymentDetails = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mobile_payment': return 'smartphone';
      case 'bank_transfer': return 'account-balance';
      case 'crypto': return 'currency-bitcoin';
      default: return 'payment';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'mobile_payment': return 'Mobil Ödeme';
      case 'bank_transfer': return 'Havale/EFT';
      case 'crypto': return 'Kripto Para';
      default: return 'Bilinmeyen';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      default: return 'Bilinmeyen';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>💳 Ödeme Yönetimi</Text>
        <Pressable onPress={() => router.push('/admin/payment-settings')} style={styles.settingsButton}>
          <MaterialIcons name="settings" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Revenue Overview */}
        <LinearGradient
          colors={['#00B894', '#55EFC4']}
          style={styles.revenueCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.revenueHeader}>
            <MaterialIcons name="account-balance-wallet" size={32} color="white" />
            <Text style={styles.revenueTitle}>Toplam Gelir</Text>
          </View>
          <Text style={styles.revenueAmount}>{formatCurrency(stats.total_revenue)}</Text>
          <Text style={styles.revenueSubtitle}>Bu ay kazancınız ₺{(stats.total_revenue * 0.2).toFixed(2)}</Text>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Ödeme İstatistikleri</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="pending" size={24} color={colors.warning} />
              <Text style={styles.statNumber}>{stats.pending_payments}</Text>
              <Text style={styles.statLabel}>Bekleyen</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <Text style={styles.statNumber}>{stats.approved_today}</Text>
              <Text style={styles.statLabel}>Bugün Onay</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="smartphone" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{stats.mobile_payments}</Text>
              <Text style={styles.statLabel}>Mobil</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="account-balance" size={24} color={colors.accent} />
              <Text style={styles.statNumber}>{stats.bank_transfers}</Text>
              <Text style={styles.statLabel}>Havale</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Hızlı İşlemler</Text>
          <View style={styles.quickActions}>
            <GradientButton
              title="Ödeme Ayarları"
              onPress={() => router.push('/admin/payment-settings')}
              size="medium"
              gradient={[colors.primary, colors.secondary]}
              style={styles.quickActionButton}
            />
            
            <GradientButton
              title="Banka Bilgileri"
              onPress={() => Alert.alert('Bilgi', 'Banka bilgileri ayarları yakında aktif olacak')}
              size="medium"
              gradient={[colors.accent, colors.primary]}
              style={styles.quickActionButton}
            />
          </View>
        </View>

        {/* Payment Records */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧾 Son Ödeme İstekleri</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Ödeme verileri yükleniyor...</Text>
            </View>
          ) : paymentRecords.length > 0 ? (
            <View style={styles.paymentsList}>
              {paymentRecords.slice(0, 10).map((payment) => (
                <Pressable
                  key={payment.id}
                  style={styles.paymentCard}
                  onPress={() => showPaymentDetails(payment)}
                >
                  <View style={styles.paymentHeader}>
                    <View style={styles.paymentUser}>
                      <View style={[
                        styles.paymentMethodIcon,
                        { backgroundColor: getStatusColor(payment.status) + '20' }
                      ]}>
                        <MaterialIcons 
                          name={getPaymentMethodIcon(payment.payment_method) as any} 
                          size={20} 
                          color={getStatusColor(payment.status)} 
                        />
                      </View>
                      <View style={styles.paymentUserInfo}>
                        <Text style={styles.paymentUsername}>{payment.username}</Text>
                        <Text style={styles.paymentPackage}>{payment.package_name}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.paymentAmount}>
                      <Text style={styles.paymentPrice}>{formatCurrency(payment.amount)}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payment.status) + '20' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(payment.status) }
                        ]}>
                          {getStatusText(payment.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.paymentFooter}>
                    <Text style={styles.paymentMethod}>
                      {getPaymentMethodText(payment.payment_method)}
                    </Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.created_at)}
                    </Text>
                  </View>

                  {payment.status === 'pending' && (
                    <View style={styles.paymentActions}>
                      <Pressable
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handlePaymentAction(payment, 'reject')}
                        disabled={processingPayment}
                      >
                        <MaterialIcons name="close" size={16} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>Reddet</Text>
                      </Pressable>
                      
                      <Pressable
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handlePaymentAction(payment, 'approve')}
                        disabled={processingPayment}
                      >
                        <MaterialIcons name="check" size={16} color={colors.success} />
                        <Text style={[styles.actionButtonText, { color: colors.success }]}>Onayla</Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Henüz ödeme yok</Text>
              <Text style={styles.emptySubtitle}>Ödeme istekleri burada görünecek</Text>
            </View>
          )}
        </View>

        {/* Payment Details Modal */}
        <Modal
          visible={showDetailsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ödeme Detayları</Text>
                <Pressable onPress={() => setShowDetailsModal(false)}>
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              {selectedPayment && (
                <ScrollView style={styles.modalContent}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Kullanıcı:</Text>
                    <Text style={styles.detailValue}>{selectedPayment.username}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Paket:</Text>
                    <Text style={styles.detailValue}>{selectedPayment.package_name}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Tutar:</Text>
                    <Text style={styles.detailValue}>{formatCurrency(selectedPayment.amount)}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Ödeme Yöntemi:</Text>
                    <Text style={styles.detailValue}>{getPaymentMethodText(selectedPayment.payment_method)}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Durum:</Text>
                    <Text style={[
                      styles.detailValue,
                      { color: getStatusColor(selectedPayment.status) }
                    ]}>
                      {getStatusText(selectedPayment.status)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Tarih:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedPayment.created_at)}</Text>
                  </View>
                  
                  {selectedPayment.notes && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Notlar:</Text>
                      <Text style={styles.detailValue}>{selectedPayment.notes}</Text>
                    </View>
                  )}
                </ScrollView>
              )}
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
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  revenueCard: {
    padding: 24,
    borderRadius: 20,
    margin: 16,
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
    gap: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
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
  paymentsList: {
    gap: 12,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentUserInfo: {
    flex: 1,
  },
  paymentUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  paymentPackage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  paymentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethod: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  paymentDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  rejectButton: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  approveButton: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  actionButtonText: {
    fontSize: 14,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailsModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    padding: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});