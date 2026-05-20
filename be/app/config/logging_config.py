import logging
from logging.handlers import TimedRotatingFileHandler
import os

def setup_logger():
    # Ensure the 'logs' directory exists
    logs_dir = "logs"
    os.makedirs(logs_dir, exist_ok=True)
    
    # Get the current date and format it for the filename
    log_file = os.path.join(logs_dir, "project.log")
    
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            TimedRotatingFileHandler(log_file, when='midnight', interval=1, backupCount=30, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )

logger = logging.getLogger(__name__)