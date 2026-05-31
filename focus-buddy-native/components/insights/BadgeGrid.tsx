import {FlatList, StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';
import {Badge} from '@/types';

export function BadgeGrid({badges}: {badges: Badge[]}) {
  return (
    <FlatList
      data={badges}
      numColumns={2}
      scrollEnabled={false}
      keyExtractor={item => item.id}
      renderItem={({item}) => (
        <View style={[styles.badge, !item.unlocked && styles.locked]}>
          <Text style={styles.icon}>{item.unlocked ? '★' : '🔒'}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{item.criteria}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  badge: {flex: 1, margin: 6, padding: 14, borderRadius: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.softBorder},
  locked: {opacity: 0.45},
  icon: {fontSize: 24},
  title: {fontWeight: '900', color: Colors.dark, marginTop: 8},
  desc: {fontSize: 11, color: Colors.muted, marginTop: 4},
});
