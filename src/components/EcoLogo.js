import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function EcoLogo({ size = 110, showTitle = true }) {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <LinearGradient id="greenGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8CC63F" />
            <Stop offset="100%" stopColor="#4E8C2B" />
          </LinearGradient>
          <LinearGradient id="greenGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#1E4D2B" />
            <Stop offset="100%" stopColor="#3E7D32" />
          </LinearGradient>
        </Defs>

        {/* Outer subtle shadow / glow circle */}
        <Circle cx="60" cy="60" r="54" fill="#E8F4D9" opacity="0.4" />

        {/* Top/Right curved leaf arrow shape (EcoShift emblem) */}
        <Path
          d="M60 14 C82 14 98 30 100 52 C96 50 88 48 78 52 C64 57 56 68 44 72 C36 74 28 72 22 68 C24 40 40 14 60 14 Z"
          fill="url(#greenGrad1)"
        />

        {/* Bottom/Left interlocking curved arrow shape */}
        <Path
          d="M60 106 C38 106 22 90 20 68 C24 70 32 72 42 68 C56 63 64 52 76 48 C84 46 92 48 98 52 C96 80 80 106 60 106 Z"
          fill="url(#greenGrad2)"
        />

        {/* Center recycle arrow accents */}
        <Path
          d="M48 38 L60 26 L52 24 C72 20 86 32 88 44 L80 42 C78 34 68 26 52 30 L56 34 Z"
          fill="#FFFFFF"
          opacity="0.9"
        />
        <Path
          d="M72 82 L60 94 L68 96 C48 100 34 88 32 76 L40 78 C42 86 52 94 68 90 L64 86 Z"
          fill="#FFFFFF"
          opacity="0.9"
        />
      </Svg>

      {showTitle && (
        <View style={styles.titleContainer}>
          <Text style={styles.titleEco}>Eco</Text>
          <Text style={styles.titleShift}>Shift</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  titleEco: {
    fontSize: 34,
    fontWeight: '800',
    color: '#23532B', // Deep forest eco green
    letterSpacing: -0.5,
  },
  titleShift: {
    fontSize: 34,
    fontWeight: '800',
    color: '#84C236', // Vibrant leaf green
    letterSpacing: -0.5,
  },
});
