import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MqttService, MqttConnectionStatus, GateAction, MqttConnectionInfo, GateStatus } from '@/lib/mqtt-client';

interface MqttContextType {
  status: MqttConnectionStatus;
  isConnected: boolean;
  error: string | null;
  lastAction: GateAction | null;
  lastActionTimestamp: Date | null;
  lastHeartbeat: Date | null;
  gateStatus: GateStatus;
  connect: (connectionInfo: MqttConnectionInfo) => void;
  disconnect: () => void;
  sendGateControl: (action: GateAction) => void;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

interface MqttProviderProps {
  children: ReactNode;
}

export const MqttProvider = ({ children }: MqttProviderProps) => {
  const [mqttService] = useState<MqttService>(() => new MqttService());
  const [status, setStatus] = useState<MqttConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<GateAction | null>(null);
  const [lastActionTimestamp, setLastActionTimestamp] = useState<Date | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [gateStatus, setGateStatus] = useState<GateStatus>('unknown');
  const { toast } = useToast();

  useEffect(() => {
    const statusUnsubscribe = mqttService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      
      if (newStatus === 'connected') {
        toast({
          title: 'Connected',
          description: 'Successfully connected to MQTT broker',
          variant: 'default',
        });
      } else if (newStatus === 'error') {
        toast({
          title: 'Connection Error',
          description: mqttService.error || 'Failed to connect to MQTT broker',
          variant: 'destructive',
        });
      } else if (newStatus === 'disconnected') {
        setLastAction(null);
        setLastActionTimestamp(null);
      }
    });

    const errorUnsubscribe = mqttService.onError((errorMessage) => {
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    return () => {
      statusUnsubscribe();
      errorUnsubscribe();
      mqttService.disconnect();
    };
  }, [mqttService, toast]);

  // Update lastAction whenever it changes in the service
  useEffect(() => {
    if (mqttService.lastAction !== lastAction) {
      setLastAction(mqttService.lastAction);
    }
    if (mqttService.lastActionTimestamp !== lastActionTimestamp) {
      setLastActionTimestamp(mqttService.lastActionTimestamp);
    }
  }, [mqttService, lastAction, lastActionTimestamp]);
  
  // Set up heartbeat listener
  useEffect(() => {
    const heartbeatUnsubscribe = mqttService.onHeartbeat((timestamp, status) => {
      setLastHeartbeat(timestamp);
      setGateStatus(status);
      
      // Toast only when gate status changes
      if (status !== gateStatus) {
        if (status === 'online') {
          toast({
            title: 'Gate Online',
            description: 'Gate is now online and ready to receive commands',
            variant: 'default',
          });
        } else if (status === 'offline') {
          toast({
            title: 'Gate Offline',
            description: 'Gate has gone offline and may not respond to commands',
            variant: 'destructive',
          });
        }
      }
    });
    
    return () => {
      heartbeatUnsubscribe();
    };
  }, [mqttService, gateStatus, toast]);

  const connect = useCallback((connectionInfo: MqttConnectionInfo) => {
    mqttService.connect(connectionInfo);
  }, [mqttService]);

  const disconnect = useCallback(() => {
    mqttService.disconnect();
    toast({
      title: 'Disconnected',
      description: 'Disconnected from MQTT broker',
    });
  }, [mqttService, toast]);

  const sendGateControl = useCallback((action: GateAction) => {
    const success = mqttService.sendGateControl(action);
    if (success) {
      setLastAction(action);
      setLastActionTimestamp(new Date());
      toast({
        title: 'Command Sent',
        description: `Action '${action}' sent successfully`,
      });
    }
  }, [mqttService, toast]);

  const value = {
    status,
    isConnected: status === 'connected',
    error,
    lastAction,
    lastActionTimestamp,
    lastHeartbeat,
    gateStatus,
    connect,
    disconnect,
    sendGateControl,
  };

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
};

export const useMqtt = () => {
  const context = useContext(MqttContext);
  if (context === undefined) {
    throw new Error('useMqtt must be used within a MqttProvider');
  }
  return context;
};
