from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from . import Base

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    contracts = relationship("ContractDB", back_populates="creator")
    documents = relationship("DocumentDB", back_populates="uploader")
    notifications = relationship("NotificationDB", back_populates="user")

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None