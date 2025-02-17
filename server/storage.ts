import { User, InsertUser, Photo, InsertPhoto } from "@shared/schema";
import { users, photos } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getPhotos(): Promise<Photo[]> {
    return await db.select().from(photos);
  }

  async getPhotosWithUsernames(): Promise<(Photo & { username: string })[]> {
    type PhotoWithUsername = Photo & { username: string };
    const results = await db
      .select({
        id: photos.id,
        userId: photos.userId,
        filename: photos.filename,
        description: photos.description,
        likes: photos.likes,
        username: users.username,
      })
      .from(photos)
      .innerJoin(users, eq(photos.userId, users.id));

    return results as PhotoWithUsername[];
  }

  async createPhoto(userId: number, insertPhoto: InsertPhoto): Promise<Photo> {
    const [photo] = await db
      .insert(photos)
      .values({ ...insertPhoto, userId, likes: 0 })
      .returning();
    return photo;
  }

  async deletePhoto(id: number, userId: number): Promise<void> {
    const result = await db
      .delete(photos)
      .where(eq(photos.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Foto não encontrada ou você não tem permissão para deletá-la");
    }
  }

  async likePhoto(id: number): Promise<Photo> {
    const [photo] = await db
      .update(photos)
      .set((photo) => ({ likes: photo.likes + 1 }))
      .where(eq(photos.id, id))
      .returning();

    if (!photo) {
      throw new Error("Foto não encontrada");
    }

    return photo;
  }
}

export const storage = new DatabaseStorage();