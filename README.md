# FutGestao - Sistema de Gerenciamento de Peladas

Sistema inteligente para organização e gestão de peladas de futebol, projetado para funcionar de forma independente utilizando **Local Storage** para máxima portabilidade, com suporte opcional para backend Node.js + Express.

## 🚀 Portabilidade e StackBlitz

O FutGestao foi desenvolvido com foco em **fácil inicialização**. 

- **Modo Local Storage (Padrão)**: O sistema salva todos os dados (jogadores, peladas, times, estatísticas) diretamente no seu navegador. Não requer banco de dados externo ou configuração complexa para começar a usar.
- **Ideal para StackBlitz**: Funciona perfeitamente em ambientes de desenvolvimento online sem necessidade de provisionamento de banco de dados.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/seu-usuario/seu-repositorio)

> **Dica**: No StackBlitz ou Preview da AI Studio, você pode usar o sistema imediatamente. Os dados persistirão no seu navegador local.

---

## 👥 Equipe de Desenvolvimento

### Frontend
- **Fabíula de Araújo Brandão** - Desenvolvedora Frontend
  - Responsável por: Interface React/TypeScript, UX/UI, Design Responsivo e Lógica de Persistência Local.

### Backend (Opcional)
- **Laura Carolina** - Desenvolvedora Backend Lead
  - Responsável por: Arquitetura Node.js, Planejamento de APIs REST e Segurança.

- **Vinícius Abreu Vasconcelos dos Santos** - Desenvolvedor Backend
  - Responsável por: Modelos de dados e Integração com Banco de Dados.

---

## 🎯 Funcionalidades Principais

O FutGestao resolve todos os problemas de quem organiza futebol semanalmente:
- **Gestão de Jogadores**: Cadastro com nível de habilidade (estrelas).
- **Lista de Presença**: Controle em tempo real de quem vai ao jogo.
- **Sorteio Inteligente**: Algoritmos para times equilibrados (diferença ≤ 0.5 estrelas).
- **Jogo ao Vivo**: Cronômetro sincronizado e registro de gols/cartões.
- **Estatísticas Automatizadas**: Artilharia, vitórias e assistências acumuladas.
- **Financeiro**: Controle de rateio e pagamentos simplificado.
- **Campeonatos**: Geração automática de tabelas e classificação.

---

## 🛠️ Tecnologias Utilizadas

### Core (Frontend + Data)
| Tecnologia | Função |
|-----------|--------|
| **React 19** | Framework de Interface |
| **TypeScript** | Segurança e Tipagem |
| **Tailwind CSS 4** | Estilização Moderna |
| **Local Storage API** | Persistência de Dados Offline |
| **Lucide React** | Ícones Vetoriais |
| **Motion** | Animações Fluídas |

### Suporte Backend (Opcional)
| Tecnologia | Função |
|-----------|--------|
| **Node.js / Express** | Servidor de API |
| **Prisma / SQLite** | ORM e Banco Relacional |
| **Socket.IO** | Comunicação Real-time |

---

## 💻 Instalação e Execução Local

### Passo 1: Clone e Instale
```bash
git clone <url-do-repositorio>
cd futgestao
npm install
```

### Passo 2: Sincronize o Banco (Opcional)
Se desejar usar o backend com SQLite/Prisma localmente:
```bash
npx prisma generate
npx prisma db push
```

### Passo 3: Inicie o Desenvolvimento
```bash
npm run dev
```

Acesse em: `http://localhost:3000`

---

## 📖 Como Usar (Guia Rápido)

1. **Inicie seu Perfil**: Crie uma conta (local ou API).
2. **Cadastre Craques**: Vá em "Meus Jogadores" e adicione seus amigos com seus respectivos níveis.
3. **Marque a Pelada**: Crie uma nova pelada, defina local e hora.
4. **Organize a Lista**: Adicione os jogadores que confirmaram Presence. No dia, use os ícones de **Check** e **Dólar** ($) para controlar presenças e pagamentos.
5. **Rola a Bola**: Use o "Sorteio" para equilibrar os times e o modo "Live" para gerenciar o placar.

---

## 🛠️ Solução de Problemas (Troubleshooting)

- **Erro de Prisma no StackBlitz**: O sistema possui um fallback automático. Se o Prisma falhar no download das engines, o backend continuará rodando, mas as operações persistirão apenas no Navegador (Local Storage).
- **Dados Sumiram**: Se você limpar a cache do navegador ou trocar de navegador/máquina, os dados locais não serão transferidos, a menos que esteja usando a integração com Banco de Dados.

---

## 📄 Licença

Este projeto é de uso educacional e open-source.

---

## 📢 Suporte e Contato

Dúvidas? Verifique os logs do console do navegador (F12) ou entre em contato com a equipe de desenvolvimento listada acima.
