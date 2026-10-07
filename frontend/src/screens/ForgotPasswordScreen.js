import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen({ navigation }) {
  const [emailOrMobile, setEmailOrMobile] = useState('dilshan.perera@colombo.lk');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // 6-Digit OTP State
  const [otp, setOtp] = useState(['5', '8', '2', '', '', '']);
  const [activeOtpIndex, setActiveOtpIndex] = useState(3);
  const inputRefs = useRef([]);

  // Countdown timer state (starting at 48s)
  const [timerSeconds, setTimerSeconds] = useState(48);

  useEffect(() => {
    let interval = null;
    if (showVerifyModal && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showVerifyModal, timerSeconds]);

  const handleSendRecoveryCode = () => {
    setShowVerifyModal(true);
    setTimerSeconds(48);
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance to next input box
    if (text && index < 5) {
      setActiveOtpIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      setActiveOtpIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = () => {
    setTimerSeconds(48);
    setOtp(['5', '8', '2', '', '', '']);
    setActiveOtpIndex(3);
    Alert.alert('Code Resent 📩', 'A new 6-digit OTP code has been dispatched to your email.');
  };

  const handleVerifyAndProceed = () => {
    const fullCode = otp.join('');
    setShowVerifyModal(false);
    Alert.alert(
      'Email Verified! 🎉',
      'Your identity has been verified. You may now create a new password.',
      [
        {
          text: 'Proceed to Sign In',
          onPress: () => navigation?.navigate('Auth'),
        },
      ]
    );
  };

  const handleWhatsAppOTP = () => {
    setShowVerifyModal(true);
    setTimerSeconds(48);
  };

  const handleSMSOTP = () => {
    setShowVerifyModal(true);
    setTimerSeconds(48);
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
                {/* Golden 3D Emblem & Expenso Badge */}
                <Image
                  source={require('../../assets/logo_expenso.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <View style={styles.logoBadge}>
                  <Text style={styles.logoBadgeText}>Expenso</Text>
                </View>

                {/* Main Header Title */}
                <Text style={styles.headerTitle}>Reset your password</Text>

                {/* Subtitle */}
                <Text style={styles.headerSubtitle}>
                  Enter your registered email or mobile to receive a secure recovery verification code.
                </Text>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Form Card Overlay */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              {/* Email Address or Mobile Input Group */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Email Address or Mobile</Text>
                  <View style={styles.sslBadge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={11}
                      color="#0284C7"
                      style={styles.sslIcon}
                    />
                    <Text style={styles.sslBadgeText}>Verified SSL</Text>
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="at-outline"
                    size={18}
                    color="#0284C7"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="dilshan.perera@colombo.lk"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={emailOrMobile}
                    onChangeText={setEmailOrMobile}
                  />
                </View>

                {/* Helper Note Below Input */}
                <View style={styles.helperNoteRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color="#0284C7"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.helperNoteText}>
                    We'll send a 6-digit verification code to verify your identity.
                  </Text>
                </View>
              </View>

              {/* Primary Submit Button */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.submitButtonTouch}
                onPress={handleSendRecoveryCode}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.submitButton}
                >
                  <Text style={styles.submitButtonText}>Send Recovery Code</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.submitArrow} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider Line */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR ALTERNATIVE</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Alternative Recovery Option Buttons */}
              <View style={styles.alternativeRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.altButton}
                  onPress={handleWhatsAppOTP}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={styles.altIcon} />
                  <Text style={styles.altText}>WhatsApp OTP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.altButton}
                  onPress={handleSMSOTP}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0F172A" style={styles.altIcon} />
                  <Text style={styles.altText}>SMS (+94)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Password Link Below Card */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation?.navigate('Auth')}
              style={styles.footerLinkTouch}
            >
              <Text style={styles.footerLinkText}>
                Remember your password?{' '}
                <Text style={styles.footerLinkHighlight}>Sign in to Expenso</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Email Verification OTP Popup Badge Modal */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardContainer}
          >
            <View style={styles.modalSheetCard}>
              {/* Grab Bar Indicator */}
              <View style={styles.grabBar} />

              {/* Close Button Top Right */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowVerifyModal(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>

              {/* Mail Icon Circle */}
              <View style={styles.mailIconBox}>
                <Ionicons name="mail-outline" size={24} color="#2563EB" />
              </View>

              {/* Modal Title & Subtitle */}
              <Text style={styles.modalTitle}>Verify your Email</Text>
              <Text style={styles.modalSubtitle}>
                We've sent a 6-digit verification OTP to{' '}
                <Text style={styles.modalSubtitleEmail}>{emailOrMobile || 'dilshan.perera@colombo.lk'}</Text>
              </Text>

              {/* 6-Digit OTP Box Grid */}
              <View style={styles.otpGridRow}>
                {Array.from({ length: 6 }).map((_, idx) => {
                  const isFilled = Boolean(otp[idx]);
                  const isFocused = activeOtpIndex === idx;

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.otpBox,
                        isFilled && styles.otpBoxFilled,
                        isFocused && styles.otpBoxFocused,
                      ]}
                    >
                      <TextInput
                        ref={(ref) => (inputRefs.current[idx] = ref)}
                        style={styles.otpInputText}
                        maxLength={1}
                        keyboardType="number-pad"
                        value={otp[idx]}
                        onChangeText={(t) => handleOtpChange(t, idx)}
                        onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                        onFocus={() => setActiveOtpIndex(idx)}
                      />
                      {/* Active Cursor Indicator */}
                      {isFocused && !isFilled && (
                        <View style={styles.cursorBar} />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Resend Timer Text */}
              <View style={styles.timerRow}>
                <Text style={styles.timerBaseText}>Didn't receive code? </Text>
                {timerSeconds > 0 ? (
                  <Text style={styles.timerHighlightText}>
                    Resend in {formatTimer(timerSeconds)}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendCode} activeOpacity={0.7}>
                    <Text style={styles.resendActiveText}>Resend Now</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify & Proceed Button */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.verifyBtnTouch}
                onPress={handleVerifyAndProceed}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.verifyBtnGradient}
                >
                  <Text style={styles.verifyBtnText}>Verify & Proceed</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
    paddingBottom: 48,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  safeHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
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
    marginBottom: 14,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 30,
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
    paddingHorizontal: 16,
  },

  /* Form Card Overlay */
  cardContainer: {
    marginTop: -28,
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

  /* Inputs */
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sslIcon: {
    marginRight: 4,
  },
  sslBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
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

  /* Helper Note */
  helperNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 2,
  },
  helperNoteText: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 17,
  },

  /* Submit Button */
  submitButtonTouch: {
    marginTop: 14,
    borderRadius: 26,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
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

  /* Alternative Recovery Row */
  alternativeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  altButton: {
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
  altIcon: {
    marginRight: 8,
  },
  altText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },

  /* Footer Link Below Card */
  footerLinkTouch: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerLinkText: {
    fontSize: 13,
    color: '#64748B',
  },
  footerLinkHighlight: {
    color: '#2563EB',
    fontWeight: '700',
  },

  /* Verification Modal Overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalKeyboardContainer: {
    width: '100%',
  },
  modalSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    position: 'relative',
  },
  grabBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  closeBtn: {
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

  /* Mail Icon Circle */
  mailIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  /* Modal Titles */
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  modalSubtitleEmail: {
    fontWeight: '600',
    color: '#0F172A',
  },

  /* OTP Grid */
  otpGridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  otpBox: {
    width: 46,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  otpBoxFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  otpInputText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  cursorBar: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: '#2563EB',
    borderRadius: 1,
  },

  /* Timer Row */
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  timerBaseText: {
    fontSize: 12,
    color: '#64748B',
  },
  timerHighlightText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  resendActiveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    textDecorationLine: 'underline',
  },

  /* Verify & Proceed Button */
  verifyBtnTouch: {
    width: '100%',
    borderRadius: 26,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  verifyBtnGradient: {
    height: 54,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
