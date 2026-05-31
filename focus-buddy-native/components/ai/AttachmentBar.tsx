import {StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';

export function AttachmentBar({name}: {name?: string | null}) {
  if (!name) return null;
  return (
    <View style={styles.bar}>
      <Text style={styles.text}>Context: {name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {backgroundColor: '#FFF7EA', borderColor: Colors.vibrant, borderWidth: 1, padding: 10, borderRadius: 14},
  text: {fontWeight: '800', color: Colors.dark},
});
