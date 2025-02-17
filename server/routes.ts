import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPhotoSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/photos", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const photos = await storage.getPhotos();
    res.json(photos);
  });

  app.post("/api/photos", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const parseResult = insertPhotoSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const photo = await storage.createPhoto(req.user!.id, parseResult.data);
    res.status(201).json(photo);
  });

  app.delete("/api/photos/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      await storage.deletePhoto(parseInt(req.params.id), req.user!.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
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