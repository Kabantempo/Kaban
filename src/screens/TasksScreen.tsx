import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Alert, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AllProfiles, Profile, GroupTask, HABIT_COLORS, getTodayKey } from '../types';
import {
  addGroupTask, toggleGroupTask, deleteGroupTask, editGroupTask, saveAllProfiles,
} from '../utils/storage';
import TaskModal from '../components/TaskModal';
import { T } from '../theme';

const AVATAR_COLORS = HABIT_COLORS;
function avatarColor(p: Profile) { return /^#[0-9A-Fa-f]{6}$/.test(p.emoji) ? p.emoji : AVATAR_COLORS[0]; }

type Filter = 'mine' | 'byMe' | 'all';

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  return deadline < getTodayKey();
}

function formatDeadline(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface Props { all: AllProfiles; onChange: (all: AllProfiles) => void }

function TaskCard({
  task, profiles, activeId,
  onToggle, onEdit, onDelete,
}: {
  task: GroupTask;
  profiles: Profile[];
  activeId: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const assignedIds = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
  const assignees = profiles.filter(p => assignedIds.includes(p.id));
  const assigner  = profiles.find(p => p.id === task.assignedBy);
  const color     = assignees[0] ? avatarColor(assignees[0]) : T.accent;
  const done      = task.status === 'done';
  const overdue   = !done && isOverdue(task.deadline);
  const isMyTask  = task.assignedTo === activeId;

  return (
    <View style={[styles.card, done && styles.cardDone, overdue && styles.cardOverdue]}>
      {/* Barre latérale colorée */}
      <View style={[styles.cardBar, { backgroundColor: done ? T.text3 : color }]} />

      <View style={styles.cardBody}>
        {/* Ligne titre + checkbox */}
        <View style={styles.cardTopRow}>
          <Pressable
            onPress={onToggle}
            style={[styles.checkbox, done && { backgroundColor: T.success, borderColor: T.success }]}
            accessibilityLabel={done ? 'Marquer comme à faire' : 'Marquer comme fait'}
          >
            {done && <Ionicons name="checkmark" size={12} color="#fff" />}
          </Pressable>
          <Text style={[styles.cardTitle, done && styles.cardTitleDone]} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
              <Ionicons name="pencil-outline" size={14} color={T.text3} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={14} color={T.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        {!!task.description && (
          <Text style={[styles.cardDesc, done && { opacity: 0.4 }]} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        {/* Footer : assigné + deadline */}
        <View style={styles.cardFooter}>
          <View style={styles.cardAssignee}>
            {/* Avatars empilés */}
            <View style={styles.avatarStack}>
              {assignees.slice(0, 4).map((p, i) => (
                <View key={p.id} style={[styles.miniAvatar, { backgroundColor: avatarColor(p), marginLeft: i === 0 ? 0 : -6, zIndex: 4 - i }]}>
                  <Text style={styles.miniAvatarLetter}>{p.name.charAt(0).toUpperCase()}</Text>
                </View>
              ))}
              {assignees.length > 4 && (
                <View style={[styles.miniAvatar, { backgroundColor: T.cardAlt, marginLeft: -6, zIndex: 0 }]}>
                  <Text style={[styles.miniAvatarLetter, { fontSize: 7 }]}>+{assignees.length - 4}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardAssigneeName}>
              {assignees.length === 1 ? assignees[0].name : `${assignees.length} personnes`}
            </Text>
            {assigner && !assignedIds.includes(assigner.id) && (
              <Text style={styles.cardBy}>· par {assigner.name}</Text>
            )}
          </View>
          {task.deadline && (
            <View style={[styles.deadlineBadge, overdue && styles.deadlineBadgeOverdue]}>
              <Ionicons
                name={overdue ? 'warning-outline' : 'calendar-outline'}
                size={10}
                color={overdue ? T.error : T.text2}
              />
              <Text style={[styles.deadlineText, overdue && { color: T.error }]}>
                {formatDeadline(task.deadline)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function TasksScreen({ all, onChange }: Props) {
  const [filter,      setFilter]      = useState<Filter>('mine');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask,  setEditingTask]  = useState<GroupTask | undefined>();

  const activeId = all.activeId;
  const tasks    = all.groupTasks ?? [];

  const filtered = tasks.filter(t => {
    const ids = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
    if (filter === 'mine')  return ids.includes(activeId);
    if (filter === 'byMe')  return t.assignedBy === activeId && !ids.includes(activeId);
    return true;
  });

  const todo = filtered.filter(t => t.status === 'todo').sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });
  const done = filtered.filter(t => t.status === 'done');

  function handleSave(title: string, desc: string, assignedTo: string[], deadline?: string) {
    let updated: AllProfiles;
    if (editingTask) {
      updated = editGroupTask(all, editingTask.id, title, desc, assignedTo, deadline);
    } else {
      updated = addGroupTask(all, activeId, assignedTo, title, desc, deadline);
    }
    onChange(updated); saveAllProfiles(updated);
    setEditingTask(undefined);
  }

  function handleToggle(task: GroupTask) {
    const updated = toggleGroupTask(all, task.id);
    onChange(updated); saveAllProfiles(updated);
  }

  function handleDelete(task: GroupTask) {
    Alert.alert('Supprimer', `Supprimer "${task.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => {
        const updated = deleteGroupTask(all, task.id);
        onChange(updated); saveAllProfiles(updated);
      }},
    ]);
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'mine',  label: 'Mes tâches' },
    { id: 'byMe',  label: 'Par moi' },
    { id: 'all',   label: 'Toutes' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      <LinearGradient colors={['#0C1F0E', '#0F1810', T.bg]} style={styles.header}>
        <Text style={styles.title}>Tâches</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{todo.length}</Text>
            <Text style={styles.statLabel}>À faire</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: T.success }]}>{done.length}</Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: tasks.filter(t => !t.status || t.status === 'todo' && isOverdue(t.deadline)).length > 0 ? T.error : T.text2 }]}>
              {tasks.filter(t => t.status === 'todo' && isOverdue(t.deadline)).length}
            </Text>
            <Text style={styles.statLabel}>En retard</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filtres */}
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={[
          ...todo.map(t => ({ ...t, _section: 'todo' })),
          ...done.map(t => ({ ...t, _section: 'done' })),
        ]}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          todo.length === 0 && done.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-outline" size={40} color={T.text3} />
              <Text style={styles.emptyTitle}>Aucune tâche</Text>
              <Text style={styles.emptyDesc}>Crée une tâche et assigne-la à un membre de l'équipe.</Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          const prev = index > 0
            ? ([...todo, ...done][index - 1])
            : null;
          const showTodoHeader = index === 0 && todo.length > 0;
          const showDoneHeader = item._section === 'done' && (index === 0 || todo[index - 1] === undefined);
          const isDoneSection  = item._section === 'done';
          const firstDoneIdx   = todo.length;

          return (
            <>
              {index === 0 && todo.length > 0 && (
                <Text style={styles.sectionHeader}>À faire · {todo.length}</Text>
              )}
              {index === firstDoneIdx && done.length > 0 && (
                <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Terminées · {done.length}</Text>
              )}
              <TaskCard
                task={item}
                profiles={all.profiles}
                activeId={activeId}
                onToggle={() => handleToggle(item)}
                onEdit={() => { setEditingTask(item); setModalVisible(true); }}
                onDelete={() => handleDelete(item)}
              />
            </>
          );
        }}
        ListFooterComponent={<View style={{ height: 120 }} />}
      />

      {/* FAB */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { setEditingTask(undefined); setModalVisible(true); }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>Nouvelle tâche</Text>
        </TouchableOpacity>
      </View>

      <TaskModal
        visible={modalVisible}
        profiles={all.profiles}
        activeId={activeId}
        task={editingTask}
        onSave={handleSave}
        onClose={() => { setModalVisible(false); setEditingTask(undefined); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: T.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  title:  { fontSize: 20, fontWeight: '900', color: T.text, letterSpacing: 4, marginBottom: 16 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingVertical: 12, borderWidth: 1, borderColor: T.border },
  stat:      { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: T.text },
  statLabel: { fontSize: 10, color: T.text3, marginTop: 2, fontWeight: '600' },
  statDiv:   { width: 1, backgroundColor: T.border },

  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: T.cardAlt, borderWidth: 1, borderColor: T.border },
  filterBtnActive: { backgroundColor: T.accentDim, borderColor: T.accent + '55' },
  filterText:      { fontSize: 12, color: T.text2, fontWeight: '600' },
  filterTextActive:{ color: T.accentSoft, fontWeight: '700' },

  list: { paddingHorizontal: 14 },
  sectionHeader: { fontSize: 11, color: T.text2, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: T.text },
  emptyDesc:  { fontSize: 13, color: T.text2, textAlign: 'center', lineHeight: 20 },

  card: {
    flexDirection: 'row', backgroundColor: T.card,
    borderRadius: 16, marginBottom: 8,
    borderWidth: 1, borderColor: T.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  cardDone:    { opacity: 0.55 },
  cardOverdue: { borderColor: T.error + '55' },
  cardBar:     { width: 4 },
  cardBody:    { flex: 1, padding: 12 },

  cardTopRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: T.border,
    backgroundColor: T.cardAlt,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  cardTitle:      { flex: 1, fontSize: 14, fontWeight: '700', color: T.text, lineHeight: 20 },
  cardTitleDone:  { textDecorationLine: 'line-through', color: T.text2 },
  cardActions:    { flexDirection: 'row', gap: 2 },
  actionBtn:      { padding: 4 },

  cardDesc: { fontSize: 12, color: T.text2, lineHeight: 17, marginBottom: 8 },

  cardFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardAssignee:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatarStack:    { flexDirection: 'row', alignItems: 'center' },
  miniAvatar:     { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.card },
  miniAvatarLetter: { color: '#fff', fontWeight: '800', fontSize: 9 },
  cardAssigneeName: { fontSize: 11, color: T.text2, fontWeight: '600' },
  cardBy:           { fontSize: 11, color: T.text3 },

  deadlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.cardAlt, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: T.border },
  deadlineBadgeOverdue: { borderColor: T.error + '66', backgroundColor: T.error + '11' },
  deadlineText:  { fontSize: 10, color: T.text2, fontWeight: '700' },

  fabWrapper: { position: 'absolute', bottom: 90, left: 0, right: 0, alignItems: 'center' },
  fab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 32, gap: 8, backgroundColor: T.accent, shadowColor: T.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
