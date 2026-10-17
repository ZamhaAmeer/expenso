import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

export default function AuthScreen({ route, navigation }) {
  const initialIsSignUp = route?.params?.isSignUp ?? false;
  const [isLogin, setIsLogin] = useState(!initialIsSignUp);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const { login, register } = useContext(AuthContext);

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isStrongPassword = hasMinLength && hasNumber && hasSymbol;

  const handleSubmit = async () => {
    setErrorMsg('');
    const targetEmail = email.trim();
    const targetPassword = password;

    if (isLogin) {
      if (!targetEmail || !targetPassword) {
        setErrorMsg('Please enter both your email address and password.');
        return;
      }
    } else {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!targetEmail) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (!targetPassword) {
        setErrorMsg('Please create a secure password.');
        return;
      }
      if (targetPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (confirmPassword && targetPassword !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('You must agree to the Terms of Service & Privacy Policy.');
        return;
      }
    }

    try {
      setLoading(true);
      if (isLogin) {
        await login(targetEmail, targetPassword);
      } else {
        await register(name.trim(), targetEmail, targetPassword);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setErrorMsg(serverMsg);
      } else if (err.message && err.message.toLowerCase().includes('network')) {
        setErrorMsg('Unable to connect to Expenso server. Please verify backend is running.');
      } else {
        setErrorMsg('Authentication failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* Header Sky-Blue Section */}
          <LinearGradient
            colors={['#2563EB', '#3B82F6', '#60A5FA']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.headerGradient}
          >
            <SafeAreaView style={styles.safeHeader}>
              <View style={styles.headerContent}>
                {/* Emblem & Badge (Login mode) */}
                {isLogin && (
                  <>
                    <Image
                      source={require('../../assets/logo_expenso.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                    <View style={styles.logoBadge}>
                      <Text style={styles.logoBadgeText}>Expenso</Text>
                    </View>
                  </>
                )}

                {/* Main Header Title */}
                <Text style={styles.headerTitle}>
                  {isLogin ? 'Master your money' : 'Start your journey.'}
                </Text>

                {/* Subtitle */}
                <Text style={styles.headerSubtitle}>
                  {isLogin
                    ? 'Smart AI expense tracking & instant receipt auditing in Sri Lankan Rupees (Rs.)'
                    : 'Join thousands taking control of their money with AI expense tracking in Sri Lankan Rupees (Rs.).'}
                </Text>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Form Card Overlay */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>

              {/* Card Title for Register mode */}
              {!isLogin && (
                <Text style={styles.registerCardHeading}>Create your account</Text>
              )}

              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.errorBannerText}>{errorMsg}</Text>
                </View>
              ) : null}

              {isLogin && (
                <TouchableOpacity
                  style={styles.demoPill}
                  activeOpacity={0.7}
                  onPress={() => {
                    setEmail('dilshan.perera@colombo.lk');
                    setPassword('FintechSecure@2025!');
                    setErrorMsg('');
                  }}
                >
                  <Ionicons name="sparkles" size={13} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text style={styles.demoPillText}>Auto-fill Demo Credentials</Text>
                </TouchableOpacity>
              )}

              {/* Full Name Input (Register mode) */}
              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Dilshan Perera"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>
              )}

              {/* Email Address Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={[styles.sslBadge, !isLogin && styles.sslBadgeGreen]}>
                    <Ionicons
                      name="shield-checkmark"
                      size={11}
                      color={isLogin ? '#0284C7' : '#16A34A'}
                      style={styles.sslIcon}
                    />
                    <Text style={[styles.sslBadgeText, !isLogin && styles.sslBadgeTextGreen]}>
                      Verified SSL
                    </Text>
                  </View>
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name={isLogin ? "at-outline" : "mail-outline"}
                    size={18}
                    color={isLogin ? "#0284C7" : "#64748B"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="dilshan.perera@colombo.lk"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={isLogin ? "ExpensoLk@2025!" : "FintechSecure@2025!"}
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#64748B"
                      style={styles.eyeIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password Strength Card (Register mode) */}
              {!isLogin && (
                <View style={styles.strengthBox}>
                  <View style={styles.strengthHeader}>
                    <Text style={styles.strengthTitle}>Password strength</Text>
                    <View style={styles.strengthBadgeRow}>
                      <Ionicons name="shield-outline" size={13} color="#16A34A" style={{ marginRight: 4 }} />
                      <Text style={styles.strengthBadgeText}>
                        {isStrongPassword ? 'Strong' : password.length >= 6 ? 'Medium' : 'Weak'}
                      </Text>
                    </View>
                  </View>

                  {/* 4 Segmented Strength Bars */}
                  <View style={styles.strengthBarRow}>
                    <View style={[styles.strengthBar, { backgroundColor: '#3B82F6' }]} />
                    <View style={[styles.strengthBar, { backgroundColor: password.length >= 4 ? '#06B6D4' : '#E2E8F0' }]} />
                    <View style={[styles.strengthBar, { backgroundColor: password.length >= 6 ? '#10B981' : '#E2E8F0' }]} />
                    <View style={[styles.strengthBar, { backgroundColor: isStrongPassword ? '#059669' : '#E2E8F0' }]} />
                  </View>

                  {/* Validation Criteria Chips */}
                  <View style={styles.criteriaRow}>
                    <View style={styles.criteriaChip}>
                      <Ionicons
                        name={hasMinLength || password.length >= 8 ? "checkmark-circle" : "ellipse-outline"}
                        size={13}
                        color={hasMinLength || password.length >= 8 ? "#16A34A" : "#94A3B8"}
                      />
                      <Text style={[styles.criteriaText, (hasMinLength || password.length >= 8) && styles.criteriaTextActive]}>
                        8+ chars
                      </Text>
                    </View>

                    <View style={styles.criteriaChip}>
                      <Ionicons
                        name={hasNumber ? "checkmark-circle" : "ellipse-outline"}
                        size={13}
                        color={hasNumber ? "#16A34A" : "#94A3B8"}
                      />
                      <Text style={[styles.criteriaText, hasNumber && styles.criteriaTextActive]}>
                        Number
                      </Text>
                    </View>

                    <View style={styles.criteriaChip}>
                      <Ionicons
                        name={hasSymbol ? "checkmark-circle" : "ellipse-outline"}
                        size={13}
                        color={hasSymbol ? "#16A34A" : "#94A3B8"}
                      />
                      <Text style={[styles.criteriaText, hasSymbol && styles.criteriaTextActive]}>
                        Symbol (@#$)
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Confirm Password Input (Register mode) */}
              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="refresh-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="FintechSecure@2025!"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color="#64748B"
                        style={styles.eyeIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Login Options Row (Remember me & Forgot password) */}
              {isLogin ? (
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberRow}
                    activeOpacity={0.7}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation?.navigate('ForgotPassword')}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Terms & Privacy Checkbox Row (Register mode) */
                <View style={styles.termsRow}>
                  <TouchableOpacity
                    style={styles.checkboxTouch}
                    activeOpacity={0.7}
                    onPress={() => setAgreeTerms(!agreeTerms)}
                  >
                    <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                      {agreeTerms && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink} onPress={() => setShowPrivacyModal(true)}>
                      Terms of Service
                    </Text>{' '}
                    &{' '}
                    <Text style={styles.termsLink} onPress={() => setShowPrivacyModal(true)}>
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </View>
              )}

              {/* Primary Submit Button */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.submitButtonTouch,
                  (!isLogin && !agreeTerms) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading || (!isLogin && !agreeTerms)}
              >
                <LinearGradient
                  colors={
                    (!isLogin && !agreeTerms)
                      ? ['#94A3B8', '#64748B']
                      : ['#2563EB', '#1D4ED8']
                  }
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        {isLogin ? 'Sign In to Expenso' : 'Create Account'}
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.submitArrow} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider Line */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {isLogin ? 'OR CONTINUE WITH' : 'OR SIGN UP WITH'}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialRow}>
                <TouchableOpacity activeOpacity={0.8} style={styles.socialButton}>
                  <Ionicons name="logo-google" size={18} color="#EA4335" style={styles.socialIcon} />
                  <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.8} style={styles.socialButton}>
                  <Ionicons name="logo-apple" size={18} color="#0F172A" style={styles.socialIcon} />
                  <Text style={styles.socialText}>Apple</Text>
                </TouchableOpacity>
              </View>

              {/* Account Switch Link inside Card */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg('');
                }}
                style={styles.switchTouchCard}
              >
                <Text style={styles.switchTextCard}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={styles.switchHighlightCard}>
                    {isLogin ? 'Create account' : 'Sign in >'}
                  </Text>
                </Text>
              </TouchableOpacity>

            </View>

            {/* AES Security Badge below Card */}
            <View style={styles.securityRowFooter}>
              <Ionicons name="lock-closed-outline" size={12} color="#94A3B8" style={styles.securityIcon} />
              <Text style={styles.securityTextFooter}>
                Secured with bank-grade 256-bit AES encryption
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Terms of Service & Privacy Policy Popup Badge Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.policyModalOverlay}>
          <View style={styles.policyModalSheet}>
            {/* Grab Bar Indicator */}
            <View style={styles.policyGrabBar} />

            {/* Close Button Top Right */}
            <TouchableOpacity
              style={styles.policyCloseBtn}
              onPress={() => setShowPrivacyModal(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Shield Icon Box */}
            <View style={styles.policyShieldBox}>
              <Ionicons name="shield-checkmark-outline" size={26} color="#2563EB" />
            </View>

            {/* Header Titles */}
            <Text style={styles.policyModalTitle}>Terms & Privacy Policy</Text>
            <View style={styles.policyBadgePill}>
              <Ionicons name="lock-closed" size={11} color="#0284C7" style={{ marginRight: 4 }} />
              <Text style={styles.policyBadgeText}>Bank-Grade 256-Bit AES Encryption</Text>
            </View>

            {/* Scrollable Policy Content */}
            <ScrollView style={styles.policyScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.policySection}>
                <View style={styles.policyHeadingRow}>
                  <Ionicons name="shield" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.policySectionHeading}>1. Data Protection & Privacy</Text>
                </View>
                <Text style={styles.policySectionText}>
                  Expenso strictly complies with the Sri Lankan Personal Data Protection Act (PDPA). Your financial records, personal income, and transaction details are processed solely for your personal wealth tracking and are never sold, rented, or shared with third-party advertisers.
                </Text>
              </View>

              <View style={styles.policySection}>
                <View style={styles.policyHeadingRow}>
                  <Ionicons name="lock-closed" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.policySectionHeading}>2. Financial Security & Encryption</Text>
                </View>
                <Text style={styles.policySectionText}>
                  All communication between your device and our servers is secured using TLS 1.3 and bank-grade 256-bit AES encryption. Sensitive authentication credentials and biometrics are stored inside secure system hardware keychains.
                </Text>
              </View>

              <View style={styles.policySection}>
                <View style={styles.policyHeadingRow}>
                  <Ionicons name="hardware-chip" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.policySectionHeading}>3. AI Optical Scanning & Processing</Text>
                </View>
                <Text style={styles.policySectionText}>
                  Optical receipt scans and AI natural language chat prompts are processed strictly to extract itemized merchant details and auto-categorize your expenses. Raw receipt images are purged automatically after OCR parsing.
                </Text>
              </View>

              <View style={styles.policySection}>
                <View style={styles.policyHeadingRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.policySectionHeading}>4. User Control & Data Rights</Text>
                </View>
                <Text style={styles.policySectionText}>
                  You retain full ownership of your data. You can clear local receipt caches, export monthly statements to Excel/PDF, or request complete account deletion at any time in the Settings menu.
                </Text>
              </View>
            </ScrollView>

            {/* Accept & Agree Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.policyAgreeBtnTouch}
              onPress={() => {
                setAgreeTerms(true);
                setShowPrivacyModal(false);
              }}
            >
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.policyAgreeBtnGradient}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.policyAgreeBtnText}>I Understand & Agree</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollContent: {
    flexGrow: 1,
  },
  keyboardView: {
    flex: 1,
  },

  /* Header Section */
  headerGradient: {
    paddingBottom: 44,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  safeHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logoImage: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  logoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 12,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  /* Form Card Overlay */
  cardContainer: {
    marginTop: -26,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  registerCardHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  demoPillText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Inputs */
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  sslBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  sslIcon: {
    marginRight: 4,
  },
  sslBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  sslBadgeTextGreen: {
    color: '#16A34A',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F7FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },

  /* Password Strength Box */
  strengthBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  strengthBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  criteriaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  criteriaChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
    fontWeight: '500',
  },
  criteriaTextActive: {
    color: '#16A34A',
    fontWeight: '600',
  },

  /* Login Options Row */
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxTouch: {
    padding: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  rememberText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },

  /* Terms Row (Register mode) */
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  termsText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: '#2563EB',
    fontWeight: '600',
  },

  /* Submit Button */
  submitButtonTouch: {
    marginTop: 12,
    borderRadius: 26,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.05,
    elevation: 2,
  },
  submitButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  submitArrow: {
    marginTop: 1,
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginHorizontal: 12,
  },

  /* Social Buttons */
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },

  /* Switch Touch Inside Card */
  switchTouchCard: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchTextCard: {
    fontSize: 13,
    color: '#64748B',
  },
  switchHighlightCard: {
    color: '#2563EB',
    fontWeight: '700',
  },

  /* AES Security Row Below Card */
  securityRowFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  securityIcon: {
    marginRight: 6,
  },
  securityTextFooter: {
    fontSize: 12,
    color: '#94A3B8',
  },

  /* Privacy Policy Modal Styles */
  policyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  policyModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    position: 'relative',
  },
  policyGrabBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  policyCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyShieldBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  policyModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  policyBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  policyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  policyScrollBody: {
    width: '100%',
    marginBottom: 16,
  },
  policySection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  policyHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  policySectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  policySectionText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
  policyAgreeBtnTouch: {
    width: '100%',
    borderRadius: 26,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  policyAgreeBtnGradient: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyAgreeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
