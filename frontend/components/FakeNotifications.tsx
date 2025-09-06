import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';

interface FakeNotification {
  id: string;
  type: 'boost' | 'join' | 'topic' | 'vip';
  message: string;
  icon: string;
  color: string;
  timestamp: Date;
}

export const FakeNotifications: React.FC = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<FakeNotification[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  const fakeData = [
    {
      type: 'boost' as const,
      messages: ['SocialGuru42', 'ContentKing', 'InfluencerPro', 'ViralMaster', 'TrendSetter'],
      icon: 'trending-up',
      color: colors.primary,
    },
    {
      type: 'join' as const,
      messages: ['CreatorNew', 'FreshUser', 'NewInfluencer', 'StarterAccount', 'BeginnersLuck'],
      icon: 'person-add',
      color: colors.success,
    },
    {
      type: 'topic' as const,
      messages: ['Instagram Algoritması 2025', 'TikTok Viral Teknikleri', 'YouTube Thumbnail İpuçları', 'Twitter Engagement Artırma'],
      icon: 'chat-bubble',
      color: colors.accent,
    },
    {
      type: 'vip' as const,
      messages: ['ProCreator', 'EliteUser', 'PremiumMember', 'VipInfluencer', 'GoldAccount'],
      icon: 'star',
      color: colors.warning,
    },
  ];

  useEffect(() => {
    const generateNotification = () => {
      const typeData = fakeData[Math.floor(Math.random() * fakeData.length)];
      const message = typeData.messages[Math.floor(Math.random() * typeData.messages.length)];
      
      let notificationText = '';
      switch (typeData.type) {
        case 'boost':
          notificationText = t('home.fakeNotifications.userBoosted').replace('{user}', message);
          break;
        case 'join':
          notificationText = t('home.fakeNotifications.userJoined').replace('{user}', message);
          break;
        case 'topic':
          notificationText = t('home.fakeNotifications.newTopic').replace('{topic}', message);
          break;
        case 'vip':
          notificationText = t('home.fakeNotifications.vipUpgrade').replace('{user}', message);
          break;
      }

      const newNotification: FakeNotification = {
        id: Date.now().toString(),
        type: typeData.type,
        message: notificationText,
        icon: typeData.icon,
        color: typeData.color,
        timestamp: new Date(),
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    };

    // Generate initial notifications
    generateNotification();
    
    // Generate new notification every 8-15 seconds
    const interval = setInterval(() => {
      generateNotification();
    }, Math.random() * 7000 + 8000);

    return () => clearInterval(interval);
  }, [t]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [notifications]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    
    if (minutes < 1) return 'şimdi';
    if (minutes < 60) return `${minutes}dk`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}s`;
    return `${Math.floor(hours / 24)}g`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.fakeNotifications.title')}</Text>
      
      <Animated.View style={[styles.notificationsList, { opacity: fadeAnim }]}>
        {notifications.map((notification, index) => (
          <Pressable 
            key={notification.id} 
            style={[styles.notificationItem, { opacity: 1 - (index * 0.2) }]}
            android_ripple={{ color: colors.primary + '20' }}
          >
            <View style={[styles.iconContainer, { backgroundColor: notification.color + '20' }]}>
              <Ionicons 
                name={notification.icon as any} 
                size={20} 
                color={notification.color} 
              />
            </View>
            
            <View style={styles.contentContainer}>
              <Text style={styles.message} numberOfLines={2}>
                {notification.message}
              </Text>
              <Text style={styles.timestamp}>
                {formatTime(notification.timestamp)}
              </Text>
            </View>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  notificationsList: {
    paddingHorizontal: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});