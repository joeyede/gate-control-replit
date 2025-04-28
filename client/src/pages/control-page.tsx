import { useEffect } from 'react';
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
  User
} from 'lucide-react';

export default function ControlPage() {
  const { 
    isConnected, 
    disconnect, 
    sendGateControl, 
    lastAction, 
    lastActionTimestamp
  } = useMqtt();
  const [, navigate] = useLocation();

  // Redirect to auth page if not connected
  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

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
            <div className="text-xs text-gray-500">
              Topic: gate/control
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
