import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#111827' }}>
        <Stack.Screen name="index" options={{ title: 'BairroNow' }} />
        <Stack.Screen name="login" options={{ title: 'Entrar' }} />
        <Stack.Screen name="register" options={{ title: 'Criar conta' }} />
        <Stack.Screen name="cep-lookup" options={{ title: 'Seu endereço' }} />
        <Stack.Screen name="proof-upload" options={{ title: 'Comprovante' }} />
        <Stack.Screen name="pending" options={{ title: 'Verificação' }} />
        <Stack.Screen name="feed" options={{ title: 'Bairro' }} />
        <Stack.Screen name="profile" options={{ title: 'Meu perfil' }} />
      </Stack>
    </>
  );
}
