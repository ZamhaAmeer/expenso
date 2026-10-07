import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Safe cross-platform animation driver
const useNativeDriver = Platform.OS !== 'web';

// Generate static star particles matching screenshot
const STARS = [
  { id: 1, x: width * 0.15, y: height * 0.12, size: 2, opacity: 0.8 },
  { id: 2, x: width * 0.35, y: height * 0.08, size: 1.5, opacity: 0.6 },
  { id: 3, x: width * 0.75, y: height * 0.05, size: 2.5, opacity: 0.9 },
  { id: 4, x: width * 0.88, y: height * 0.11, size: 1.8, opacity: 0.5 },
  { id: 5, x: width * 0.90, y: height * 0.27, size: 2, opacity: 0.4 },
  { id: 6, x: width * 0.10, y: height * 0.49, size: 2.2, opacity: 0.85 },
  { id: 7, x: width * 0.70, y: height * 0.61, size: 2, opacity: 0.7 },
  { id: 8, x: width * 0.84, y: height * 0.75, size: 1.8, opacity: 0.6 },
  { id: 9, x: width * 0.32, y: height * 0.90, size: 2, opacity: 0.5 },
  { id: 10, x: width * 0.87, y: height * 0.86, size: 1.5, opacity: 0.7 },
];

export default function GetStartedScreen({ navigation, onGetStarted, onSignIn }) {
  // Animation References - Separated for staggered sequence
  const logoFade = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  const logoFloat = useRef(new Animated.Value(0)).current;
  const orbitSpin = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Staggered Entrance Sequence matching the video
    Animated.sequence([
      Animated.delay(800), // Show only background initially
      Animated.timing(logoFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver,
      }),
      Animated.delay(300), // Slight pause before text
      Animated.timing(textFade, {
        toValue: 1,
        duration: 1800, // Luxurious slow transition from left to right
        easing: Easing.out(Easing.quad),
        useNativeDriver,
      }),
      Animated.delay(300), // Slight pause before button
      Animated.timing(buttonFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver,
      }),
    ]).start();

    // 2. Subtle Floating Animation for Central 3D Emblem
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -8,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
        Animated.timing(logoFloat, {
          toValue: 6,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
      ])
    ).start();

    // 3. Gentle Slow Orbital Rotation
    Animated.loop(
      Animated.timing(orbitSpin, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver,
      })
    ).start();
  }, []);

  const spin = orbitSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Staggered Letter-by-Letter reveal interpolations for "Expenso" (7 letters)
  const appTitleLetters = ['E', 'x', 'p', 'e', 'n', 's', 'o'];
  const totalLetters = appTitleLetters.length;

  const letterInterpolations = appTitleLetters.map((_, i) => {
    const start = (i / totalLetters) * 0.65;
    const end = Math.min(1, start + 0.25);
    return {
      opacity: textFade.interpolate({
        inputRange: [start, end],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      translateX: textFade.interpolate({
        inputRange: [start, end],
        outputRange: [-40, 0],
        extrapolate: 'clamp',
      }),
    };
  });

  // Subtext entrance interpolation following letter reveal
  const subtitleOpacity = textFade.interpolate({
    inputRange: [0.55, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const subtitleTranslateX = textFade.interpolate({
    inputRange: [0.55, 1],
    outputRange: [-60, 0],
    extrapolate: 'clamp',
  });

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver,
    }).start();
  };

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else if (navigation) {
      navigation.navigate('Auth', { isSignUp: false });
    }
  };

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else if (navigation) {
      navigation.navigate('Auth', { isSignUp: false });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050714" />

      {/* Deep Midnight Blue/Dark Cosmic Background */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#070D26', '#0A1233', '#040612']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Blue Nebular Glow on Upper Left */}
        <View style={styles.blueNebula} />

        {/* Golden Warm Glow Behind Center Orbital Ring */}
        <View style={styles.goldNebula} />

        {/* Background Star Particles */}
        {STARS.map((star) => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>

          {/* HERO SECTION: Center Orbital Graphic & 3D Emblem */}
          <Animated.View style={[styles.heroContainer, { opacity: logoFade }]}>

            {/* Outer Rotating Orbital Rings & Planet Dots */}
            <Animated.View
              style={[
                styles.orbitalWrapper,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <Svg width={280} height={280}>
                <Defs>
                  <SvgGradient id="orbitLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
                    <Stop offset="50%" stopColor="#F59E0B" stopOpacity="0.25" />
                    <Stop offset="100%" stopColor="#2563EB" stopOpacity="0.5" />
                  </SvgGradient>
                </Defs>

                {/* Outer Fine Dashed Orbit Ring */}
                <Circle
                  cx="140"
                  cy="140"
                  r="125"
                  stroke="url(#orbitLineGrad)"
                  strokeWidth="1.2"
                  strokeDasharray="4 5"
                  fill="none"
                />

                {/* Inner Concentric Solid Orbit Ring */}
                <Circle
                  cx="140"
                  cy="140"
                  r="98"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                  fill="none"
                />

                {/* Top Yellow Planet Dot */}
                <Circle cx="140" cy="15" r="4.5" fill="#FBBF24" />

                {/* Bottom Cyan Planet Dot */}
                <Circle cx="140" cy="265" r="4.5" fill="#06B6D4" />

                {/* Small Yellow Accent Star Dot */}
                <Circle cx="145" cy="290" r="2" fill="#FBBF24" opacity="0.8" />
              </Svg>
            </Animated.View>

            {/* Central 3D Golden Logo Emblem */}
            <Animated.View
              style={[
                styles.logoWrapper,
                { transform: [{ translateY: logoFloat }] },
              ]}
            >
              <Image
                source={require('../../assets/logo_expenso.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>

          {/* TEXT SECTION: Letter-by-Letter Staggered Reveal Animation */}
          <View style={styles.textSection}>
            {/* "Expenso" Title - Letter by Letter */}
            <View style={styles.titleRow}>
              {appTitleLetters.map((char, index) => (
                <Animated.Text
                  key={index}
                  style={[
                    styles.appTitleLetter,
                    {
                      opacity: letterInterpolations[index].opacity,
                      transform: [{ translateX: letterInterpolations[index].translateX }],
                    },
                  ]}
                >
                  {char}
                </Animated.Text>
              ))}
            </View>

            {/* Subtitle Line */}
            <Animated.Text
              style={[
                styles.appSubtitle,
                {
                  opacity: subtitleOpacity,
                  transform: [{ translateX: subtitleTranslateX }],
                },
              ]}
            >
              Intelligent wealth tracking & expense intelligence in Sri Lankan Rupees.
            </Animated.Text>
          </View>

          {/* ACTION SECTION: Button & Sign In Link */}
          <Animated.View style={[styles.actionSection, { opacity: buttonFade }]}>

            {/* Primary Gradient Pill Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleGetStarted}
              style={styles.buttonTouch}
            >
              <Animated.View
                style={[
                  styles.buttonGlowContainer,
                  { transform: [{ scale: buttonScale }] },
                ]}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB', '#D97706', '#EAB308']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.arrowIcon} />
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>


          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040612',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: height * 0.06,
    paddingBottom: height * 0.04,
  },

  /* Background Glows */
  blueNebula: {
    position: 'absolute',
    top: height * 0.06,
    left: -70,
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    backgroundColor: '#1E40AF',
    opacity: 0.25,
  },
  goldNebula: {
    position: 'absolute',
    top: height * 0.22,
    right: -40,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#B45309',
    opacity: 0.2,
  },

  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },

  /* Hero Orbital Section */
  heroContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: height * 0.02,
  },
  orbitalWrapper: {
    position: 'absolute',
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 8,
  },
  logoImage: {
    width: 100,
    height: 100,
  },

  /* Text Section */
  textSection: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appTitleLetter: {
    fontSize: 38,
    fontWeight: '900',
    fontFamily: Platform.select({
      ios: 'Avenir-Black',
      android: 'sans-serif-condensed',
      web: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }),
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  appSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  /* Action Section */
  actionSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  buttonTouch: {
    width: '100%',
  },
  buttonGlowContainer: {
    width: '100%',
    borderRadius: 30,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  gradientButton: {
    width: '100%',
    height: 56,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  arrowIcon: {
    marginTop: 1,
  },


});