from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserCreate, UserResponse
from app.auth import get_password_hash
from app.dependencies import require_admin, get_current_user

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

# 1. Get all students (Admin Only)
@router.get("/students", response_model=List[UserResponse])
def get_all_students(
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    return db.query(User).filter(User.role == UserRole.student).all()

# 2. Create a new Student account (Admin Only)
@router.post("/students", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    # Check if username/roll number already exists
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username/Roll number '{user_data.username}' already exists."
        )
    
    hashed_pwd = get_password_hash(user_data.password)
    
    new_student = User(
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        password_hash=hashed_pwd,
        role=UserRole.student,
        class_group_id=user_data.class_group_id,
        is_active=user_data.is_active
    )
    
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student