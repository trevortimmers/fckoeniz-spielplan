# FC Köniz – Spielplan Widget

Automatisch aktueller Spielplan direkt von al-la.ch.
Kein manuelles Pflegen nötig – die Daten werden alle 30 Minuten aktualisiert.

## Setup (einmalig, ~10 Minuten)

### 1. GitHub Account + Repository
1. github.com → Sign up (kostenlos)
2. + → New repository → Name: `fckoeniz-spielplan` → Public → Create
3. Alle Dateien dieses Ordners per Drag & Drop hochladen → Commit

### 2. Vercel Account + Deploy
1. vercel.com → Sign up with GitHub (kostenlos)
2. Add New Project → `fckoeniz-spielplan` auswählen → Deploy
3. Nach ~1 Min: du erhältst deine URL, z.B. `fckoeniz-spielplan.vercel.app`

### 3. In WordPress/Elementor einbetten
HTML Widget → einfügen:

```html
<iframe
  src="https://fckoeniz-spielplan.vercel.app/spielplan"
  width="100%"
  height="700"
  frameborder="0"
  style="border:none; overflow:hidden;"
  scrolling="no"
></iframe>
```

## Wie es funktioniert
- Die App scrapt automatisch al-la.ch (Team-IDs: 36600 = 2.Liga, 36601 = 3.Liga)
- Vercel cached die Daten 30 Minuten → schnell, aber immer aktuell
- Findet FC Köniz in Heim- und Auswärtsspielen automatisch
- Zeigt Datum, Uhrzeit, Gegner, Resultat (sobald gespielt)

## Lokale Entwicklung
```bash
npm install
npm run dev
# → http://localhost:3000/spielplan
```
