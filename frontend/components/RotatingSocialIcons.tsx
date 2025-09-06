import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';

const { width } = Dimensions.get('window');

const SOCIAL_ICONS = [
  { name: 'logo-instagram', color: '#E4405F', angle: 0 },
  { name: 'logo-twitter', color: '#1DA1F2', angle: 90 },
  { name: 'logo-tiktok', color: '#000000', angle: 180 },
  { name: 'logo-youtube', color: '#FF0000', angle: 270 },
];

export const RotatingSocialIcons: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Rotation animation
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000, // 20 seconds for full rotation
        useNativeDriver: true,
      })
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    rotationAnimation.start();
    pulseAnimation.start();

    return () => {
      rotationAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderIcon = (icon: typeof SOCIAL_ICONS[0], index: number) => {
    const radius = 80;
    const angle = (icon.angle * Math.PI) / 180;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    return (
      <Animated.View
        key={icon.name}
        style={[
          styles.iconContainer,
          {
            transform: [
              { translateX: x },
              { translateY: y },
              { scale: pulseAnim },
              { rotate: rotateInterpolate },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[icon.color + '20', icon.color + '10']}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Center circle */}
      <LinearGradient
        colors={colors.gradient.primary}
        style={styles.centerCircle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="trending-up" size={32} color="white" />
      </LinearGradient>

      {/* Rotating icons */}
      <Animated.View
        style={[
          styles.rotatingContainer,
          {
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      >
        {SOCIAL_ICONS.map(renderIcon)}
      </Animated.View>

      {/* Orbit ring */}
      <View style={styles.orbitRing} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rotatingContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  orbitRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
});