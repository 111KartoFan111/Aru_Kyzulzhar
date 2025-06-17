import os
import uuid
import mimetypes
from typing import List, Optional
from fastapi import UploadFile, HTTPException

class FileHandler:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.allowed_extensions = {
            '.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif',
            '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'
        }
        os.makedirs(upload_dir, exist_ok=True)

    def validate_file(self, file: UploadFile) -> bool:
        """Validate uploaded file"""
        # Check file size
        if file.size > self.max_file_size:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds maximum allowed size of {self.max_file_size // (1024*1024)}MB"
            )
        
        # Check file extension
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in self.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {', '.join(self.allowed_extensions)}"
            )
        
        return True

    def generate_unique_filename(self, original_filename: str) -> str:
        """Generate unique filename while preserving extension"""
        file_extension = os.path.splitext(original_filename)[1]
        unique_name = f"{uuid.uuid4().hex}{file_extension}"
        return unique_name

    def get_file_info(self, file: UploadFile) -> dict:
        """Get file information"""
        mime_type, _ = mimetypes.guess_type(file.filename)
        return {
            'filename': file.filename,
            'content_type': file.content_type or mime_type,
            'size': file.size
        }