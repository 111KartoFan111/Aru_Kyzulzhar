from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from . import Base

class ContractDB(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String, unique=True, index=True, nullable=False)
    client_name = Column(String, nullable=False)
    client_phone = Column(String)
    client_email = Column(String)
    property_address = Column(String, nullable=False)
    property_type = Column(String, nullable=False)
    rental_amount = Column(Numeric(10, 2), nullable=False)
    deposit_amount = Column(Numeric(10, 2), default=0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default="draft")
    contract_file_path = Column(String)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("UserDB", back_populates="contracts")
    documents = relationship("DocumentDB", back_populates="contract")

class ContractBase(BaseModel):
    client_name: str
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    property_address: str
    property_type: str
    rental_amount: Decimal
    deposit_amount: Decimal = Decimal('0')
    start_date: date
    end_date: date

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    property_address: Optional[str] = None
    property_type: Optional[str] = None
    rental_amount: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class Contract(ContractBase):
    id: int
    contract_number: str
    status: str
    contract_file_path: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True