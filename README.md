# ⚡ Vetor Fúria — Gamificação Pessoal & Produtividade

Um aplicativo web de gamificação pessoal que transforma sua rotina de hábitos, treinos e estudos em uma jornada RPG. Cada ação completa gera XP, sobe seu nível e evolui seu avatar.

## 🎮 Features

### Core RPG
- **Sistema de XP & Níveis** — Fórmula progressiva com 5 estágios de avatar
- **Barra de XP animada** — Spring physics via Framer Motion (60fps)
- **Modal de Level Up** — Animação celebratória com particle burst
- **XP Ledger** — Histórico transacional de todos os ganhos de XP

### ✅ Hábitos Diários
- Checklist diário com checkboxes animados
- **12 templates pré-prontos** (saúde, estudo, bem-estar, fitness)
- **Contagem de ofensiva (streaks)** com bônus de XP
- Bônus de +50 XP ao completar todos os hábitos do dia

### 💪 Saúde & Treinos
- Registro de treinos com **catálogo de 20 exercícios** pré-cadastrados
- **GIFs de execução** via URL externa
- Tracking de séries (reps × peso)
- **Biometria**: peso, altura, IMC + biomarcadores de exames (JSON flexível)

### 📖 Estudos
- **Timer Pomodoro** circular animado (15/25/45/60 min)
- **Editor Markdown** com preview em tempo real
- Sessões de estudo com XP baseado na duração
- Histórico de sessões com notas

## 🏗️ Arquitetura

**Desacoplamento**: Módulos de domínio emitem eventos `XP_EARNED` via EventBus. O Core RPG consome e grava no Ledger. Nenhum módulo importa lógica de outro.

## 🚀 Setup

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## ⚔️ O Sistema (Solo Leveling)

Camada inspirada no "Sistema" de Solo Leveling:

- **Janela do Sistema** — notificações translúcidas azuis com som "PING!"
- **Quest Diária** — os hábitos do dia viram a missão diária, com contagem regressiva até a meia-noite
- **Zona de Penalidade** — falhar a quest abre a janela vermelha de penalidade
- **Pontos de habilidade** — +3 por nível, distribuídos manualmente nos atributos (que também crescem com a atividade real)
- **Rank de Caçador** — E → D → C → B → A → S, derivado do nível

## 📱 Notificações no WhatsApp (CallMeBot)

Em **Perfil → Notificações no WhatsApp**:

1. No WhatsApp, mande `I allow callmebot to send me messages` para **+34 644 51 95 23**.
2. O bot responde com sua **apikey**. Cole número (com DDI, ex.: `+5511...`) + apikey e ative.
3. O app avisa **quest concluída** e **penalidade** enquanto estiver aberto.

> **Lembrete diário com o app fechado:** requer um agendador externo (cron) chamando
> `https://api.callmebot.com/whatsapp.php?phone=SEU_NUMERO&text=...&apikey=SUA_KEY`.
> Use um cron grátis (cron-job.org / GitHub Actions) ou Firebase Functions (plano Blaze).

## 🔧 Stack

- **Next.js 16** (App Router + Turbopack)
- **React 19** + TypeScript
- **Framer Motion** — Animações de XP, avatar, transições
- **Firebase Auth + Firestore** — login e sincronização de dados por usuário
- **localStorage** — cópia de trabalho local (sincronizada com a nuvem)
