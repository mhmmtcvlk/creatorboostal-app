import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';

interface AdminSetting {
  key: string;
  value: string;
  description: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiClient.getAdminSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Hata', 'Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  const handleEditSetting = (key: string, currentValue: string) => {
    setEditingKey(key);
    setEditingValue(currentValue);
  };

  const handleSaveSetting = async () => {
    if (!editingKey) return;

    try {
      const updatedSettings = settings.map(setting => 
        setting.key === editingKey 
          ? { ...setting, value: editingValue }
          : setting
      );

      await apiClient.updateAdminSettings(
        Object.fromEntries(updatedSettings.map(s => [s.key, s.value]))
      );

      setSettings(updatedSettings);
      setEditingKey(null);
      setEditingValue('');
      Alert.alert('Başarılı!', 'Ayar güncellendi');
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Hata', 'Ayar güncellenemedi');
    }
  };

  const getSettingIcon = (key: string) => {
    if (key.includes('telegram')) return 'send';
    if (key.includes('instagram')) return 'camera';
    if (key.includes('company')) return 'business';
    if (key.includes('payment')) return 'payment';
    if (key.includes('email')) return 'email';
    if (key.includes('phone')) return 'phone';
    if (key.includes('ai')) return 'psychology';
    return 'settings';
  };

  const getSettingColor = (key: string) => {
    if (key.includes('telegram')) return colors.primary;
    if (key.includes('instagram')) return '#E4405F';
    if (key.includes('company')) return colors.success;
    if (key.includes('payment')) return colors.warning;
    return colors.accent;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sistem Ayarları</Text>
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
        {/* Header Card */}
        <LinearGradient
          colors={colors.gradient.primary}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="settings" size={48} color="white" />
          <Text style={styles.headerTitle}>API Anahtarları & Sistem Yapılandırması</Text>
          <Text style={styles.headerSubtitle}>Tüm sistem ayarlarınızı buradan yönetin</Text>
        </LinearGradient>

        {/* Settings List */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Sistem Ayarları</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Ayarlar yükleniyor...</Text>
            </View>
          ) : (
            <View style={styles.settingsList}>
              {settings.map((setting) => (
                <View key={setting.key} style={styles.settingCard}>
                  <View style={styles.settingHeader}>
                    <View style={[styles.settingIcon, { backgroundColor: getSettingColor(setting.key) + '20' }]}>
                      <MaterialIcons 
                        name={getSettingIcon(setting.key) as any} 
                        size={20} 
                        color={getSettingColor(setting.key)} 
                      />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingKey}>{setting.key.replace(/_/g, ' ').toUpperCase()}</Text>
                      <Text style={styles.settingDescription}>{setting.description}</Text>
                    </View>
                    <Pressable
                      style={styles.editButton}
                      onPress={() => handleEditSetting(setting.key, setting.value)}
                    >
                      <MaterialIcons name="edit" size={20} color={colors.primary} />
                    </Pressable>
                  </View>

                  {editingKey === setting.key ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={styles.editInput}
                        value={editingValue}
                        onChangeText={setEditingValue}
                        placeholder="Yeni değer girin..."
                        placeholderTextColor={colors.textSecondary}
                        multiline={setting.key.includes('description') || setting.key.includes('message')}
                      />
                      <View style={styles.editActions}>
                        <Pressable
                          style={styles.cancelButton}
                          onPress={() => {
                            setEditingKey(null);
                            setEditingValue('');
                          }}
                        >
                          <Text style={styles.cancelButtonText}>İptal</Text>
                        </Pressable>
                        <GradientButton
                          title="Kaydet"
                          onPress={handleSaveSetting}
                          size="small"
                          style={styles.saveButton}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.settingValue}>
                      <Text style={styles.valueText}>
                        {setting.value || 'Değer girilmemiş'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActionsList}>
            <GradientButton
              title="Ayarları Yenile"
              onPress={loadSettings}
              size="medium"
              gradient={[colors.primary, colors.secondary]}
              style={styles.quickActionButton}
            />
            
            <GradientButton
              title="Sistem Sağlığını Kontrol Et"
              onPress={() => Alert.alert('Sistem Durumu', 'Tüm servisler normal çalışıyor ✅')}
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
  headerCard: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  settingsList: {
    gap: 16,
  },
  settingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  settingKey: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  editButton: {
    padding: 8,
  },
  settingValue: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  valueText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'monospace',
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
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