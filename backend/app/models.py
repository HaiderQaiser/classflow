from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Time, ForeignKey, Enum, CheckConstraint, UniqueConstraint, func
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    admin = "admin"
    student = "student"

class ScheduleStatus(str, enum.Enum):
    draft = "draft"
    published = "published"

class ClassGroup(Base):
    __tablename__ = "class_groups"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(50), nullable=False)
    group_name = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint('class_name', 'group_name', name='uq_class_group'),
    )

    users = relationship("User", back_populates="class_group")
    schedules = relationship("Schedule", back_populates="class_group")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(60), nullable=False)
    last_name = Column(String(60), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False)
    class_group_id = Column(Integer, ForeignKey("class_groups.id", ondelete="RESTRICT"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())

    class_group = relationship("ClassGroup", back_populates="users")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    class_group_id = Column(Integer, ForeignKey("class_groups.id", ondelete="RESTRICT"), nullable=False)
    schedule_date = Column(Date, nullable=False)
    status = Column(Enum(ScheduleStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=ScheduleStatus.draft)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('class_group_id', 'schedule_date', 'status', name='uq_schedule_per_status'),
    )

    class_group = relationship("ClassGroup", back_populates="schedules")
    slots = relationship("ScheduleSlot", back_populates="schedule", cascade="all, delete-orphan")

class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    teacher_name = Column(String(100), nullable=True)
    is_cancelled = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        CheckConstraint('end_time > start_time', name='chk_slot_time'),
    )

    schedule = relationship("Schedule", back_populates="slots")

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    holiday_date = Column(Date, unique=True, nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())