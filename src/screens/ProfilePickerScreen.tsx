import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, StatusBar, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AllProfiles, Profile, HABIT_COLORS } from '../types';
import { createProfile, hashPassword, saveAllProfiles } from '../utils/storage';
import { T } from '../theme';

const { width } = Dimensions.get('window');
const COLS      = 3;
const CARD_SIZE = Math.floor((width - 48 - (COLS - 1) * 16) / COLS);
const MAX_PROFILES = 6;

const AVATAR_COLORS = HABIT_COLORS;

function avatarColor(p: Profile) {
  return /^#[0-9A-Fa-f]{6}$/.test(p.emoji) ? p.emoji : AVATAR_COLORS[0];
}

function ProfileCard({
  profile,
  onPress,
}: {
  profile: Profile;
  onPress: () => void;
}) {
  const color = avatarColor(profile);
  const hasPassword = !!profile.password;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.cardAvatar, { backgroundColor: color }]}>
        <Text style={styles.cardInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
        {hasPassword && (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={10} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.cardName} numberOfLines={1}>{profile.name}</Text>
    </TouchableOpacity>
  );
}

function AddCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.cardAvatar, styles.addCardAvatar]}>
        <Ionicons name="add" size={32} color={T.text2} />
      </View>
      <Text style={styles.addCardName}>Nouveau</Text>
    </TouchableOpacity>
  );
}

interface NewProfileFormProps {
  takenColors: string[];
  onSave: (name: string, color: string, password?: string) => void;
  onCancel: () => void;
}

function NewProfileForm({ takenColors, onSave, onCancel }: NewProfileFormProps) {
  const available = AVATAR_COLORS.filter(c => !takenColors.includes(c));
  const [name,     setName]     = useState('');
  const [color,    setColor]    = useState(available[0] ?? AVATAR_COLORS[0]);
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');

  function handleSave() {
    if (!name.trim()) { setError('Le nom est obligatoire.'); return; }
    onSave(name.trim(), color, password || undefined);
  }

  return (
    <View style={styles.formWrap}>
      <TouchableOpacity style={styles.formBack} onPress={onCancel}>
        <Ionicons name="chevron-back" size={18} color={T.text2} />
        <Text style={styles.formBackText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.formTitle}>Nouveau profil</Text>

      {/* Préview avatar */}
      <View style={[styles.formPreview, { backgroundColor: color }]}>
        <Text style={styles.formPreviewInitial}>{name.charAt(0).toUpperCase() || '?'}</Text>
      </View>

      {/* Couleurs disponibles */}
      <Text style={styles.formLabel}>Couleur</Text>
      <View style={styles.colorRow}>
        {AVATAR_COLORS.map(c => {
          const taken = takenColors.includes(c);
          return (
            <TouchableOpacity
              key={c}
              disabled={taken}
              style={[
                styles.colorDot,
                { backgroundColor: c, opacity: taken ? 0.2 : 1 },
                color === c && styles.colorDotActive,
              ]}
              onPress={() => setColor(c)}
            />
          );
        })}
      </View>

      {/* Nom */}
      <Text style={styles.formLabel}>Nom</Text>
      <TextInput
        style={styles.formInput}
        value={name}
        onChangeText={t => { setName(t); setError(''); }}
        placeholder="Ton prénom"
        placeholderTextColor={T.text3}
        selectionColor={T.accent}
        autoFocus
      />

      {/* Mot de passe optionnel */}
      <Text style={styles.formLabel}>
        Mot de passe <Text style={styles.optional}>(optionnel)</Text>
      </Text>
      <View style={styles.pwdRow}>
        <TextInput
          style={styles.pwdInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Laisser vide = sans mdp"
          placeholderTextColor={T.text3}
          secureTextEntry={!showPwd}
          selectionColor={T.accent}
        />
        <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
          <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={T.text2} />
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>Créer le profil</Text>
      </TouchableOpacity>
    </View>
  );
}

interface UnlockViewProps {
  profile: Profile;
  onUnlock: (password: string) => boolean;
  onCancel: () => void;
}

function UnlockView({ profile, onUnlock, onCancel }: UnlockViewProps) {
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');

  function handleUnlock() {
    const ok = onUnlock(password);
    if (!ok) { setError('Mot de passe incorrect.'); setPassword(''); }
  }

  return (
    <View style={styles.unlockWrap}>
      <TouchableOpacity style={styles.formBack} onPress={onCancel}>
        <Ionicons name="chevron-back" size={18} color={T.text2} />
        <Text style={styles.formBackText}>Retour</Text>
      </TouchableOpacity>

      <View style={[styles.unlockAvatar, { backgroundColor: avatarColor(profile) }]}>
        <Text style={styles.unlockInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.unlockName}>{profile.name}</Text>
      <Ionicons name="lock-closed" size={16} color={T.text3} style={{ marginBottom: 24 }} />

      <Text style={styles.formLabel}>Mot de passe</Text>
      <View style={styles.pwdRow}>
        <TextInput
          style={styles.pwdInput}
          value={password}
          onChangeText={t => { setPassword(t); setError(''); }}
          placeholder="••••••••"
          placeholderTextColor={T.text3}
          secureTextEntry={!showPwd}
          selectionColor={T.accent}
          autoFocus
          onSubmitEditing={handleUnlock}
        />
        <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
          <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={T.text2} />
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.saveBtn} onPress={handleUnlock}>
        <Ionicons name="lock-open-outline" size={16} color="#fff" />
        <Text style={styles.saveBtnText}>Déverrouiller</Text>
      </TouchableOpacity>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

interface Props {
  all: AllProfiles;
  onChange: (all: AllProfiles) => void;
  onSelect: (profileId: string) => void;
}

export default function ProfilePickerScreen({ all, onChange, onSelect }: Props) {
  const [mode,       setMode]       = useState<'grid' | 'new' | 'unlock'>('grid');
  const [unlockId,   setUnlockId]   = useState<string | null>(null);

  const takenColors = all.profiles.map(p => avatarColor(p));

  function handleTap(profile: Profile) {
    if (profile.password) {
      setUnlockId(profile.id);
      setMode('unlock');
    } else {
      onSelect(profile.id);
    }
  }

  function handleUnlock(password: string): boolean {
    const profile = all.profiles.find(p => p.id === unlockId);
    if (!profile || !profile.password) return false;
    if (hashPassword(password) !== profile.password) return false;
    onSelect(unlockId!);
    return true;
  }

  function handleCreate(name: string, color: string, password?: string) {
    const updated = createProfile(all, name, color, password);
    onChange(updated);
    saveAllProfiles(updated);
    setMode('grid');
    // Auto-sélectionne le nouveau profil
    onSelect(updated.activeId);
  }

  const unlockProfile = all.profiles.find(p => p.id === unlockId);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#09090F" />
      <LinearGradient colors={['#0C1F0E', '#0A0F0A', '#09090F']} style={styles.gradient}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>KABAN</Text>
          {mode === 'grid' && (
            <Text style={styles.logoSub}>Qui est là ?</Text>
          )}
        </View>

        {/* Contenu selon le mode */}
        {mode === 'grid' && (
          <ScrollView contentContainerStyle={styles.gridWrap} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {all.profiles.map(p => (
                <ProfileCard key={p.id} profile={p} onPress={() => handleTap(p)} />
              ))}
              {all.profiles.length < MAX_PROFILES && (
                <AddCard onPress={() => setMode('new')} />
              )}
            </View>
          </ScrollView>
        )}

        {mode === 'new' && (
          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            <NewProfileForm
              takenColors={takenColors}
              onSave={handleCreate}
              onCancel={() => setMode('grid')}
            />
          </ScrollView>
        )}

        {mode === 'unlock' && unlockProfile && (
          <UnlockView
            profile={unlockProfile}
            onUnlock={handleUnlock}
            onCancel={() => { setMode('grid'); setUnlockId(null); }}
          />
        )}

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#09090F' },
  gradient: { flex: 1, paddingHorizontal: 20 },

  logoWrap: { alignItems: 'center', paddingTop: 48, marginBottom: 32 },
  logo:     { fontSize: 36, fontWeight: '900', color: T.text, letterSpacing: 8 },
  logoSub:  { fontSize: 16, color: T.text2, fontWeight: '500', marginTop: 8, letterSpacing: 0.5 },

  gridWrap: { flexGrow: 1, justifyContent: 'center' },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },

  card:       { width: CARD_SIZE, alignItems: 'center', gap: 10 },
  cardAvatar: {
    width: CARD_SIZE, height: CARD_SIZE,
    borderRadius: CARD_SIZE * 0.22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  cardInitial: { fontSize: CARD_SIZE * 0.38, fontWeight: '900', color: '#fff' },
  cardName:    { fontSize: 13, fontWeight: '700', color: T.text2, textAlign: 'center' },
  lockBadge: {
    position: 'absolute', bottom: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  addCardAvatar: { backgroundColor: T.cardAlt, borderStyle: 'dashed', borderColor: T.border },
  addCardName:   { fontSize: 13, fontWeight: '600', color: T.text3, textAlign: 'center' },

  // Formulaire nouveau profil
  formScroll: { flexGrow: 1 },
  formWrap:   { flex: 1 },
  formBack:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  formBackText: { fontSize: 14, color: T.text2, fontWeight: '600' },
  formTitle:  { fontSize: 22, fontWeight: '900', color: T.text, marginBottom: 24, textAlign: 'center' },
  formPreview: {
    width: 80, height: 80, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  formPreviewInitial: { fontSize: 36, fontWeight: '900', color: '#fff' },
  formLabel:  { fontSize: 11, color: T.text2, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 16 },
  optional:   { color: T.text3, fontWeight: '500', letterSpacing: 0, textTransform: 'none' },
  colorRow:   { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  colorDot:   { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff', transform: [{ scale: 1.15 }] },
  formInput:  { backgroundColor: T.input, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, color: T.text, fontSize: 15, borderWidth: 1, borderColor: T.border },
  pwdRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: T.input, borderRadius: 14, borderWidth: 1, borderColor: T.border, paddingHorizontal: 16 },
  pwdInput:   { flex: 1, paddingVertical: 13, color: T.text, fontSize: 15 },
  eyeBtn:     { padding: 8 },
  errorText:  { color: T.error, fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: T.accent, borderRadius: 14, paddingVertical: 15, marginTop: 24 },
  saveBtnDisabled: { backgroundColor: T.cardAlt },
  saveBtnText:{ color: '#fff', fontWeight: '800', fontSize: 15 },

  // Déverrouillage
  unlockWrap:    { alignItems: 'center', paddingTop: 8 },
  unlockAvatar:  { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  unlockInitial: { fontSize: 36, fontWeight: '900', color: '#fff' },
  unlockName:    { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 4 },
});
