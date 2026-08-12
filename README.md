# Atelier de învățare

Demo public, determinist și sintetic, pentru dovezi de tender: interfață React + TypeScript în limba română, cu șase lecții, feedback explicat, progres în memorie și filtre.

## Stack exact

React 19.2.8, React DOM 19.2.8, TypeScript 7.0.2, Vite 8.2.1, Express 5.2.1, Vitest 4.1.10, Testing Library, Playwright 1.55.1, Node 22. Versiunile sunt pin-uite exact în `package.json` și `package-lock.json`.

## Arhitectură și flux de date

```text
shared/store.ts + shared/contracts.ts
        ├── mod static: bundle Vite → catalog, lecții și răspunsuri sintetice
        └── mod local: frontend → Express /api → store în memorie
```

- `shared/` este sursa unică pentru contracte și datele demo; `getLesson` nu expune cheia răspunsurilor.
- `backend/` oferă `GET /api/courses`, `GET /api/lessons/:id`, `POST /api/lessons/:id/answer` și `POST /api/courses/:id/complete`.
- `frontend/` detectează `VITE_DEMO_MODE=static`; în static folosește datele incluse, iar în local folosește API-ul Express și are fallback local pentru demonstrații offline.
- `frontend/learning-context.tsx` păstrează într-un singur React Context modul demo și progresul global, pentru ca fluxul catalog–lecție să nu lege aceste date prin props.
- `shared/privacy.ts` aplică un guard determinist: payload-urile cu câmpuri/valori de tip secret sau date personale sunt respinse; demo-ul nu persistă date personale.

## Flux funcțional

Catalog → filtru domeniu/nivel → alegere lecție → întrebare → răspuns și explicație → următoarea întrebare → rezultat → progres și revenire la catalog. Încărcarea, eroarea API, lista goală și revenirea/resetarea au mesaje vizibile; progresul dispare la restart.

## Criteriul P1: matrice criteriu–fișier–test

| Criteriu | Fișier(e) | Dovadă/test |
|---|---|---|
| Date sintetice, contract fără cheie | `shared/store.ts`, `shared/contracts.ts` | `tests/store.test.ts` |
| API și completare idempotentă | `backend/server.ts` | `tests/api.test.ts` |
| Mod static cu mesaj vizibil | `frontend/main.tsx`, `frontend/vite.config.ts` | `npm run build:static`; badge static în UI |
| Mod local cu API Express | `frontend/main.tsx`, `backend/server.ts` | `npm run dev`; `tests/api.test.ts` |
| Guard privacy/secrete | `shared/privacy.ts`, `backend/server.ts` | typecheck și test API; payload invalid → 400 |
| Loading/error/empty/reset | `frontend/main.tsx`, `frontend/styles.css` | `tests/app.test.tsx`; verificare manuală în demo |
| React Context | `frontend/learning-context.tsx`, `frontend/main.tsx` | `npm run typecheck`; progresul din UI |
| Playwright E2E static | `playwright.config.ts`, `e2e/learning-flow.spec.ts` | `npm run e2e` pe desktop și mobile |
| Livrare GitHub Pages | `.github/workflows/pages.yml` | workflow construiește și publică `frontend/dist` |

## Demo local, full-stack și static

```bash
npm ci
npm run dev                 # Vite + API Express, http://localhost:5173
npm run dev:frontend        # doar frontend
npm run dev:backend         # doar API, http://localhost:3001
npm run build:static        # bundle Pages cu date sintetice incluse
npm run e2e                  # servește build-ul static și testează fluxul pe desktop + mobile
```

În UI, modul local spune explicit „folosește API-ul Express”, iar modul static spune explicit „folosește date sintetice incluse în pachet”. URL-ul Pages configurat de workflow este `https://<owner>.github.io/learning-platform-demo/`; nu este declarat live în această copie deoarece owner-ul GitHub nu este disponibil și nu inventez un URL public.

## Verificare

```bash
npm run typecheck
npm test
npm run build
npm run build:static
npm run e2e
npm audit --audit-level=high
npx playwright install --with-deps chromium  # dacă Chromium nu este instalat
git diff --check
```

## Confidențialitate, IP și limite

Toate textele, întrebările și rezultatele sunt inventate pentru demo; nu se colectează utilizatori, identificatori, cookies sau analytics. Nu introduce date personale ori secrete: guard-ul le respinge, iar progresul este doar în memorie. Conținutul și implementarea sunt demonstrative, fără afirmații despre rezultate educaționale, conformitate, proprietate intelectuală asupra unor surse externe sau disponibilitate de producție. Nu există integrare externă, autentificare, administrare sau furnizori.
