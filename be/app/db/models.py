from typing import List
from pydantic import BaseModel
from pymongo import MongoClient

from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.config.EnvConfig import MONGO_URL, DB_NAME

client = MongoClient(MONGO_URL)

def get_collection(collection_name):
    db = client[DB_NAME]
    collection = db[collection_name]

    return collection


# -----------------------------
# CREATE
# -----------------------------
def create_one(collection_name: str, data):
    collection = get_collection(collection_name)

    result = collection.insert_one(data)

    return str(result.inserted_id)


def create_many(collection_name: str, data):
    collection = get_collection(collection_name)

    result = collection.insert_many(data)

    return [str(_id) for _id in result.inserted_ids]


# -----------------------------
# READ
# -----------------------------
def find_one(
    collection_name: str,
    query: Dict[str, Any],
    projection: Optional[Dict[str, int]] = None
):

    collection = get_collection(collection_name)

    # exclude mongo _id by default
    if projection is None:
        projection = {"_id": 0}

    data = collection.find_one(query, projection)

    return data


def find_many(
    collection_name: str,
    query: Dict[str, Any] = {},
    projection: Optional[Dict[str, int]] = None,
    limit: int = 100,
    skip: int = 0,
    sort: Optional[List[tuple]] = None
):

    collection = get_collection(collection_name)

    cursor = collection.find(query, projection)

    if sort:
        cursor = cursor.sort(sort)

    cursor = cursor.skip(skip).limit(limit)

    results = []

    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)

    return results


def count_documents(
    collection_name: str,
    query: Dict[str, Any] = {}
) -> int:

    collection = get_collection(collection_name)

    return collection.count_documents(query)


# -----------------------------
# UPDATE
# -----------------------------
def update_one(
    collection_name: str,
    query: dict,
    update_data: dict
):

    collection = get_collection(collection_name)

    result = collection.update_one(
        query,
        {"$set": update_data}
    )

    return result

def update_many(
    collection_name: str,
    query: Dict[str, Any],
    update_data: Dict[str, Any]
) -> int:

    collection = get_collection(collection_name)

    result = collection.update_many(
        query,
        {"$set": update_data}
    )

    return result.modified_count


# -----------------------------
# DELETE
# -----------------------------
def delete_one(
    collection_name: str,
    query: Dict[str, Any]
) -> int:

    collection = get_collection(collection_name)

    result = collection.delete_one(query)

    return result.deleted_count


def delete_many(
    collection_name: str,
    query: Dict[str, Any]
) -> int:

    collection = get_collection(collection_name)

    result = collection.delete_many(query)

    return result.deleted_count


# -----------------------------
# OBJECT ID HELPER
# -----------------------------
def to_object_id(id: str) -> ObjectId:
    return ObjectId(id)

def append_to_list(
    collection_name: str,
    query: dict,
    field_name: str,
    value
):

    collection = get_collection(collection_name)

    result = collection.update_one(
        query,
        {
            "$push": {
                field_name: value
            }
        }
    )

    return result