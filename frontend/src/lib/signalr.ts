"use client";

import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

export interface NotificationHubOptions {
  baseUrl: string;
  getAccessToken: () => string | null;
}

export function createNotificationHub({
  baseUrl,
  getAccessToken,
}: NotificationHubOptions): HubConnection {
  const url = `${baseUrl.replace(/\/$/, "")}/hubs/notifications`;
  return new HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => getAccessToken() ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}
