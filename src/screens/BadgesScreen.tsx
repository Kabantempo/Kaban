import React from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, SafeAreaView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppData, BADGES, BadgeDef } from '../types';
import { T } from '../theme';

const RARITY: Record<BadgeDef['rarity'], { color: string; label: string; glow: string }> = {
  common:    { color: '#6B7280', label: 'Commun',    glow: 'rgba(107,114,128,0.2)' },
  rare:      { color: '#3B82F6', label: 'Rare',      glow: 'rgba(59,130,246,0.2)'  },
  epic:      { color: '#8B5CF6', label: 'Épique',    glow: 'rgba(139,92,246,0.22)' },
  legendary: { color: '#F59E0B', label: 'Légendaire',glow: 'rgba(245,158,11,0.22)' },
};

function BadgeCard({ badge, earned }: { badge: BadgeDef; earned: boolean }) {
  const r = RARITY[badge.rarity];
  return (
    <View style={[
      styles.card,
      earned
        ? { borderColor: r.color + '55', backgroundColor: r.glow as any }
        : { borderColor: T.border, backgroundColor: T.card },
    ]}>
      <View style={[
        styles.iconCircle,
        { backgroundColor: earned ? r.color + '20' : T.cardAlt },
      ]}>
        {earned
          ? <Ionicons name={badge.icon as any} size={26} color={r.color} />
          : <Ionicons name="lock-closed-outline" size={20} color={T.text3} />
        }
      </View>

      <Text style={[styles.name, !earned && { opacity: 0.3 }]}>{badge.name}</Text>
      <Text style={[styles.desc, !earned && { opacity: 0.25 }]} numberOfLines={2}>
        {badge.description}
      </Text>

      {earned
        ? (
          <View style={[styles.tag, { backgroundColor: r.color + '22', borderColor: r.color + '55' }]}>
            <Text style={[styles.tagText, { color: r.color }]}>{r.label}</Text>
          </View>
        )
        : (
          <View style={[styles.tag, { borderColor: T.border }]}>
            <Text style={[styles.tagText, { color: T.text3 }]}>Verrouillé</Text>
          </View>
        )
      }
    </View>
  );
}

export default function BadgesScreen({ data }: { data: AppData }) {
  const earned      = new Set(data.earnedBadges ?? []);
  const total       = BADGES.length;
  const earnedCount = BADGES.filter(b => earned.has(b.id)).length;
  const pct         = total > 0 ? earnedCount / total : 0;

  const sorted = [...BADGES].sort((a, b) => (earned.has(a.id) ? 0 : 1) - (earned.has(b.id) ? 0 : 1));

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      <LinearGradient colors={['#0C1F0E', '#0F1810', T.bg]} style={styles.header}>
        <Text style={styles.title}>Badges</Text>
        <Text style={styles.subtitle}>{earnedCount} / {total} débloqués</Text>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[T.accent, T.accentSoft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any }]}
          />
        </View>
        <Text style={styles.pctText}>{Math.round(pct * 100)}%</Text>
      </LinearGradient>

      <FlatList
        data={sorted}
        keyExtractor={b => b.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <BadgeCard badge={item} earned={earned.has(item.id)} />}
        ListFooterComponent={<View style={{ height: 110 }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    paddingTop: 56, paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  title:    { fontSize: 26, fontWeight: '900', color: T.text, letterSpacing: 1, marginBottom: 4 },
  subtitle: { fontSize: 13, color: T.text2, fontWeight: '600', marginBottom: 14 },
  progressTrack: {
    width: '80%', height: 5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  pctText: { fontSize: 11, color: T.text3, fontWeight: '700' },

  list: { paddingHorizontal: 12, paddingTop: 16 },
  row:  { justifyContent: 'space-between', marginBottom: 12 },

  card: {
    flex: 1, marginHorizontal: 4,
    borderRadius: 20, borderWidth: 1,
    padding: 16, alignItems: 'center',
    minHeight: 170, justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  cardGlow: {
    position: 'absolute', top: -20, left: -20,
    width: 120, height: 120, borderRadius: 60,
    opacity: 0.6,
  },
  iconCircle: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  name: { fontSize: 13, fontWeight: '800', color: T.text, textAlign: 'center', marginBottom: 4 },
  desc: { fontSize: 10, color: T.text2, textAlign: 'center', lineHeight: 14, marginBottom: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
