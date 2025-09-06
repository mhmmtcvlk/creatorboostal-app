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

interface ForumTopic {
  id: string;
  title: string;
  author: string;
  replies_count: number;
  views_count: number;
  created_at: string;
  category: string;
  is_pinned: boolean;
  is_locked: boolean;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  topics_count: number;
  color: string;
}

export default function AdminForum() {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'topics' | 'categories'>('topics');

  useEffect(() => {
    loadForumData();
  }, []);

  const loadForumData = async () => {
    try {
      const [topicsData, categoriesData] = await Promise.all([
        apiClient.getForumTopics(),
        apiClient.getForumCategories()
      ]);
      
      setTopics(topicsData.slice(0, 10)); // Latest 10 topics
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading forum data:', error);
      // Mock data for demo
      setTopics([
        {
          id: '1',
          title: 'Instagram hesabımı nasıl daha çok kişiye ulaştırabilirim?',
          author: 'user123',
          replies_count: 15,
          views_count: 234,
          created_at: new Date().toISOString(),
          category: 'Instagram',
          is_pinned: true,
          is_locked: false,
        },
        {
          id: '2',
          title: 'TikTok algoritmasi nasıl çalışıyor?',
          author: 'tiktoker',
          replies_count: 8,
          views_count: 156,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          category: 'TikTok',
          is_pinned: false,
          is_locked: false,
        },
        {
          id: '3',
          title: 'VIP üyeliğin avantajları nelerdir?',
          author: 'newbie',
          replies_count: 22,
          views_count: 445,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          category: 'Genel',
          is_pinned: false,
          is_locked: false,
        },
      ]);
      
      setCategories([
        { id: '1', name: 'Instagram', description: 'Instagram ile ilgili tüm konular', topics_count: 45, color: '#E4405F' },
        { id: '2', name: 'TikTok', description: 'TikTok stratejileri ve ipuçları', topics_count: 23, color: '#000000' },
        { id: '3', name: 'Twitter', description: 'Twitter engagement artırma', topics_count: 18, color: '#1DA1F2' },
        { id: '4', name: 'YouTube', description: 'YouTube kanal büyütme', topics_count: 31, color: '#FF0000' },
        { id: '5', name: 'Genel', description: 'Genel sosyal medya konuları', topics_count: 67, color: colors.primary },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadForumData();
    setRefreshing(false);
  };

  const handleTopicAction = (topicId: string, action: 'pin' | 'lock' | 'delete') => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    const actionLabels = {
      pin: topic.is_pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle',
      lock: topic.is_locked ? 'Kilidi Aç' : 'Kilitle',
      delete: 'Sil'
    };

    Alert.alert(
      'Konu İşlemi',
      `"${topic.title}" konusunu ${actionLabels[action].toLowerCase()} istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: actionLabels[action], 
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => performTopicAction(topicId, action)
        }
      ]
    );
  };

  const performTopicAction = async (topicId: string, action: 'pin' | 'lock' | 'delete') => {
    try {
      if (action === 'delete') {
        setTopics(prev => prev.filter(t => t.id !== topicId));
        Alert.alert('Başarılı!', 'Konu silindi');
      } else if (action === 'pin') {
        setTopics(prev => prev.map(t => 
          t.id === topicId ? { ...t, is_pinned: !t.is_pinned } : t
        ));
        Alert.alert('Başarılı!', 'Konu sabitleme durumu değiştirildi');
      } else if (action === 'lock') {
        setTopics(prev => prev.map(t => 
          t.id === topicId ? { ...t, is_locked: !t.is_locked } : t
        ));
        Alert.alert('Başarılı!', 'Konu kilit durumu değiştirildi');
      }
    } catch (error) {
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatViews = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const renderTopic = (topic: ForumTopic) => (
    <View key={topic.id} style={styles.topicCard}>
      <View style={styles.topicHeader}>
        <View style={styles.topicInfo}>
          <View style={styles.topicTitleRow}>
            {topic.is_pinned && (
              <MaterialIcons name="push-pin" size={16} color={colors.warning} />
            )}
            {topic.is_locked && (
              <MaterialIcons name="lock" size={16} color={colors.error} />
            )}
            <Text style={styles.topicTitle} numberOfLines={2}>
              {topic.title}
            </Text>
          </View>
          <View style={styles.topicMeta}>
            <Text style={styles.topicAuthor}>@{topic.author}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(topic.category) + '20' }]}>
              <Text style={[styles.categoryText, { color: getCategoryColor(topic.category) }]}>
                {topic.category}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.topicStats}>
          <Text style={styles.statNumber}>{topic.replies_count}</Text>
          <Text style={styles.statLabel}>Yanıt</Text>
          <Text style={styles.statNumber}>{formatViews(topic.views_count)}</Text>
          <Text style={styles.statLabel}>Görüntüleme</Text>
        </View>
      </View>
      
      <View style={styles.topicActions}>
        <Pressable
          style={[styles.actionButton, { borderColor: colors.warning }]}
          onPress={() => handleTopicAction(topic.id, 'pin')}
        >
          <MaterialIcons 
            name={topic.is_pinned ? 'push-pin' : 'push-pin'} 
            size={16} 
            color={topic.is_pinned ? colors.warning : colors.textSecondary} 
          />
        </Pressable>
        
        <Pressable
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => handleTopicAction(topic.id, 'lock')}
        >
          <MaterialIcons 
            name={topic.is_locked ? 'lock-open' : 'lock'} 
            size={16} 
            color={topic.is_locked ? colors.primary : colors.textSecondary} 
          />
        </Pressable>
        
        <Pressable
          style={[styles.actionButton, { borderColor: colors.error }]}
          onPress={() => handleTopicAction(topic.id, 'delete')}
        >
          <MaterialIcons name="delete" size={16} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || colors.primary;
  };

  const renderCategory = (category: ForumCategory) => (
    <View key={category.id} style={styles.categoryCard}>
      <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
        <MaterialIcons name="forum" size={24} color={category.color} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>
        <Text style={styles.categoryTopics}>{category.topics_count} konu</Text>
      </View>
      <Pressable style={styles.categoryActionButton}>
        <MaterialIcons name="settings" size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Forum Yönetimi</Text>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Stats Header */}
      <LinearGradient
        colors={colors.gradient.primary}
        style={styles.statsHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{topics.length}</Text>
          <Text style={styles.statLabel}>Aktif Konu</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{categories.length}</Text>
          <Text style={styles.statLabel}>Kategori</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{topics.reduce((sum, t) => sum + t.replies_count, 0)}</Text>
          <Text style={styles.statLabel}>Toplam Yanıt</Text>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <Pressable
          style={[styles.tabButton, activeTab === 'topics' && styles.activeTabButton]}
          onPress={() => setActiveTab('topics')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'topics' && styles.activeTabButtonText]}>
            Konular
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'categories' && styles.activeTabButton]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'categories' && styles.activeTabButtonText]}>
            Kategoriler
          </Text>
        </Pressable>
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
            <Text style={styles.loadingText}>Forum verileri yükleniyor...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {activeTab === 'topics' ? (
              <View style={styles.topicsList}>
                {topics.map(renderTopic)}
              </View>
            ) : (
              <View style={styles.categoriesList}>
                {categories.map(renderCategory)}
              </View>
            )}
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
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    margin: 16,
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
  tabNavigation: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabButtonText: {
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
  topicsList: {
    gap: 16,
  },
  topicCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topicInfo: {
    flex: 1,
    marginRight: 12,
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  topicTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicAuthor: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  topicStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  topicActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesList: {
    gap: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  categoryTopics: {
    fontSize: 12,
    color: colors.primary,
  },
  categoryActionButton: {
    padding: 8,
  },
});