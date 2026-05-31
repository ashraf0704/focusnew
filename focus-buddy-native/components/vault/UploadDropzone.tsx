import {StyleSheet, Text, View} from 'react-native';
import {Button} from '@/components/ui/Button';
import {Colors} from '@/constants/colors';

export function UploadDropzone({onPick}: {onPick: () => void}) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Upload study files</Text>
      <Text style={styles.copy}>PDFs, notes, photos, code, and project archives.</Text>
      <Button onPress={onPick}>Pick Document</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.vibrant, backgroundColor: '#FFF8EA', borderRadius: 18, padding: 18, gap: 10},
  title: {fontWeight: '900', color: Colors.dark},
  copy: {color: Colors.muted},
});
