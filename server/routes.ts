import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, requireAuth, requireAdmin, requirePasswordChange, hashPassword, comparePasswords } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { insertClienteSchema, updateClienteSchema, insertDocumentoJuridicoSchema } from "@shared/schema";
import passport from "passport";
import { buscarCEP } from "./services/viacep";
import { buscarEstados, buscarMunicipios } from "./services/ibge";

// Setup file upload
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas PDF, JPG e PNG são aceitos.'));
    }
  },
});

// Helper to create audit log
async function createAuditLog(
  req: Request,
  acao: string,
  entidade?: string,
  entidadeId?: string,
  detalhes?: string
) {
  if (req.user) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await storage.createLog({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      acao,
      entidade,
      entidadeId,
      detalhes,
      ipAddress: typeof ip === 'string' ? ip : ip?.[0] || null,
    });
  }
}

export function registerRoutes(app: Express): Server {
  // Setup authentication (session and passport only)
  setupAuth(app);

  // Auth routes
  app.post("/api/login", passport.authenticate("local", { failureMessage: true }), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      await storage.updateUserLastAccess(user.id);

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      await storage.createLog({
        usuarioId: user.id,
        usuarioNome: user.nome,
        acao: "login",
        detalhes: "Login realizado com sucesso",
        ipAddress: typeof ip === 'string' ? ip : ip?.[0] || null,
      });

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user) {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      await storage.createLog({
        usuarioId: user.id,
        usuarioNome: user.nome,
        acao: "logout",
        detalhes: "Logout realizado",
        ipAddress: typeof ip === 'string' ? ip : ip?.[0] || null,
      });
    }

    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", requireAuth, (req: Request, res: Response) => {
    res.json(req.user);
  });

  // Change password endpoint with password validation (no CSRF for auth flows)
  app.post("/api/change-password", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      
      const passwordSchema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      });

      const { currentPassword, newPassword } = passwordSchema.parse(req.body);

      const passwordMatch = await comparePasswords(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(400).send("Senha atual incorreta");
      }

      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      await storage.createLog({
        usuarioId: user.id,
        usuarioNome: user.nome,
        acao: "alterar_senha",
        detalhes: "Senha alterada com sucesso",
        ipAddress: typeof ip === 'string' ? ip : ip?.[0] || null,
      });

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  // Apply password change requirement to all routes except allowed ones
  app.use("/api/*", (req, res, next) => {
    // Skip for auth/password change routes
    const allowedPaths = [
      '/api/login',
      '/api/logout',
      '/api/user',
      '/api/change-password'
    ];

    if (allowedPaths.includes(req.path)) {
      return next();
    }

    requirePasswordChange(req, res, next);
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard/atividades-recentes", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const atividades = await storage.getRecentActivities(10);
      res.json(atividades);
    } catch (error) {
      next(error);
    }
  });

  // Clientes routes
  app.get("/api/clientes", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientes = await storage.getAllClientes();
      res.json(clientes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/clientes/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cliente = await storage.getClienteById(req.params.id);
      if (!cliente) {
        return res.status(404).send("Cliente não encontrado");
      }
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/clientes", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const validatedData = insertClienteSchema.parse(req.body);
      const cliente = await storage.createCliente(validatedData, req.user!.id);
      await createAuditLog(req, "criar_cliente", "cliente", cliente.id, `Cliente criado: ${cliente.nome}`);
      res.status(201).json(cliente);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/clientes/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate partial input
      const validatedData = updateClienteSchema.parse(req.body);
      const cliente = await storage.updateCliente(req.params.id, validatedData);
      await createAuditLog(req, "editar_cliente", "cliente", cliente.id, `Cliente editado: ${cliente.nome}`);
      res.json(cliente);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/clientes/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cliente = await storage.getClienteById(req.params.id);
      if (!cliente) {
        return res.status(404).send("Cliente não encontrado");
      }
      await storage.deleteCliente(req.params.id);
      await createAuditLog(req, "excluir_cliente", "cliente", req.params.id, `Cliente excluído: ${cliente.nome}`);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // CEP e IBGE routes
  app.get("/api/cep/:cep", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cepSchema = z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido");
      const cep = cepSchema.parse(req.params.cep);
      
      const endereco = await buscarCEP(cep);
      
      if (!endereco) {
        return res.status(404).send("CEP não encontrado");
      }
      
      res.json(endereco);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      next(error);
    }
  });

  app.get("/api/ibge/estados", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const estados = await buscarEstados();
      res.json(estados);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/ibge/municipios/:uf", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ufSchema = z.string().length(2, "UF deve ter 2 caracteres");
      const uf = ufSchema.parse(req.params.uf);
      
      const municipios = await buscarMunicipios(uf);
      res.json(municipios);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      next(error);
    }
  });

  // Documentos routes
  app.get("/api/documentos", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documentos = await storage.getAllDocumentos();
      res.json(documentos);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/documentos/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documento = await storage.getDocumentoById(req.params.id);
      if (!documento) {
        return res.status(404).send("Documento não encontrado");
      }
      res.json(documento);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/documentos/upload", requireAuth, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).send("Nenhum arquivo enviado");
      }

      // Validate metadata
      const uploadSchema = z.object({
        nome: z.string().min(1),
        descricao: z.string().optional(),
        clienteId: z.string().min(1),
        status: z.enum(['em_analise', 'em_uso', 'devolvido', 'arquivado']).default('em_analise'),
      });

      const validatedData = uploadSchema.parse(req.body);
      const { nome, descricao, clienteId, status } = validatedData;

      const documento = await storage.createDocumento({
        nome,
        descricao: descricao || null,
        clienteId,
        nomeArquivo: req.file!.filename,
        tipoArquivo: req.file!.mimetype.split('/')[1],
        tamanhoBytes: req.file!.size,
        caminhoArquivo: req.file!.path,
        status,
      }, req.user!.id);

      await createAuditLog(req, "upload_documento", "documento", documento.id, `Documento enviado: ${documento.nome}`);
      res.status(201).json(documento);
    } catch (error) {
      // Delete uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/documentos/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate partial update
      const updateSchema = z.object({
        nome: z.string().optional(),
        descricao: z.string().nullable().optional(),
        status: z.enum(['em_analise', 'em_uso', 'devolvido', 'arquivado']).optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      const documento = await storage.updateDocumento(req.params.id, validatedData);
      await createAuditLog(req, "editar_documento", "documento", documento.id, `Documento editado: ${documento.nome}`);
      res.json(documento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/documentos/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documento = await storage.getDocumentoById(req.params.id);
      if (!documento) {
        return res.status(404).send("Documento não encontrado");
      }

      // Delete file from filesystem
      if (fs.existsSync(documento.caminhoArquivo)) {
        fs.unlinkSync(documento.caminhoArquivo);
      }

      await storage.deleteDocumento(req.params.id);
      await createAuditLog(req, "excluir_documento", "documento", req.params.id, `Documento excluído: ${documento.nome}`);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Documentos Juridicos routes
  app.get("/api/documentos-juridicos", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documentos = await storage.getAllDocumentosJuridicos();
      res.json(documentos);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/documentos-juridicos", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const validatedData = insertDocumentoJuridicoSchema.parse(req.body);
      const documento = await storage.createDocumentoJuridico(validatedData, req.user!.id);

      await createAuditLog(req, "criar_documento_juridico", "documento_juridico", documento.id, `Documento jurídico criado: ${documento.titulo}`);
      res.status(201).json(documento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/documentos-juridicos/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updateSchema = insertDocumentoJuridicoSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      const documento = await storage.updateDocumentoJuridico(req.params.id, validatedData);
      await createAuditLog(req, "editar_documento_juridico", "documento_juridico", documento.id, `Documento jurídico editado: ${documento.titulo}`);
      res.json(documento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/documentos-juridicos/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      await storage.deleteDocumentoJuridico(req.params.id);
      await createAuditLog(req, "excluir_documento_juridico", "documento_juridico", req.params.id, "Documento jurídico excluído");
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Usuarios routes (admin only)
  app.get("/api/usuarios", requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarios = await storage.getAllUsers();
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/usuarios", requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userSchema = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        nome: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["admin", "user"]).default("user"),
      });

      const validatedData = userSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).send("Usuário já existe");
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).send("Email já cadastrado");
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      await createAuditLog(req, "criar_usuario", "usuario", user.id, `Usuário criado: ${user.nome}`);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/usuarios/:id", requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate user update
      const updateUserSchema = z.object({
        username: z.string().min(3).optional(),
        password: z.string().min(6).optional(),
        nome: z.string().min(1).optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "user"]).optional(),
      });

      const validatedData = updateUserSchema.parse(req.body);
      const { password, ...data } = validatedData;
      
      let updateData = data;
      if (password) {
        const hashedPassword = await hashPassword(password);
        updateData = { ...data, password: hashedPassword };
      }

      const user = await storage.updateUser(req.params.id, updateData);
      await createAuditLog(req, "editar_usuario", "usuario", user.id, `Usuário editado: ${user.nome}`);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/usuarios/:id/toggle-ativo", requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const toggleSchema = z.object({
        ativo: z.boolean(),
      });
      const { ativo } = toggleSchema.parse(req.body);
      const user = await storage.toggleUserActive(req.params.id, ativo);
      await createAuditLog(req, "alterar_status_usuario", "usuario", user.id, `Usuário ${ativo ? 'ativado' : 'desativado'}: ${user.nome}`);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  // Logs routes (admin only)
  app.get("/api/logs", requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await storage.getAllLogs();
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
