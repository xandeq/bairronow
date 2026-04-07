import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/Button';
import { useVerificationPolling } from '../src/lib/verification-polling';

export default function Pending() {
  const router = useRouter();
  const { status, loading, error } = useVerificationPolling(true, 5000);

  useEffect(() => {
    if (status?.status === 'approved') {
      const t = setTimeout(() => router.replace('/feed'), 2000);
      return () => clearTimeout(t);
    }
  }, [status?.status, router]);

  if (loading && !status) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.subtitle}>Carregando status…</Text>
      </View>
    );
  }

  if (error && !status) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Erro</Text>
        <Text style={styles.subtitle}>{error}</Text>
      </View>
    );
  }

  if (status?.status === 'approved') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.title}>Aprovado!</Text>
        <Text style={styles.subtitle}>Bem-vindo ao seu bairro.</Text>
      </View>
    );
  }

  if (status?.status === 'rejected') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>Verificação rejeitada</Text>
        <Text style={styles.subtitle}>
          {status.rejectionReason ?? 'Por favor envie outro comprovante.'}
        </Text>
        <View style={{ height: 24 }} />
        <Button title="Enviar novamente" onPress={() => router.replace('/proof-upload')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.title}>Documento em análise</Text>
      <Text style={styles.subtitle}>
        Você receberá uma notificação assim que for aprovado.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 64 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
