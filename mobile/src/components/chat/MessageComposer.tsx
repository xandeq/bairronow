import { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useChatStore } from '../../lib/chat-store';

interface Props {
  conversationId: number;
}

export function MessageComposer({ conversationId }: Props) {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const body = text.trim();
    setText('');
    setSending(true);
    try {
      await sendMessage(conversationId, body);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const handleAttach = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1920 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );
    setSending(true);
    try {
      await sendMessage(conversationId, text.trim(), {
        uri: manipulated.uri,
        name: `chat-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      setText('');
    } catch {
      Alert.alert('Erro', 'Falha ao enviar imagem.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.attachBtn} onPress={handleAttach} disabled={sending}>
        <Text style={styles.attachIcon}>📎</Text>
      </Pressable>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Digite uma mensagem"
        multiline
      />
      <Pressable
        style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || sending}
      >
        <Text style={styles.sendText}>Enviar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachIcon: { fontSize: 22 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 120,
    color: '#111827',
    marginHorizontal: 6,
  },
  sendBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendBtnDisabled: { backgroundColor: '#9CA3AF' },
  sendText: { color: '#fff', fontWeight: '800' },
});
