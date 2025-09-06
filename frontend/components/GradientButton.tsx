import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: string[];
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'accent';
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  gradient,
  disabled = false,
  size = 'medium',
  variant = 'primary',
}) => {
  const getGradient = () => {
    if (gradient) return gradient;
    
    switch (variant) {
      case 'secondary':
        return colors.gradient.secondary;
      case 'accent':
        return ['#FD79A8', '#6C5CE7'];
      default:
        return colors.gradient.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 16,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 12,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        getSizeStyles(),
        style,
        disabled && styles.disabled,
      ]}
      android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
    >
      <LinearGradient
        colors={disabled ? ['#666', '#666'] : getGradient()}
        style={[StyleSheet.absoluteFill, { borderRadius: getSizeStyles().borderRadius }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text
        style={[
          styles.text,
          {
            fontSize: getTextSize(),
            opacity: disabled ? 0.5 : 1,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
});