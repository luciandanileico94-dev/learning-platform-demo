# Learningo - demo de portofoliu

Demo public, standalone, în limba română, inspirat de un produs de învățare. Nu este botul real și nu pretinde că se conectează la Telegram.

## Domeniu exact

Demo-ul arată un singur traseu de aproximativ un minut: Școală, Matematică, clasa a VIII-a, lecția „Ecuații liniare”. Include două carduri de predare și trei interacțiuni: alegere multiplă, răspuns numeric și ordonarea pașilor. Un răspuns greșit afișează explicația și permite retry. La final se acordă 30 XP, se afișează seria de 3 zile, iar lecția este marcată ca finalizată.

Nu există autentificare, Telegram, conturi, catalog generic, admin, date reale sau server necesar. Progresul este sintetic și se păstrează numai în `localStorage` al browserului. Controlul „Resetează demo” îl șterge.

## Stack și rulare

- React 19, TypeScript 7, Vite 8
- CSS scris pentru acest demo, fără bibliotecă UI grea
- Vitest și Testing Library pentru testele unitare, Playwright pentru traseul E2E

```bash
npm ci
npm run dev:frontend
npm test
npm run build
npm run e2e
```

Aplicația statică este compatibilă cu Vercel. Configurația Vite folosește `frontend/index.html` și nu are nevoie de variabile de mediu sau API extern. `backend/server.ts` este păstrat doar pentru un preview local opțional și nu este folosit de experiența publică.

## Date sigure

Codul și conținutul sunt o implementare clean-room cu date sintetice. Nu conține tokenuri, ID-uri Telegram, utilizatori reali, progres stocat în afara browserului, căi private sau infrastructură de generare a conținutului.
