import { View, Text, StyleSheet, Image } from 'react-native';
import type { MessageDto } from '../../lib/api/chat';

interface Props {
  message: MessageDto;
  isOwn: boolean;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {message.imageUrl && (
          <Image source={{ uri: message.imageUrl }} style={styles.image} />
        )}
        {!!message.text && (
          <Text style={isOwn ? styles.textOwn : styles.textOther}>{message.text}</Text>
        )}
        <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
          {formatTime(message.sentAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 12 },
  rowOwn: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bubbleOwn: { backgroundColor: '#15803D' }, // green-700
  bubbleOther: { backgroundColor: '#E5E7EB' },
  textOwn: { color: '#fff', fontSize: 15 },
  textOther: { color: '#111827', fontSize: 15 },
  image: { width: 220, height: 220, borderRadius: 8, marginBottom: 6 },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeOwn: { color: 'rgba(255,255,255,0.7)' },
  timeOther: { color: '#6B7280' },
});
