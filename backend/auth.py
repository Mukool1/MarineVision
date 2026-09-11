"""Password and role helpers. Keep all secrets in environment variables."""
import os
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import database as db

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-development-secret-before-deployment")
ALGORITHM = "HS256"
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
def hash_password(password): return password_context.hash(password)
def verify_password(password, password_hash): return password_context.verify(password, password_hash)
def create_token(user):
    expires = datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480")))
    return jwt.encode({"sub": str(user.id), "role": user.role, "exp": expires}, SECRET_KEY, algorithm=ALGORITHM)
def current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(db.get_db)):
    try: user_id = int(jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]).get("sub"))
    except (JWTError, TypeError, ValueError): raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    user = session.get(db.User, user_id)
    if not user: raise HTTPException(status_code=401, detail="User account not found")
    return user
def admin_user(user = Depends(current_user)):
    if user.role != "admin": raise HTTPException(status_code=403, detail="Administrator access required")
    return user
