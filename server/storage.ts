import { User, InsertUser, Photo, InsertPhoto } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

const MOCK_PHOTOS: (Photo & { username: string })[] = [
  {
    id: 1,
    userId: 1,
    filename: "exemplo1.jpg",
    description: "First day of school celebration",
    takenAt: new Date("2024-02-01"),
    likes: 12,
    username: "usuario1"
  },
  {
    id: 2,
    userId: 1,
    filename: "exemplo2.jpg",
    description: "Graduation ceremony",
    takenAt: new Date("2024-01-15"),
    likes: 8,
    username: "usuario1"
  },
  {
    id: 3,
    userId: 2,
    filename: "exemplo3.jpg",
    description: "Science fair projects",
    takenAt: new Date("2024-01-20"),
    likes: 15,
    username: "usuario2"
  }
];

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getPhotos(): Promise<Photo[]>;
  getPhotosWithUsernames(): Promise<(Photo & { username: string })[]>;
  createPhoto(userId: number, photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number, userId: number): Promise<void>;
  likePhoto(id: number): Promise<Photo>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private photos: Photo[];
  private currentId: number;
  private currentPhotoId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.photos = MOCK_PHOTOS;
    this.currentId = 1;
    this.currentPhotoId = this.photos.length + 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPhotos(): Promise<Photo[]> {
    return this.photos;
  }

  async getPhotosWithUsernames(): Promise<(Photo & { username: string })[]> {
    return this.photos.map(photo => {
      const user = this.users.get(photo.userId);
      return {
        ...photo,
        username: user?.username || "Usuário desconhecido"
      };
    });
  }

  async createPhoto(userId: number, insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.currentPhotoId++;
    const photo: Photo = {
      ...insertPhoto,
      id,
      userId,
      likes: 0
    };
    this.photos.push(photo);
    return photo;
  }

  async deletePhoto(id: number, userId: number): Promise<void> {
    const index = this.photos.findIndex(p => p.id === id && p.userId === userId);
    if (index === -1) {
      throw new Error("Foto não encontrada ou você não tem permissão para deletá-la");
    }
    this.photos.splice(index, 1);
  }

  async likePhoto(id: number): Promise<Photo> {
    const photo = this.photos.find(p => p.id === id);
    if (!photo) {
      throw new Error("Foto não encontrada");
    }
    photo.likes += 1;
    return photo;
  }
}

export const storage = new MemStorage();