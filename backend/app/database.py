import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# .env file se variables load karein
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL .env file mein set nahi hai!")

# SQLAlchemy Database Engine initialize karein
engine = create_engine(DATABASE_URL)

# Database sessions manage karne ke liye SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base Class - future DB models (tables) is se inherit honge
Base = declarative_base()

# Dependency: Har API request ke liye DB session open karega aur request khatam hote hi close karega
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()