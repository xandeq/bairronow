import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { apiClient } from '../src/lib/api';
import { useTheme } from '../src/theme/ThemeContext';

export default function MagicLinkScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Informe seu e-mail');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/magic-link/request', { email: email.trim() });
      setSent(true);
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.error || 'Falha ao enviar link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.title, { color: colors.fg }]}>Link enviado!</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Verifique seu e-mail para o link de acesso. O link expira em 15 minutos.
        </Text>
        <View style={{ height: 24 }} />
        <Button title="Voltar para login" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.fg }]}>Entrar sem senha</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Enviaremos um link de acesso para seu e-mail
      </Text>
      <View style={{ height: 24 }} />
      <Input
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholder="voce@exemplo.com"
        autoCapitalize="none"
      />
      <View style={{ height: 8 }} />
      <Button title="Enviar link" onPress={handleSend} loading={loading} />
      <View style={{ height: 16 }} />
      <Button title="Voltar" variant="outline" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
});
