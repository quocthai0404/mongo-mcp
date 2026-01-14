import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { ServerConfig } from '../types/config.js';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ConnectionManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private state: ConnectionState = 'disconnected';
  private config: ServerConfig | null = null;
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  async connect(config: ServerConfig): Promise<Db> {
    if (this.state === 'connected' && this.db) {
      return this.db;
    }

    if (this.state === 'connecting') {
      return new Promise((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (this.state === 'connected' && this.db) {
            clearInterval(checkConnection);
            resolve(this.db);
          } else if (this.state === 'error') {
            clearInterval(checkConnection);
            reject(new Error('Connection failed'));
          }
        }, 100);
      });
    }

    this.state = 'connecting';
    this.config = config;

    let lastError: Error | null = null;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const options: MongoClientOptions = {
          serverSelectionTimeoutMS: config.mongodbTimeout,
          connectTimeoutMS: config.mongodbTimeout,
          socketTimeoutMS: config.mongodbTimeout,
          maxPoolSize: 10,
          minPoolSize: 1,
        };

        this.client = new MongoClient(config.mongodbUri, options);
        await this.client.connect();

        const dbName = this.extractDatabaseName(config.mongodbUri);
        this.db = this.client.db(dbName);

        this.state = 'connected';
        return this.db;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.client) {
          try {
            await this.client.close();
          } catch {
          }
          this.client = null;
        }

        if (attempt < this.retryConfig.maxRetries) {
          await sleep(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelayMs);
        }
      }
    }

    this.state = 'error';
    this.client = null;
    this.db = null;
    throw new Error(
      `Failed to connect to MongoDB after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  getDb(): Db {
    if (!this.db || this.state !== 'connected') {
      throw new Error('Not connected to MongoDB. Call connect() first.');
    }
    return this.db;
  }

  getClient(): MongoClient {
    if (!this.client || this.state !== 'connected') {
      throw new Error('Not connected to MongoDB. Call connect() first.');
    }
    return this.client;
  }

  getState(): ConnectionState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === 'connected' && this.db !== null;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch {
      }
    }
    this.client = null;
    this.db = null;
    this.state = 'disconnected';
  }

  private extractDatabaseName(uri: string): string {
    try {
      const match = uri.match(/\/([^/?]+)(\?|$)/);
      if (match && match[1] && match[1] !== 'admin') {
        return match[1];
      }
      return 'test';
    } catch {
      return 'test';
    }
  }
}

export const connectionManager = new ConnectionManager();
