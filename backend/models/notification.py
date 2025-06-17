from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from . import Base

class NotificationDB(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")
    is_read = Column(Boolean, default=False)
    related_contract_id = Column(Integer, ForeignKey("contracts.id"))
    related_document_id = Column(Integer, ForeignKey("documents.id"))
    scheduled_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("UserDB", back_populates="notifications")
    contract = relationship("ContractDB", back_populates="notifications")
    document = relationship("DocumentDB", back_populates="notifications")

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"
    related_contract_id: Optional[int] = None
    related_document_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True