from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
import os
import uuid

from models import get_db
from models.contract import ContractDB, ContractCreate, ContractUpdate, Contract
from models.user import UserDB
from routes.auth import get_current_user
from services.contract_generator import ContractGenerator

router = APIRouter()

@router.post("/", response_model=Contract)
def create_contract(
    contract: ContractCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Generate unique contract number
    contract_number = f"KZH-{datetime.now().year}-{datetime.now().month:02d}-{uuid.uuid4().hex[:6].upper()}"
    
    db_contract = ContractDB(
        contract_number=contract_number,
        created_by=current_user.id,
        **contract.dict()
    )
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    
    # Generate contract document
    generator = ContractGenerator()
    contract_path = generator.generate_contract(db_contract)
    
    # Update contract with file path
    db_contract.contract_file_path = contract_path
    db.commit()
    db.refresh(db_contract)
    
    return db_contract

@router.get("/", response_model=List[Contract])
def read_contracts(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    expiring_soon: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    query = db.query(ContractDB)
    
    if status:
        query = query.filter(ContractDB.status == status)
    
    if expiring_soon:
        # Contracts expiring in the next 30 days
        expiry_threshold = date.today() + timedelta(days=30)
        query = query.filter(ContractDB.end_date <= expiry_threshold)
    
    contracts = query.offset(skip).limit(limit).all()
    return contracts

@router.get("/{contract_id}", response_model=Contract)
def read_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    contract = db.query(ContractDB).filter(ContractDB.id == contract_id).first()
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

@router.put("/{contract_id}", response_model=Contract)
def update_contract(
    contract_id: int,
    contract_update: ContractUpdate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    contract = db.query(ContractDB).filter(ContractDB.id == contract_id).first()
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    update_data = contract_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contract, field, value)
    
    db.commit()
    db.refresh(contract)
    
    # Regenerate contract if necessary
    if any(field in update_data for field in ['client_name', 'property_address', 'rental_amount', 'start_date', 'end_date']):
        generator = ContractGenerator()
        contract_path = generator.generate_contract(contract)
        contract.contract_file_path = contract_path
        db.commit()
        db.refresh(contract)
    
    return contract

@router.delete("/{contract_id}")
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    contract = db.query(ContractDB).filter(ContractDB.id == contract_id).first()
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    db.delete(contract)
    db.commit()
    return {"message": "Contract deleted successfully"}

@router.get("/{contract_id}/download")
def download_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    contract = db.query(ContractDB).filter(ContractDB.id == contract_id).first()
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if not contract.contract_file_path or not os.path.exists(contract.contract_file_path):
        raise HTTPException(status_code=404, detail="Contract file not found")
    
    return FileResponse(
        path=contract.contract_file_path,
        filename=f"{contract.contract_number}.pdf",
        media_type="application/pdf"
    )
