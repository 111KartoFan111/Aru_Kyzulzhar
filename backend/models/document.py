from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from . import Base

class DocumentDB(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer)
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    tags = Column(ARRAY(String))
    expiry_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    contract = relationship("ContractDB", back_populates="documents")
    uploader = relationship("UserDB", back_populates="documents")

class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_type: str
    contract_id: Optional[int] = None
    tags: Optional[List[str]] = []
    expiry_date: Optional[date] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    expiry_date: Optional[date] = None

class Document(DocumentBase):
    id: int
    file_path: str
    file_size: Optional[int] = None
    uploaded_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True