# Indie Business Tracker – FastAPI Project Structure

```
sb_tracker/
├── main.py                        # App entrypoint
└── app/
    ├── core/
    │   ├── config.py              # Env vars / settings
    │   └── security.py            # JWT + auth middleware
    ├── db/
    │   └── mongo.py               # Motor client + lifecycle hooks
    ├── schemas/
    │   ├── entry.py               # Entry Pydantic models
    │   └── meta.py                # Meta Pydantic models
    ├── services/
    │   ├── entry_service.py       # Business logic for entries
    │   ├── meta_service.py        # Business logic for meta
    │   └── stats_service.py       # Business logic for stats
    └── api/
        └── routes/
            ├── entries.py         # /entries endpoints
            ├── meta.py            # /meta endpoints
            └── stats.py           # /stats + /months endpoints
```
