# Dinder

A phone-first prototype for a flat that eats together. Swipe dinners, keep a shared week, and open a cook view you can leave on the counter.

It is a prototype, not a product. One household, no accounts, data in the browser. The rules, data shapes, and where to edit them live in [PROJECT.md](PROJECT.md).

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints. On a laptop it sits in a phone frame. On a phone it is full screen. Use the Network URL if you want the same Wi-Fi.

The demo flat is already loaded: Elias, Luca, Lars Kristian, Lisa, Pavle, Shahrzad, and Tobias. The name at the top is whoever is holding the phone. Swipes stay with that person. The plan is shared.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 5173, reachable on the local network |
| `npm run build` | Static build in `dist/` |
| `npm run preview` | Serve that build |
| `npm run week` | Print this week, next week, and the hidden duty counts |
| `npm run shots` | Save phone screenshots to `shots/`. Needs Microsoft Edge |

## Stack

Vite and React. No backend. Household data is in `localStorage` under `dinder.v1`. Reset lives on the House tab, and wipes that flat back to the demo.
