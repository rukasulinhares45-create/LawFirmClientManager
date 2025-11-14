// Based on javascript_auth_all_persistance and javascript_database blueprints
import {
  users,
  clientes,
  documentos,
  documentosJuridicos,
  logsAuditoria,
  statusDocumentos,
  type User,
  type InsertUser,
  type Cliente,
  type InsertCliente,
  type Documento,
  type InsertDocumento,
  type DocumentoJuridico,
  type InsertDocumentoJuridico,
  type LogAuditoria,
  type InsertLogAuditoria,
  type StatusDocumento,
  type InsertStatusDocumento,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, like, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<User>;
  updateUserLastAccess(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;
  toggleUserActive(id: string, ativo: boolean): Promise<User>;

  // Cliente methods
  getAllClientes(): Promise<Cliente[]>;
  getClienteById(id: string): Promise<Cliente | undefined>;
  createCliente(cliente: InsertCliente, userId: string): Promise<Cliente>;
  updateCliente(id: string, cliente: Partial<InsertCliente>): Promise<Cliente>;
  deleteCliente(id: string): Promise<void>;

  // Documento methods
  getAllDocumentos(): Promise<Documento[]>;
  getDocumentoById(id: string): Promise<Documento | undefined>;
  createDocumento(documento: InsertDocumento, userId: string): Promise<Documento>;
  updateDocumento(id: string, documento: Partial<InsertDocumento>): Promise<Documento>;
  deleteDocumento(id: string): Promise<void>;

  // Status Documento methods
  getAllStatusDocumentos(): Promise<StatusDocumento[]>;
  getStatusDocumentoById(id: string): Promise<StatusDocumento | undefined>;
  createStatusDocumento(status: InsertStatusDocumento): Promise<StatusDocumento>;
  updateStatusDocumento(id: string, status: Partial<InsertStatusDocumento>): Promise<StatusDocumento>;
  deleteStatusDocumento(id: string): Promise<void>;

  // Documento Juridico methods
  getAllDocumentosJuridicos(): Promise<DocumentoJuridico[]>;
  getDocumentoJuridicoById(id: string): Promise<DocumentoJuridico | undefined>;
  createDocumentoJuridico(documento: InsertDocumentoJuridico, userId: string): Promise<DocumentoJuridico>;
  updateDocumentoJuridico(id: string, documento: Partial<InsertDocumentoJuridico>): Promise<DocumentoJuridico>;
  deleteDocumentoJuridico(id: string): Promise<void>;

  // Log methods
  createLog(log: InsertLogAuditoria): Promise<LogAuditoria>;
  getAllLogs(): Promise<LogAuditoria[]>;

  // Dashboard methods
  getDashboardStats(): Promise<{
    totalClientes: number;
  }>;
  getRecentActivities(limit?: number): Promise<LogAuditoria[]>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password, primeiroAcesso: false })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLastAccess(id: string): Promise<void> {
    await db
      .update(users)
      .set({ ultimoAcesso: new Date() })
      .where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.criadoEm));
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async toggleUserActive(id: string, ativo: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ativo })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Cliente methods
  async getAllClientes(): Promise<Cliente[]> {
    return await db.select().from(clientes).orderBy(desc(clientes.criadoEm));
  }

  async getClienteById(id: string): Promise<Cliente | undefined> {
    const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id));
    return cliente || undefined;
  }

  async createCliente(insertCliente: InsertCliente, userId: string): Promise<Cliente> {
    const [cliente] = await db
      .insert(clientes)
      .values({
        ...insertCliente,
        criadoPorId: userId,
      })
      .returning();
    return cliente;
  }

  async updateCliente(id: string, insertCliente: Partial<InsertCliente>): Promise<Cliente> {
    const [cliente] = await db
      .update(clientes)
      .set({
        ...insertCliente,
        atualizadoEm: new Date(),
      })
      .where(eq(clientes.id, id))
      .returning();
    return cliente;
  }

  async deleteCliente(id: string): Promise<void> {
    await db.delete(clientes).where(eq(clientes.id, id));
  }

  // Documento methods
  async getAllDocumentos(): Promise<Documento[]> {
    return await db.select().from(documentos).orderBy(desc(documentos.uploadEm));
  }

  async getDocumentoById(id: string): Promise<Documento | undefined> {
    const [documento] = await db.select().from(documentos).where(eq(documentos.id, id));
    return documento || undefined;
  }

  async createDocumento(insertDocumento: InsertDocumento, userId: string): Promise<Documento> {
    const [documento] = await db
      .insert(documentos)
      .values({
        ...insertDocumento,
        uploadPorId: userId,
      })
      .returning();
    return documento;
  }

  async updateDocumento(id: string, insertDocumento: Partial<InsertDocumento>): Promise<Documento> {
    const [documento] = await db
      .update(documentos)
      .set(insertDocumento)
      .where(eq(documentos.id, id))
      .returning();
    return documento;
  }

  async deleteDocumento(id: string): Promise<void> {
    await db.delete(documentos).where(eq(documentos.id, id));
  }

  // Status Documento methods
  async getAllStatusDocumentos(): Promise<StatusDocumento[]> {
    return await db.select().from(statusDocumentos).where(eq(statusDocumentos.ativo, true)).orderBy(statusDocumentos.ordem);
  }

  async getStatusDocumentoById(id: string): Promise<StatusDocumento | undefined> {
    const [status] = await db.select().from(statusDocumentos).where(eq(statusDocumentos.id, id));
    return status || undefined;
  }

  async createStatusDocumento(insertStatus: InsertStatusDocumento): Promise<StatusDocumento> {
    const [status] = await db
      .insert(statusDocumentos)
      .values(insertStatus)
      .returning();
    return status;
  }

  async updateStatusDocumento(id: string, insertStatus: Partial<InsertStatusDocumento>): Promise<StatusDocumento> {
    const [status] = await db
      .update(statusDocumentos)
      .set(insertStatus)
      .where(eq(statusDocumentos.id, id))
      .returning();
    return status;
  }

  async deleteStatusDocumento(id: string): Promise<void> {
    await db.delete(statusDocumentos).where(eq(statusDocumentos.id, id));
  }

  // Documento Juridico methods
  async getAllDocumentosJuridicos(): Promise<DocumentoJuridico[]> {
    return await db.select().from(documentosJuridicos).orderBy(desc(documentosJuridicos.criadoEm));
  }

  async getDocumentoJuridicoById(id: string): Promise<DocumentoJuridico | undefined> {
    const [documento] = await db.select().from(documentosJuridicos).where(eq(documentosJuridicos.id, id));
    return documento || undefined;
  }

  async createDocumentoJuridico(insertDocumento: InsertDocumentoJuridico, userId: string): Promise<DocumentoJuridico> {
    const [documento] = await db
      .insert(documentosJuridicos)
      .values({
        ...insertDocumento,
        criadoPorId: userId,
      })
      .returning();
    return documento;
  }

  async updateDocumentoJuridico(id: string, insertDocumento: Partial<InsertDocumentoJuridico>): Promise<DocumentoJuridico> {
    const [documento] = await db
      .update(documentosJuridicos)
      .set({
        ...insertDocumento,
        atualizadoEm: new Date(),
      })
      .where(eq(documentosJuridicos.id, id))
      .returning();
    return documento;
  }

  async deleteDocumentoJuridico(id: string): Promise<void> {
    await db.delete(documentosJuridicos).where(eq(documentosJuridicos.id, id));
  }

  // Log methods
  async createLog(insertLog: InsertLogAuditoria): Promise<LogAuditoria> {
    const [log] = await db
      .insert(logsAuditoria)
      .values(insertLog)
      .returning();
    return log;
  }

  async getAllLogs(): Promise<LogAuditoria[]> {
    return await db.select().from(logsAuditoria).orderBy(desc(logsAuditoria.dataHora)).limit(100);
  }

  // Dashboard methods
  async getDashboardStats() {
    const [totalClientesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clientes);

    return {
      totalClientes: totalClientesResult?.count || 0,
    };
  }

  async getRecentActivities(limit: number = 10): Promise<LogAuditoria[]> {
    return await db
      .select()
      .from(logsAuditoria)
      .orderBy(desc(logsAuditoria.dataHora))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
