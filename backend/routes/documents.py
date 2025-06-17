from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import shutil

from models import get_db
from models.document import DocumentDB, DocumentCreate, DocumentUpdate, Document
from models.user import UserDB
from routes.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=Document)
async def upload_document(
    file: UploadFile = File(...),
    title: str = None,
    description: str = None,
    contract_id: int = None,
    tags: str = None,
    expiry_date: str = None,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Parse tags
    tag_list = [tag.strip() for tag in tags.split(",")] if tags else []
    
    # Parse expiry date
    expiry_date_obj = None
    if expiry_date:
        try:
            expiry_date_obj = datetime.strptime(expiry_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry date format")
    
    db_document = DocumentDB(
        title=title or file.filename,
        description=description,
        file_path=file_path,
        file_type=file.content_type,
        file_size=file.size,
        contract_id=contract_id,
        uploaded_by=current_user.id,
        tags=tag_list,
        expiry_date=expiry_date_obj
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return db_document

@router.get("/", response_model=List[Document])
def read_documents(
    skip: int = 0,
    limit: int = 100,
    contract_id: Optional[int] = None,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    query = db.query(DocumentDB)
    
    if contract_id:
        query = query.filter(DocumentDB.contract_id == contract_id)
    
    if search:
        query = query.filter(DocumentDB.title.ilike(f"%{search}%"))
    
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
        for tag in tag_list:
            query = query.filter(DocumentDB.tags.contains([tag]))
    
    documents = query.offset(skip).limit(limit).all()
    return documents

@router.get("/{document_id}", response_model=Document)
def read_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    document = db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.put("/{document_id}", response_model=Document)
def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    document = db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = document_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(document, field, value)
    
    db.commit()
    db.refresh(document)
    return document

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    document = db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from filesystem
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    document = db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=document.file_path,
        filename=document.title,
        media_type=document.file_type
    )
