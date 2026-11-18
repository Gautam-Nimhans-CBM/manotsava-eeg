# Listening to the Brain — Manotsava 2026 EEG pages

Interactive pages from the Manotsava 2026 EEG team, NIMHANS, Bengaluru, made for
Manotsava – National Mental Health Festival (5–6 December 2026). The EEG recordings behind the
team's work are made at the Centre for Brain Mapping, NIMHANS.

| Page | What it shows |
|---|---|
| `index.html` | Listening to the Brain: what EEG is and how it is recorded |
| `sensor_net.html` | The sensor net: how a 128-channel cap samples the scalp |
| `where_from.html` | Where is it coming from? How scalp signals relate to their sources |
| `india_map.html` | EEG across India: where participants come from (district totals only) and what happens on the day |
| `team.html` | Meet the EEG team, filled from `team.js` |
| `*.pdf` | Printable handouts |

## How the site works

- `welcome.html` shows a short Google Form. Content pages send first-time visitors there and open
  automatically once the form is submitted; the browser remembers this, so returning visitors go straight in.
- `config.js` holds the form link and the analytics IDs. It is the only file that needs editing.
- `site.js` runs the visitor gate and loads Google Analytics 4 and Microsoft Clarity after the form is submitted.
- `privacy.html` explains what is collected.
- `lang.js` adds language tabs (English, ಕನ್ನಡ, தமிழ், हिन्दी, తెలుగు) to every page. The translations are in
  `lang/kn.js`, `lang/ta.js`, `lang/hi.js` and `lang/te.js`: English on the left, translation on the right.
  `sensor_net.html` and `where_from.html` carry their own translations (and Malayalam); the choice is shared.

Hosted with GitHub Pages from the `main` branch root.
