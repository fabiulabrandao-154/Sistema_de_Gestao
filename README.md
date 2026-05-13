# FutGestao - Sistema de Gerenciamento de Peladas

Sistema completo para organização e gestão de peladas de futebol, desenvolvido com React + TypeScript no frontend e Node.js + Express no backend, utilizando MongoDB como banco de dados.

## 🚀 Deploy no Vercel
Acesse a aplicação: [https://sistema-de-gestao-de-futebol-amador.vercel.app](https://sistema-de-gestao-de-futebol-amador.vercel.app)

---

## 👥 Equipe de Desenvolvimento

### Frontend
- **Fabíula de Araújo Brandão** - Desenvolvedora Frontend
  - Responsável por: Interface React/TypeScript, experiência do usuário, design responsivo

### Backend
- **Laura Carolina** - Desenvolvedora Backend Lead
  - Responsável por: Arquitetura Node.js, APIs REST, autenticação JWT

- **Vinícius Abreu Vasconcelos dos Santos** - Desenvolvedor Backend
  - Responsável por: Modelos de dados, lógica de negócios, integração MongoDB

---

## 📝 Sobre o Projeto
O FutGestao é uma solução moderna e completa para organizadores de peladas que precisam:
- Cadastrar e gerenciar jogadores com níveis de habilidade
- Agendar e organizar partidas
- Controlar listas de presença em tempo real
- Confirmar participação e pagamentos
- Visualizar estatísticas e histórico
- Gerenciar times e campeonatos

### Características Principais
- **Frontend React** - React 19 + TypeScript + Tailwind CSS
- **Backend Node.js** - Express + MongoDB (ou SQLite/Prisma) com autenticação JWT
- **Design Responsivo** - Interface adaptável para desktop e mobile
- **Autenticação Segura** - Sistema de login com JWT
- **Deploy Automático** - Configurado para Vercel
- **Banco MongoDB** - Suporte a MongoDB Atlas para produção
- **Real-time** - Socket.IO para atualizações em tempo real

---

## 🛠️ Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Função |
|-----------|--------|--------|
| React | 19.0.0 | Framework JavaScript |
| TypeScript | 5.8.2 | Tipagem estática |
| Tailwind CSS | 4.1.14 | Framework CSS |
| React Router | 7.14.0 | Roteamento |
| Axios | 1.14.0 | Cliente HTTP |
| React Hot Toast | 2.6.0 | Notificações |
| Lucide React | 0.546.0 | Ícones |

### Backend
| Tecnologia | Versão | Função |
|-----------|--------|--------|
| Node.js | 18+ | Runtime JavaScript |
| Express | 4.21.2 | Framework web |
| MongoDB | 7.2.0 | Banco de dados NoSQL |
| JWT | 9.0.3 | Autenticação |
| Socket.IO | 4.8.3 | Comunicação real-time |
| bcryptjs | 3.0.3 | Hash de senhas |
| CORS | 2.8.6 | Controle de CORS |

---

## 💻 Instalação e Execução Local

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no MongoDB Atlas (ou MongoDB local)

### Passo 1: Clone o projeto
```bash
git clone <url-do-repositorio>
cd futgestao
```

### Passo 2: Instale as dependências
```bash
npm install
```

### Passo 3: Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# MongoDB
MONGODB_URI=mongodb+srv://fabiulabrandao15_db_user:hGT5wxGilTYu6D9l@cluster0.cislst7.mongodb.net/
MONGODB_NAME=futgestao

# JWT
JWT_SECRET=jwt-futgestao-2026-x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

### Passo 4: Inicie o servidor
```bash
npm run dev
```
O sistema estará rodando em `http://localhost:3000`

---

## 📂 Estrutura do Projeto
```
futgestao/
|
+-- src/                    # Frontend React
|   +-- components/         # Componentes reutilizáveis
|   +-- pages/              # Páginas da aplicação (Login, Dashboard, Players, etc.)
|   +-- context/            # Context API (Auth, Theme)
|   +-- services/           # Serviços (API, Socket)
|   +-- lib/                # Utilitários
|
+-- backend/                # Estrutura do Backend Node.js
+-- prisma/                 # Esquema do banco de dados
+-- server.ts               # Servidor Express + Vite Middleware
+-- vercel.json             # Configuração Vercel
+-- package.json            # Dependências e scripts
```

---

## ☁️ Deploy no Vercel

O projeto está configurado para deploy automático:
1. **Frontend**: Build estático com Vite.
2. **Backend**: Serverless functions com Express.
3. **Variáveis**: Devem ser configuradas no painel da Vercel (MONGODB_URI, JWT_SECRET).

---

## 📖 Como Usar o Sistema

1. **Primeiro Acesso**: Cadastre-se como organizador.
2. **Gerenciar Jogadores**: Adicione jogadores e defina seu nível técnico (estrelas).
3. **Agendar Pelada**: Crie um evento com data, local e regras.
4. **Lista de Presença**: Controle quem confirmou e quem já pagou.
5. **Sorteio**: Gere times equilibrados automaticamente.
6. **Jogo ao Vivo**: Use o cronômetro e registre gols/cartões em tempo real.

---

## 🔌 API Endpoints (Resumo)

### Autenticação
- `POST /api/register` - Registro
- `POST /api/token` - Login (JWT)

### Jogadores & Peladas
- `GET /api/jogadores` - Lista geral
- `POST /api/peladas` - Nova partida
- `POST /api/peladas/{id}/sortear` - Sorteio de times

---

## 🛡️ Segurança
- **JWT**: Todas as rotas protegidas validam o token no header Authorization.
- **Bcrypt**: Senhas nunca são salvas em texto puro.
- **CORS**: Configurado para restringir acessos não autorizados.

---

## 🛠️ Troubleshooting (Solução de Problemas)
- **Erro de Prisma no StackBlitz**: Se o download das engines falhar, o sistema entrará em modo restrito. Tente recarregar ou rodar `npx prisma generate` manualmente.
- **Conexão MongoDB**: Verifique se o seu IP está liberado no painel do MongoDB Atlas.

---

## 📄 Licença
Este projeto é de uso educacional e pode ser modificado e distribuído livremente.

---

## 🏆 Checklist de Validação
- [x] Cadastro e Login
- [x] Gestão de Jogadores (0.5 a 5.0 estrelas)
- [x] Sorteio Balanceado (diferença ≤ 0.5)
- [x] Cronômetro e Placar em tempo real
- [x] Controle Financeiro e Pagamentos
- [x] Campeonatos e Classificação Automatizada
