import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // Smooth 0.5s fade out
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image
        source={require('../../assets/dummylogofinal.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // flex fill instead of absoluteFill: this renders at the app root, where an absolute
  // child can collapse to its content height and leave the rest of the screen white
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#65a30d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});