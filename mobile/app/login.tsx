import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, Link } from 'expo-router';
import { loginSchema, type LoginInput } from '@bairronow/shared-validators';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { authApi } from '../src/lib/api';
import { useAuthStore } from '../src/lib/auth-store';

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      login(res.accessToken, res.user);
      router.replace('/feed');
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.error || 'Falha ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Entrar</Text>
      <Text style={styles.subtitle}>Acesse seu bairro</Text>
      <View style={{ height: 24 }} />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label="E-mail"
            value={value}
            onChangeText={onChange}
            keyboardType="email-address"
            placeholder="voce@exemplo.com"
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Senha"
            value={value}
            onChangeText={onChange}
            secureTextEntry
            placeholder="********"
            error={errors.password?.message}
          />
        )}
      />
      <Button title="Entrar" onPress={handleSubmit(onSubmit)} loading={loading} />
      <View style={{ height: 16 }} />
      <Link href="/register" style={styles.link}>Não tem conta? Criar conta</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  link: { color: '#3B82F6', textAlign: 'center', fontWeight: '600' },
});
