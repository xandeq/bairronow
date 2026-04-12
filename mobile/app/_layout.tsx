import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#111827' }}>
        {/* Auth screens */}
        <Stack.Screen name="index" options={{ title: 'BairroNow' }} />
        <Stack.Screen name="login" options={{ title: 'Entrar' }} />
        <Stack.Screen name="register" options={{ title: 'Criar conta' }} />
        <Stack.Screen name="cep-lookup" options={{ title: 'Seu endereço' }} />
        <Stack.Screen name="proof-upload" options={{ title: 'Comprovante' }} />
        <Stack.Screen name="pending" options={{ title: 'Verificação' }} />
        {/* Authenticated — tabs with persistent bottom nav */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Profile (outside tabs) */}
        <Stack.Screen name="profile" options={{ title: 'Meu perfil' }} />
        {/* Deep routes rendered above tab bar */}
        <Stack.Screen name="marketplace/new" options={{ title: 'Novo anúncio' }} />
        <Stack.Screen name="marketplace/[id]" options={{ title: 'Anúncio' }} />
        <Stack.Screen name="marketplace/edit/[id]" options={{ title: 'Editar anúncio' }} />
        <Stack.Screen name="marketplace/search" options={{ title: 'Buscar' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
      </Stack>
    </>
  );
}
