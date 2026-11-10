from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

app = FastAPI(title="ClassFlow API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Welcome to ClassFlow API!"}

# Test route to check MySQL Connection
@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        # Simple SQL test query
        result = db.execute(text("SELECT 1")).fetchone()
        return {"status": "success", "db_connected": True, "result": result[0]}
    except Exception as e:
        return {"status": "error", "db_connected": False, "details": str(e)}