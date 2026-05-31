import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Button} from '@/components/ui/Button';
import {FlashcardFlip} from '@/components/flashcards/FlashcardFlip';
import {Colors} from '@/constants/colors';
import {FlashcardDeck} from '@/types';

export function QuizOverlay({deck, onRate}: {deck: FlashcardDeck; onRate: (cardId: string, rating: string) => void}) {
  const [index, setIndex] = useState(0);
  const card = deck.cards[index];
  if (!card) return <Text>No cards yet.</Text>;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{deck.name}</Text>
      <FlashcardFlip card={card} />
      <View style={styles.row}>
        {['easy', 'medium', 'hard'].map(rating => (
          <Button key={rating} variant="ghost" onPress={() => { onRate(card.id, rating); setIndex((index + 1) % deck.cards.length); }}>{rating}</Button>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: 18},
  title: {fontSize: 20, fontWeight: '900', color: Colors.dark},
  row: {flexDirection: 'row', justifyContent: 'space-between'},
});
