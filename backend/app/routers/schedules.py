from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import Schedule, ScheduleSlot, Holiday, ScheduleStatus, UserRole, User
from app.schemas import ScheduleCreate, ScheduleResponse, HolidayCreate, HolidayResponse
from app.dependencies import require_admin, get_current_user

router = APIRouter(
    prefix="/api/schedules",
    tags=["Schedules & Holidays"]
)

# 1. Get Today's Schedule (Student or Admin View)
@router.get("/today", response_model=dict)
def get_today_schedule(
    class_group_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    today = date.today()
    
    # Check 1: Pehle check karein kya aaj Holiday declared hai?
    holiday = db.query(Holiday).filter(Holiday.holiday_date == today).first()
    if holiday:
        return {
            "is_holiday": True,
            "reason": holiday.reason or "Tuition Center Closed",
            "schedule": None
        }
    
    # Student account ke liye class group auto-detect karein
    target_group = class_group_id
    if current_user.role == UserRole.student:
        target_group = current_user.class_group_id
        if not target_group:
            raise HTTPException(status_code=400, detail="Student is not assigned to any class group.")
    
    if not target_group:
        raise HTTPException(status_code=400, detail="Please specify class_group_id parameter.")

    # Query Schedule for Today
    query = db.query(Schedule).filter(
        Schedule.class_group_id == target_group,
        Schedule.schedule_date == today
    )
    
    # Student ko sirf 'published' schedule dikhana hai
    if current_user.role == UserRole.student:
        query = query.filter(Schedule.status == ScheduleStatus.published)
        
    schedule = query.first()
    
    if not schedule:
        return {
            "is_holiday": False,
            "reason": None,
            "schedule": None,
            "message": "No published schedule available for today."
        }

    schedule_data = ScheduleResponse.model_validate(schedule)
    return {
        "is_holiday": False,
        "reason": None,
        "schedule": schedule_data
    }

# 2. Create Schedule with Slots (Admin Only)
@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    # Duplicate check for group + date
    existing = db.query(Schedule).filter(
        Schedule.class_group_id == schedule_data.class_group_id,
        Schedule.schedule_date == schedule_data.schedule_date
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Schedule already exists for this group on date {schedule_data.schedule_date}."
        )

    # Schedule Header Save
    new_schedule = Schedule(
        class_group_id=schedule_data.class_group_id,
        schedule_date=schedule_data.schedule_date,
        status=schedule_data.status
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    # Schedule Slots Save
    for slot in schedule_data.slots:
        new_slot = ScheduleSlot(
            schedule_id=new_schedule.id,
            subject=slot.subject,
            start_time=slot.start_time,
            end_time=slot.end_time,
            teacher_name=slot.teacher_name,
            is_cancelled=slot.is_cancelled
        )
        db.add(new_slot)

    db.commit()
    db.refresh(new_schedule)
    return new_schedule

# 3. Create Center-Wide Holiday (Admin Only)
@router.post("/holidays", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
def create_holiday(
    holiday_data: HolidayCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    existing = db.query(Holiday).filter(Holiday.holiday_date == holiday_data.holiday_date).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Holiday already declared for {holiday_data.holiday_date}."
        )

    new_holiday = Holiday(
        holiday_date=holiday_data.holiday_date,
        reason=holiday_data.reason
    )
    db.add(new_holiday)
    db.commit()
    db.refresh(new_holiday)
    return new_holiday

@router.put("/slots/{slot_id}/cancel")
def toggle_slot_cancellation(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can modify slots")

    slot = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    slot.is_cancelled = not slot.is_cancelled
    db.commit()
    db.refresh(slot)
    return {"message": "Slot status updated", "slot_id": slot.id, "is_cancelled": slot.is_cancelled}