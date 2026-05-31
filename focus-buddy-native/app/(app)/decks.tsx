import {useState} from 'react';
import {FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {DeckCard} from '@/components/flashcards/DeckCard';
import {QuizOverlay} from '@/components/flashcards/QuizOverlay';
import {Colors} from '@/constants/colors';
import {endpoints} from '@/lib/apiClient';
import {useAddDeck, useUpdateCardDifficulty} from '@/hooks/useDecks';
import {useAppStore} from '@/store/appStore';
import {FlashcardDeck} from '@/types';

export default function DecksScreen() {
  const {decks, selectedSubjectId} = useAppStore();
  const addDeck = useAddDeck();
  const difficulty = useUpdateCardDifficulty();
  const [active, setActive] = useState<FlashcardDeck | null>(null);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function generateDeck() {
    const generated = await endpoints.generateFlashcards({subjectName: name || 'General Studies', count: 5});
    addDeck.mutate({name: name || 'AI Generated Deck', subjectId: selectedSubjectId, description, cards: generated.cards.map((card, index) => ({...card, id: `temp-${index}`, deckId: ''}))});
    setModal(false);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.row}><Text style={styles.title}>Study Decks</Text><Button onPress={() => setModal(true)}>Create</Button></View>
      <FlatList scrollEnabled={false} data={decks} keyExtractor={item => item.id} renderItem={({item}) => <DeckCard deck={item} onPress={() => setActive(item)} />} />
      <Modal visible={!!active} animationType="slide"><ScrollView style={styles.screen} contentContainerStyle={styles.content}><Button variant="ghost" onPress={() => setActive(null)}>Close</Button>{active && <QuizOverlay deck={active} onRate={(cardId, rating) => difficulty.mutate({deckId: active.id, cardId, difficultyRating: rating})} />}</ScrollView></Modal>
      <Modal visible={modal} transparent animationType="slide"><View style={styles.modal}><Card><Text style={styles.title}>Create Deck</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Deck name" /><TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Description" /><Button onPress={generateDeck}>Generate with AI</Button><Button variant="ghost" onPress={() => setModal(false)}>Cancel</Button></Card></View></Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.bg},
  content: {padding: 18, gap: 18, paddingBottom: 110},
  title: {fontSize: 24, fontWeight: '900', color: Colors.dark},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  input: {borderWidth: 1, borderColor: Colors.softBorder, borderRadius: 14, padding: 12, marginVertical: 8},
  modal: {flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', padding: 18},
});
