# Learningo — Telegram Mini App / web preview

Learningo este o aplicație de învățare gamificată, construită pentru utilizare în Telegram Mini App și preview web. Demo-ul public păstrează shell-ul mobil și traseele produsului original: învățare, lecții, dueluri, time-attack, recapitulare, ligă, clasament, magazin, profil, avatar, Moldova și olimpiade.

[Deschide aplicația live →](https://learning-platform-demo-pi.vercel.app)

## Trasee demonstrabile

- catalog local cu domenii, materii, teme și niveluri;
- lecții cu carduri de explicații, exerciții, feedback și progres;
- Battle și Time-attack cu adversari ficționali;
- recapitulare, clasament, ligă, profil, avatar și magazin;
- preview pentru curriculum Moldova și olimpiade;
- interfață RU / RO / EN, optimizată pentru viewport mobil.

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
