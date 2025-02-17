import { User, InsertUser, Photo, InsertPhoto } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

const MOCK_PHOTOS: Photo[] = [
  {
    id: 1,
    userId: 1,
    imageUrl: "https://source.unsplash.com/random/800x600?school=1",
    description: "First day of school celebration",
    takenAt: new Date("2024-02-01"),
    likes: 12
  },
  {
    id: 2,
    userId: 1,
    imageUrl: "https://source.unsplash.com/random/800x600?graduation=1",
    description: "Graduation ceremony",
    takenAt: new Date("2024-01-15"),
    likes: 8
  },
  {
    id: 3,
    userId: 2,
    imageUrl: "https://source.unsplash.com/random/800x600?classroom=1",
    description: "Science fair projects",
    takenAt: new Date("2024-01-20"),
    likes: 15
  }
];

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getPhotos(): Promise<Photo[]>;
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
    this.photos = [...MOCK_PHOTOS];
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
      throw new Error("Photo not found or you don't have permission to delete it");
    }
    this.photos.splice(index, 1);
  }

  async likePhoto(id: number): Promise<Photo> {
    const photo = this.photos.find(p => p.id === id);
    if (!photo) {
      throw new Error("Photo not found");
    }
    photo.likes += 1;
    return photo;
  }
}

export const storage = new MemStorage();