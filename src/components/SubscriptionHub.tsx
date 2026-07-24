import React from 'react';
import FocusRewardsStore from './FocusRewardsStore';
import { UserProfile } from '../types';

interface SubscriptionHubProps {
  profile?: UserProfile;
  buddyPoints?: number;
  onRedeemBuddyPoints?: (profile: UserProfile) => void;
}

export default function SubscriptionHub({
  profile,
  buddyPoints = 250,
  onRedeemBuddyPoints,
}: SubscriptionHubProps) {
  const currentProfile: UserProfile = profile || {
    email: 'student@college.edu',
    fullName: 'Student Scholar',
    streak: 5,
    totalFocusMinutes: 120,
    sessionsCount: 6,
    dailyGoalMinutes: 25,
    buddyPoints,
    buddySpecies: 'fox',
    alarmTone: 'singing-bowl',
    soundVolume: 75,
    notificationsEnabled: true,
    language: 'en'
  };

  return (
    <FocusRewardsStore
      profile={currentProfile}
      onProfileUpdated={(updated) => {
        if (onRedeemBuddyPoints) {
          onRedeemBuddyPoints(updated);
        }
      }}
    />
  );
}
