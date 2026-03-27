import Dexie, { Table } from 'dexie';

export interface Identity {
  id?: string;
  anonId: string;
  displayName: string | null;
  createdAt: Date;
  token: string;
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
