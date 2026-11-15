# Education atlas

A 2D world map with a timeline. Each marker is an education system, shown only while the slider year falls inside its dates. The app uses no network calls. Every map and marker comes from local files in this folder.

## Run it on your computer

1. Install Node.js (the LTS version) from https://nodejs.org and accept the installer defaults.
2. Open a new terminal window.
3. Go to this folder, then run `npm install` once.
4. Run `npm run dev` and open the address it prints (usually http://localhost:5173).
5. Press Ctrl+C in the terminal to stop it.

## Put it online with Netlify

1. Run `npm run build`. This creates a `dist` folder.
2. Open https://app.netlify.com/drop in a browser and drag the `dist` folder onto the page.

## Where the data lives

- `public/education.csv` holds every marker. Open it in Excel, edit, and save it as CSV. Refresh the browser to see changes.
- `src/data/settings.json` holds the app name and the intro line.
- `src/data/timeline.json` holds the slider stages and tick years.
- `src/data/land.json` holds the coastlines as lists of [longitude, latitude] points.
- `src/data/terrain.json` holds the terrain zones.
- `src/data/key.json` holds the terrain key colours.
- `src/data/labels.json` holds the historical region names and the years they show.

## Other files

- `src/App.tsx` holds the map, slider, side panel, and the rule that hides overlapping labels.
- `src/styles.css` holds all styling.

## Known limits

- The coastlines are hand-simplified and modern. Coasts changed little after 3000 BCE, but lost land such as Doggerland is not shown.
- Terrain zones are rough polygons, not elevation or biome data.
- Not built yet: search with synonyms, bookmarks and folders, history, marker editing, a resizable popup, an Excel data source, and region labels for every era.

## Rename the app

Open `src/data/settings.json` and change `title`. Change `intro` to edit the line that fades away.

## Edit markers, descriptions, and tags in the spreadsheet

Columns in `public/education.csv`, in this order: `id`, `name`, `longitude`, `latitude`, `start_year`, `end_year`, `period`, `region`, `method`, `description`.

- Use negative years for BCE. Use negative latitude for south and negative longitude for west.
- `period`, `region`, and `method` are the three tags. The Method buttons are built from the `method` column.
- Rows with a missing name or a bad number are skipped, and the side panel lists their row numbers.
- Save as CSV UTF-8. Do not save as .xlsx.

## Edit the slider

`stages` in `timeline.json` sets the pace. Each stage has an `until` year and a `step`. The slider moves one step at a time, so the years per step are exactly the `step` value. The default is 20 years until 500 BCE, 15 until 1000 CE, 10 until 1500 CE, and 1 until 1800 CE. Make each stage's length divide evenly by its step. `ticks` lists where the tick marks sit.

## Edit the terrain key

- To change a colour, edit the hex code beside its name in `key.json`.
- To add a terrain type, add `["wetland", "#7fb3a8"]` to `key.json` above `"other land"`, then add a shape to `terrain.json` with `"kind": "wetland"`.
- The `kind` in `terrain.json` must match a name in `key.json` exactly.
