import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, StatusBar, Dimensions, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AllProfiles, Profile, HABIT_COLORS } from '../types';
import { createProfile, deleteProfile, renameProfile, hashPassword, saveAllProfiles } from '../utils/storage';
import { T } from '../theme';

const { width } = Dimensions.get('window');
const COLS      = 3;
const CARD_SIZE = Math.floor((width - 48 - (COLS - 1) * 16) / COLS);
const MAX_PROFILES = 6;
const AVATAR_COLORS = HABIT_COLORS;

function avatarColor(p: Profile) {
  return /^#[0-9A-Fa-f]{6}$/.test(p.emoji) ? p.emoji : AVATAR_COLORS[0];
}

// ── Carte profil ──────────────────────────────────────────────────────────────
function ProfileCard({ profile, onPress, onEdit }: {
  profile: Profile;
  onPress: () => void;
  onEdit: () => void;
}) {
  const color = avatarColor(profile);
  return (
    <View style={styles.cardWrap}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.cardAvatar, { backgroundColor: color }]}>
          <Text style={styles.cardInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
          {!!profile.password && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={10} color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.cardName} numberOfLines={1}>{profile.name}</Text>
      </TouchableOpacity>
      {/* Bouton crayon */}
      <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
        <Ionicons name="pencil" size={12} color={T.text2} />
      </TouchableOpacity>
    </View>
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

// ── Formulaire créer / modifier ───────────────────────────────────────────────
function ProfileForm({ title, initialName, initialColor, initialHasPassword, takenColors, onSave, onCancel, onRemovePassword, onDelete }: {
  title: string;
  initialName?: string;
  initialColor?: string;
  initialHasPassword?: boolean;
  takenColors: string[];
  onSave: (name: string, color: string, newPassword?: string) => void;
  onCancel: () => void;
  onRemovePassword?: () => void;
  onDelete?: () => void;
}) {
  const firstFree  = AVATAR_COLORS.find(c => !takenColors.includes(c)) ?? AVATAR_COLORS[0];
  const [name,     setName]     = useState(initialName ?? '');
  const [color,    setColor]    = useState(initialColor ?? firstFree);
  const [newPwd,   setNewPwd]   = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');

  function handleSave() {
    if (!name.trim()) { setError('Le nom est obligatoire.'); return; }
    onSave(name.trim(), color, newPwd || undefined);
  }

  const isEdit = !!initialName;

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.formBack} onPress={onCancel}>
        <Ionicons name="chevron-back" size={18} color={T.text2} />
        <Text style={styles.formBackText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.formTitle}>{title}</Text>

      {/* Préview */}
      <View style={[styles.formPreview, { backgroundColor: color }]}>
        <Text style={styles.formPreviewInitial}>{name.charAt(0).toUpperCase() || '?'}</Text>
      </View>

      {/* Couleur */}
      <Text style={styles.formLabel}>Couleur</Text>
      <View style={styles.colorRow}>
        {AVATAR_COLORS.map(c => {
          const taken = takenColors.includes(c);
          return (
            <TouchableOpacity
              key={c} disabled={taken}
              style={[styles.colorDot, { backgroundColor: c, opacity: taken ? 0.2 : 1 }, color === c && styles.colorDotActive]}
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
        autoFocus={!isEdit}
      />

      {/* Mot de passe */}
      <Text style={styles.formLabel}>
        {isEdit ? 'Nouveau mot de passe' : 'Mot de passe'}
        {' '}<Text style={styles.optional}>(optionnel)</Text>
      </Text>
      <View style={styles.pwdRow}>
        <TextInput
          style={styles.pwdInput}
          value={newPwd}
          onChangeText={setNewPwd}
          placeholder={isEdit ? 'Laisser vide = inchangé' : 'Laisser vide = sans mdp'}
          placeholderTextColor={T.text3}
          secureTextEntry={!showPwd}
          selectionColor={T.accent}
        />
        <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
          <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={T.text2} />
        </TouchableOpacity>
      </View>

      {/* Supprimer le mdp */}
      {isEdit && initialHasPassword && onRemovePassword && (
        <TouchableOpacity onPress={onRemovePassword} style={styles.removePwdBtn}>
          <Ionicons name="lock-open-outline" size={14} color={T.error} />
          <Text style={styles.removePwdText}>Supprimer le mot de passe</Text>
        </TouchableOpacity>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {onDelete && (
        <TouchableOpacity style={styles.deleteProfileBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={14} color={T.error} />
          <Text style={styles.deleteProfileBtnText}>Supprimer ce profil</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>{isEdit ? 'Enregistrer' : 'Créer'}</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Écran déverrouillage ──────────────────────────────────────────────────────
function UnlockView({ profile, onUnlock, onCancel }: {
  profile: Profile;
  onUnlock: (pwd: string) => boolean;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');

  function handleUnlock() {
    if (!onUnlock(password)) { setError('Mot de passe incorrect.'); setPassword(''); }
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

// ── Écran principal ───────────────────────────────────────────────────────────
type Mode = 'grid' | 'new' | 'edit' | 'unlock';

interface Props {
  all: AllProfiles;
  onChange: (all: AllProfiles) => void;
  onSelect: (profileId: string) => void;
  onReset?: () => void;
}

export default function ProfilePickerScreen({ all, onChange, onSelect, onReset }: Props) {
  const [mode,      setMode]      = useState<Mode>('grid');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [unlockId,  setUnlockId]  = useState<string | null>(null);

  const takenColors = all.profiles.map(p => avatarColor(p));
  const editingProfile = all.profiles.find(p => p.id === editingId);
  const unlockProfile  = all.profiles.find(p => p.id === unlockId);

  // Couleurs prises SAUF celle du profil en cours d'édition
  const takenForEdit = editingProfile
    ? all.profiles.filter(p => p.id !== editingId).map(p => avatarColor(p))
    : takenColors;

  function handleTap(profile: Profile) {
    if (profile.password) { setUnlockId(profile.id); setMode('unlock'); }
    else onSelect(profile.id);
  }

  function handleUnlock(password: string): boolean {
    const p = all.profiles.find(pr => pr.id === unlockId);
    if (!p?.password || hashPassword(password) !== p.password) return false;
    onSelect(unlockId!);
    return true;
  }

  function handleCreate(name: string, color: string, password?: string) {
    const updated = createProfile(all, name, color, password);
    onChange(updated);
    saveAllProfiles(updated);
    setMode('grid');
    onSelect(updated.activeId);
  }

  function handleEdit(name: string, color: string, newPassword?: string) {
    if (!editingId) return;
    const updated = renameProfile(all, editingId, name, color, newPassword ?? undefined);
    onChange(updated);
    saveAllProfiles(updated);
    setMode('grid');
  }

  function handleRemovePassword() {
    if (!editingId) return;
    const p = all.profiles.find(pr => pr.id === editingId);
    if (!p) return;
    const updated = renameProfile(all, editingId, p.name, p.emoji, null);
    onChange(updated);
    saveAllProfiles(updated);
    setMode('grid');
  }

  function handleDelete() {
    if (!editingId) return;
    Alert.alert(
      'Supprimer ce profil',
      'Toutes les données de ce profil seront perdues.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: () => {
            const updated = deleteProfile(all, editingId);
            onChange(updated);
            saveAllProfiles(updated);
            setMode('grid');
            setEditingId(null);
          },
        },
      ]
    );
  }

  function handleResetPress() {
    Alert.alert(
      'Réinitialiser l\'app',
      'Tous les profils et données seront supprimés. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réinitialiser', style: 'destructive', onPress: onReset },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#09090F" />
      <LinearGradient colors={['#0C1F0E', '#0A0F0A', '#09090F']} style={styles.gradient}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>KABAN</Text>
          {mode === 'grid' && <Text style={styles.logoSub}>Qui est là ?</Text>}
        </View>

        {mode === 'grid' && (
          <ScrollView contentContainerStyle={styles.gridWrap} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {all.profiles.map(p => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  onPress={() => handleTap(p)}
                  onEdit={() => { setEditingId(p.id); setMode('edit'); }}
                />
              ))}
              {all.profiles.length < MAX_PROFILES && (
                <AddCard onPress={() => setMode('new')} />
              )}
            </View>
            {onReset && (
              <TouchableOpacity style={styles.resetBtn} onPress={handleResetPress}>
                <Ionicons name="refresh-outline" size={12} color={T.text3} />
                <Text style={styles.resetBtnText}>Réinitialiser l'app</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {mode === 'new' && (
          <ProfileForm
            title="Nouveau profil"
            takenColors={takenColors}
            onSave={handleCreate}
            onCancel={() => setMode('grid')}
          />
        )}

        {mode === 'edit' && editingProfile && (
          <ProfileForm
            title="Modifier le profil"
            initialName={editingProfile.name}
            initialColor={avatarColor(editingProfile)}
            initialHasPassword={!!editingProfile.password}
            takenColors={takenForEdit}
            onSave={handleEdit}
            onCancel={() => setMode('grid')}
            onRemovePassword={handleRemovePassword}
            onDelete={all.profiles.length > 1 ? handleDelete : undefined}
          />
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

  cardWrap:    { width: CARD_SIZE, alignItems: 'center' },
  card:        { width: CARD_SIZE, alignItems: 'center', gap: 10 },
  cardAvatar:  {
    width: CARD_SIZE, height: CARD_SIZE, borderRadius: CARD_SIZE * 0.22,
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
  editBtn: {
    position: 'absolute', top: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: T.cardAlt, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  addCardAvatar: { backgroundColor: T.cardAlt, borderStyle: 'dashed', borderColor: T.border },
  addCardName:   { fontSize: 13, fontWeight: '600', color: T.text3, textAlign: 'center' },

  formBack:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  formBackText: { fontSize: 14, color: T.text2, fontWeight: '600' },
  formTitle:    { fontSize: 22, fontWeight: '900', color: T.text, marginBottom: 24, textAlign: 'center' },
  formPreview: {
    width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  formPreviewInitial: { fontSize: 36, fontWeight: '900', color: '#fff' },
  formLabel:  { fontSize: 11, color: T.text2, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 16 },
  optional:   { color: T.text3, fontWeight: '500', letterSpacing: 0, textTransform: 'none' },
  colorRow:   { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot:   { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff', transform: [{ scale: 1.15 }] },
  formInput:  { backgroundColor: T.input, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, color: T.text, fontSize: 15, borderWidth: 1, borderColor: T.border },
  pwdRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: T.input, borderRadius: 14, borderWidth: 1, borderColor: T.border, paddingHorizontal: 16 },
  pwdInput:   { flex: 1, paddingVertical: 13, color: T.text, fontSize: 15 },
  eyeBtn:     { padding: 8 },
  removePwdBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  removePwdText: { fontSize: 13, color: T.error, fontWeight: '600' },
  deleteProfileBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, justifyContent: 'center' },
  deleteProfileBtnText: { fontSize: 13, color: T.error, fontWeight: '600' },
  resetBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 32, paddingBottom: 16 },
  resetBtnText:  { fontSize: 12, color: T.text3, fontWeight: '500' },
  errorText:  { color: T.error, fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: T.accent, borderRadius: 14, paddingVertical: 15, marginTop: 24 },
  saveBtnDisabled: { backgroundColor: T.cardAlt },
  saveBtnText:{ color: '#fff', fontWeight: '800', fontSize: 15 },

  unlockWrap:    { alignItems: 'center', paddingTop: 8 },
  unlockAvatar:  { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  unlockInitial: { fontSize: 36, fontWeight: '900', color: '#fff' },
  unlockName:    { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 4 },
});
