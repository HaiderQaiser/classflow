from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime  # <--- datetime import zaroori hai
from app.models import UserRole, ScheduleStatus

# CLASS GROUP SCHEMAS
class ClassGroupBase(BaseModel):
    class_name: str
    group_name: str

class ClassGroupCreate(ClassGroupBase):
    pass

class ClassGroupResponse(ClassGroupBase):
    id: int
    created_at: datetime  # <--- datetime

    class Config:
        from_attributes = True

# USER SCHEMAS
class UserBase(BaseModel):
    username: str
    first_name: str
    last_name: str
    role: UserRole
    class_group_id: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime  # <--- datetime

    class Config:
        from_attributes = True

# SCHEDULE SLOT SCHEMAS
class ScheduleSlotBase(BaseModel):
    subject: str
    start_time: time
    end_time: time
    teacher_name: Optional[str] = None
    is_cancelled: bool = False

class ScheduleSlotCreate(ScheduleSlotBase):
    pass

class ScheduleSlotResponse(ScheduleSlotBase):
    id: int
    schedule_id: int

    class Config:
        from_attributes = True

# SCHEDULE HEADER SCHEMAS
class ScheduleBase(BaseModel):
    class_group_id: int
    schedule_date: date
    status: ScheduleStatus = ScheduleStatus.draft

class ScheduleCreate(ScheduleBase):
    slots: List[ScheduleSlotCreate]

class ScheduleResponse(ScheduleBase):
    id: int
    updated_at: datetime  # <--- datetime
    slots: List[ScheduleSlotResponse] = []

    class Config:
        from_attributes = True

# HOLIDAY SCHEMAS
class HolidayBase(BaseModel):
    holiday_date: date
    reason: Optional[str] = None

class HolidayCreate(HolidayBase):
    pass

class HolidayResponse(HolidayBase):
    id: int
    created_at: datetime  # <--- datetime

    class Config:
        from_attributes = True