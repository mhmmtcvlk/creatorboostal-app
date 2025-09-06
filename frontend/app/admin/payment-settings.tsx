import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';

interface PaymentSettings {
  // Bank Transfer Settings
  bank_name: string;
  account_holder: string;
  iban: string;
  swift_code: string;
  
  // Mobile Payment Settings
  mobile_payment_enabled: boolean;
  turkcell_paycell: boolean;
  vodafone_cuzdan: boolean;
  avea_cuzdan: boolean;
  
  // Crypto Settings
  crypto_enabled: boolean;
  bitcoin_address: string;
  ethereum_address: string;
  usdt_address: string;
  
  // General Settings
  auto_approve_limit: number;
  telegram_bot_token: string;
  telegram_channel_id: string;
  
  // Company Info
  company_name: string;
  company_address: string;
  tax_number: string;
  contact_email: string;
  contact_phone: string;
}

export default function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings>({
    bank_name: '',
    account_holder: '',
    iban: '',
    swift_code: '',
    mobile_payment_enabled: false,
    turkcell_paycell: false,
    vodafone_cuzdan: false,
    avea_cuzdan: false,
    crypto_enabled: false,
    bitcoin_address: '',
    ethereum_address: '',
    usdt_address: '',
    auto_approve_limit: 0,
    telegram_bot_token: '',
    telegram_channel_id: '',
    company_name: '',
    company_address: '',
    tax_number: '',
    contact_email: '',
    contact_phone: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In real app, would load from API
      const mockSettings: PaymentSettings = {
        bank_name: 'Ziraat Bankası',
        account_holder: 'CreatorBoostal Ltd.',
        iban: 'TR123456789012345678901234',
        swift_code: 'TCZBTR2A',
        mobile_payment_enabled: true,
        turkcell_paycell: true,
        vodafone_cuzdan: false,
        avea_cuzdan: false,
        crypto_enabled: true,
        bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        ethereum_address: '0x742d35Cc6865C28C8c71e4a2c2dF4f4c1d5f5',
        usdt_address: 'TLsV52sRDL79HXGog9zC22og4d5WsEVo8V',
        auto_approve_limit: 50,
        telegram_bot_token: '',
        telegram_channel_id: '',
        company_name: 'CreatorBoostal Ltd.',
        company_address: 'İstanbul, Türkiye',
        tax_number: '1234567890',
        contact_email: 'info@creatorboostal.com',
        contact_phone: '+90 555 123 4567',
      };
      
      setSettings(mockSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Hata', 'Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In real app, would save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Başarılı!', 'Ödeme ayarları kaydedildi');
    } catch (error) {
      Alert.alert('Hata', 'Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PaymentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testTelegramConnection = () => {
    if (!settings.telegram_bot_token) {
      Alert.alert('Hata', 'Telegram bot token girilmemiş');
      return;
    }
    
    Alert.alert('Test', 'Telegram bağlantısı test ediliyor...');
    // In real app, would test Telegram connection
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>⚙️ Ödeme Ayarları</Text>
        <Pressable onPress={saveSettings} style={styles.saveButton} disabled={saving}>
          <MaterialIcons name="save" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="settings" size={48} color="white" />
          <Text style={styles.heroTitle}>Ödeme Ayarlarını Yönet</Text>
          <Text style={styles.heroSubtitle}>
            Banka bilgileri, mobil ödeme ve kripto ayarlarını buradan yapılandırın
          </Text>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Ayarlar yükleniyor...</Text>
          </View>
        ) : (
          <>
            {/* Bank Transfer Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏦 Banka Bilgileri</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Banka Adı</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.bank_name}
                  onChangeText={(text) => updateSetting('bank_name', text)}
                  placeholder="Örn: Ziraat Bankası"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hesap Sahibi</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.account_holder}
                  onChangeText={(text) => updateSetting('account_holder', text)}
                  placeholder="Örn: CreatorBoostal Ltd."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IBAN</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.iban}
                  onChangeText={(text) => updateSetting('iban', text)}
                  placeholder="TR123456789012345678901234"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={26}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SWIFT Kodu</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.swift_code}
                  onChangeText={(text) => updateSetting('swift_code', text)}
                  placeholder="TCZBTR2A"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Mobile Payment Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📱 Mobil Ödeme Ayarları</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Mobil Ödeme Aktif</Text>
                  <Text style={styles.settingDescription}>Mobil ödeme seçeneğini etkinleştir</Text>
                </View>
                <Switch
                  value={settings.mobile_payment_enabled}
                  onValueChange={(value) => updateSetting('mobile_payment_enabled', value)}
                  trackColor={{ false: colors.border, true: colors.primary + '40' }}
                  thumbColor={settings.mobile_payment_enabled ? colors.primary : colors.textSecondary}
                />
              </View>

              {settings.mobile_payment_enabled && (
                <>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>Turkcell Paycell</Text>
                      <Text style={styles.settingDescription}>Turkcell mobil ödeme</Text>
                    </View>
                    <Switch
                      value={settings.turkcell_paycell}
                      onValueChange={(value) => updateSetting('turkcell_paycell', value)}
                      trackColor={{ false: colors.border, true: colors.primary + '40' }}
                      thumbColor={settings.turkcell_paycell ? colors.primary : colors.textSecondary}
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>Vodafone Cüzdan</Text>
                      <Text style={styles.settingDescription}>Vodafone mobil ödeme</Text>
                    </View>
                    <Switch
                      value={settings.vodafone_cuzdan}
                      onValueChange={(value) => updateSetting('vodafone_cuzdan', value)}
                      trackColor={{ false: colors.border, true: colors.primary + '40' }}
                      thumbColor={settings.vodafone_cuzdan ? colors.primary : colors.textSecondary}
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>Türk Telekom Cüzdan</Text>
                      <Text style={styles.settingDescription}>Türk Telekom mobil ödeme</Text>  
                    </View>
                    <Switch
                      value={settings.avea_cuzdan}
                      onValueChange={(value) => updateSetting('avea_cuzdan', value)}
                      trackColor={{ false: colors.border, true: colors.primary + '40' }}
                      thumbColor={settings.avea_cuzdan ? colors.primary : colors.textSecondary}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Crypto Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>₿ Kripto Para Ayarları</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Kripto Ödeme Aktif</Text>
                  <Text style={styles.settingDescription}>Bitcoin ve diğer kripto paralar</Text>
                </View>
                <Switch
                  value={settings.crypto_enabled}
                  onValueChange={(value) => updateSetting('crypto_enabled', value)}
                  trackColor={{ false: colors.border, true: colors.primary + '40' }}
                  thumbColor={settings.crypto_enabled ? colors.primary : colors.textSecondary}
                />
              </View>

              {settings.crypto_enabled && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bitcoin Adresi</Text>
                    <TextInput
                      style={styles.textInput}
                      value={settings.bitcoin_address}
                      onChangeText={(text) => updateSetting('bitcoin_address', text)}
                      placeholder="bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Ethereum Adresi</Text>
                    <TextInput
                      style={styles.textInput}
                      value={settings.ethereum_address}
                      onChangeText={(text) => updateSetting('ethereum_address', text)}
                      placeholder="0x742d35Cc6865C28C8c71e4a2c2dF4f4c1d5f5"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>USDT (Tron) Adresi</Text>
                    <TextInput
                      style={styles.textInput}
                      value={settings.usdt_address}
                      onChangeText={(text) => updateSetting('usdt_address', text)}
                      placeholder="TLsV52sRDL79HXGog9zC22og4d5WsEVo8V"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Telegram Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📱 Telegram Bot Ayarları</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bot Token</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.telegram_bot_token}
                  onChangeText={(text) => updateSetting('telegram_bot_token', text)}
                  placeholder="1234567890:AAEhBOweik6ad9r_3wBmKXOzU7GhKp..."
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kanal ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.telegram_channel_id}
                  onChangeText={(text) => updateSetting('telegram_channel_id', text)}
                  placeholder="-1001234567890"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <GradientButton
                title="Telegram Bağlantısını Test Et"
                onPress={testTelegramConnection}
                size="medium"
                gradient={[colors.accent, colors.primary]}
                style={styles.testButton}
              />
            </View>

            {/* Company Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏢 Şirket Bilgileri</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Şirket Adı</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.company_name}
                  onChangeText={(text) => updateSetting('company_name', text)}
                  placeholder="CreatorBoostal Ltd."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adres</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={settings.company_address}
                  onChangeText={(text) => updateSetting('company_address', text)}
                  placeholder="Şirket adresi..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vergi Numarası</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.tax_number}
                  onChangeText={(text) => updateSetting('tax_number', text)}
                  placeholder="1234567890"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>İletişim E-posta</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.contact_email}
                  onChangeText={(text) => updateSetting('contact_email', text)}
                  placeholder="info@creatorboostal.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>İletişim Telefon</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.contact_phone}
                  onChangeText={(text) => updateSetting('contact_phone', text)}
                  placeholder="+90 555 123 4567"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Auto Approve Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚡ Otomatik Onay</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Otomatik Onay Limiti (₺)</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.auto_approve_limit.toString()}
                  onChangeText={(text) => updateSetting('auto_approve_limit', parseInt(text) || 0)}
                  placeholder="50"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.inputHelp}>
                  Bu tutarın altındaki ödemeler otomatik onaylanır (0: Kapalı)
                </Text>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.section}>
              <GradientButton
                title={saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                onPress={saveSettings}
                disabled={saving}
                size="large"
                gradient={[colors.success, '#55EFC4']}
                style={styles.saveMainButton}
              />
            </View>
          </>
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
  saveButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHelp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  settingRow: {
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
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  testButton: {
    marginTop: 8,
  },
  saveMainButton: {
    marginTop: 8,
  },
});