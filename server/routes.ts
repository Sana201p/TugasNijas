import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/photos", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const photos = await storage.getPhotos();
    res.json(photos);
  });

  app.post("/api/photos/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const photo = await storage.likePhoto(parseInt(req.params.id));
    res.json(photo);
  });

  const httpServer = createServer(app);
  return httpServer;
}
