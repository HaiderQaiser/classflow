from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Date, Time, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base

class UserRole(str, enum.Enum):
    admin = "admin"
    student = "student"

UserRole.ADMIN = UserRole.admin
UserRole.STUDENT = UserRole.student

class ScheduleStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    cancelled = "cancelled"
    holiday = "holiday"

ScheduleStatus.DRAFT = ScheduleStatus.draft
ScheduleStatus.PUBLISHED = ScheduleStatus.published
ScheduleStatus.CANCELLED = ScheduleStatus.cancelled
ScheduleStatus.HOLIDAY = ScheduleStatus.holiday

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    # MySQL column aur app/main.py dono 'password_hash' expect kar rahe hain
    password_hash = Column("password_hash", String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)

    class_group_id = Column(Integer, ForeignKey("class_groups.id"), nullable=True)
    class_group = relationship("ClassGroup", back_populates="students")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def hashed_password(self):
        return self.password_hash

class ClassGroup(Base):
    __tablename__ = "class_groups"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(50), nullable=False)
    group_name = Column(String(50), nullable=False)

    students = relationship("User", back_populates="class_group")
    schedules = relationship("Schedule", back_populates="class_group")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    class_group_id = Column(Integer, ForeignKey("class_groups.id"), nullable=False)
    schedule_date = Column(Date, nullable=False)
    status = Column(Enum(ScheduleStatus), default=ScheduleStatus.published, nullable=False)

    class_group = relationship("ClassGroup", back_populates="schedules")
    slots = relationship("ScheduleSlot", back_populates="schedule", cascade="all, delete-orphan")

class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    teacher_name = Column(String(100), nullable=False)
    is_cancelled = Column(Boolean, default=False)

    schedule = relationship("Schedule", back_populates="slots")

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    holiday_date = Column(Date, unique=True, nullable=False)
    reason = Column(String(255), nullable=False)

class ScheduleRevision(Base):
    __tablename__ = "schedule_revisions"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    revision_number = Column(Integer, nullable=False)
    slots_snapshot = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    schedule = relationship("Schedule", backref="revisions")