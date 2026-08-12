# Learningo — catalog de învățare și progres personal

Learningo este o platformă web de învățare în limba română, construită pentru trasee scurte și clare: alegi un curs, deschizi o lecție, exersezi, primești explicații și revii la progresul tău.

[Deschide aplicația live →](https://learning-platform-demo-pi.vercel.app)

## Cum funcționează

- **Catalog:** filtrează cursurile după materie și alege un traseu.
- **Curs:** vezi lecțiile, durata și progresul acumulat.
- **Lecție:** parcurge explicațiile și exercițiile de alegere, calcul și ordonare.
- **Feedback:** răspunsurile greșite afișează explicația și permit retry.
- **Progres:** lecțiile finalizate adaugă XP, actualizează seria și rămân vizibile după reîncărcarea paginii.

Catalogul seeded include cursuri de matematică și științe, lecții independente și un flux complet care poate fi reluat fără cont.

## Date și limite

Catalogul și progresul sunt ficțiuni publice, generate determinist în aplicație. Progresul utilizatorului este păstrat numai în `localStorage` al browserului. Nu există autentificare, conturi reale, Telegram, date personale sau conținut privat. Backend-ul Express rămas în repository este opțional pentru preview local; experiența live funcționează static pe Vercel și nu depinde de un API extern.

## Stack și rulare

- React 19, TypeScript 7, Vite 8
- CSS existent, păstrat ca sistem vizual al produsului
- Vitest + Testing Library pentru unit/integration tests
- Playwright pentru traseul catalog → curs → lecție → progres

```bash
npm ci
npm run dev:frontend
npm test
npm run typecheck
npm run build
npm run e2e
```

Aplicația statică este compatibilă cu Vercel. Build-ul folosește `frontend/index.html` și nu necesită variabile de mediu.
