import {FlatList, Pressable, StyleSheet, Text} from 'react-native';
import {Colors} from '@/constants/colors';
import {VaultFolder} from '@/types';

export function FolderList({folders, selectedId, onSelect}: {folders: VaultFolder[]; selectedId?: string | null; onSelect: (id: string | null) => void}) {
  return (
    <FlatList
      horizontal
      data={[{id: '', name: 'All', color: 'all', createdAt: ''}, ...folders]}
      keyExtractor={item => item.id || 'all'}
      renderItem={({item}) => (
        <Pressable onPress={() => onSelect(item.id || null)} style={[styles.chip, (selectedId || '') === item.id && styles.active]}>
          <Text style={[styles.text, (selectedId || '') === item.id && styles.activeText]}>{item.name}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  chip: {paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.softBorder, marginRight: 8},
  active: {backgroundColor: Colors.primary},
  text: {fontWeight: '800', color: Colors.dark},
  activeText: {color: Colors.white},
});
