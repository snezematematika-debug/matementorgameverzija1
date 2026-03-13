# Мате-Ментор / Мате-Хут — Акционен план за зацврстување

> Последно ажурирање: 2026-03-13 — Сите фази завршени ✅
> Статус: КОМПЛЕТНО — следи `npm install` + верификација

---

## ФАЗА 1 — Критично 🔴

| # | Задача | Файл(ови) | Статус |
|---|--------|-----------|--------|
| 1.1 | Премести Firebase конфиг во `.env.local` — отстрани JSON со API клучеви од git | `firebase-applet-config.json` → `services/firebase.ts` + `vite.config.ts` + `.gitignore` + `.env.example` | ✅ Завршено |
| 1.2 | Додај TTL (30 дена) во cacheService — стари одговори се отфрлаат | `services/cacheService.ts` | ✅ Завршено |
| 1.3 | Ограничи читање на `ai_cache` само за автентицирани корисници | `firestore.rules` | ✅ Завршено |

---

## ФАЗА 2 — Перформанси 🟡

| # | Задача | Файл(ови) | Статус |
|---|--------|-----------|--------|
| 2.1 | React.lazy() + Suspense за сите 24 компоненти → помал initial bundle (60-70%) | `App.tsx` | ✅ Завршено |
| 2.2 | Singleton AI client — создај `GoogleGenAI` еднаш, не при секој повик | `services/geminiService.ts` | ✅ Завршено |
| 2.3 | Отстрани `testConnection()` од module-level во firebase.ts | `services/firebase.ts` | ✅ Завршено |
| 2.4 | ~~Отстрани `marked`~~ — `marked` се користи за print/export HTML, `react-markdown` за приказ. Различни намени, не се дублира. Задачата се затвора. | — | ✅ Анализирано — не е потребна промена |

---

## ФАЗА 3 — Архитектура и квалитет 🟢

| # | Задача | Файл(ови) | Статус |
|---|--------|-----------|--------|
| 3.1 | React Context за `userRole`, `selectedGrade`, `currentMode` — App.tsx рефакториран на AppProvider + AppShell | `context/AppContext.tsx` + `App.tsx` | ✅ Завршено |
| 3.2 | Vitest — 12 unit тести за `parseJsonSafe` (валиден JSON, code blocks, backslash fallback, Unicode, кирилица…) | `tests/geminiService.test.ts` + `vitest.config.ts` | ✅ Завршено |
| 3.3 | Отстранет празниот `ManimGenerator.tsx` | `components/ManimGenerator.tsx` | ✅ Завршено — избришан |
| 3.4 | GitHub Actions CI — TypeScript check + build на секој push/PR | `.github/workflows/ci.yml` | ✅ Завршено |
| 3.5 | Елиминирани сите `// @ts-ignore` — `declare global Window.aistudio` + правилни каст | `services/geminiService.ts` | ✅ Завршено |
| 3.6 | PWA / Service Worker — `vite-plugin-pwa` со Network-First за Gemini + Firestore, manifest на македонски | `vite.config.ts` | ✅ Завршено |

---

## Легенда

- ✅ Завршено
- 🔄 Во тек
- ⏳ Не започнато
- ❌ Блокирано

---

## По завршувањето — чекори за активирање

```bash
npm install          # инсталирај vitest, vite-plugin-pwa, jsdom
npm run test         # треба да поминат сите 12 тести
npm run lint         # TypeScript check без грешки
npm run build        # production build
```

За Vercel: постави ги сите `VITE_FIREBASE_*` и `GEMINI_API_KEY` во **Project Settings → Environment Variables**.
За GitHub: постави ги истите во **Repository Settings → Secrets → Actions**.

---

## Белешки

- Firebase конфигот (.env.local) **никогаш не се commit-ува** — додаден е во .gitignore
- При секое деплојување на Vercel — постави ги VITE_FIREBASE_* и GEMINI_API_KEY во Vercel Environment Variables
- Cache TTL е поставен на **30 дена** — може да се намали на 7 дена ако се сака почеста свежина на AI содржините
