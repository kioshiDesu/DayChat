import Dexie, { Table } from 'dexie';

export interface PushSubscriptionJSON {
  endpoint?: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface Identity {
  id?: string;
  displayName: string;
  token: string;
  createdAt: Date;
  pushSubscription?: PushSubscriptionJSON;
}

export interface LocalMessage {
  id: string;
  room_id: string;
  user_anon_id: string;
  display_name: string;
  content: string;
  expires_at: string;
  created_at: string;
  expired: boolean;
  synced: boolean;
  deleted?: boolean;
}

export class DayChatDB extends Dexie {
  identity!: Table<Identity, string>;
  messages!: Table<LocalMessage, string>;

  constructor() {
    super('DayChatDB');
    this.version(1).stores({
      identity: 'id',
      messages: 'id, room_id, expired, synced, expires_at'
    });
  }
}

export const db = new DayChatDB();
