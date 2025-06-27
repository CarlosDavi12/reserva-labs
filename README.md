# ReservaLab - Sistema de Reserva de Laboratórios

Sistema web completo para gerenciamento de reservas de laboratórios, com autenticação, controle de acesso por papéis e painel administrativo. Desenvolvido como projeto da disciplina de Segurança da Informação.

## Funcionalidades

- Cadastro e login de usuários com autenticação JWT
- Papéis de usuário: `SOLICITANTE`, `MODERATOR`, `ADMIN`
- Cadastro e exclusão de laboratórios com imagem
- Associação de moderadores a laboratórios
- Criação e listagem de reservas por data e laboratório
- Painel de administração completo (CRUD de laboratórios, associação, visualização de usuários)
- Painel de moderadores para gerenciar solicitações
- Log de ações administrativas
- Interface moderna, responsiva e minimalista

---

## Segurança implementada

- **Autenticação via JWT** (JSON Web Token) protegendo rotas privadas
- **Controle de acesso por papéis** (role-based access control - RBAC)
- **Validação de entrada de dados** no backend
- **Middleware de autenticação e autorização** para proteger rotas
- **Registro de logs** de ações críticas (criação e exclusão de laboratórios, entre outros)
- **Uploads protegidos via multer**, com geração de nomes únicos

---

## Stack utilizada

### Backend (Node.js + Express + Prisma)
- Express.js
- Prisma ORM
- PostgreSQL (desenvolvimento)
- JWT para autenticação
- Multer para upload de imagens
- CORS, dotenv

### Frontend (React + TailwindCSS)
- React Router DOM
- TailwindCSS
- Fetch API

---

## Como rodar o projeto

### Pré-requisitos

- Node.js (v18+)
- npm ou yarn
- Git

---

### Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/reserva-labs.git
cd reserva-labs
```

### 2. Configure o backend

#### Instale as dependências:

```bash
cd backend
npm install
```

#### Configure o banco de dados PostgreSQL:

Crie um arquivo `.env` com a seguinte variável:

```
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"
JWT_SECRET="sua_chave_secreta"
```

#### Rode as migrações do Prisma:

```bash
npx prisma migrate dev
```

#### Inicie o servidor:

```bash
npm run dev
```

### 3. Configure o frontend

Abra outro terminal e vá para a pasta do frontend:

```bash
cd frontend
npm install
npm run dev
```

A aplicação será iniciada em `http://localhost:5173`.

---

## Perfis de usuários

- **Solicitante**: usuário comum que pode reservar laboratórios
- **Moderador**: vinculado a um laboratório, pode aprovar ou rejeitar reservas
- **Administrador**: pode criar usuários moderadores e outros admins, além de gerenciar todos os dados do sistema

> Apenas o administrador pode cadastrar novos moderadores e administradores pelo painel.

---

## Estrutura de pastas

```
reserva-labs/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/
│   │   └── prisma/
│   ├── uploads/
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
└── README.md
```

---


## Desenvolvido por

Carlos Davi – [UFOPA](https://www.ufopa.edu.br) – Ciência da Computação  
Projeto final da disciplina **Segurança da Informação** – 2025
