import React from 'react';
import { View, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export const HomeHeader: React.FC<{ userName?: string }> = ({ userName }) => {
  return (
    <ThemedView style={{ alignItems: 'center', marginBottom: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 32, height: 32, marginRight: 12 }}
          resizeMode="contain"
        />
        <ThemedText type="title" style={{ fontSize: 24, fontWeight: 'bold' }}>
          Travel Buddy
        </ThemedText>
      </View>
      <ThemedText style={{ fontSize: 16 }}>Welcome back, {userName || 'Traveler'}!</ThemedText>
    </ThemedView>
  );
};

export default HomeHeader;
