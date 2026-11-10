from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models import User, ClassGroup
from app.schemas import (
    UserResponse, 
    ClassGroupResponse, 
    LoginRequest, 
    TokenResponse
)
from app.auth import verify_password, create_access_token

app = FastAPI(title="ClassFlow API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Welcome to ClassFlow API!"}

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1")).fetchone()
        return {"status": "success", "db_connected": True, "result": result[0]}
    except Exception as e:
        return {"status": "error", "db_connected": False, "details": str(e)}

@app.get("/test-models")
def test_models(db: Session = Depends(get_db)):
    try:
        user = db.query(User).first()
        class_group = db.query(ClassGroup).first()
        
        return {
            "status": "success",
            "user_found": f"{user.first_name} {user.last_name} ({user.role.value})" if user else None,
            "class_group_found": f"{class_group.class_name} - {class_group.group_name}" if class_group else None
        }
    except Exception as e:
        return {"status": "error", "details": str(e)}

@app.get("/test-schemas", response_model=dict)
def test_schemas(db: Session = Depends(get_db)):
    try:
        user = db.query(User).first()
        class_group = db.query(ClassGroup).first()
        
        user_data = UserResponse.model_validate(user) if user else None
        group_data = ClassGroupResponse.model_validate(class_group) if class_group else None
        
        return {
            "status": "success",
            "validated_user": user_data,
            "validated_group": group_data
        }
    except Exception as e:
        return {"status": "error", "details": str(e)}

# -----------------------------
# AUTHENTICATION ROUTE
# -----------------------------
@app.post("/api/auth/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # 1. Database se user query karein by username
    user = db.query(User).filter(User.username == credentials.username).first()
    
    # 2. Verify karein ke user exist karta hai aur active hai
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or account is inactive"
        )
    
    # 3. Password match verification
    is_valid = False
    if user.password_hash.startswith("$2b$"):
        is_valid = verify_password(credentials.password, user.password_hash)
    else:
        is_valid = (credentials.password == user.password_hash)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # 4. JWT Access Token generate karein
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value, "user_id": user.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": f"{user.first_name} {user.last_name}",
        "class_group_id": user.class_group_id
    }