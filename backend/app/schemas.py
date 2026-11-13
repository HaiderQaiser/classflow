from pydantic import BaseModel
from datetime import date, time, datetime
from typing import List, Optional
from app.models import UserRole, ScheduleStatus

class UserBase(BaseModel):
    username: str
    first_name: str
    last_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str
    class_group_id: Optional[int] = None
    is_active: bool = True  # Added to prevent AttributeError during registration

class UserResponse(UserBase):
    id: int
    is_active: bool
    class_group_id: Optional[int] = None

    class Config:
        from_attributes = True

class ClassGroupBase(BaseModel):
    class_name: str
    group_name: str

class ClassGroupCreate(ClassGroupBase):
    pass

class ClassGroupResponse(ClassGroupBase):
    id: int
    created_at: Optional[datetime] = None  # Optional to handle missing attributes safely

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class ScheduleSlotBase(BaseModel):
    subject: str
    start_time: time
    end_time: time
    teacher_name: str
    is_cancelled: bool = False

class ScheduleSlotCreate(ScheduleSlotBase):
    pass

class ScheduleSlotResponse(ScheduleSlotBase):
    id: int

    class Config:
        from_attributes = True

class ScheduleBase(BaseModel):
    class_group_id: int
    schedule_date: date
    status: ScheduleStatus = ScheduleStatus.published

class ScheduleCreate(ScheduleBase):
    slots: List[ScheduleSlotCreate]

class ScheduleResponse(ScheduleBase):
    id: int
    slots: List[ScheduleSlotResponse] = []

    class Config:
        from_attributes = True

class HolidayCreate(BaseModel):
    holiday_date: date
    reason: str

class HolidayResponse(HolidayCreate):
    id: int

    class Config:
        from_attributes = True

class ScheduleRevisionResponse(BaseModel):
    id: int
    schedule_id: int
    revision_number: int
    slots_snapshot: str
    created_at: datetime

    class Config:
        from_attributes = True