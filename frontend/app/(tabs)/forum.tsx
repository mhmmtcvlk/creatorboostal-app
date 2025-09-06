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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';
import { apiClient } from '../../services/api';
import { ForumCategory, ForumTopic } from '../../types/forum';

const CATEGORY_ICONS = {
  'Instagram Pazarlama': 'instagram',
  'Instagram Marketing': 'instagram',
  'TikTok Büyüme': 'tiktok',
  'TikTok Growth': 'tiktok',
  'YouTube Creator': 'youtube',
  'Genel Sosyal Medya': 'share',
  'General Social Media': 'share',
};

export default function ForumTab() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, topicsData] = await Promise.all([
        apiClient.getForumCategories(),
        apiClient.getForumTopics(selectedCategory || undefined, 0, 20)
      ]);
      setCategories(categoriesData);
      setTopics(topicsData);
    } catch (error) {
      console.error('Error loading forum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCategoryPress = async (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    try {
      const topicsData = await apiClient.getForumTopics(categoryId || undefined, 0, 20);
      setTopics(topicsData);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = () => {
    if (!user) {
      Alert.alert('Hata', 'Konu oluşturmak için giriş yapmanız gerekiyor');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Hata', 'Lütfen önce bir kategori seçin');
      return;
    }

    // Navigate to create topic page
    Alert.alert('Bilgi', 'Konu oluşturma sayfası yakında aktif olacak');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderCategory = (category: ForumCategory) => {
    const isSelected = selectedCategory === category.id;
    const name = language === 'tr' ? category.name : category.name_en;
    const description = language === 'tr' ? category.description : category.description_en;
    const iconName = CATEGORY_ICONS[name] || 'forum';

    return (
      <Pressable
        key={category.id}
        style={[styles.categoryCard, isSelected && styles.selectedCategory]}
        onPress={() => handleCategoryPress(category.id)}
        android_ripple={{ color: colors.primary + '20' }}
      >
        <LinearGradient
          colors={isSelected ? colors.gradient.primary : [colors.surface, colors.surface]}
          style={styles.categoryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.categoryIcon}>
            <Ionicons 
              name={iconName as any} 
              size={24} 
              color={isSelected ? 'white' : colors.primary} 
            />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, { color: isSelected ? 'white' : colors.text }]}>
              {name}
            </Text>
            <Text style={[styles.categoryDescription, { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
              {description}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  const renderTopic = (topic: ForumTopic) => (
    <Pressable
      key={topic.id}
      style={styles.topicCard}
      android_ripple={{ color: colors.primary + '20' }}
    >
      <View style={styles.topicHeader}>
        <Text style={styles.topicTitle} numberOfLines={2}>
          {topic.title}
        </Text>
        {topic.is_pinned && (
          <MaterialIcons name="push-pin" size={16} color={colors.warning} />
        )}
      </View>
      
      <Text style={styles.topicContent} numberOfLines={3}>
        {topic.content}
      </Text>
      
      <View style={styles.topicFooter}>
        <View style={styles.topicStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="chat-bubble-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{topic.replies_count}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="visibility" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{topic.views_count}</Text>
          </View>
        </View>
        <Text style={styles.topicDate}>{formatDate(topic.created_at)}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forum</Text>
        <GradientButton
          title="Konu Oluştur"
          onPress={handleCreateTopic}
          size="small"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kategoriler</Text>
            <Pressable
              onPress={() => handleCategoryPress(null)}
              style={[styles.allButton, !selectedCategory && styles.selectedAll]}
            >
              <Text style={[styles.allButtonText, !selectedCategory && styles.selectedAllText]}>
                Tümü
              </Text>
            </Pressable>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            <View style={styles.categoriesList}>
              {categories.map(renderCategory)}
            </View>
          </ScrollView>
        </View>

        {/* Topics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.[language === 'tr' ? 'name' : 'name_en'] + ' - Konular'
              : 'Tüm Konular'
            }
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Konular yükleniyor...</Text>
            </View>
          ) : topics.length > 0 ? (
            <View style={styles.topicsList}>
              {topics.map(renderTopic)}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="forum" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Henüz konu yok</Text>
              <Text style={styles.emptySubtitle}>
                {selectedCategory 
                  ? 'Bu kategoride henüz konu oluşturulmamış'
                  : 'İlk konuyu sen oluştur!'
                }
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
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  allButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedAll: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  allButtonText: {
    fontSize: 12,
    color: colors.text,
  },
  selectedAllText: {
    color: 'white',
  },
  categoriesScroll: {
    marginHorizontal: -16,
  },
  categoriesList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedCategory: {
    // Additional styles for selected category
  },
  categoryGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    lineHeight: 16,
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
  },
  topicsList: {
    gap: 12,
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  topicContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  topicDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});