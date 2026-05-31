import {useState} from 'react';
import {FlatList, StyleSheet, Text, TextInput, View} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Speech from 'expo-speech';
import {BottomSheetView} from '@gorhom/bottom-sheet';
import {Button} from '@/components/ui/Button';
import {AttachmentBar} from '@/components/ai/AttachmentBar';
import {ChatBubble} from '@/components/ai/ChatBubble';
import {PersonaSelector} from '@/components/ai/PersonaSelector';
import {Colors} from '@/constants/colors';
import {Persona, useAIChat} from '@/hooks/useAIChat';
import {useAppStore} from '@/store/appStore';

export default function AIDoubtSolverScreen() {
  const params = useLocalSearchParams<{context?: string; contextName?: string}>();
  const [persona, setPersona] = useState<Persona>('chatgpt');
  const [input, setInput] = useState('');
  const [attachmentName, setAttachmentName] = useState(params.contextName || null);
  const [context, setContext] = useState(params.context || null);
  const {subjects, selectedSubjectId} = useAppStore();
  const subjectName = subjects.find(subject => subject.id === selectedSubjectId)?.name || 'General Studies';
  const chat = useAIChat();

  async function attach() {
    const result = await DocumentPicker.getDocumentAsync({copyToCacheDirectory: true});
    if (!result.canceled) {
      setAttachmentName(result.assets[0].name);
      setContext(`Attached native document: ${result.assets[0].name}`);
    }
  }

  async function send() {
    if (!input.trim() && !context) return;
    await chat.send(persona, input || `Please explain ${attachmentName}`, subjectName, context);
    setInput('');
  }

  return (
    <BottomSheetView style={styles.screen}>
      <Text style={styles.title}>AI Doubt Solver</Text>
      <PersonaSelector value={persona} onChange={setPersona} />
      <AttachmentBar name={attachmentName} />
      <FlatList data={[...chat.messages[persona]].reverse()} inverted keyExtractor={item => item.id} renderItem={({item}) => <ChatBubble message={item} />} style={styles.chat} />
      <View style={styles.inputRow}>
        <TextInput value={input} onChangeText={setInput} placeholder={`Ask ${persona} about ${subjectName}`} style={styles.input} />
        <Button variant="ghost" onPress={attach}>Attach</Button>
      </View>
      <View style={styles.inputRow}>
        <Button variant="ghost" onPress={() => Speech.speak(input || 'Ask me anything about your study material.')}>Mic</Button>
        <Button onPress={send}>{chat.isStreaming ? 'Streaming...' : 'Send'}</Button>
      </View>
    </BottomSheetView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.bg, padding: 18, gap: 12},
  title: {fontSize: 24, fontWeight: '900', color: Colors.dark},
  chat: {flex: 1},
  inputRow: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  input: {flex: 1, backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.softBorder, padding: 12},
});
