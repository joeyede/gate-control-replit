import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // No need for API routes, as MQTT connection is established directly in browser
  
  const httpServer = createServer(app);
  return httpServer;
}
