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

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Backend API base URL |
