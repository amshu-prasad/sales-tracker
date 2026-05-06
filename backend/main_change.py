from fastapi import FastAPI, HTTPException, Depends,  Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
import requests as http_requests
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import os, jwt, math

# ── Config ──────────────────────────────────────────────────────
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
DB_NAME   = os.getenv("DB_NAME", "indie_business")
JWT_SECRET = os.getenv("JWT_SECRET", "indie_secret_change_me")
MODULE_ID = os.getenv("MODULE_ID", "gf98293201-3j20v9-v93093-g9j203r3f")
AUTH_SERVICE_URL = "http://localhost/smart-auth-be/api/v1/validate-token"
# AUTH_SERVICE_URL = "http://192.168.21.49/smart-auth-be/api/v1/validate-token"

# CLIENTS = [
#     "Samsung","Xilinx","AMD Hyd","AMD BLR","Google","Amazon","Nvidia",
#     "Synopsys","Micron","NXP","ADI","Qualcomm","Sandisk",
#     "Cerebras Systems","HydWyr","TI","Big Endian","Other"
# ]
# VERTICALS = ["DV","PD","AL","AD","DFT","RTL","Emulation","STA","FPGA","PV","Embedded Systems"]
# AMS = ["Shalini","Shubha","Shataveeresh","Sathvik","Sweatha","Subhashini","Jaibheema","xxx","yyy","zzz"]

# ── App ─────────────────────────────────────────────────────────
app = FastAPI(title="Indie Business Tracker API",root_path="/sb-tracker-be")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DB ──────────────────────────────────────────────────────────
client: AsyncIOMotorClient = None
db = None

@app.on_event("startup")
async def startup():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    await db.entries.create_index("am")
    await db.entries.create_index("type")
    await db.entries.create_index("date")
    await db.entries.create_index([("month", 1), ("week", 1)])

@app.on_event("shutdown")
async def shutdown():
    client.close()

# ── Auth helpers ────────────────────────────────────────────────
security = HTTPBearer(auto_error=False)

def make_token(username: str) -> str:
    return jwt.encode({"sub": username}, JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials

    try:
        headers = {"Authorization": f"Bearer {token}"}
        params = {"module": MODULE_ID}
        response = http_requests.post(AUTH_SERVICE_URL, headers=headers, params=params)
        
        if response.status_code == 403:
            raise HTTPException(status_code=403, detail="Permission denied")
        elif response.status_code == 401:
            raise HTTPException(status_code=401, detail="Unauthorized")

        response_data = response.json()

        if not response_data.get("isValid"):
            raise HTTPException(status_code=401, detail="Token invalid")

        user = response_data.get("user")

        # Map role to manager/am
        roles = user.get("role", [])
        
        if isinstance(roles, list):
            is_manager = "13evreg4420-b6a1-4fec-8a93-dverr42329bs51" in roles
        else:
            is_manager = roles == "13evreg4420-b6a1-4fec-8a93-dverr42329bs51"

        if is_manager:
            return "manager"

        username = user.get("user_name") or user.get("sub")
        usr = username.split("@")[0].capitalize()
        if not usr:
            raise HTTPException(status_code=401, detail="Invalid token claims")

        return usr

    except HTTPException:
        raise
    except http_requests.exceptions.RequestException as ex:
        raise HTTPException(status_code=401, detail="Authorization failed")

# ── Utility ─────────────────────────────────────────────────────
def get_week(date_str: str) -> str:
    try:
        d = datetime.fromisoformat(date_str)
        return "W" + str(min(4, math.floor((d.day - 1) / 7) + 1))
    except:
        return "W1"

def get_month(date_str: str) -> str:
    try:
        d = datetime.fromisoformat(date_str)
        return d.strftime("%b'%y")
    except:
        return ""

def get_quarter(date_str: str) -> str:
    try:
        d = datetime.fromisoformat(date_str)
        return f"Q{(d.month - 1) // 3 + 1}'{str(d.year)[-2:]}"
    except:
        return ""

def serialize(doc) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc

# ── Schemas ─────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    pin: str

class EntryCreate(BaseModel):
    date: str
    client: str
    vertical: str
    source: str          # Bench | Partner
    empType: str         # T&M | ODC
    type: str            # selection | onboarding | offboarding
    remarks: Optional[str] = ""
    candidateName: str

class EntryUpdate(BaseModel):
    date: Optional[str] = None
    client: Optional[str] = None
    vertical: Optional[str] = None
    source: Optional[str] = None
    empType: Optional[str] = None
    type: Optional[str] = None
    candidateName: Optional[str] = None
    remarks: Optional[str] = None

# ── Routes ──────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "ok", "app": "Indie Business Tracker"}

@app.get("/meta")
async def get_meta():
    doc = await db.meta.find_one({})
    if not doc:
        raise HTTPException(status_code=404, detail="Meta config not found")
    return {
        "clients":   doc.get("CLIENTS", []),
        "verticals": doc.get("VERTICALS", []),
        "ams":       doc.get("AMS", [])
    }

@app.put("/meta")
async def update_meta(body: dict, current_user: str = Depends(get_current_user)):
    if current_user != "manager":
        raise HTTPException(status_code=403, detail="Only manager can update meta")
    allowed = {"CLIENTS", "VERTICALS", "AMS"}
    update = {k.upper(): v for k, v in body.items() if k.upper() in allowed}
    await db.meta.update_one({}, {"$set": update}, upsert=True)
    doc = await db.meta.find_one({})
    return {
        "clients":   doc.get("CLIENTS", []),
        "verticals": doc.get("VERTICALS", []),
        "ams":       doc.get("AMS", [])
    }

# ── Entries ─────────────────────────────────────────────────────
@app.post("/entries", status_code=201)
async def create_entry(body: EntryCreate, current_user: str = Depends(get_current_user)):
    
    doc = body.dict()
    doc["am"] = current_user
    doc["week"] = get_week(body.date)
    doc["month"] = get_month(body.date)
    doc["quarter"] = get_quarter(body.date)
    doc["created_at"] = datetime.utcnow().isoformat()
    result = await db.entries.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc


@app.get("/entries")
async def get_entries(
    month: Optional[str] = None,
    week: Optional[str] = None,
    date: Optional[str] = None,
    from_date: Optional[str] = None,   # ✅ NEW
    to_date: Optional[str] = None,     # ✅ NEW
    type: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    query = {"is_deleted": {"$ne": True}}

    if current_user != "manager":
        query["am"] = current_user

    # ✅ PRIORITY 1: DATE RANGE
    if from_date and to_date:
        query["date"] = {
            "$gte": from_date,
            "$lte": to_date
        }

    # ✅ PRIORITY 2: SINGLE DATE
    elif date:
        query["date"] = date

    # ✅ FALLBACK: MONTH + WEEK
    else:
        if month and month != "ALL":
            query["month"] = month
        if week and week != "ALL":
            query["week"] = week

    if type:
        query["type"] = type
        
    cursor = db.entries.find(query).sort("date", -1)
    docs = await cursor.to_list(length=2000)
    return [serialize(d) for d in docs]
        
@app.get("/entries/{entry_id}")
async def get_entry(entry_id: str, current_user: str = Depends(get_current_user)):
    doc = await db.entries.find_one({"_id": ObjectId(entry_id), "is_deleted": {"$ne": True}})  # ← added
    if not doc:
        raise HTTPException(status_code=404, detail="Entry not found")
    if current_user != "manager" and doc["am"] != current_user:
        raise HTTPException(status_code=403, detail="Forbidden")
    return serialize(doc)

@app.put("/entries/{entry_id}")
async def update_entry(entry_id: str, body: EntryUpdate, current_user: str = Depends(get_current_user)):
    doc = await db.entries.find_one({"_id": ObjectId(entry_id), "is_deleted": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user != "manager" and doc["am"] != current_user:
        raise HTTPException(status_code=403, detail="Forbidden")
    update = {k: v for k, v in body.dict().items() if v is not None}
    if "date" in update:
        update["week"]    = get_week(update["date"])
        update["month"]   = get_month(update["date"])
        update["quarter"] = get_quarter(update["date"])
    update["updated_by"] = current_user                          # ← who edited
    update["updated_at"] = datetime.utcnow().isoformat()        # ← when edited
    await db.entries.update_one({"_id": ObjectId(entry_id)}, {"$set": update})
    updated = await db.entries.find_one({"_id": ObjectId(entry_id), "is_deleted": {"$ne": True}})
    return serialize(updated)

@app.delete("/entries/{entry_id}", status_code=200)
async def delete_entry(entry_id: str, current_user: str = Depends(get_current_user)):
    doc = await db.entries.find_one({"_id": ObjectId(entry_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user != "manager" and doc["am"] != current_user:
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.entries.update_one(
        {"_id": ObjectId(entry_id)},
        {"$set": {"is_deleted": True, "deleted_at": datetime.utcnow().isoformat(), "deleted_by": current_user}}
    )
    return {"deleted": entry_id}

# ── Stats ────────────────────────────────────────────────────────
@app.get("/stats/summary")
async def stats_summary(
    month: Optional[str] = None,
    week: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    query = {}
    if current_user != "manager":
        query["am"] = current_user
    if month and month != "ALL":
        query["month"] = month
    if week and week != "ALL":
        query["week"] = week

    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {"type": "$type", "source": "$source"},
            "count": {"$sum": 1}
        }}
    ]
    results = await db.entries.aggregate(pipeline).to_list(length=100)
    summary = {"selection": {"bench": 0, "partner": 0}, "onboarding": {"bench": 0, "partner": 0}, "offboarding": {"bench": 0, "partner": 0}}
    for r in results:
        t = r["_id"]["type"]
        s = r["_id"]["source"].lower() if r["_id"]["source"] else "bench"
        if t in summary and s in summary[t]:
            summary[t][s] = r["count"]
    return summary

@app.get("/stats/by-am")
async def stats_by_am(
    month: Optional[str] = None,
    week: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    if current_user != "manager":
        raise HTTPException(status_code=403, detail="Manager only")
    query = {}
    if month and month != "ALL":
        query["month"] = month
    if week and week != "ALL":
        query["week"] = week
    pipeline = [
        {"$match": query},
        {"$group": {"_id": {"am": "$am", "type": "$type", "source": "$source"}, "count": {"$sum": 1}}}
    ]
    results = await db.entries.aggregate(pipeline).to_list(length=500)
    data = {}
    for r in results:
        am = r["_id"]["am"]
        t = r["_id"]["type"]
        s = (r["_id"]["source"] or "bench").lower()
        if am not in data:
            data[am] = {}
        key = f"{t}_{s}"
        data[am][key] = data[am].get(key, 0) + r["count"]
    return data

@app.get("/stats/by-vertical")
async def stats_by_vertical(
    month: Optional[str] = None,
    week: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    query = {}
    if current_user != "manager":
        query["am"] = current_user
    if month and month != "ALL":
        query["month"] = month
    if week and week != "ALL":
        query["week"] = week
    pipeline = [
        {"$match": query},
        {"$group": {"_id": {"vertical": "$vertical", "type": "$type", "source": "$source"}, "count": {"$sum": 1}}}
    ]
    results = await db.entries.aggregate(pipeline).to_list(length=500)
    data = {}
    for r in results:
        v = r["_id"]["vertical"]
        t = r["_id"]["type"]
        s = (r["_id"]["source"] or "bench").lower()
        if v not in data:
            data[v] = {}
        data[v][f"{t}_{s}"] = data[v].get(f"{t}_{s}", 0) + r["count"]
    return data

@app.get("/stats/by-client")
async def stats_by_client(
    month: Optional[str] = None,
    week: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    query = {}
    if current_user != "manager":
        query["am"] = current_user
    if month and month != "ALL":
        query["month"] = month
    if week and week != "ALL":
        query["week"] = week
    pipeline = [
        {"$match": query},
        {"$group": {"_id": {"client": "$client", "type": "$type", "vertical": "$vertical"}, "count": {"$sum": 1}}}
    ]
    results = await db.entries.aggregate(pipeline).to_list(length=1000)
    data = {}
    for r in results:
        c = r["_id"]["client"]
        t = r["_id"]["type"]
        v = r["_id"]["vertical"]
        if c not in data:
            data[c] = {}
        data[c][f"type_{t}"] = data[c].get(f"type_{t}", 0) + r["count"]
        data[c][f"vert_{v}"] = data[c].get(f"vert_{v}", 0) + r["count"]
    return data

@app.get("/stats/rollup")
async def stats_rollup(current_user: str = Depends(get_current_user)):
    query = {} if current_user == "manager" else {"am": current_user}
    pipeline = [
        {"$match": query},
        {"$group": {"_id": {"month": "$month", "week": "$week", "type": "$type", "source": "$source"}, "count": {"$sum": 1}}}
    ]
    results = await db.entries.aggregate(pipeline).to_list(length=2000)
    data = {}
    for r in results:
        m = r["_id"]["month"]
        w = r["_id"]["week"]
        t = r["_id"]["type"]
        s = (r["_id"]["source"] or "bench").lower()
        if m not in data:
            data[m] = {}
        if w not in data[m]:
            data[m][w] = {}
        data[m][w][f"{t}_{s}"] = data[m][w].get(f"{t}_{s}", 0) + r["count"]
    return data

@app.get("/months")
async def get_months(current_user: str = Depends(get_current_user)):
    query = {} if current_user == "manager" else {"am": current_user}
    months = await db.entries.distinct("month", query)
    return sorted([m for m in months if m])
