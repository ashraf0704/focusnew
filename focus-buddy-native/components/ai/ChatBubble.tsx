import {StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';
import {ChatMessage} from '@/hooks/useAIChat';

export function ChatBubble({message}: {message: ChatMessage}) {
  const isUser = message.sender === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.user : styles.ai]}>
      <Text style={[styles.text, isUser && styles.userText]}>{message.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {maxWidth: '86%', padding: 12, borderRadius: 18, marginVertical: 5},
  user: {alignSelf: 'flex-end', backgroundColor: Colors.primary},
  ai: {alignSelf: 'flex-start', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.softBorder},
  text: {color: Colors.dark, lineHeight: 20},
  userText: {color: Colors.white},
});
