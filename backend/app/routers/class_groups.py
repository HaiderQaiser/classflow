from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import ClassGroup
from app.schemas import ClassGroupCreate, ClassGroupResponse
from app.dependencies import require_admin, get_current_user

router = APIRouter(
    prefix="/api/class-groups",
    tags=["Class Groups"]
)

# 1. Get all class groups (Logged-in Admin or Student can view)
@router.get("/", response_model=List[ClassGroupResponse])
def get_class_groups(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(ClassGroup).all()

# 2. Create new class group (Admin Only)
@router.post("/", response_model=ClassGroupResponse, status_code=status.HTTP_201_CREATED)
def create_class_group(
    group_data: ClassGroupCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    # Duplicate Check
    existing = db.query(ClassGroup).filter(
        ClassGroup.class_name == group_data.class_name,
        ClassGroup.group_name == group_data.group_name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Class Group '{group_data.class_name} - {group_data.group_name}' already exists."
        )
        
    new_group = ClassGroup(
        class_name=group_data.class_name,
        group_name=group_data.group_name
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group