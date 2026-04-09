import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
} from '@microsoft/signalr';
import Constants from 'expo-constants';
import { useAuthStore } from './auth-store';

const baseURL =
  (Constants.expoConfig?.extra?.apiUrl as string) || 'https://api.bairronow.com.br';

let connection: HubConnection | null = null;

/**
 * Shared SignalR HubConnection singleton for Expo / React Native.
 *
 * Pitfall 1 (RESEARCH.md): Expo release builds (EAS) cannot negotiate the SignalR
 * transport reliably — force WebSockets and skip negotiation.
 *
 * Pitfall 2 (RESEARCH.md): Never call `connection.start()` inside the `onclose`
 * handler or inside an `AppState` listener — `withAutomaticReconnect` already
 * handles recovery. Calling start() manually during reconnection crashes iOS.
 */
export async function getHubConnection(): Promise<HubConnection> {
  if (connection && connection.state === 'Connected') return connection;

  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(`${baseURL}/hubs/notifications`, {
        transport: HttpTransportType.WebSockets, // force WebSockets — Pitfall 1
        skipNegotiation: true, // skip problematic negotiate step
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Pitfall 2 — auto reconnect
      .configureLogging(LogLevel.Warning)
      .build();

    // DO NOT call connection.start() inside onclose — withAutomaticReconnect handles it (Pitfall 2)
    connection.onclose((err) => {
      console.warn('[signalr] closed', err);
      // intentionally empty — automatic reconnect handles recovery
    });
  }

  if (connection.state === 'Disconnected') {
    await connection.start();
  }
  return connection;
}

export async function disposeHubConnection(): Promise<void> {
  if (connection) {
    try {
      await connection.stop();
    } catch {
      // ignore
    }
    connection = null;
  }
}
