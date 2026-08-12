# Learningo — Telegram Mini App / web preview

[![CI](https://github.com/luciandanileico94-dev/learning-platform-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/luciandanileico94-dev/learning-platform-demo/actions/workflows/ci.yml)
[![Live preview](https://img.shields.io/badge/live-Vercel-black?logo=vercel)](https://learning-platform-demo-pi.vercel.app)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Learningo este o aplicație de învățare gamificată, construită pentru utilizare în Telegram Mini App și preview web. Demo-ul public păstrează shell-ul mobil și traseele produsului original: învățare, lecții, dueluri, time-attack, recapitulare, ligă, clasament, magazin, profil, avatar, Moldova și olimpiade.

[Deschide aplicația live →](https://learning-platform-demo-pi.vercel.app)

## Preview

<p align="center">
  <img src="docs/screenshots/learningo-welcome-desktop.png" alt="Learningo welcome screen on desktop" width="760" />
</p>

<p align="center">
  <img src="docs/screenshots/learningo-home-mobile.png" alt="Learningo mobile home with local learning sections" width="260" />
  <img src="docs/screenshots/learningo-lesson-mobile.png" alt="Learningo mobile lesson screen" width="260" />
</p>

## Trasee demonstrabile

- catalog local cu domenii, materii, teme și niveluri;
- lecții cu carduri de explicații, exerciții, feedback și progres;
- Battle și Time-attack cu adversari ficționali;
- recapitulare, clasament, ligă, profil, avatar și magazin;
- preview pentru curriculum Moldova și olimpiade;
- interfață RU / RO / EN, optimizată pentru viewport mobil.

## Architecture

`frontend/` păstrează structura ecranelor Mini App-ului și shell-ul responsive. `frontend/api.ts` este boundary-ul de date: în ediția publică, metodele API sunt implementate prin fixture store local, astfel încât aceleași acțiuni să poată fi demonstrate fără autentificare sau backend public. `shared/` păstrează contractele de domeniu, lecție, exercițiu și gamification.

## Date și limite

Aplicația folosește un adapter local cu date ficționale și deterministic fixtures. Profilul, XP, monedele, avatarul și progresul sunt păstrate în `localStorage`. Nu sunt folosite autentificare Telegram reală, token-uri, utilizatori, contacte sau conținut privat. Battle, clasamentul, shop-ul și curriculum-ul sunt scenarii locale pentru demonstrație.

## Stack și rulare

- React, TypeScript, Vite;
- CSS-ul original al Mini App-ului: shell întunecat, cards, progress, buttons și responsive mobile layout;
- Vitest + Testing Library;
- Playwright pentru desktop și mobile.

```bash
npm ci
npm run dev:frontend
npm test
npm run typecheck
npm run build
npm run e2e
```

Build-ul Vercel publică `frontend/dist` și nu are nevoie de variabile de mediu.

## Privacy

Ediția publică nu conține token-uri, ID-uri Telegram reale, contacte, date de elevi sau istoric privat. Toate numele, scorurile și răspunsurile din preview sunt sintetice.
