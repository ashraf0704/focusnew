import {StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';

export function BuddyPointsBar({points}: {points: number}) {
  return (
    <View style={styles.bar}>
      <Text style={styles.text}>Buddy Points: {points}</Text>
      <Text style={styles.meta}>1 point = Rs. 1 discount</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {backgroundColor: '#FFF7EA', borderWidth: 1, borderColor: Colors.vibrant, borderRadius: 16, padding: 14},
  text: {fontWeight: '900', color: Colors.dark},
  meta: {fontSize: 11, color: Colors.muted, marginTop: 3},
});
