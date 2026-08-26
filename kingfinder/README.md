# KingFinder

A web application for discovering kingfisher sightings and finding the best photography opportunities around Bengaluru, Karnataka, India.

KingFinder aggregates real-world observation data from iNaturalist and GBIF, normalizes and deduplicates records, and presents them through an interactive map and a photography recommendation system.

## Features

- **Home** — Landing page introducing KingFinder
- **Explore** — Browse and filter real kingfisher sightings with an interactive Leaflet map
- **Photographer Mode** — Location rankings and recommendations based on observation activity, species diversity, photographic evidence, and recent activity
- **Interactive Map** — Find nearby sightings with geolocation support and Google Maps integration
- **Report Sighting** — Placeholder for future sighting submissions
- **Insights** — Placeholder for future analytics and charts

## Tech Stack

- **Frontend:** React, Vite, React Router, Leaflet, Lucide React
- **Backend:** Express, Node.js
- **Data Sources:** iNaturalist API, GBIF API, Wikimedia Commons

## Project Structure

```
kingfinder/
├── src/                    # React frontend
│   ├── components/         # Shared components (Navbar, Logo, Map, etc.)
│   ├── layouts/            # Layout wrappers
│   ├── pages/              # Page components
│   │   └── photographer/   # Photographer Mode modules
│   ├── routes/             # Route configuration
│   ├── styles/             # Global styles
│   └── utils/              # Shared utility functions
├── server/                 # Express backend
│   └── server.js           # API server (iNaturalist + GBIF aggregation)
├── public/                 # Static assets
└── .env                    # Environment configuration (not committed)
```

## Running the Project

### Backend

```bash
cd server
npm install
npm start
```

The backend runs on `http://localhost:5000` by default.

### Frontend

```bash
npm install
npm run dev
```

The frontend uses the following environment variable:

```env
VITE_API_URL=http://localhost:5000
```

Create a `.env` file in the project root with this value if it does not already exist.

## Environment Variables

### Frontend (.env)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Backend API base URL |

### Backend (server/.env)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server listening port |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed frontend origin for CORS (or comma-separated URLs) |

## Deployment

### Frontend (Vercel)

1. Connect the GitHub repository on [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite**.
3. Set the Environment Variable:
   - `VITE_API_URL`: URL of your deployed Render backend (e.g. `https://kingfinder-api.onrender.com`).
4. Deploy. Client-side routes are handled via `vercel.json`.

### Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com) from the GitHub repository.
2. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. Add Environment Variables:
   - `PORT`: `5000`
   - `FRONTEND_URL`: URL of your deployed Vercel frontend (e.g. `https://kingfinder.vercel.app`).
4. Deploy.
