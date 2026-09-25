import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthNavigator from './src/auth';
import SplashScreen from './src/screens/SplashScreen';

// Main Screens
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import NgoScreen from './src/screens/NgoScreen';
import MapScreen from './src/screens/MapScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import RecycleAdviceScreen from './src/screens/RecycleAdviceScreen';
import DosDontsScreen from './src/screens/DosDontsScreen';
import ReportDumpScreen from './src/screens/ReportDumpScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TermsScreen from './src/screens/TermsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import ContactScreen from './src/screens/ContactScreen';
import AboutScreen from './src/screens/AboutScreen';
import { colors } from './src/globalStyles';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Placeholder for the camera tab; the tab press is intercepted, this only catches stray focus
function ScanLauncher({ navigation }) {
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        navigation.navigate('HomeTab');
        navigation.navigate('ScanCamera');
      }),
    [navigation]
  );
  return <View style={{ flex: 1, backgroundColor: '#000' }} />;
}

function MainAppTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabHeight = 60 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabHeight,
            paddingBottom: bottomInset,
            paddingTop: 8,
          },
        ],
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.65)',
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName = 'home';
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'NgoTab') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'MapTab') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'HistoryTab') iconName = focused ? 'time' : 'time-outline';

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="NgoTab" component={NgoScreen} />

      {/* Center Camera / Scanner Button: opens the full-screen scanner on the root stack.
          A live camera preview inside a tab can render black on Android. */}
      <Tab.Screen
        name="ScanTab"
        component={ScanLauncher}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ScanCamera');
          },
        })}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.scanButtonContainer, focused && styles.scanButtonContainerActive]}>
              <Ionicons
                name={focused ? "camera" : "camera-outline"}
                size={24}
                color={colors.white}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen name="MapTab" component={MapScreen} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  // If user is authenticated, render tab navigator + dynamic civic stack
  if (session?.user) {
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainAppTabs} />
        <RootStack.Screen name="ScanCamera" component={ScanScreen} options={{ animation: 'fade' }} />
        <RootStack.Screen name="MapTab" component={MapScreen} />
        <RootStack.Screen name="RecycleAdviceScreen" component={RecycleAdviceScreen} />
        <RootStack.Screen name="DosDontsScreen" component={DosDontsScreen} />
        <RootStack.Screen name="ReportDumpScreen" component={ReportDumpScreen} />
        <RootStack.Screen name="ProfileScreen" component={ProfileScreen} />
        <RootStack.Screen name="TermsScreen" component={TermsScreen} />
        <RootStack.Screen name="PrivacyScreen" component={PrivacyScreen} />
        <RootStack.Screen name="ContactScreen" component={ContactScreen} />
        <RootStack.Screen name="AboutScreen" component={AboutScreen} />
      </RootStack.Navigator>
    );
  }

  return <AuthNavigator initialScreen="Welcome" />;
}

export default function App() {
  const [isShowSplash, setIsShowSplash] = useState(true);

  if (isShowSplash) {
    return <SplashScreen onFinish={() => setIsShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.primary600,
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  scanButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary800,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  scanButtonContainerActive: {
    backgroundColor: '#14532D',
  },
});
