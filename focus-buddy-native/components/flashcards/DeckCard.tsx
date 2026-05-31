import {Pressable, StyleSheet, Text} from 'react-native';
import {Card} from '@/components/ui/Card';
import {Colors} from '@/constants/colors';
import {FlashcardDeck} from '@/types';

export function DeckCard({deck, onPress}: {deck: FlashcardDeck; onPress?: () => void}) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <Text style={styles.title}>{deck.name}</Text>
        <Text style={styles.desc}>{deck.description || 'Revision deck'}</Text>
        <Text style={styles.meta}>{deck.cards.length} cards</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {marginBottom: 12},
  title: {fontSize: 16, fontWeight: '900', color: Colors.dark},
  desc: {color: Colors.muted, marginTop: 4},
  meta: {color: Colors.vibrant, fontWeight: '900', marginTop: 10},
});
