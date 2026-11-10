from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ClassGroup

app = FastAPI(title="ClassFlow API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Welcome to ClassFlow API!"}

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT 1")).fetchone()
        return {"status": "success", "db_connected": True, "result": result[0]}
    except Exception as e:
        return {"status": "error", "db_connected": False, "details": str(e)}

# New test endpoint using SQLAlchemy ORM Models
@app.get("/test-models")
def test_models(db: Session = Depends(get_db)):
    try:
        user = db.query(User).first()
        class_group = db.query(ClassGroup).first()
        
        return {
            "status": "success",
            "user_found": f"{user.first_name} {user.last_name} ({user.username})" if user else None,
            "class_group_found": f"{class_group.class_name} - {class_group.group_name}" if class_group else None
        }
    except Exception as e:
        return {"status": "error", "details": str(e)}