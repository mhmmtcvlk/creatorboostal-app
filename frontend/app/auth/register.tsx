import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/theme';
import { GradientButton } from '../../components/GradientButton';

const SECURITY_QUESTIONS = [
  'İlk evcil hayvanınızın adı neydi?',
  'Doğduğunuz şehir neresi?',
  'En sevdiğiniz öğretmeninizin soyadı neydi?',
  'İlk arabanızın markası neydi?',
  'Annenizin kızlık soyadı nedir?',
];

export default function Register() {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert(t('common.error'), 'Kullanıcı adı gerekli');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert(t('common.error'), 'E-posta gerekli');
      return false;
    }

    if (!formData.email.includes('@')) {
      Alert.alert(t('common.error'), 'Geçerli bir e-posta adresi girin');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert(t('common.error'), 'Şifre en az 6 karakter olmalı');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t('common.error'), 'Şifreler eşleşmiyor');
      return false;
    }

    if (!formData.securityQuestion.trim()) {
      Alert.alert(t('common.error'), 'Güvenlik sorusu seçin');
      return false;
    }

    if (!formData.securityAnswer.trim()) {
      Alert.alert(t('common.error'), 'Güvenlik cevabı gerekli');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const success = await register({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        security_question: formData.securityQuestion,
        security_answer: formData.securityAnswer.trim(),
        language: language,
      });

      if (success) {
        Alert.alert(
          t('common.success'),
          'Kayıt başarılı! 10 bonus kredi kazandınız.',
          [{ text: 'Tamam', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert(t('common.error'), t('auth.userExists'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('auth.register')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={colors.gradient.primary}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="trending-up" size={48} color="white" />
            </LinearGradient>
            <Text style={styles.logoText}>CreatorBoostal</Text>
            <Text style={styles.logoSubtext}>Hesap oluşturun</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.username')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  value={formData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  placeholder="Kullanıcı adınızı girin"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.email')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="E-posta adresinizi girin"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="Şifrenizi girin (min. 6 karakter)"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.confirmPassword')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  placeholder="Şifrenizi tekrar girin"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </Pressable>
              </View>
            </View>

            {/* Security Question */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.securityQuestion')}</Text>
              <Pressable 
                style={styles.inputWrapper}
                onPress={() => setShowQuestions(!showQuestions)}
              >
                <MaterialIcons name="help" size={20} color={colors.textSecondary} />
                <Text style={[styles.textInput, { color: formData.securityQuestion ? colors.text : colors.textSecondary }]}>
                  {formData.securityQuestion || 'Güvenlik sorusu seçin'}
                </Text>
                <Ionicons 
                  name={showQuestions ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </Pressable>
              
              {showQuestions && (
                <View style={styles.questionsContainer}>
                  {SECURITY_QUESTIONS.map((question, index) => (
                    <Pressable
                      key={index}
                      style={styles.questionItem}
                      onPress={() => {
                        handleInputChange('securityQuestion', question);
                        setShowQuestions(false);
                      }}
                    >
                      <Text style={styles.questionText}>{question}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Security Answer */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.securityAnswer')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="key" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  value={formData.securityAnswer}
                  onChangeText={(value) => handleInputChange('securityAnswer', value)}
                  placeholder="Güvenlik cevabınızı girin"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Register Button */}
            <GradientButton
              title={loading ? t('common.loading') : t('auth.register')}
              onPress={handleRegister}
              disabled={loading}
              size="large"
              style={styles.registerButton}
            />

            {/* Login Link */}
            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Zaten hesabınız var mı?</Text>
              <Pressable onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginLink}>{t('auth.login')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  logoSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  eyeButton: {
    padding: 4,
  },
  questionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  questionText: {
    fontSize: 14,
    color: colors.text,
  },
  registerButton: {
    marginVertical: 24,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loginText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});