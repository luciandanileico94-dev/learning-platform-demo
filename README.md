# Atelier de învățare

Demo public, sintetic, pentru un portofoliu React + TypeScript. Interfața în limba română prezintă trei domenii, filtre de nivel, lecții cu cinci întrebări, feedback explicat, progres și resetare.

## Pornire

```bash
npm install
npm run dev
```

Frontend-ul pornește pe Vite, iar API-ul Express pe `http://localhost:3001`. Pentru verificări: `npm run typecheck`, `npm test`, `npm run build`.

## Arhitectură

- `shared/` — contracte TypeScript și store determinist, în memorie;
- `backend/` — `GET /api/courses`, `GET /api/lessons/:id`, `POST /api/lessons/:id/answer`, `POST /api/courses/:id/complete`;
- `frontend/` — UI responsive, accesibilă cu tastatura, care folosește API-ul și fallback local fără secrete;
- `tests/` — contract fără scurgerea cheii de răspuns, flux API/idempotency și smoke test React.

## Limitări

Acesta este un demo offline de portofoliu: datele, utilizatorii, întrebările și textele sunt inventate, iar starea dispare la restart. Nu există autentificare, administrare, conturi, tracking, integrare cu furnizori, conținut extern sau media. Nu este un produs educațional complet și nu include capturi de ecran.
