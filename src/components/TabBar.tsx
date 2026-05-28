import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  active: 'home' | 'calendar';
  onChange: (tab: 'home' | 'calendar') => void;
}

export default function TabBar({ active, onChange }: Props) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={['#0D1B4B', '#1A0533']} style={styles.bar}>
        <TouchableOpacity style={styles.tab} onPress={() => onChange('home')}>
          <Text style={styles.icon}>🏠</Text>
          <Text style={[styles.label, active === 'home' && styles.labelActive]}>Habitudes</Text>
          {active === 'home' && <View style={styles.dot} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => onChange('calendar')}>
          <Text style={styles.icon}>📅</Text>
          <Text style={[styles.label, active === 'calendar' && styles.labelActive]}>Calendrier</Text>
          {active === 'calendar' && <View style={styles.dot} />}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
  },
  bar: {
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  icon: { fontSize: 22 },
  label: { fontSize: 11, color: '#475569', fontWeight: '600' },
  labelActive: { color: '#A855F7' },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#A855F7', marginTop: 2,
  },
});
