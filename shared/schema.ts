import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuários do sistema (advogados e administradores)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"), // "admin" | "user"
  ativo: boolean("ativo").notNull().default(true),
  primeiroAcesso: boolean("primeiro_acesso").notNull().default(true),
  ultimoAcesso: timestamp("ultimo_acesso"),
  criadoEm: timestamp("criado_em").notNull().default(sql`now()`),
});

// Clientes (Pessoa Física ou Jurídica)
export const clientes = pgTable("clientes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipo: text("tipo").notNull(), // "pf" | "pj"
  
  // Campos comuns
  nome: text("nome").notNull(), // Nome completo ou Razão Social
  cpfCnpj: text("cpf_cnpj").notNull().unique(),
  rgInscricaoEstadual: text("rg_inscricao_estadual"),
  
  // Pessoa Física
  dataNascimento: text("data_nascimento"),
  localNascimento: text("local_nascimento"),
  
  // Endereço
  cep: text("cep"),
  endereco: text("endereco"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"),
  
  // Contato
  telefone: text("telefone"),
  celular: text("celular"),
  email: text("email"),
  
  // Profissional
  ocupacao: text("ocupacao"), // Ocupação ou Ramo de atuação
  
  // Observações
  observacoes: text("observacoes"),
  
  // Metadados
  criadoPorId: varchar("criado_por_id").notNull().references(() => users.id),
  criadoEm: timestamp("criado_em").notNull().default(sql`now()`),
  atualizadoEm: timestamp("atualizado_em").notNull().default(sql`now()`),
});

// Documentos vinculados a clientes
export const documentos = pgTable("documentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: 'cascade' }),
  
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  
  // Arquivo
  nomeArquivo: text("nome_arquivo").notNull(),
  tipoArquivo: text("tipo_arquivo").notNull(), // "pdf" | "jpg" | "png"
  tamanhoBytes: integer("tamanho_bytes").notNull(),
  caminhoArquivo: text("caminho_arquivo").notNull(),
  
  // Status
  status: text("status").notNull().default("em_analise"), // "em_analise" | "em_uso" | "devolvido" | "arquivado"
  statusAtualizadoEm: timestamp("status_atualizado_em").notNull().default(sql`now()`),
  
  // Metadados
  uploadPorId: varchar("upload_por_id").notNull().references(() => users.id),
  uploadEm: timestamp("upload_em").notNull().default(sql`now()`),
});

// Documentos jurídicos criados no editor
export const documentosJuridicos = pgTable("documentos_juridicos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").references(() => clientes.id, { onDelete: 'set null' }),
  
  titulo: text("titulo").notNull(),
  conteudo: text("conteudo").notNull(), // HTML do editor
  
  // Metadados
  criadoPorId: varchar("criado_por_id").notNull().references(() => users.id),
  criadoEm: timestamp("criado_em").notNull().default(sql`now()`),
  atualizadoEm: timestamp("atualizado_em").notNull().default(sql`now()`),
});

// Logs de auditoria
export const logsAuditoria = pgTable("logs_auditoria", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").references(() => users.id, { onDelete: 'set null' }),
  usuarioNome: text("usuario_nome").notNull(),
  
  acao: text("acao").notNull(), // "login" | "criar_cliente" | "editar_cliente" | "upload_documento" etc
  entidade: text("entidade"), // "cliente" | "documento" | "usuario" | "documento_juridico"
  entidadeId: varchar("entidade_id"),
  detalhes: text("detalhes"),
  
  dataHora: timestamp("data_hora").notNull().default(sql`now()`),
  ipAddress: text("ip_address"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clientesCriados: many(clientes),
  documentosUpload: many(documentos),
  documentosJuridicosÇriados: many(documentosJuridicos),
  logsAuditoria: many(logsAuditoria),
}));

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  criadoPor: one(users, {
    fields: [clientes.criadoPorId],
    references: [users.id],
  }),
  documentos: many(documentos),
  documentosJuridicos: many(documentosJuridicos),
}));

export const documentosRelations = relations(documentos, ({ one }) => ({
  cliente: one(clientes, {
    fields: [documentos.clienteId],
    references: [clientes.id],
  }),
  uploadPor: one(users, {
    fields: [documentos.uploadPorId],
    references: [users.id],
  }),
}));

export const documentosJuridicosRelations = relations(documentosJuridicos, ({ one }) => ({
  cliente: one(clientes, {
    fields: [documentosJuridicos.clienteId],
    references: [clientes.id],
  }),
  criadoPor: one(users, {
    fields: [documentosJuridicos.criadoPorId],
    references: [users.id],
  }),
}));

export const logsAuditoriaRelations = relations(logsAuditoria, ({ one }) => ({
  usuario: one(users, {
    fields: [logsAuditoria.usuarioId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  nome: true,
  email: true,
  role: true,
});

export const insertClienteSchema = createInsertSchema(clientes).omit({
  id: true,
  criadoPorId: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertDocumentoSchema = createInsertSchema(documentos).omit({
  id: true,
  uploadPorId: true,
  uploadEm: true,
  statusAtualizadoEm: true,
});

export const insertDocumentoJuridicoSchema = createInsertSchema(documentosJuridicos).omit({
  id: true,
  criadoPorId: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertLogAuditoriaSchema = createInsertSchema(logsAuditoria).omit({
  id: true,
  dataHora: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;

export type InsertDocumento = z.infer<typeof insertDocumentoSchema>;
export type Documento = typeof documentos.$inferSelect;

export type InsertDocumentoJuridico = z.infer<typeof insertDocumentoJuridicoSchema>;
export type DocumentoJuridico = typeof documentosJuridicos.$inferSelect;

export type InsertLogAuditoria = z.infer<typeof insertLogAuditoriaSchema>;
export type LogAuditoria = typeof logsAuditoria.$inferSelect;
