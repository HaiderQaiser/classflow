from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models import Schedule, ScheduleSlot, Holiday, UserRole, User
from app.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/api/schedules", tags=["Schedules & Holidays"])

# --- Helper Function for Safe Role Check ---
def is_admin(user: User) -> bool:
    role_str = str(getattr(user.role, "value", user.role)).lower()
    return role_str == "admin"

# --- Schemas ---
class SlotCreate(BaseModel):
    subject: str
    start_time: str
    end_time: str
    teacher_name: str
    is_cancelled: bool = False

class ScheduleCreate(BaseModel):
    class_group_id: int
    schedule_date: date
    status: str = "published"
    slots: List[SlotCreate]

class HolidayCreate(BaseModel):
    holiday_date: date
    reason: str

# --- Endpoints ---

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_or_update_schedule(
    payload: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admins can publish schedules")

    existing_schedule = db.query(Schedule).filter(
        Schedule.class_group_id == payload.class_group_id,
        Schedule.schedule_date == payload.schedule_date
    ).first()

    if existing_schedule:
        db.query(ScheduleSlot).filter(ScheduleSlot.schedule_id == existing_schedule.id).delete()
        existing_schedule.status = payload.status
        schedule_obj = existing_schedule
    else:
        schedule_obj = Schedule(
            class_group_id=payload.class_group_id,
            schedule_date=payload.schedule_date,
            status=payload.status
        )
        db.add(schedule_obj)
        db.flush()

    for slot_data in payload.slots:
        new_slot = ScheduleSlot(
            schedule_id=schedule_obj.id,
            subject=slot_data.subject,
            start_time=slot_data.start_time,
            end_time=slot_data.end_time,
            teacher_name=slot_data.teacher_name,
            is_cancelled=slot_data.is_cancelled
        )
        db.add(new_slot)

    db.commit()
    db.refresh(schedule_obj)
    return {"message": "Schedule published successfully", "schedule_id": schedule_obj.id}

@router.get("/today")
def get_today_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()

    holiday = db.query(Holiday).filter(Holiday.holiday_date == today).first()
    if holiday:
        return {
            "is_holiday": True,
            "reason": holiday.reason,
            "schedule": None
        }

    if not current_user.class_group_id:
        return {
            "is_holiday": False,
            "message": "No class group assigned to this student",
            "schedule": None
        }

    schedule = db.query(Schedule).filter(
        Schedule.class_group_id == current_user.class_group_id,
        Schedule.schedule_date == today,
        Schedule.status == "published"
    ).first()

    if not schedule:
        return {
            "is_holiday": False,
            "message": "Today's schedule has not been published yet",
            "schedule": None
        }

    return {
        "is_holiday": False,
        "schedule": {
            "id": schedule.id,
            "schedule_date": str(schedule.schedule_date),
            "status": schedule.status,
            "slots": [
                {
                    "id": slot.id,
                    "subject": slot.subject,
                    "start_time": str(slot.start_time),
                    "end_time": str(slot.end_time),
                    "teacher_name": slot.teacher_name,
                    "is_cancelled": slot.is_cancelled
                }
                for slot in schedule.slots
            ]
        }
    }

@router.get("/group/{class_group_id}")
def get_schedule_by_group_and_date(
    class_group_id: int,
    schedule_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admins can view group schedules")

    target_date = schedule_date or date.today()
    schedule = db.query(Schedule).filter(
        Schedule.class_group_id == class_group_id,
        Schedule.schedule_date == target_date
    ).first()

    if not schedule:
        return {"schedule": None}

    return {
        "schedule": {
            "id": schedule.id,
            "schedule_date": str(schedule.schedule_date),
            "status": schedule.status,
            "slots": [
                {
                    "id": slot.id,
                    "subject": slot.subject,
                    "start_time": str(slot.start_time),
                    "end_time": str(slot.end_time),
                    "teacher_name": slot.teacher_name,
                    "is_cancelled": slot.is_cancelled
                }
                for slot in schedule.slots
            ]
        }
    }

@router.get("/holidays")
def list_holidays(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admins can view holidays")

    holidays = db.query(Holiday).order_by(Holiday.holiday_date.desc()).all()
    return holidays

@router.post("/holidays", status_code=status.HTTP_201_CREATED)
def declare_holiday(
    payload: HolidayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admins can declare holidays")

    existing_holiday = db.query(Holiday).filter(Holiday.holiday_date == payload.holiday_date).first()
    if existing_holiday:
        existing_holiday.reason = payload.reason
    else:
        new_holiday = Holiday(
            holiday_date=payload.holiday_date,
            reason=payload.reason
        )
        db.add(new_holiday)

    db.commit()
    return {"message": "Holiday declared successfully"}

@router.delete("/holidays/{holiday_date}")
def remove_holiday(
    holiday_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admins can remove holidays")

    holiday = db.query(Holiday).filter(Holiday.holiday_date == holiday_date).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    db.delete(holiday)
    db.commit()
    return {"message": "Holiday removed successfully"}

@router.put("/slots/{slot_id}/cancel")
def toggle_slot_cancellation(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admins can modify slots")

    slot = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    slot.is_cancelled = not slot.is_cancelled
    db.commit()
    db.refresh(slot)
    return {"message": "Slot status updated", "slot_id": slot.id, "is_cancelled": slot.is_cancelled}

@router.get("/previous/{class_group_id}")
def get_previous_schedule(
    class_group_id: int,
    before_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admins can view schedules")

    ref_date = before_date or date.today()

    # Selected date se pehle ka sab se recent schedule fetch karein
    schedule = db.query(Schedule).filter(
        Schedule.class_group_id == class_group_id,
        Schedule.schedule_date < ref_date
    ).order_by(Schedule.schedule_date.desc()).first()

    if not schedule:
        return {"schedule": None}

    return {
        "schedule": {
            "id": schedule.id,
            "schedule_date": str(schedule.schedule_date),
            "slots": [
                {
                    "subject": slot.subject,
                    "start_time": str(slot.start_time)[:5],
                    "end_time": str(slot.end_time)[:5],
                    "teacher_name": slot.teacher_name,
                    "is_cancelled": False
                }
                for slot in schedule.slots
            ]
        }
    }