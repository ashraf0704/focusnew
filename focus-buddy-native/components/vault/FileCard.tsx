import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';
import {CollegeFile} from '@/types';

export function FileCard({file, onLongPress}: {file: CollegeFile; onLongPress: () => void}) {
  return (
    <Pressable onLongPress={onLongPress} style={styles.card}>
      <Text style={styles.icon}>{file.type === 'image' ? '🖼' : file.type === 'code' ? '{}' : '📄'}</Text>
      <View style={{flex: 1}}>
        <Text style={styles.name}>{file.name}</Text>
        <Text style={styles.meta}>{file.size} • {new Date(file.createdAt).toLocaleDateString()}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.softBorder, borderRadius: 16, padding: 14, marginBottom: 10},
  icon: {fontSize: 24},
  name: {fontWeight: '900', color: Colors.dark},
  meta: {fontSize: 11, color: Colors.muted, marginTop: 4},
});
