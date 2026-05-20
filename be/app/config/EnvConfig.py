import logging
import os
from dotenv import load_dotenv

logger = logging.getLogger("main_project")

environment = os.getenv('ENVIRONMENT', 'development')

# Determine the correct .env file to load
env_file = f"{environment}.env"
logger.info('Loaded Environment file', env_file)
load_dotenv(env_file)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
DB_NAME   = os.getenv("DB_NAME", "Sb_tracker")
JWT_SECRET = os.getenv("JWT_SECRET", "indie_secret_change_me")
MODULE_ID = os.getenv("MODULE_ID", "gf98293201-3j20v9-v93093-g9j203r3f")

access_key_id = os.getenv('aws_access_key_id')
secret_access_key = os.getenv('aws_secret_access_key')
region = os.getenv('region_name')
bucket_name = os.getenv('bucket_name')


base_path = os.getenv('base_path')
port = os.getenv('port')