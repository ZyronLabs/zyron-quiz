# 🚀 Zyron Labs - MVP Quiz + Dashboard

## 📋 Sobre o Projeto

Sistema de diagnóstico digital para captação de leads, composto por:
- **Landing Page** com formulário de captura
- **Quiz** com 10 perguntas sobre maturidade digital
- **Dashboard Administrativo** para gestão de leads
- **Webhook** integrado com Chegou.dev para notificações

## 🎯 Funcionalidades

### Para o Usuário
- ✅ Preenchimento de formulário de lead
- ✅ Quiz de diagnóstico (10 perguntas)
- ✅ Pontuação automática (0-100 pontos)
- ✅ Nível de maturidade digital (Inicial/Intermediário/Avançado)
- ✅ Recomendações personalizadas

### Para o Admin
- ✅ Login protegido
- ✅ Dashboard com estatísticas
- ✅ Lista de leads com filtros
- ✅ Atualização de status (Novo → Contactado → Reunião → Proposta → Cliente)
- ✅ Exportação CSV
- ✅ Webhook para notificações

## 🏗️ Tecnologias

### Backend
- **Node.js** + **Express**
- **JSON** como banco de dados (MVP)
- **Axios** para webhook
- **bcryptjs** para hash de senhas

### Frontend
- **HTML5** + **CSS3** (Glassmorphism)
- **JavaScript** Vanilla
- **Design Responsivo** (Mobile-first)

### Integrações
- **Chegou.dev** para notificações via WhatsApp/Telegram

## 📁 Estrutura do Projeto

```

zyron-quiz/
├── backend/
│   ├── server.js              # Servidor principal
│   ├── routes/                # Rotas da API
│   │   ├── lead.routes.js
│   │   ├── quiz.routes.js
│   │   ├── admin.routes.js
│   │   └── webhook.routes.js
│   ├── controllers/           # Controladores
│   │   ├── lead.controller.js
│   │   ├── quiz.controller.js
│   │   └── admin.controller.js
│   ├── services/              # Serviços
│   │   ├── scoring.service.js
│   │   ├── rules.service.js
│   │   ├── lead.service.js
│   │   └── webhook.service.js
│   ├── middleware/            # Middleware
│   │   └── auth.js
│   ├── utils/                 # Utilitários
│   │   ├── validation.js
│   │   └── hash.js
│   ├── data/                  # Dados estáticos
│   │   └── quiz.perguntas.json
│   ├── database/              # Banco de dados JSON
│   │   ├── leads.json
│   │   ├── admin.json
│   │   └── config.json
│   └── logs/                  # Logs
│       └── notifications.json
├── frontend/
│   ├── index.html             # Landing Page
│   ├── quiz.html              # Quiz
│   ├── admin/                 # Área administrativa
│   │   ├── login.html
│   │   └── dashboard.html
│   ├── styles/
│   │   └── output.css         # CSS completo
│   └── assets/                # Imagens/ícones
├── .env                       # Variáveis de ambiente
├── package.json
├── nodemon.json
└── README.md

```

## 🚀 Como Rodar

### 1. Clone o repositório
```bash
git clone <seu-repo>
cd zyron-quiz
```

2. Instale as dependências

```bash
npm install
```

3. Configure o .env

```bash
cp .env.example .env
# Edite o .env com suas configurações
```

4. Execute o projeto

Terminal 1 - Backend:

```bash
npm run dev
```

Terminal 2 - Frontend:

```bash
npm run frontend
```

5. Acesse

· Landing: http://localhost:8000
· Admin Login: http://localhost:8000/admin/login.html
· Dashboard: http://localhost:8000/admin/dashboard.html

Credenciais Admin:

· Email: admin@zyronlabs.com
· Senha: Zyron2026

📊 Webhook Chegou.dev

O sistema envia notificações para o Chegou.dev quando um novo lead completa o quiz.

Payload Enviado:

```json
{
  "title": "🟣 Novo Lead Zyron",
  "subtitle": "Diagnóstico concluído",
  "message": "👤 João Manuel | Restaurante Sabores\n\n📊 65 pts · Intermediário\n🎯 Interesse: Website, Automação",
  "sound": "success",
  "channel": "leads",
  "actions": [
    { "label": "👤 Ver Lead", "url": "..." },
    { "label": "💬 WhatsApp", "url": "..." }
  ]
}
```

🔧 Personalização

Alterar Perguntas do Quiz

Edite backend/data/quiz.perguntas.json

Alterar Pontuação

Edite backend/services/scoring.service.js

Alterar Regras de Diagnóstico

Edite backend/services/rules.service.js

Alterar Cores do Tema

Edite frontend/styles/output.css (cores no início do arquivo)

📱 Status dos Leads

Status Descrição
🟢 Novo Lead acabou de chegar
🟡 Contactado Já entramos em contato
🟠 Reunião Reunião agendada
🟣 Proposta Proposta enviada
✅ Cliente Fechou negócio
❌ Perdido Não convertido

🎯 Próximos Passos (V2)

· Banco de dados (PostgreSQL/MongoDB)
· Autenticação JWT completa
· Dashboard com gráficos
· Envio de email automático
· Área do cliente
· Integração com CRM

📄 Licença

MIT © Zyron Labs

---

Desenvolvido com 💜 pela Zyron Labs
