import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence,
  withTiming 
} from 'react-native-reanimated';

interface VipCrownProps {
  size?: 'small' | 'medium' | 'large';
  vipLevel?: 'starter' | 'pro' | 'premium';
  animated?: boolean;
}

export function VipCrown({ 
  size = 'medium', 
  vipLevel = 'starter', 
  animated = true 
}: VipCrownProps) {
  const sparkle = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      sparkle.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animated ? 0.7 + (sparkle.value * 0.3) : 1,
      transform: [{
        scale: animated ? 1 + (sparkle.value * 0.1) : 1
      }]
    };
  });

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { container: 16, icon: 12 };
      case 'large':
        return { container: 32, icon: 24 };
      default:
        return { container: 24, icon: 16 };
    }
  };

  const getVipColors = () => {
    switch (vipLevel) {
      case 'starter':
        return ['#3498DB', '#2980B9']; // Blue
      case 'pro':
        return ['#F39C12', '#E67E22']; // Orange
      case 'premium':
        return ['#FFD700', '#FFA500']; // Gold
      default:
        return ['#3498DB', '#2980B9'];
    }
  };

  const { container, icon } = getSizeConfig();
  const colors = getVipColors();

  return (
    <Animated.View style={[animatedStyle]}>
      <LinearGradient
        colors={colors}
        style={[
          styles.crownContainer,
          {
            width: container,
            height: container,
            borderRadius: container / 2,
          }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialIcons 
          name="workspace-premium" 
          size={icon} 
          color="white"
        />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  crownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});