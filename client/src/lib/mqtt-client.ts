import mqtt, { MqttClient, IClientOptions } from 'mqtt';

// Broker details
export const BROKER_URL = '3b62666a86a14b23956244c4308bad76.s1.eu.hivemq.cloud';
export const BROKER_PORT = 8884;
export const TOPIC = 'gate/control';
export const STATUS_TOPIC = 'gate/status';

export type GateAction = 'full' | 'pedestrian' | 'right' | 'left';

export interface GateControlMessage {
  action: GateAction;
}

export type MqttConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MqttConnectionInfo {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface GateHeartbeat {
  hb: string; // Date string
}

export type GateStatus = 'unknown' | 'online' | 'offline';

export class MqttService {
  private client: MqttClient | null = null;
  private _status: MqttConnectionStatus = 'disconnected';
  private _error: string | null = null;
  private _lastAction: GateAction | null = null;
  private _lastActionTimestamp: Date | null = null;
  private _lastHeartbeat: Date | null = null;
  private _gateStatus: GateStatus = 'unknown';

  private onStatusChangeCallbacks: ((status: MqttConnectionStatus) => void)[] = [];
  private onMessageCallbacks: ((topic: string, message: Buffer) => void)[] = [];
  private onErrorCallbacks: ((error: string) => void)[] = [];
  private onHeartbeatCallbacks: ((timestamp: Date | null, status: GateStatus) => void)[] = [];

  get status(): MqttConnectionStatus {
    return this._status;
  }

  get error(): string | null {
    return this._error;
  }

  get lastAction(): GateAction | null {
    return this._lastAction;
  }

  get lastActionTimestamp(): Date | null {
    return this._lastActionTimestamp;
  }

  get isConnected(): boolean {
    return this._status === 'connected';
  }
  
  get lastHeartbeat(): Date | null {
    return this._lastHeartbeat;
  }
  
  get gateStatus(): GateStatus {
    return this._gateStatus;
  }

  connect(connectionInfo: MqttConnectionInfo): void {
    this.updateStatus('connecting');

    const options: IClientOptions = {
      username: connectionInfo.username,
      password: connectionInfo.password,
      protocol: 'wss',
      port: BROKER_PORT
    };

    try {
      this.client = mqtt.connect(`wss://${BROKER_URL}:${BROKER_PORT}/mqtt`, options);

      this.client.on('connect', () => {
        this.updateStatus('connected');
      });

      this.client.on('error', (err) => {
        const errorMessage = err.message || 'Unknown error occurred';
        this._error = errorMessage;
        this.updateStatus('error');
        this.notifyErrorCallbacks(errorMessage);
      });

      this.client.on('message', (topic, message) => {
        this.notifyMessageCallbacks(topic, message);
      });

      this.client.on('offline', () => {
        this.updateStatus('disconnected');
      });

      this.client.on('disconnect', () => {
        this.updateStatus('disconnected');
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this._error = errorMessage;
      this.updateStatus('error');
      this.notifyErrorCallbacks(errorMessage);
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
    this.updateStatus('disconnected');
  }

  sendGateControl(action: GateAction): boolean {
    if (!this.client || !this.isConnected) {
      this.notifyErrorCallbacks('Not connected to MQTT broker');
      return false;
    }

    try {
      const message: GateControlMessage = { action };
      this.client.publish(TOPIC, JSON.stringify(message));
      this._lastAction = action;
      this._lastActionTimestamp = new Date();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      this.notifyErrorCallbacks(errorMessage);
      return false;
    }
  }

  onStatusChange(callback: (status: MqttConnectionStatus) => void): () => void {
    this.onStatusChangeCallbacks.push(callback);
    return () => {
      this.onStatusChangeCallbacks = this.onStatusChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  onMessage(callback: (topic: string, message: Buffer) => void): () => void {
    this.onMessageCallbacks.push(callback);
    return () => {
      this.onMessageCallbacks = this.onMessageCallbacks.filter(cb => cb !== callback);
    };
  }

  onError(callback: (error: string) => void): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter(cb => cb !== callback);
    };
  }

  private updateStatus(status: MqttConnectionStatus): void {
    this._status = status;
    this.notifyStatusChangeCallbacks();
  }

  private notifyStatusChangeCallbacks(): void {
    this.onStatusChangeCallbacks.forEach(callback => callback(this._status));
  }

  private notifyMessageCallbacks(topic: string, message: Buffer): void {
    this.onMessageCallbacks.forEach(callback => callback(topic, message));
  }

  private notifyErrorCallbacks(error: string): void {
    this._error = error;
    this.onErrorCallbacks.forEach(callback => callback(error));
  }
}
