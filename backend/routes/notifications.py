from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from models import get_db
from models.notification import NotificationDB, NotificationCreate, NotificationUpdate, Notification
from models.user import UserDB
from routes.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=Notification)
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    db_notification = NotificationDB(**notification.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

@router.get("/", response_model=List[Notification])
def read_notifications(
    skip: int = 0,
    limit: int = 100,
    unread_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    query = db.query(NotificationDB).filter(NotificationDB.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(NotificationDB.is_read == False)
    
    notifications = query.order_by(NotificationDB.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.get("/{notification_id}", response_model=Notification)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    notification = db.query(NotificationDB).filter(
        NotificationDB.id == notification_id,
        NotificationDB.user_id == current_user.id
    ).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.put("/{notification_id}", response_model=Notification)
def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    notification = db.query(NotificationDB).filter(
        NotificationDB.id == notification_id,
        NotificationDB.user_id == current_user.id
    ).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    update_data = notification_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(notification, field, value)
    
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    db.query(NotificationDB).filter(
        NotificationDB.user_id == current_user.id,
        NotificationDB.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    notification = db.query(NotificationDB).filter(
        NotificationDB.id == notification_id,
        NotificationDB.user_id == current_user.id
    ).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted successfully"}