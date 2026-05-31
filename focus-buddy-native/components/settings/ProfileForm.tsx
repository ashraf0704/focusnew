import {StyleSheet, Text, TextInput, View} from 'react-native';
import {Colors} from '@/constants/colors';

export function ProfileForm({fullName, email, onNameChange}: {fullName: string; email: string; onNameChange: (name: string) => void}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Full name</Text>
      <TextInput value={fullName} onChangeText={onNameChange} style={styles.input} />
      <Text style={styles.label}>Email</Text>
      <TextInput value={email} editable={false} style={[styles.input, styles.readonly]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: 8},
  label: {fontWeight: '900', color: Colors.dark},
  input: {backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.softBorder, borderRadius: 14, padding: 12, color: Colors.dark},
  readonly: {opacity: 0.7},
});
