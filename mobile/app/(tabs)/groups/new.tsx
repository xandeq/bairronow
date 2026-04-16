import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth-store';
import { createGroup } from '@/features/groups/groupsApi';

const CATEGORIES = ['Esportes', 'Animais', 'Pais', 'Seguranca', 'Jardinagem', 'Negocios', 'Cultura', 'Outros'] as const;

export default function NewGroupScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Outros');
  const [joinPolicy, setJoinPolicy] = useState<'Open' | 'Closed'>('Open');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (name.trim().length < 3) {
      Alert.alert('Erro', 'Nome deve ter pelo menos 3 caracteres');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Erro', 'Descrição deve ter pelo menos 10 caracteres');
      return;
    }
    if (!user?.bairroId) return;
    setSubmitting(true);
    try {
      const group = await createGroup({
        bairroId: user.bairroId,
        name: name.trim(),
        description: description.trim(),
        category,
        joinPolicy,
        scope: 'Bairro',
      });
      router.replace(`/groups/${group.id}`);
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o grupo. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={styles.title}>Criar Grupo</Text>

      <View>
        <Text style={styles.label}>Nome do grupo</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={100} placeholder="Ex: Futebol da Vila" />
      </View>

      <View>
        <Text style={styles.label}>Descrição</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} maxLength={500} placeholder="Sobre o grupo..." multiline textAlignVertical="top" />
      </View>

      <View>
        <Text style={styles.label}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, category === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View>
        <Text style={styles.label}>Tipo de entrada</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {(['Open', 'Closed'] as const).map((p) => (
            <TouchableOpacity key={p} onPress={() => setJoinPolicy(p)} style={[styles.chip, joinPolicy === p && styles.chipActive]}>
              <Text style={[styles.chipText, joinPolicy === p && styles.chipTextActive]}>
                {p === 'Open' ? 'Aberto' : 'Fechado'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity onPress={handleCreate} disabled={submitting} style={[styles.createBtn, submitting && { opacity: 0.6 }]}>
        <Text style={styles.createBtnText}>{submitting ? 'Criando...' : 'Criar Grupo'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: '600', color: '#111827' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#15803D', borderColor: '#15803D' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff' },
  createBtn: { backgroundColor: '#15803D', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
