# IB — Indie Business Tracker

A full-stack app to track weekly Engineer **Selections**, **Onboardings**, and **Offboardings** across Account Managers.

Built with **FastAPI** (Python) + **MongoDB** + **React** (Vite).

---

## Project Structure

```
indie-business/
├── backend/
│   ├── main.py            # FastAPI app — all routes & logic
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Root + auth routing
│   │   ├── App.css        # All styles
│   │   ├── main.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.jsx
│   │   ├── utils/
│   │   │   └── api.js     # All API calls
│   │   ├── components/
│   │   │   ├── UI.jsx     # Shared components (MetricCard, Badge, Bar…)
│   │   │   └── EntryForm.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── AMDashboard.jsx
│   │       └── ManagerDashboard.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
└── docker-compose.yml
```

---

## Quickstart — Docker (recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run everything with one command

```bash
cd indie-business
docker-compose up --build
```

- **Frontend** → http://localhost:5173  
- **Backend API** → http://localhost:8000  
- **API Docs** → http://localhost:8000/docs  
- **MongoDB** → localhost:27017

---

## Quickstart — Local Dev (no Docker)

### 1. Start MongoDB

Install MongoDB locally or use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier).

### 2. Backend

```bash
cd backend

# Create virtual environment
py -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set MONGO_URL and JWT_SECRET

# Start API server
uvicorn main:app --reload --port 8000
```

API will be live at http://localhost:8000  
Swagger docs at http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

Frontend will be live at http://localhost:5173

---

## Login Credentials

| User         | PIN  | Access       |
|--------------|------|--------------|
| manager      | 0000 | All data     |
| Shalini      | 1001 | Own data     |
| Shubha       | 1002 | Own data     |
| Shataveeresh | 1003 | Own data     |
| Sathvik      | 1004 | Own data     |
| Sweatha      | 1005 | Own data     |
| Subhashini   | 1006 | Own data     |
| Jaibheema    | 1007 | Own data     |
| xxx          | 1008 | Own data     |
| yyy          | 1009 | Own data     |
| zzz          | 1010 | Own data     |

> **Security note:** Change PINs and `JWT_SECRET` in `backend/main.py` and `.env` before deploying.

---

## API Endpoints

| Method | Path                  | Auth     | Description                        |
|--------|-----------------------|----------|------------------------------------|
| POST   | `/auth/login`         | None     | Login → returns JWT token          |
| GET    | `/meta`               | JWT      | Clients, verticals, AM list        |
| GET    | `/months`             | JWT      | Distinct months in data            |
| GET    | `/entries`            | JWT      | List entries (filter: month, week) |
| POST   | `/entries`            | JWT      | Create a new entry                 |
| PUT    | `/entries/{id}`       | JWT      | Update an entry                    |
| DELETE | `/entries/{id}`       | JWT      | Delete an entry                    |
| GET    | `/stats/summary`      | JWT      | Bench/Partner counts               |
| GET    | `/stats/by-am`        | Manager  | Stats grouped by AM                |
| GET    | `/stats/by-vertical`  | JWT      | Stats grouped by vertical          |
| GET    | `/stats/by-client`    | JWT      | Stats grouped by client            |
| GET    | `/stats/rollup`       | JWT      | Week→Month→Year rollup data        |

---

## Customisation

### Add / rename Account Managers
Edit `PINS` and `AMS` in `backend/main.py` and `AMS` / `AMS_PEER` in the frontend pages.

### Add clients or verticals
Edit `CLIENTS` and `VERTICALS` in `backend/main.py` and `EntryForm.jsx`.

### Change MongoDB database name
Set `DB_NAME` in `.env`.

### Production deployment
1. Set a strong `JWT_SECRET` in `.env`
2. Set `MONGO_URL` to your production MongoDB URI (Atlas, etc.)
3. Build frontend: `npm run build` → serve `dist/` via Nginx or a CDN
4. Run backend with: `uvicorn main:app --host 0.0.0.0 --port 8000`

---

## Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Backend  | Python 3.12, FastAPI, Motor (async MongoDB driver) |
| Database | MongoDB 7           |
| Auth     | JWT (PyJWT)         |
| Frontend | React 18, Vite      |
| Styles   | Pure CSS (no framework) |
| Deploy   | Docker + Docker Compose |
