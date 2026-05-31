import {useMutation} from '@tanstack/react-query';
import {endpoints} from '@/lib/apiClient';
import {useAppStore} from '@/store/appStore';
import {FlashcardDeck} from '@/types';

export function useAddDeck() {
  const addDeck = useAppStore(state => state.addDeck);
  return useMutation({
    mutationFn: (deck: Partial<FlashcardDeck>) => endpoints.addDeck(deck),
    onSuccess: addDeck,
  });
}

export function useUpdateCardDifficulty() {
  return useMutation({
    mutationFn: (data: {deckId: string; cardId: string; difficultyRating: string}) =>
      endpoints.updateCardDifficulty(data.deckId, data.cardId, data.difficultyRating),
  });
}
