from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models import User, ClassGroup
from app.schemas import UserResponse, ClassGroupResponse, LoginRequest, TokenResponse
from app.auth import verify_password, create_access_token
from app.routers import class_groups, users, schedules

app = FastAPI(title="ClassFlow API", version="1.0.0")

# -----------------------------
# CORS MIDDLEWARE (Allow All Origins for Local Development)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Sub local origins allow kar rahe hain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers Include
app.include_router(class_groups.router)
app.include_router(users.router)
app.include_router(schedules.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to ClassFlow API!"}

@app.post("/api/auth/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or account is inactive"
        )
    
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