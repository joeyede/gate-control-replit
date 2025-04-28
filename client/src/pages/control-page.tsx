import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useMqtt } from '@/hooks/use-mqtt';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Wifi, 
  ArrowRight, 
  ArrowLeft, 
  DoorOpen, 
  User,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export default function ControlPage() {
  const { 
    isConnected, 
    disconnect, 
    sendGateControl, 
    lastAction, 
    lastActionTimestamp,
    lastHeartbeat,
    gateStatus
  } = useMqtt();
  const [, navigate] = useLocation();
  const [countdown, setCountdown] = useState(60);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // Redirect to auth page if not connected
  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);
  
  // Handle countdown timer for initial heartbeat
  useEffect(() => {
    // Start countdown when connected but no heartbeat yet
    if (isConnected && gateStatus === 'unknown' && !lastHeartbeat) {
      // Clear any existing interval
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      
      // Reset countdown to 60 seconds
      setCountdown(60);
      
      // Start new countdown
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // If countdown reaches zero, reset to 60
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (lastHeartbeat || gateStatus !== 'unknown') {
      // Clear interval when heartbeat is received or status changes
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    }
    
    // Cleanup function
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    };
  }, [isConnected, gateStatus, lastHeartbeat]);

  if (!isConnected) {
    return null;
  }

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const formatLastAction = () => {
    if (!lastAction || !lastActionTimestamp) {
      return 'No actions performed yet';
    }
    
    return `Last action: ${lastAction} at ${lastActionTimestamp.toLocaleTimeString()}`;
  };
  
  const getGateStatusInfo = () => {
    switch (gateStatus) {
      case 'online':
        return {
          icon: <CheckCircle className="h-4 w-4 text-success mr-1" />,
          text: 'Gate Online',
          description: lastHeartbeat ? `Last heartbeat: ${lastHeartbeat.toLocaleTimeString()}` : '',
          color: 'text-success'
        };
      case 'offline':
        return {
          icon: <XCircle className="h-4 w-4 text-destructive mr-1" />,
          text: 'Gate Offline',
          description: lastHeartbeat ? `Last heartbeat: ${lastHeartbeat.toLocaleTimeString()}` : '',
          color: 'text-destructive'
        };
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-warning mr-1" />,
          text: 'Gate Status Unknown',
          description: lastHeartbeat 
            ? `Last heartbeat: ${lastHeartbeat.toLocaleTimeString()}`
            : `Expecting heartbeat in: ${countdown} seconds`,
          color: 'text-warning'
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 min-h-screen">
      <Card className="bg-surface rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto">
        <CardContent className="p-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-medium text-gray-800">Gate Control</h1>
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-destructive flex items-center text-sm" 
              onClick={handleDisconnect}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Disconnect
            </Button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Wifi className="h-4 w-4 text-success mr-1" />
              <span>Connected to HiveMQ broker</span>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              Topic: gate/control
            </div>
            
            {/* Gate status indicator */}
            <div className="flex flex-col rounded-md bg-gray-50 p-3 border border-gray-100">
              <div className="flex items-center text-sm mb-1">
                {getGateStatusInfo().icon}
                <span className={getGateStatusInfo().color}>{getGateStatusInfo().text}</span>
              </div>
              <div className="text-xs text-gray-500">
                {getGateStatusInfo().description}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <Button 
              className="btn-transition bg-primary hover:bg-primary/90 text-white font-medium py-6 h-auto flex flex-col items-center justify-center"
              onClick={() => sendGateControl('pedestrian')}
            >
              <User className="h-6 w-6 mb-2" />
              <span>Pedestrian</span>
            </Button>

            <Button 
              className="btn-transition bg-primary hover:bg-primary/90 text-white font-medium py-6 h-auto flex flex-col items-center justify-center"
              onClick={() => sendGateControl('full')}
            >
              <DoorOpen className="h-6 w-6 mb-2" />
              <span>Full Open</span>
            </Button>

            <Button 
              className="btn-transition bg-primary hover:bg-primary/90 text-white font-medium py-6 h-auto flex flex-col items-center justify-center"
              onClick={() => sendGateControl('left')}
            >
              <ArrowLeft className="h-6 w-6 mb-2" />
              <span>Left Gate</span>
            </Button>

            <Button 
              className="btn-transition bg-primary hover:bg-primary/90 text-white font-medium py-6 h-auto flex flex-col items-center justify-center"
              onClick={() => sendGateControl('right')}
            >
              <ArrowRight className="h-6 w-6 mb-2" />
              <span>Right Gate</span>
            </Button>
          </div>

          <div className="text-center p-3 bg-gray-100 rounded-md text-sm text-gray-600">
            {formatLastAction()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
