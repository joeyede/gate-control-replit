import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ControlPage from "@/pages/control-page";
import { MqttProvider } from "@/hooks/use-mqtt";

function Router() {
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/control" component={ControlPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MqttProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </MqttProvider>
    </QueryClientProvider>
  );
}

export default App;
