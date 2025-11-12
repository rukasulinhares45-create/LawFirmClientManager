# Sistema de Gestão de Clientes para Escritório de Advocacia

## Visão Geral
Sistema completo de gestão de clientes desenvolvido especificamente para escritórios de advocacia, com interface em português brasileiro (pt-BR). Oferece funcionalidades robustas para gerenciamento de clientes (pessoas físicas e jurídicas), documentos, editor de documentos jurídicos e logs de auditoria.

## Stack Tecnológica

### Frontend
- **Framework**: React com TypeScript
- **Estilização**: Tailwind CSS + Shadcn UI
- **Roteamento**: Wouter
- **Estado/Data Fetching**: TanStack React Query
- **Formulários**: React Hook Form + Zod
- **Ícones**: Lucide React
- **Data**: date-fns (localização pt-BR)

### Backend
- **Runtime**: Node.js com Express
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Autenticação**: Passport.js (Local Strategy)
- **Sessões**: express-session com PostgreSQL store
- **Segurança**: 
  - Bcrypt (hash de senhas com 12 salt rounds)
  - Helmet (headers de segurança)
  - Validação Zod em todas as rotas
  - Proteção contra SQL Injection, XSS e CSRF
- **Upload de Arquivos**: Multer (PDF, JPG, PNG até 10MB)

## Funcionalidades Principais

### 1. Sistema de Autenticação
- Login com usuário e senha
- Troca de senha obrigatória no primeiro acesso
- Criptografia bcrypt (12 salt rounds)
- Sessões seguras com cookie httpOnly
- Logout com registro em logs

### 2. Controle de Acesso por Funções
- **Administrador**: Acesso total ao sistema
  - Criar, editar e desativar usuários
  - Visualizar logs de auditoria
  - Todas as funcionalidades de usuário regular
- **Usuário Regular**: Acesso às funcionalidades principais
  - Cadastrar e gerenciar clientes
  - Upload e gestão de documentos
  - Criar documentos jurídicos no editor

### 3. Gestão de Clientes
- Cadastro completo de Pessoa Física (PF) e Pessoa Jurídica (PJ)
- Campos incluem:
  - Dados pessoais/empresariais (nome, CPF/CNPJ, RG/IE)
  - Endereço completo
  - Múltiplos contatos (telefone, celular, email)
  - Ocupação/ramo de atuação
  - Observações gerais
- Busca por nome, documento ou ID
- Edição e visualização detalhada
- Interface com tabs para organização de dados

### 4. Gestão de Documentos
- Upload de arquivos (PDF, JPG, PNG)
- Metadados: nome, descrição, cliente vinculado
- Controle de status:
  - Em Análise
  - Em Uso
  - Devolvido ao Cliente
  - Arquivado
- Filtros por status, data e cliente
- Registro automático de quem fez upload e quando
- Visualização em grid cards

### 5. Editor de Documentos Jurídicos
- Editor de texto com formatação básica
- Inserção automática de dados do cliente:
  - Nome
  - CPF/CNPJ
  - Endereço completo
  - Email e telefone
- Salvamento com título e conteúdo
- Vinculação opcional a cliente
- Funcionalidade de exportar PDF e imprimir (preparada)

### 6. Dashboard
- Métricas em tempo real:
  - Total de clientes
  - Documentos ativos (em uso)
  - Documentos em análise
  - Documentos devolvidos
- Atividades recentes (10 últimas)
- Interface limpa e profissional

### 7. Gerenciamento de Usuários (Admin)
- Criação de novos usuários
- Definição de função (admin/user)
- Ativação/desativação de contas
- Visualização de último acesso
- Edição de dados do usuário

### 8. Logs de Auditoria (Admin)
- Registro automático de todas as ações:
  - Login/logout
  - Criação/edição/exclusão de clientes
  - Upload/exclusão de documentos
  - Criação de documentos jurídicos
  - Gerenciamento de usuários
- Informações registradas:
  - Data/hora
  - Usuário que realizou a ação
  - Tipo de ação
  - Entidade afetada
  - Detalhes da ação
  - Endereço IP
- Filtros por tipo de ação
- Busca por usuário ou detalhes
- Exportação para PDF (preparada)

## Segurança Implementada

1. **Criptografia de Senhas**: Bcrypt com 12 salt rounds
2. **Sessões Seguras**: 
   - Cookie httpOnly
   - Secure em produção
   - SameSite: lax
   - Validade: 7 dias
3. **Headers de Segurança**: Helmet middleware
4. **Validação de Inputs**: Zod em todas as rotas críticas
5. **Proteção contra SQL Injection**: Drizzle ORM com prepared statements
6. **Autorização por Função**: Middleware requireAuth e requireAdmin
7. **Logs de Auditoria**: Rastreamento completo de ações

## Estrutura do Banco de Dados

### Tabelas Principais
1. **users**: Usuários do sistema
   - id, username, password (bcrypt hash)
   - nome, email, role
   - ativo, primeiroAcesso, ultimoAcesso

2. **clientes**: Clientes (PF e PJ)
   - Dados pessoais/empresariais
   - Endereço completo
   - Contatos
   - Observações

3. **documentos**: Documentos anexados
   - Arquivo físico (PDF/imagem)
   - Metadados e status
   - Vinculação a cliente

4. **documentos_juridicos**: Documentos criados no editor
   - Título e conteúdo HTML
   - Vinculação opcional a cliente

5. **logs_auditoria**: Logs de todas as ações
   - Usuário, ação, entidade
   - Detalhes e IP

## Credenciais Iniciais

**Usuário Administrador Padrão**:
- Username: `admin`
- Password: `admin123`
- Role: `admin`

⚠️ **IMPORTANTE**: Altere esta senha no primeiro acesso!

## Como Executar

```bash
# Instalar dependências
npm install

# Push do schema para o banco de dados
npm run db:push

# Executar em desenvolvimento
npm run dev
```

O sistema será iniciado em `http://localhost:5000`

## Design System

O projeto segue as diretrizes de design documentadas em `design_guidelines.md`:
- Fonte: Inter (Google Fonts)
- Cores: Sistema adaptativo light/dark mode
- Componentes: Shadcn UI com customizações
- Responsividade: Mobile-first approach
- Acessibilidade: ARIA labels, keyboard navigation

## Estrutura de Pastas

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilitários
├── server/                 # Backend Express
│   ├── auth.ts            # Configuração de autenticação
│   ├── storage.ts         # Interface de storage
│   ├── routes.ts          # Rotas da API
│   ├── db.ts              # Configuração do banco
│   └── seed.ts            # Seed de dados iniciais
├── shared/                 # Código compartilhado
│   └── schema.ts          # Schemas Drizzle + Zod
└── uploads/                # Diretório de uploads (criado automaticamente)
```

## API Endpoints

### Autenticação
- `POST /api/register` - Registrar novo usuário (admin only via rotas protegidas)
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/user` - Obter usuário atual
- `POST /api/change-password` - Alterar senha

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas do dashboard
- `GET /api/dashboard/atividades-recentes` - Atividades recentes

### Clientes
- `GET /api/clientes` - Listar todos
- `GET /api/clientes/:id` - Obter por ID
- `POST /api/clientes` - Criar
- `PATCH /api/clientes/:id` - Atualizar
- `DELETE /api/clientes/:id` - Excluir

### Documentos
- `GET /api/documentos` - Listar todos
- `GET /api/documentos/:id` - Obter por ID
- `POST /api/documentos/upload` - Upload (multipart/form-data)
- `PATCH /api/documentos/:id` - Atualizar
- `DELETE /api/documentos/:id` - Excluir

### Documentos Jurídicos
- `GET /api/documentos-juridicos` - Listar todos
- `POST /api/documentos-juridicos` - Criar
- `PATCH /api/documentos-juridicos/:id` - Atualizar
- `DELETE /api/documentos-juridicos/:id` - Excluir

### Usuários (Admin only)
- `GET /api/usuarios` - Listar todos
- `POST /api/usuarios` - Criar
- `PATCH /api/usuarios/:id` - Atualizar
- `PATCH /api/usuarios/:id/toggle-ativo` - Ativar/desativar

### Logs (Admin only)
- `GET /api/logs` - Listar logs de auditoria

## Status do Projeto

✅ **Completo e Funcional**:
- Autenticação com bcrypt e passport
- CRUD completo de clientes
- Upload e gestão de documentos
- Editor de documentos jurídicos
- Gerenciamento de usuários
- Logs de auditoria
- Dashboard com métricas
- Interface responsiva em português
- Segurança implementada

## Próximas Melhorias Possíveis

- Exportação de relatórios em PDF
- Histórico de versões para documentos editados
- Backup automático de dados
- Permissões granulares por usuário
- Notificações por email
- PWA para acesso offline

## Última Atualização

Data: 12 de Novembro de 2025
Versão: 1.0.0
