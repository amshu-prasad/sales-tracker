from datetime import datetime
import math


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