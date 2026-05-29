import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { AllProfiles, Profile } from '../types';
import { createProfile, deleteProfile, renameProfile, switchProfile } from '../utils/storage';

const PROFILE_EMOJIS = ['🦖', '🦁', '🐺', '🦊', '🐻', '🐯', '🦅', '🐉', '🦋', '🌟', '🔥', '⚡'];

interface Props {
  visible: boolean;
  all: AllProfiles;
  onClose: () => void;
  onChange: (all: AllProfiles) => void;
}

export default function ProfileModal({ visible, all, onClose, onChange }: Props) {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(PROFILE_EMOJIS[0]);

  function openCreate() {
    setName('');
    setEmoji(PROFILE_EMOJIS[0]);
    setMode('create');
  }

  function openEdit(profile: Profile) {
    setEditingId(profile.id);
    setName(profile.name);
    setEmoji(profile.emoji);
    setMode('edit');
  }

  function handleCreate() {
    if (!name.trim()) return;
    onChange(createProfile(all, name.trim(), emoji));
    setMode('list');
    onClose();
  }

  function handleEdit() {
    if (!name.trim() || !editingId) return;
    onChange(renameProfile(all, editingId, name.trim(), emoji));
    setMode('list');
  }

  function handleSwitch(id: string) {
    onChange(switchProfile(all, id));
    onClose();
  }

  function handleDelete(profile: Profile) {
    if (all.profiles.length <= 1) {
      Alert.alert('Impossible', 'Tu dois garder au moins un profil.');
      return;
    }
    Alert.alert('Supprimer', `Supprimer le profil "${profile.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => onChange(deleteProfile(all, profile.id)) },
    ]);
  }

  function backToList() { setMode('list'); }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {mode === 'list' && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Profils</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
                  <Text style={styles.addBtnText}>+ Nouveau</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {all.profiles.map(profile => (
                  <TouchableOpacity
                    key={profile.id}
                    style={[styles.profileRow, all.activeId === profile.id && styles.profileRowActive]}
                    onPress={() => handleSwitch(profile.id)}
                  >
                    <Text style={styles.profileEmoji}>{profile.emoji}</Text>
                    <Text style={[styles.profileName, all.activeId === profile.id && styles.profileNameActive]}>
                      {profile.name}
                    </Text>
                    {all.activeId === profile.id && <Text style={styles.activeDot}>●</Text>}
                    <View style={styles.rowActions}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(profile)}>
                        <Text style={styles.editBtnText}>✏️</Text>
                      </TouchableOpacity>
                      {all.profiles.length > 1 && (
                        <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(profile)}>
                          <Text style={styles.delBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {(mode === 'create' || mode === 'edit') && (
            <>
              <View style={styles.header}>
                <TouchableOpacity onPress={backToList}>
                  <Text style={styles.backBtn}>← Retour</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{mode === 'create' ? 'Nouveau profil' : 'Modifier'}</Text>
              </View>

              <Text style={styles.label}>Avatar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
                {PROFILE_EMOJIS.map(e => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}
                    onPress={() => setEmoji(e)}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Nom du profil</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Mon profil"
                placeholderTextColor="#9CA3AF"
                selectionColor="#111827"
                autoFocus
              />

              <TouchableOpacity
                style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                onPress={mode === 'create' ? handleCreate : handleEdit}
              >
                <Text style={styles.saveBtnText}>{mode === 'create' ? 'Créer' : 'Enregistrer'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '80%', paddingHorizontal: 20, paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  addBtn: {
    backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  profileRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12,
  },
  profileRowActive: { backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 10 },
  profileEmoji: { fontSize: 28 },
  profileName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#374151' },
  profileNameActive: { color: '#111827', fontWeight: '800' },
  activeDot: { color: '#111827', fontSize: 10 },
  rowActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 6 },
  editBtnText: { fontSize: 16 },
  delBtn: { padding: 6 },
  delBtnText: { fontSize: 16 },
  backBtn: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  label: {
    fontSize: 11, color: '#6B7280', fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16,
  },
  emojiScroll: { marginBottom: 4 },
  emojiBtn: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#F9FAFB',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  emojiBtnActive: { borderColor: '#111827', backgroundColor: '#F3F4F6' },
  emojiText: { fontSize: 24 },
  input: {
    backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 13, color: '#111827', fontSize: 15,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  saveBtn: {
    backgroundColor: '#111827', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 24,
  },
  saveBtnDisabled: { backgroundColor: '#D1D5DB' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
