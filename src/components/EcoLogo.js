import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

// साफ़ logo tile. The artwork already contains the app name, so no separate title is drawn.
export default function EcoLogo({ size = 110 }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/saaf-logo.png')}
        style={{ width: size, height: size, borderRadius: size * 0.22 }}
        accessibilityLabel="साफ़"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
});
