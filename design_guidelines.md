# Design Guidelines: Law Firm Client Management System

## Design Approach

**Selected System:** Material Design principles adapted for enterprise legal software
**Rationale:** Information-dense professional application requiring clear hierarchy, trustworthy aesthetic, and proven patterns for complex data management. Material Design provides robust component patterns for forms, tables, and data-heavy interfaces while maintaining professional credibility essential for legal software.

**Key References:** Linear (for clean data tables), Notion (for content organization), Asana (for status management)

---

## Core Design Elements

### Typography
- **Primary Font:** Inter or Roboto (via Google Fonts CDN)
- **Headers:** Font weight 600-700, sizes: text-3xl (dashboard), text-2xl (page titles), text-xl (section headers)
- **Body Text:** Font weight 400, text-base for content, text-sm for labels and secondary info
- **Data/Numbers:** Font weight 500, tabular-nums for alignment in tables
- **All UI text must be in Brazilian Portuguese (pt-BR)**

### Layout System
**Spacing Units:** Tailwind units of 2, 4, 6, and 8 for consistency
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-6
- Form field spacing: space-y-4

**Grid Structure:**
- Main container: max-w-7xl mx-auto px-6
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Client lists: Full-width tables with fixed header
- Forms: Single column max-w-3xl for readability

---

## Application Structure

### 1. Authentication Pages (Login & Password Reset)
- Centered card layout (max-w-md)
- Logo/firm name at top
- Clean form with clear labels
- "Primeiro Acesso" flow for password change
- Security message footer (encryption notice)

### 2. Main Dashboard Layout
**Sidebar Navigation (Left):**
- Fixed sidebar (w-64) with logo at top
- Navigation items: Dashboard, Clientes, Documentos, Editor, Usuários (Admin only), Logs
- Collapse button for mobile (transform to hamburger menu)

**Top Bar:**
- Search bar (global, prominent with icon)
- User profile dropdown (name, role, logout)
- Breadcrumbs for deep navigation

**Dashboard Content:**
- 4 metric cards: Total Clientes, Documentos Ativos, Docs Pendentes, Docs Devolvidos
- Recent activity table
- Quick actions section

### 3. Client Management Interface
**List View:**
- Search/filter bar with chips (Pessoa Física/Jurídica filters)
- Data table with sortable columns: Nome, CPF/CNPJ, Telefone, Email, Ações
- Pagination controls
- "Novo Cliente" button (prominent, top-right)

**Client Detail/Edit:**
- Tabbed interface: Dados Cadastrais, Documentos Vinculados, Histórico
- Two-column form layout for data entry
- Clear field labels in Portuguese
- CPF/CNPJ input with formatting
- Address autocomplete support structure

### 4. Document Management
**Document Library:**
- Grid view with document cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Each card shows: thumbnail, name, client, status badge, upload date
- Status chips with distinct styling (Em Análise, Em Uso, Devolvido ao Cliente)
- Filter sidebar: Status, Data, Cliente

**Upload Interface:**
- Drag-and-drop zone (large, clear)
- File type indicators (PDF, JPG, PNG)
- Progress bars for uploads
- Metadata form: name, description, client selector, initial status

### 5. Document Editor
**Editor Layout:**
- Toolbar: formatting options (bold, italic, alignment, tables, bullet lists)
- Main editing area (max-w-4xl, centered, print-optimized)
- Right sidebar: "Inserir Dados do Cliente" panel with auto-complete fields
- Actions: Salvar, Exportar PDF, Imprimir

### 6. User Management (Admin Only)
- User table with columns: Nome, Email, Função, Status, Última Atividade
- Add/Edit user modal
- Permission checkboxes for granular access control
- Password reset trigger

### 7. Audit Logs
- Filterable table: Data/Hora, Usuário, Ação, Detalhes
- Export to PDF option
- Date range picker

---

## Component Library

### Navigation
- Vertical sidebar with icons + labels
- Active state: subtle highlight
- Hover state: slight background change
- Mobile: Collapsible hamburger menu

### Forms
- Floating labels or top-aligned labels
- Input fields: border-2 with focus ring
- Required field indicators (asterisk)
- Validation messages below fields
- Submit buttons: full width on mobile, auto-width on desktop

### Data Tables
- Sticky headers
- Row hover states
- Sortable column headers (icon indicator)
- Action column (icons: edit, delete, view)
- Empty state messaging
- Loading skeletons

### Cards
- Rounded corners (rounded-lg)
- Subtle border
- Padding: p-6
- Metrics cards: icon, number, label, change indicator

### Buttons
- Primary: Solid background, medium weight text
- Secondary: Outline style
- Icon buttons: Consistent sizing (h-10 w-10)
- Sizes: Small (form actions), Medium (primary CTAs), Large (empty states)

### Status Badges
- Pill-shaped (rounded-full px-3 py-1 text-sm)
- Em Análise, Em Uso, Devolvido ao Cliente, Ativo, Inativo

### Modals/Dialogs
- Centered overlay with backdrop
- Max-width constraints (max-w-2xl for forms)
- Header, content, footer structure
- Clear close button

### File Upload
- Dashed border drop zone
- Icon + text instruction
- File list with remove buttons
- Progress indicators

---

## Responsive Behavior

**Mobile (< 768px):**
- Sidebar collapses to hamburger menu
- Tables convert to card view
- Forms stack to single column
- Dashboard metrics stack vertically
- Search bar moves to top

**Tablet (768px - 1024px):**
- Sidebar remains visible but narrower
- 2-column layouts where appropriate
- Tables scroll horizontally if needed

**Desktop (> 1024px):**
- Full sidebar navigation
- Multi-column layouts utilized
- Tables show all columns

---

## Accessibility
- Semantic HTML throughout
- ARIA labels for icon-only buttons (in Portuguese)
- Keyboard navigation support
- Focus indicators on all interactive elements
- Form labels properly associated
- Error messages announced to screen readers
- Minimum touch target size: 44px × 44px

---

## Images
**No hero images** - This is a business application, not a marketing site. Focus remains on data and functionality.

**Icons:** Use Heroicons via CDN for consistency (outline style for navigation, solid for actions)

**Document thumbnails:** Generate from PDFs or use file-type placeholders

**User avatars:** Initials-based when no photo uploaded

---

This design creates a professional, efficient interface optimized for legal professionals managing client data and documents, with clear information hierarchy and Brazilian Portuguese throughout.