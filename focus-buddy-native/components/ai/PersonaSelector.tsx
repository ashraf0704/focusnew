import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';
import {Persona} from '@/hooks/useAIChat';

const personas: Persona[] = ['groq'];

export function PersonaSelector({value, onChange}: {value: Persona; onChange: (persona: Persona) => void}) {
  return (
    <View style={styles.row}>
      {personas.map(persona => (
        <Pressable key={persona} onPress={() => onChange(persona)} style={[styles.tab, value === persona && styles.active]}>
          <Text style={[styles.text, value === persona && styles.activeText]}>Groq Llama 70B</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 8},
  tab: {paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.softBorder},
  active: {backgroundColor: Colors.primary},
  text: {fontSize: 11, fontWeight: '900', color: Colors.dark},
  activeText: {color: Colors.white},
});
