import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {supabaseAdmin} from '../services/supabaseClient.js';
import {deckFromRows} from '../utils/mappers.js';

export const decksRouter = Router();

decksRouter.get('/', async (req, res, next) => {
  try {
    const [deckRows, cardRows] = await Promise.all([
      supabaseAdmin.from('flashcard_decks').select('*').eq('user_id', req.user!.id).order('created_at', {ascending: false}),
      supabaseAdmin.from('flashcards').select('*').eq('user_id', req.user!.id).order('created_at', {ascending: true}),
    ]);
    if (deckRows.error || cardRows.error) throw new HttpError(400, 'Could not load decks', 'DECKS_LOAD_FAILED');
    res.json((deckRows.data || []).map(deck => deckFromRows(deck, (cardRows.data || []).filter(card => card.deck_id === deck.id))));
  } catch (error) {
    next(error);
  }
});

decksRouter.post('/', async (req, res, next) => {
  try {
    const {name, subjectId, description, cards} = req.body || {};
    const {data: deck, error} = await supabaseAdmin
      .from('flashcard_decks')
      .insert({user_id: req.user!.id, name, subject_id: subjectId, description})
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not create deck', 'DECK_CREATE_FAILED');

    const cardPayload = (cards || []).map((card: any) => ({
      user_id: req.user!.id,
      deck_id: deck.id,
      question: card.question,
      answer: card.answer,
    }));
    const {data: insertedCards, error: cardError} = await supabaseAdmin.from('flashcards').insert(cardPayload).select();
    if (cardError) throw new HttpError(400, 'Could not save deck cards', 'CARDS_CREATE_FAILED');
    res.status(201).json(deckFromRows(deck, insertedCards || []));
  } catch (error) {
    next(error);
  }
});

decksRouter.delete('/:id', async (req, res, next) => {
  try {
    const {error} = await supabaseAdmin.from('flashcard_decks').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) throw new HttpError(400, 'Could not delete deck', 'DECK_DELETE_FAILED');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

decksRouter.patch('/:deckId/cards/:cardId', async (req, res, next) => {
  try {
    const {difficultyRating} = req.body || {};
    const {data, error} = await supabaseAdmin
      .from('flashcards')
      .update({difficulty_rating: difficultyRating})
      .eq('id', req.params.cardId)
      .eq('deck_id', req.params.deckId)
      .eq('user_id', req.user!.id)
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not update card', 'CARD_UPDATE_FAILED');
    res.json(data);
  } catch (error) {
    next(error);
  }
});
