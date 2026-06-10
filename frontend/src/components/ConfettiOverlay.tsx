import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const COLORS = ['#E878A0', '#9B7ED8', '#7EC8A8', '#F5C6D0', '#B8D4E3', '#F8D56E', '#FF9FBB'];

function Particle({ x, delay }: { x: number; delay: number }) {
  const animY = useRef(new Animated.Value(-20)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const animR = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = 6 + Math.random() * 8;
  const drift = (Math.random() - 0.5) * 80;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animY, { toValue: height + 20, duration: 1800 + Math.random() * 800, delay, useNativeDriver: true }),
      Animated.timing(animX, { toValue: drift, duration: 1800 + Math.random() * 800, delay, useNativeDriver: true }),
      Animated.timing(animR, { toValue: Math.PI * (2 + Math.random() * 4), duration: 1800 + Math.random() * 800, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, delay: delay + 1200, useNativeDriver: true }),
    ]).start();
  }, []);

  const shape = Math.random() > 0.5 ? 'circle' : 'square';

  return (
    <Animated.View
      style={[styles.particle, {
        left: x,
        width: size,
        height: shape === 'circle' ? size : size * 0.7,
        borderRadius: shape === 'circle' ? size / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: animY }, { translateX: animX }, { rotate: animR.interpolate({ inputRange: [0, Math.PI * 2], outputRange: ['0deg', '720deg'] }) }],
      }]}
    />
  );
}

export function ConfettiOverlay() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    delay: i * 30 + Math.random() * 100,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => <Particle key={p.id} x={p.x} delay={p.delay} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: { position: 'absolute', top: 0 },
});
