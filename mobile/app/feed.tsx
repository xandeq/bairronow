import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Button } from '../src/components/Button';
import { useAuthStore } from '../src/lib/auth-store';
import { useRouter } from 'expo-router';

export default function Feed() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const stub = [
    { id: '1', author: 'Vizinho A', text: 'Bem vindo ao BairroNow! Em breve, posts reais.' },
    { id: '2', author: 'Vizinho B', text: 'Feed do bairro em construção (Phase 3).' },
  ];
  return (
    <View style={styles.container}>
      <FlatList
        data={stub}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
      <View style={{ padding: 16 }}>
        <Button title="Sair" variant="outline" onPress={() => { logout(); router.replace('/'); }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: { padding: 16, backgroundColor: '#F3F4F6', borderRadius: 8, marginBottom: 12 },
  author: { fontWeight: '700', color: '#111827', marginBottom: 4 },
  text: { color: '#374151' },
});
