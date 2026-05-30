import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AllProfiles, Profile, HABIT_COLORS } from '../types';
import { createProfile, deleteProfile, renameProfile, switchProfile, hashPassword } from '../utils/storage';
import { T } from '../theme';

const AVATAR_COLORS = HABIT_COLORS;

type Mode = 'list' | 'create' | 'edit' | 'unlock';

function LetterAvatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.4 }}>
        {name.charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}

function avatarColor(profile: Profile): string {
  return /^#[0-9A-Fa-f]{6}$/.test(profile.emoji) ? profile.emoji : AVATAR_COLORS[0];
}

interface Props {
  visible: boolean;
  all: AllProfiles;
  onClose: () => void;
  onChange: (all: AllProfiles) => void;
}

export default function ProfileModal({ visible, all, onClose, onChange }: Props) {
  const [mode,       setMode]       = useState<Mode>('list');
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [unlockId,   setUnlockId]   = useState<string | null>(null);
  const [name,       setName]       = useState('');
  const [color,      setColor]      = useState(AVATAR_COLORS[0]);
  const [password,   setPassword]   = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdError,   setPwdError]   = useState('');

  function reset() {
    setName(''); setColor(AVATAR_COLORS[0]);
    setPassword(''); setNewPwd('');
    setShowPwd(false); setShowNewPwd(false);
    setPwdError('');
  }

  function openCreate() { reset(); setMode('create'); }

  function openEdit(profile: Profile) {
    setEditingId(profile.id);
    setName(profile.name);
    setColor(avatarColor(profile));
    setPassword(''); setNewPwd('');
    setShowPwd(false); setShowNewPwd(false);
    setPwdError('');
    setMode('edit');
  }

  function openUnlock(profile: Profile) {
    setUnlockId(profile.id);
    setPassword('');
    setPwdError('');
    setShowPwd(false);
    setMode('unlock');
  }

  function handleCreate() {
    if (!name.trim()) return;
    onChange(createProfile(all, name.trim(), color, password || undefined));
    reset(); setMode('list'); onClose();
  }

  function handleEdit() {
    if (!name.trim() || !editingId) return;
    const profile = all.profiles.find(p => p.id === editingId);
    if (!profile) return;

    // Si le profil a un mdp et qu'on veut le changer, vérifier l'ancien
    if (profile.password && newPwd) {
      if (!password) { setPwdError('Entre ton mot de passe actuel.'); return; }
      if (hashPassword(password) !== profile.password) { setPwdError('Mot de passe incorrect.'); return; }
    }

    const pwdArg = newPwd ? newPwd : undefined; // undefined = inchangé
    onChange(renameProfile(all, editingId, name.trim(), color, pwdArg));
    reset(); setMode('list');
  }

  function handleRemovePassword() {
    if (!editingId) return;
    const profile = all.profiles.find(p => p.id === editingId);
    if (!profile) return;
    if (profile.password) {
      if (!password) { setPwdError('Entre ton mot de passe actuel pour le supprimer.'); return; }
      if (hashPassword(password) !== profile.password) { setPwdError('Mot de passe incorrect.'); return; }
    }
    onChange(renameProfile(all, editingId, profile.name, profile.emoji, null));
    setPwdError('');
    setPassword('');
  }

  function handleUnlock() {
    if (!unlockId) return;
    const profile = all.profiles.find(p => p.id === unlockId);
    if (!profile) return;
    if (hashPassword(password) !== profile.password) {
      setPwdError('Mot de passe incorrect.');
      return;
    }
    onChange(switchProfile(all, unlockId));
    reset(); setMode('list'); onClose();
  }

  function handleSwitch(profile: Profile) {
    if (profile.id === all.activeId) { onClose(); return; }
    if (profile.password) { openUnlock(profile); return; }
    onChange(switchProfile(all, profile.id));
    onClose();
  }

  function handleDelete(profile: Profile) {
    if (all.profiles.length <= 1) { Alert.alert('Impossible', 'Tu dois garder au moins un profil.'); return; }
    Alert.alert('Supprimer', `Supprimer "${profile.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => onChange(deleteProfile(all, profile.id)) },
    ]);
  }

  const editingProfile = editingId ? all.profiles.find(p => p.id === editingId) : null;
  const unlockProfile  = unlockId  ? all.profiles.find(p => p.id === unlockId)  : null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* ── LISTE ── */}
          {mode === 'list' && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Profils</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Nouveau</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {all.profiles.map(profile => {
                  const ac = avatarColor(profile);
                  const isActive = all.activeId === profile.id;
                  return (
                    <TouchableOpacity
                      key={profile.id}
                      style={[styles.profileRow, isActive && styles.profileRowActive]}
                      onPress={() => handleSwitch(profile)}
                      activeOpacity={0.7}
                    >
                      <LetterAvatar name={profile.name} color={ac} size={40} />
                      <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, isActive && styles.profileNameActive]}>
                          {profile.name}
                        </Text>
                        {profile.password && (
                          <View style={styles.lockedTag}>
                            <Ionicons name="lock-closed" size={9} color={T.text3} />
                            <Text style={styles.lockedTagText}>Protégé</Text>
                          </View>
                        )}
                      </View>
                      {isActive && <View style={styles.activeDot} />}
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(profile)}>
                          <Ionicons name="pencil-outline" size={16} color={T.text2} />
                        </TouchableOpacity>
                        {all.profiles.length > 1 && (
                          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(profile)}>
                            <Ionicons name="trash-outline" size={16} color={T.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* ── DÉVERROUILLAGE ── */}
          {mode === 'unlock' && unlockProfile && (
            <>
              <TouchableOpacity onPress={() => setMode('list')} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={18} color={T.text2} />
                <Text style={styles.backText}>Retour</Text>
              </TouchableOpacity>

              <View style={styles.unlockCenter}>
                <LetterAvatar name={unlockProfile.name} color={avatarColor(unlockProfile)} size={64} />
                <Text style={styles.unlockName}>{unlockProfile.name}</Text>
                <Ionicons name="lock-closed" size={18} color={T.text3} style={{ marginTop: 4 }} />
              </View>

              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.pwdRow}>
                <TextInput
                  style={styles.pwdInput}
                  value={password}
                  onChangeText={t => { setPassword(t); setPwdError(''); }}
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
              {!!pwdError && <Text style={styles.errorText}>{pwdError}</Text>}

              <TouchableOpacity style={styles.saveBtn} onPress={handleUnlock}>
                <Ionicons name="lock-open-outline" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Déverrouiller</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── CRÉER / MODIFIER ── */}
          {(mode === 'create' || mode === 'edit') && (
            <>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => { reset(); setMode('list'); }} style={styles.backBtn}>
                  <Ionicons name="chevron-back" size={18} color={T.text2} />
                  <Text style={styles.backText}>Retour</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{mode === 'create' ? 'Nouveau profil' : 'Modifier'}</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Prévisualisation */}
                <View style={styles.avatarPreview}>
                  <LetterAvatar name={name || '?'} color={color} size={64} />
                  <Text style={styles.avatarPreviewName}>{name || 'Mon profil'}</Text>
                </View>

                <Text style={styles.label}>Couleur</Text>
                <View style={styles.colorRow}>
                  {AVATAR_COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                      onPress={() => setColor(c)}
                    />
                  ))}
                </View>

                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Alice"
                  placeholderTextColor={T.text3}
                  selectionColor={T.accent}
                  autoFocus={mode === 'create'}
                />

                {/* Mot de passe */}
                {mode === 'create' && (
                  <>
                    <Text style={styles.label}>Mot de passe <Text style={styles.optional}>(optionnel)</Text></Text>
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
                  </>
                )}

                {mode === 'edit' && (
                  <>
                    {editingProfile?.password && (
                      <>
                        <Text style={styles.label}>Mot de passe actuel</Text>
                        <View style={styles.pwdRow}>
                          <TextInput
                            style={styles.pwdInput}
                            value={password}
                            onChangeText={t => { setPassword(t); setPwdError(''); }}
                            placeholder="Requis pour modifier"
                            placeholderTextColor={T.text3}
                            secureTextEntry={!showPwd}
                            selectionColor={T.accent}
                          />
                          <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                            <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={T.text2} />
                          </TouchableOpacity>
                        </View>
                      </>
                    )}

                    <Text style={styles.label}>
                      {editingProfile?.password ? 'Nouveau mot de passe' : 'Définir un mot de passe'}
                      {' '}<Text style={styles.optional}>(optionnel)</Text>
                    </Text>
                    <View style={styles.pwdRow}>
                      <TextInput
                        style={styles.pwdInput}
                        value={newPwd}
                        onChangeText={setNewPwd}
                        placeholder={editingProfile?.password ? 'Laisser vide = inchangé' : 'Laisser vide = sans mdp'}
                        placeholderTextColor={T.text3}
                        secureTextEntry={!showNewPwd}
                        selectionColor={T.accent}
                      />
                      <TouchableOpacity onPress={() => setShowNewPwd(v => !v)} style={styles.eyeBtn}>
                        <Ionicons name={showNewPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={T.text2} />
                      </TouchableOpacity>
                    </View>

                    {editingProfile?.password && (
                      <TouchableOpacity onPress={handleRemovePassword} style={styles.removePwdBtn}>
                        <Ionicons name="lock-open-outline" size={14} color={T.error} />
                        <Text style={styles.removePwdText}>Supprimer le mot de passe</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {!!pwdError && <Text style={styles.errorText}>{pwdError}</Text>}

                <TouchableOpacity
                  style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                  onPress={mode === 'create' ? handleCreate : handleEdit}
                >
                  <Text style={styles.saveBtnText}>{mode === 'create' ? 'Créer' : 'Enregistrer'}</Text>
                </TouchableOpacity>
                <View style={{ height: 20 }} />
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: T.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '88%', paddingHorizontal: 20, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  handle: {
    width: 40, height: 4, backgroundColor: T.border,
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: T.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  profileRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border, gap: 12,
  },
  profileRowActive: { backgroundColor: T.cardAlt, borderRadius: 12, paddingHorizontal: 10, borderBottomWidth: 0, marginBottom: 1 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: T.text2 },
  profileNameActive: { color: T.text, fontWeight: '800' },
  lockedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  lockedTagText: { fontSize: 10, color: T.text3, fontWeight: '600' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.accent },
  rowActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },

  unlockCenter: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  unlockName: { fontSize: 20, fontWeight: '800', color: T.text },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backText: { fontSize: 14, color: T.text2, fontWeight: '600' },

  avatarPreview: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  avatarPreviewName: { fontSize: 16, color: T.text, fontWeight: '700' },

  label: {
    fontSize: 11, color: T.text2, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 18,
  },
  optional: { color: T.text3, fontWeight: '500', letterSpacing: 0, textTransform: 'none' },

  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff', transform: [{ scale: 1.15 }] },

  input: {
    backgroundColor: T.input, borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 13, color: T.text, fontSize: 15,
    borderWidth: 1, borderColor: T.border,
  },

  pwdRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.input, borderRadius: 14,
    borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 16,
  },
  pwdInput: { flex: 1, paddingVertical: 13, color: T.text, fontSize: 15 },
  eyeBtn: { padding: 8 },

  errorText: { color: T.error, fontSize: 12, fontWeight: '600', marginTop: 8 },

  removePwdBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, alignSelf: 'flex-start',
  },
  removePwdText: { fontSize: 13, color: T.error, fontWeight: '600' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: T.accent, borderRadius: 14,
    paddingVertical: 15, marginTop: 24,
  },
  saveBtnDisabled: { backgroundColor: T.cardAlt },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
