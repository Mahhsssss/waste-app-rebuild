import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../globalStyles';

export default function SkeletonBentoCard({ isLarge = false }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeletonCard,
        isLarge ? styles.largeCard : styles.halfCard,
        { opacity },
      ]}
    >
      <View style={styles.headerBar} />
      <View style={styles.titleLine1} />
      <View style={styles.titleLine2} />
      <View style={styles.footerBar} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: colors.primary800,
    borderRadius: radius.xl,
    padding: spacing.base,
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  largeCard: { width: '100%', height: 170 },
  halfCard: { width: '100%', height: 140 },
  headerBar: {
    width: '35%',
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.xs,
  },
  titleLine1: {
    width: '85%',
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.xs,
    marginTop: 12,
  },
  titleLine2: {
    width: '60%',
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radius.xs,
    marginTop: 8,
  },
  footerBar: {
    width: '40%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radius.xs,
  },
});