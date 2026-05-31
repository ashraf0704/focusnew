import {FlatList, Pressable, StyleSheet, Text} from 'react-native';
import {Colors} from '@/constants/colors';

const buddies = [
  {id: 'fox', label: 'Fox', icon: '🦊'},
  {id: 'cat', label: 'Cat', icon: '🐱'},
  {id: 'owl', label: 'Owl', icon: '🦉'},
  {id: 'bear', label: 'Bear', icon: '🐻'},
];

export function BuddyPicker({value, onChange}: {value: string; onChange: (id: string) => void}) {
  return (
    <FlatList
      horizontal
      data={buddies}
      renderItem={({item}) => (
        <Pressable onPress={() => onChange(item.id)} style={[styles.card, value === item.id && styles.active]}>
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {alignItems: 'center', width: 86, padding: 12, marginRight: 10, borderRadius: 16, borderWidth: 1, borderColor: Colors.softBorder, backgroundColor: Colors.white},
  active: {borderColor: Colors.vibrant, backgroundColor: '#FFF7EA'},
  icon: {fontSize: 28},
  label: {fontWeight: '900', color: Colors.dark, marginTop: 6},
});
