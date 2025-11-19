
import { User, SupportTicket, SystemLog, ChatMessage } from '../types';

const DB_NAME = 'NovaTradeDB';
const DB_VERSION = 2; // Incremented for Chat Store

// Database Schemas
// Users: keyPath: id
// Tickets: keyPath: id, index: userId
// Logs: keyPath: id, index: timestamp
// Chat: keyPath: id, index: timestamp

export const DBService = {
  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Users Store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
        }

        // Tickets Store
        if (!db.objectStoreNames.contains('tickets')) {
          const ticketStore = db.createObjectStore('tickets', { keyPath: 'id' });
          ticketStore.createIndex('userId', 'userId', { unique: false });
        }

        // System Logs Store
        if (!db.objectStoreNames.contains('logs')) {
          const logStore = db.createObjectStore('logs', { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Community Chat Store (New)
        if (!db.objectStoreNames.contains('chat')) {
          const chatStore = db.createObjectStore('chat', { keyPath: 'id' });
          chatStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  },

  // --- Generic Helper ---
  async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.init();
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  },

  // --- User Operations ---
  async getUser(username: string): Promise<User | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('users', 'readonly');
      const store = tx.objectStore('users');
      const index = store.index('username');
      const request = index.get(username);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllUsers(): Promise<User[]> {
    const store = await this.getStore('users');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async saveUser(user: User): Promise<void> {
    const store = await this.getStore('users', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(user);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteUser(userId: string): Promise<void> {
    const store = await this.getStore('users', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(userId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // --- Ticket Operations ---
  async createTicket(ticket: SupportTicket): Promise<void> {
    const store = await this.getStore('tickets', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(ticket);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async updateTicket(ticket: SupportTicket): Promise<void> {
    const store = await this.getStore('tickets', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(ticket);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAllTickets(): Promise<SupportTicket[]> {
    const store = await this.getStore('tickets');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result?.reverse() || []); // Newest first
      request.onerror = () => reject(request.error);
    });
  },

  // --- System Logging ---
  async logActivity(action: string, actorId: string, targetId?: string, details?: string): Promise<void> {
    const log: SystemLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      adminId: actorId, // reusing adminId field for "actor"
      targetId: targetId || details,
      timestamp: new Date().toISOString()
    };
    
    const store = await this.getStore('logs', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(log);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getLogs(): Promise<SystemLog[]> {
    const store = await this.getStore('logs');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const logs = request.result as SystemLog[];
        // Sort by timestamp descending
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(logs);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // --- Community Chat Operations ---
  async saveChatMessage(message: ChatMessage): Promise<void> {
    const store = await this.getStore('chat', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(message);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getChatHistory(limit = 50): Promise<ChatMessage[]> {
    const store = await this.getStore('chat');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let msgs = request.result as ChatMessage[];
        msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        // keep only last 'limit' messages
        if (msgs.length > limit) {
           msgs = msgs.slice(msgs.length - limit);
        }
        resolve(msgs);
      };
      request.onerror = () => reject(request.error);
    });
  }
};