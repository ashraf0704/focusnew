import {FlatList} from 'react-native';
import {SubjectChip} from '@/components/ui/SubjectChip';
import {Subject} from '@/types';

export function SubjectGrid({subjects, selectedId, onSelect}: {subjects: Subject[]; selectedId: string; onSelect: (id: string) => void}) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={subjects}
      keyExtractor={item => item.id}
      renderItem={({item}) => <SubjectChip subject={item} selected={item.id === selectedId} onPress={() => onSelect(item.id)} />}
    />
  );
}
