import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getXPProgress } from '../types';

const { width } = Dimensions.get('window');

interface Props {
  totalXP: number;
  completedToday: number;
  totalHabits: number;
}

export default function XPHeader({ totalXP, completedToday, totalHabits }: Props) {
  const { level, current, required, percent } = getXPProgress(totalXP);
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: percent,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const today = new Date();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const dateStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]}`;

  return (
    <LinearGradient colors={['#1A0533', '#0D1B4B']} style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.appTitle}>⚡ XP TRACKER</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
        <View style={styles.levelBadge}>
          <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.levelGradient}>
            <Text style={styles.levelLabel}>LVL</Text>
            <Text style={styles.levelNumber}>{level}</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.xpSection}>
        <View style={styles.xpLabelRow}>
          <Text style={styles.xpLabel}>Points d'expérience</Text>
          <Text style={styles.xpCount}>{current} / {required} XP</Text>
        </View>
        <View style={styles.barBackground}>
          <Animated.View style={[styles.barFill, { width: barWidth }]}>
            <LinearGradient
              colors={['#A855F7', '#6366F1', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <View style={styles.barGlow} />
        </View>
        <Text style={styles.totalXP}>{totalXP} XP total</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{completedToday}</Text>
          <Text style={styles.statLabel}>Complétées</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalHabits - completedToday}</Text>
          <Text style={styles.statLabel}>Restantes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalHabits}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  levelBadge: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  levelGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A0533',
    letterSpacing: 2,
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A0533',
    lineHeight: 30,
  },
  xpSection: {
    marginBottom: 20,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 12,
    color: '#A855F7',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  xpCount: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  barBackground: {
    height: 12,
    backgroundColor: '#1E1B4B',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  totalXP: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
