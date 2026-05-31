import {Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {interpolate, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {Colors} from '@/constants/colors';
import {Flashcard} from '@/types';

export function FlashcardFlip({card}: {card: Flashcard}) {
  const flip = useSharedValue(0);
  const front = useAnimatedStyle(() => ({transform: [{rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg`}]}));
  const back = useAnimatedStyle(() => ({transform: [{rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg`}]}));
  return (
    <Pressable onPress={() => (flip.value = withTiming(flip.value ? 0 : 1))} style={styles.wrap}>
      <Animated.View style={[styles.card, front]}>
        <Text style={styles.label}>Question</Text>
        <Text style={styles.text}>{card.question}</Text>
      </Animated.View>
      <Animated.View style={[styles.card, styles.back, back]}>
        <Text style={styles.label}>Answer</Text>
        <Text style={styles.text}>{card.answer}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {height: 240},
  card: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.softBorder, padding: 24, backfaceVisibility: 'hidden', justifyContent: 'center'},
  back: {backgroundColor: '#FFF7EA'},
  label: {fontWeight: '900', color: Colors.vibrant, marginBottom: 12},
  text: {fontSize: 20, fontWeight: '800', color: Colors.dark},
});
