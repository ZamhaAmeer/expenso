import React from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Universal Floating Bottom Navigation Bar matching DashboardScreen design
 * @param {string} currentScreen - 'Dashboard' | 'Transactions' | 'Calendar' | 'AIChat' | 'Settings'
 * @param {object} navigation - React Navigation object
 */
export default function FloatingBottomNav({ currentScreen, navigation }) {
  const tabs = [
    {
      name: 'Dashboard',
      iconActive: 'home',
      iconInactive: 'home-outline',
      badge: true,
      onPress: () => {
        if (currentScreen !== 'Dashboard') {
          navigation?.navigate('Dashboard');
        }
      },
    },
    {
      name: 'Transactions',
      iconActive: 'bar-chart',
      iconInactive: 'bar-chart-outline',
      badge: true,
      onPress: () => {
        if (currentScreen !== 'Transactions') {
          navigation?.navigate('Transactions');
        }
      },
    },
    {
      name: 'Calendar',
      iconActive: 'calendar',
      iconInactive: 'calendar-outline',
      badge: true,
      onPress: () => {
        if (currentScreen !== 'Calendar') {
          navigation?.navigate('Calendar');
        }
      },
    },
    {
      name: 'AIChat',
      iconActive: 'sparkles',
      iconInactive: 'sparkles-outline',
      badge: true,
      onPress: () => {
        if (currentScreen !== 'AIChat') {
          navigation?.navigate('AIChat');
        }
      },
    },
    {
      name: 'Settings',
      iconActive: 'person',
      iconInactive: 'person-outline',
      badge: true,
      onPress: () => {
        if (currentScreen !== 'Settings') {
          navigation?.navigate('Settings');
        }
      },
    },
  ];

  return (
    <View style={styles.bottomNavContainer} pointerEvents="box-none">
      <View style={styles.floatingNavBar}>
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.name;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.navItem}
              onPress={tab.onPress}
              activeOpacity={0.8}
            >
              {isActive ? (
                <View style={styles.navActiveBadge}>
                  <Ionicons name={tab.iconActive} size={20} color="#FFFFFF" />
                </View>
              ) : (
                <Ionicons name={tab.iconInactive} size={22} color="#94A3B8" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  floatingNavBar: {
    width: width * 0.88,
    height: 62,
    backgroundColor: '#FFFFFF',
    borderRadius: 31,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  navItem: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActiveBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
