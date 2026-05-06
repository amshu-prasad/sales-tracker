from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.mongo import connect_db, close_db
from app.api.routes import entries, meta, stats

app = FastAPI(title="Indie Business Tracker API", root_path="/sb-tracker-be")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Lifecycle ────────────────────────────────────────────────────
app.add_event_handler("startup", connect_db)
app.add_event_handler("shutdown", close_db)

# ── Routers ──────────────────────────────────────────────────────
app.include_router(entries.router)
app.include_router(meta.router)
app.include_router(stats.router)


@app.get("/")
async def root():
    return {"status": "ok", "app": "Indie Business Tracker"}
