import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import TabBar, { TabName } from './src/components/TabBar';
import ProfileModal from './src/components/ProfileModal';
import { AllProfiles, AppData, checkBadges } from './src/types';
import {
  loadAllProfiles, saveAllProfiles, getActiveData, setActiveData,
} from './src/utils/storage';

export default function App() {
  const [tab, setTab] = useState<TabName>('home');
  const [all, setAll] = useState<AllProfiles>({
    profiles: [{ id: 'profile_1', name: 'Profil 1', emoji: '🦖', createdAt: '' }],
    activeId: 'profile_1',
    data: { profile_1: { habits: [], entries: [], totalXP: 0, earnedBadges: [] } },
  });
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  useEffect(() => {
    loadAllProfiles().then(setAll);
  }, []);

  const data = getActiveData(all);
  const activeProfile = all.profiles.find(p => p.id === all.activeId) ?? all.profiles[0];

  function handleDataChange(newData: AppData) {
    const checked = checkBadges(newData);
    const newAll = setActiveData(all, checked);
    setAll(newAll);
    saveAllProfiles(newAll);
  }

  function handleProfileChange(newAll: AllProfiles) {
    setAll(newAll);
    saveAllProfiles(newAll);
  }

  return (
    <View style={styles.root}>
      {tab === 'home' && (
        <HomeScreen
          onDataChange={handleDataChange}
          profileData={data}
          profile={activeProfile}
          onProfilePress={() => setProfileModalVisible(true)}
        />
      )}
      {tab === 'calendar' && <CalendarScreen data={data} />}
      {tab === 'badges' && <BadgesScreen data={data} />}
      <TabBar active={tab} onChange={setTab} />
      <ProfileModal
        visible={profileModalVisible}
        all={all}
        onClose={() => setProfileModalVisible(false)}
        onChange={handleProfileChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
});
