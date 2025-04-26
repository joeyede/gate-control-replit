import { useState, FormEvent } from 'react';
import { useLocation } from 'wouter';
import { useMqtt } from '@/hooks/use-mqtt';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { connect, status } = useMqtt();
  const [, navigate] = useLocation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      return;
    }

    connect({
      username,
      password,
      rememberMe
    });
  };

  // Redirect to control page when connected
  if (status === 'connected') {
    navigate('/control');
    return null;
  }

  const isConnecting = status === 'connecting';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-surface rounded-lg shadow-lg">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium text-gray-800">MQTT Gate Control</h1>
            <p className="text-gray-600 mt-2">Connect to your HiveMQ broker</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isConnecting}
                className="w-full px-4 py-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isConnecting}
                className="w-full px-4 py-2"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isConnecting}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me
              </Label>
            </div>



            <Button 
              type="submit" 
              className="btn-transition w-full bg-primary hover:bg-primary/90 text-white font-medium" 
              disabled={isConnecting}
            >
              {isConnecting ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </span>
              ) : (
                'Connect'
              )}
            </Button>
            
            {isConnecting && (
              <div className="mt-4 text-sm text-center text-gray-600">
                <div className="flex items-center justify-center">
                  <span className="inline-block h-3 w-3 rounded-full bg-yellow-400 mr-2"></span>
                  <span>Connecting to broker...</span>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
