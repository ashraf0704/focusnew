import {FlatList, Pressable, StyleSheet, Text} from 'react-native';
import {Colors} from '@/constants/colors';

const sounds = [
  {id: 'off', label: 'Silence'},
  {id: 'rain', label: 'Rain'},
  {id: 'forest', label: 'Forest'},
  {id: 'cafe', label: 'Cafe'},
  {id: 'whitenoise', label: 'White Noise'},
];

export function SoundPicker({value, onChange}: {value: string; onChange: (id: string) => void}) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={sounds}
      keyExtractor={item => item.id}
      renderItem={({item}) => (
        <Pressable onPress={() => onChange(item.id)} style={[styles.card, value === item.id && styles.active]}>
          <Text style={[styles.label, value === item.id && styles.activeText]}>{item.label}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.softBorder, marginRight: 10},
  active: {backgroundColor: Colors.primary},
  label: {fontWeight: '800', color: Colors.dark},
  activeText: {color: Colors.white},
});
