import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../theme';

export type TabName = 'home' | 'calendar' | 'labo' | 'tasks' | 'badges';

interface TabDef { id: TabName; icon: string; iconActive: string; label: string }
const TABS: TabDef[] = [
  { id: 'home',     icon: 'home-outline',         iconActive: 'home',              label: 'Habits' },
  { id: 'calendar', icon: 'calendar-outline',      iconActive: 'calendar',          label: 'Calendrier' },
  { id: 'labo',     icon: 'flask-outline',         iconActive: 'flask',             label: 'Labo' },
  { id: 'tasks',    icon: 'checkbox-outline',      iconActive: 'checkbox',          label: 'Tâches' },
  { id: 'badges',   icon: 'trophy-outline',        iconActive: 'trophy',            label: 'Badges' },
];

const SCREEN_W = Dimensions.get('window').width;
const TAB_W    = SCREEN_W / TABS.length;
const PILL_W   = TAB_W - 10;

interface Props { active: TabName; onChange: (tab: TabName) => void }

export default function TabBar({ active, onChange }: Props) {
  const activeIndex = TABS.findIndex(t => t.id === active);
  const pillAnim    = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(pillAnim, { toValue: activeIndex, tension: 60, friction: 12, useNativeDriver: true }).start();
  }, [activeIndex]);

  const pillX = pillAnim.interpolate({
    inputRange:  TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * TAB_W + 5),
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.pill, { width: PILL_W, transform: [{ translateX: pillX }] }]} />
      <View style={styles.bar}>
        {TABS.map(tab => {
          const isActive = active === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
              onPress={() => onChange(tab.id)}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={(isActive ? tab.iconActive : tab.icon) as any}
                size={20}
                color={isActive ? T.accentSoft : T.text3}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: T.card,
    borderTopWidth: 1, borderTopColor: T.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 24,
  },
  pill: {
    position: 'absolute', top: 7, height: 44,
    borderRadius: 12, backgroundColor: T.accentDim,
    borderWidth: 1, borderColor: T.accent + '33',
  },
  bar:  { flexDirection: 'row', paddingBottom: 20, paddingTop: 7 },
  tab:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 5 },
  label:       { fontSize: 8, color: T.text3, fontWeight: '600', letterSpacing: 0.1 },
  labelActive: { color: T.accentSoft },
});
