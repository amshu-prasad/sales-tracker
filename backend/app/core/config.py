import os

MONGO_URL        = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
DB_NAME          = os.getenv("DB_NAME", "indie_business")
JWT_SECRET       = os.getenv("JWT_SECRET", "indie_secret_change_me")
MODULE_ID        = os.getenv("MODULE_ID", "gf98293201-3j20v9-v93093-g9j203r3f")
AUTH_SERVICE_URL = os.getenv(
    "AUTH_SERVICE_URL",
    "http://localhost/smart-auth-be/api/v1/validate-token"
)
MANAGER_ROLE_ID  = "13evreg4420-b6a1-4fec-8a93-dverr42329bs51"
