import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../src/components/Button';
import { useRouter } from 'expo-router';

export default function Pending() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>Aguardando aprovação</Text>
      <Text style={styles.subtitle}>Sua verificação está em análise. Você receberá uma notificação em breve.</Text>
      <View style={{ height: 32 }} />
      <Button title="Ir para o feed" onPress={() => router.replace('/feed')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 64 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
});
