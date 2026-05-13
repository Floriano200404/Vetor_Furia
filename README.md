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

## 🔧 Stack

- **Next.js 16** (App Router + Turbopack)
- **React 19** + TypeScript
- **Framer Motion** — Animações de XP, avatar, transições
- **localStorage** — Persistência MVP (preparado para Firebase)
