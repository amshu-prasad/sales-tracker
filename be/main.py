import logging
from app.config.logging_config import setup_logger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.EnvConfig import base_path, port
from app.api.opportunity_controller import opportunity_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_logger()  # Set up logging

logger = logging.getLogger("main_project")
apiPrefix = f"/api/v1"

# Include routers
app.include_router(opportunity_router, prefix=apiPrefix, tags=["tracker"])

@app.get("/")
def root():
    logger.info("This is a root function.")
    # Sample JSON data
    sample_data = [
        {"id": 1, "name": "John Doe", "email": "john@example.com"},
        {"id": 2, "name": "Jane Doe", "email": "jane@example.com"},
        {"id": 3, "name": "Alice Smith", "email": "alice@example.com"},
    ]
    # return {"Hello": "World"}
    return sample_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=port)
