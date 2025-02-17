import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPhotoSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

const storage_config = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Apenas imagens são permitidas'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // limite de 5MB
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/photos", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const photos = await storage.getPhotos();
    res.json(photos);
  });

  app.post("/api/photos", upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    if (!req.file) {
      return res.status(400).json({ message: "Nenhuma foto foi enviada" });
    }

    const parseResult = insertPhotoSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const photo = await storage.createPhoto(req.user!.id, {
      ...parseResult.data,
      filename: req.file.filename,
    });
    res.status(201).json(photo);
  });

  app.get("/uploads/:filename", (req, res) => {
    res.sendFile(path.join(process.cwd(), "uploads", req.params.filename));
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