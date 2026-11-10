from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from app.database import get_db
from app.models import User, UserRole

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "classflow_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Authorization Header se token extract karne ke liye helper
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """JWT Token ko decode karke logged-in user details fetch karta hai"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None or not user.is_active:
        raise credentials_exception
        
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Enforces that only users with 'admin' role can access the endpoint"""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation permitted for Admin users only"
        )
    return current_user