import os
import shutil
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, date

from models.document import DocumentDB, DocumentCreate

class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.upload_dir = "uploads/documents"
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_uploaded_file(self, file, filename: str = None) -> str:
        """Save uploaded file and return file path"""
        if not filename:
            file_extension = os.path.splitext(file.filename)[1]
            filename = f"{uuid.uuid4().hex}{file_extension}"
        
        file_path = os.path.join(self.upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return file_path

    def create_document(self, document_data: DocumentCreate, file_path: str, 
                       file_size: int, uploaded_by: int) -> DocumentDB:
        """Create document record in database"""
        db_document = DocumentDB(
            **document_data.dict(),
            file_path=file_path,
            file_size=file_size,
            uploaded_by=uploaded_by
        )
        
        self.db.add(db_document)
        self.db.commit()
        self.db.refresh(db_document)
        
        return db_document

    def search_documents(self, query: str, tags: List[str] = None, 
                        contract_id: int = None) -> List[DocumentDB]:
        """Search documents by title, description, and tags"""
        db_query = self.db.query(DocumentDB)
        
        if query:
            db_query = db_query.filter(
                DocumentDB.title.ilike(f"%{query}%") |
                DocumentDB.description.ilike(f"%{query}%")
            )
        
        if tags:
            for tag in tags:
                db_query = db_query.filter(DocumentDB.tags.contains([tag]))
        
        if contract_id:
            db_query = db_query.filter(DocumentDB.contract_id == contract_id)
        
        return db_query.all()

    def get_documents_expiring_soon(self, days_ahead: int = 30) -> List[DocumentDB]:
        """Get documents that will expire soon"""
        expiry_threshold = date.today() + timedelta(days=days_ahead)
        
        return self.db.query(DocumentDB).filter(
            DocumentDB.expiry_date <= expiry_threshold,
            DocumentDB.expiry_date >= date.today()
        ).all()

    def delete_document(self, document_id: int) -> bool:
        """Delete document and its file"""
        document = self.db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
        
        if not document:
            return False
        
        # Delete file from filesystem
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete from database
        self.db.delete(document)
        self.db.commit()
        
        return True

    def get_document_statistics(self) -> dict:
        """Get document statistics"""
        total_documents = self.db.query(DocumentDB).count()
        
        documents_by_type = self.db.query(
            DocumentDB.file_type,
            func.count(DocumentDB.id)
        ).group_by(DocumentDB.file_type).all()
        
        expiring_soon = len(self.get_documents_expiring_soon())
        
        return {
            "total_documents": total_documents,
            "documents_by_type": dict(documents_by_type),
            "expiring_soon": expiring_soon
        }