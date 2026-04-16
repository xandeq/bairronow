---
adr: 001
title: Confirmação do stack de backend (.NET 8) e condições para reavaliação
status: accepted
date: 2026-04-15
deciders: [tech-lead]
supersedes: null
superseded-by: null
tags: [backend, stack, architecture, strategic]
---

# ADR-001: Confirmação do stack de backend (.NET 8)

## Contexto

A escolha de stack do BairroNow foi feita em Phase 1 (2026-04-05), registrada
em `.planning/PROJECT.md:95` como **"Next.js + .NET Core + SQL Server"**, com
justificativa "Leverages existing hosting (HostGator + SmarterASP)".

Esse ADR **não documenta uma mudança de decisão**. Documenta:

1. A **confirmação** da escolha original após a entrega do v1.0 MVP
2. As **condições objetivas** que fariam a decisão ser reaberta no futuro
3. A análise arquitetural que deve ser consultada **se** alguém levantar a questão

## Estado atual (consolidado em 2026-04-15)

- Backend: **ASP.NET Core 8 (C# 12)** + EF Core 8 + SQL Server
- SignalR para real-time (chat, notificações, grupos)
- Autenticação JWT com refresh-token rotation (SHA256 + family revocation + single-use)
- FluentValidation, Serilog, 38 arquivos de teste xUnit
- 6 migrations EF aplicadas
- LGPD compliance completa (export, anonymize com grace period)
- Workers: digest, retention, group reminders, OCR
- ~14-20k linhas de lógica de negócio funcional

A auditoria de 2026-04-15 identificou lacunas arquiteturais (transacional,
concorrência, idempotência, consistência, estado distribuído, versionamento de
API), endereçadas na Phase 07 Stabilize. **Nenhuma dessas lacunas é
específica de .NET** — existem em qualquer stack e são tratadas com padrões
portáveis.

## Decisão

Manter .NET 8 como stack do backend **até que pelo menos um dos gatilhos de
reavaliação (abaixo) seja observado**.

## Por que faz sentido manter

O trabalho já entregue inclui implementações não-triviais que custariam
reescrever:

- Refresh-token rotation com family revocation (AuthService)
- LGPD anonymization com grace period de 30 dias (AccountService)
- SignalR integrado à auth (token factory + groups + user-scoped broadcasts)
- Feed cursor pagination com full-text search em SQL Server
- Validação declarativa via FluentValidation em todos os DTOs
- 6 migrations versionadas com histórico de schema
- 38 testes cobrindo auth, LGPD, chat, marketplace, moderação

Nenhum problema operacional atual é causado pela escolha de linguagem ou
framework. Dores identificadas (hosting Windows shared, falta de shared-types,
dark mode, static export do marketplace) são ortogonais ao backend.

## Gatilhos para reavaliar este ADR

Este ADR deve ser reaberto se **pelo menos dois** dos seguintes ocorrerem:

- **R1 — Time:** Perda de todos os devs com experiência em C#, sem reposição viável
- **R2 — Produto:** Pivot para arquitetura edge-first (Cloudflare Workers, Vercel Edge) onde .NET AOT tem DX inferior
- **R3 — IA:** Requisito de ecossistema de IA conversacional (LangGraph, AI SDK específicos) sem equivalente maduro em .NET
- **R4 — Custo:** Custo operacional do .NET excedendo equivalente Node em ordem de magnitude (cenário remoto)
- **R5 — Ecossistema:** Estagnação ou descontinuação do .NET (cenário muito remoto)

Reabertura exige novo ADR (`ADR-NNN-revisit-backend-stack.md`) com dados
concretos dos gatilhos observados, não hipóteses.

## Se a questão for levantada

Análise detalhada de custos, alternativas consideradas (big-bang rewrite vs
Strangler Fig vs manter), e justificativa ficam preservadas no histórico
git deste arquivo. Consultar antes de abrir nova discussão para evitar
re-litigar o mesmo terreno.

Caminho preferido em caso de necessidade legítima de componente Node: **Strangler
Fig** — adicionar microserviço Node.js para o caso de uso específico (ex:
worker de IA, webhook handler), mantendo o core .NET. Evita big-bang rewrite.

## Referências

- `PROJECT.md:95` — decisão original em Phase 1
- Auditoria arquitetural de 2026-04-15 — conversação da sessão
- Phase 07 Stabilize — endereça as lacunas sem exigir troca de stack

---

**Status:** Aceita. Não há ação pendente — é confirmação, não mudança.
