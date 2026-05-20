# create virtual environment
python -m venv venv

# activate venv using
venv\Scripts\activate

# Install required libraries
pip install -r requirements.txt

# Set environment file windows
set ENVIRONMENT=development
set ENVIRONMENT=.testing

# Set environment file mac/linux
export ENVIRONMENT=.development

# Start the server
uvicorn main:app --reload --port 8010
uvicorn main:app --reload --port 8000 --host 0.0.0.0

# Access application in Browser
localhost:8010
