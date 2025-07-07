# ReservaLab – Sistema de Reserva de Laboratórios (Produção)

Sistema web completo para reservas e gerenciamento de laboratórios universitários, desenvolvido como projeto final da disciplina **Segurança da Informação**.

Acesse em: [https://reserva-labs.vercel.app](https://reserva-labs.vercel.app)

---

## Funcionalidades principais

- Cadastro de usuários (com ativação por e-mail)
- Login com autenticação JWT e 2FA por e-mail
- Perfis com diferentes permissões:
  - **Solicitante**
  - **Monitor**
  - **Coordenador**
  - **Administrador**
- Cadastro de laboratórios com imagem (armazenadas no Cloudinary)
- Sistema de reservas com aprovação
- Painel de administrador (usuários, laboratórios, logs)
- Painel de coordenador com controle de monitores e reservas
- Agenda visual por laboratório
- Auditoria de ações administrativas e tentativas suspeitas
- Exibição de coordenadores e monitores vinculados por laboratório
- Cadastro com convite e definição de senha por e-mail (sem senha pré-definida)
- Reenvio de código 2FA com temporizador
- Ativação de conta para usuários comuns via link

---

## Funcionalidades de Segurança da Informação

Este sistema foi projetado com foco em **segurança**, conforme exigido na disciplina. As funcionalidades estão implementadas nos seguintes arquivos:

### Autenticação com JWT
- **Backend**: `authService.js`, `authController.js`
- **Protege rotas** com `authenticateToken` em `middlewares/authMiddleware.js`

### Autorização baseada em papéis (RBAC)
- **Backend**: `authorizeRoles()` em `middlewares/authMiddleware.js`
- **Frontend**: controle de rotas no `App.jsx`

### 2FA (Autenticação em duas etapas)
- **Backend**: Funções `gerarEEnviarCodigo2FA()` e `verificarCodigo2FA()` em `authService.js`
- **Frontend**: página `Verificar2FA.jsx`, controle de fluxo em `Login.jsx`

### Ativação de conta via link por e-mail
- **Backend**: `cadastroDireto()` e `ativarContaPorToken()` em `authService.js`
- **Frontend**: `AtivarConta.jsx`

### Definição de senha via token
- **Backend**: `definirSenha()` em `authService.js`
- **Frontend**: `DefinirSenha.jsx`

### Verificação de senha forte
- Validação com regex em `authService.js` e `authController.js`

### reCAPTCHA após múltiplas tentativas
- **Frontend**: `Login.jsx` com exibição após 3 falhas
- **Backend**: validação em `authController.js` com integração Google

### Logs de auditoria
- Criados com `logService.js`
- Ações registradas: login suspeito, ativação de conta, cadastro com convite, redefinição, exclusão, exibição do reCAPTCHA, 2FA, entre outras.
- Visualização no painel do admin (`PainelAdmin.jsx`)

### Uploads seguros de imagem
- Feito com `multer` no backend, com nomes únicos e verificação de tipo
- Diretório protegido: `uploads/`

---

## Tecnologias utilizadas

### Backend
- Node.js + Express
- Prisma ORM + PostgreSQL
- JWT + Bcrypt
- Nodemailer + Gmail
- Multer + middleware de segurança
- Render (deploy)

### Frontend
- React + Vite
- TailwindCSS
- FullCalendar
- React Router
- Vercel (deploy)

---

## Versão para desenvolvimento local

Você pode rodar o sistema localmente com este repositório:  
[https://github.com/CarlosDavi12/reserva-lab-local.git](https://github.com/CarlosDavi12/reserva-lab-local.git)

---

## Acesso de Administrador

E-mail: `carlos@example.com`  
Senha: `123456`

---

## Desenvolvido por

Carlos Davi  
Ciência da Computação – UFOPA  
Projeto final da disciplina **Segurança da Informação** (2025)
