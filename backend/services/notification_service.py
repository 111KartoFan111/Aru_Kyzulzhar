from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import List
import asyncio
import logging

from models.notification import NotificationDB, NotificationCreate
from models.contract import ContractDB
from models.document import DocumentDB
from models.user import UserDB

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(self, notification: NotificationCreate) -> NotificationDB:
        """Create a new notification"""
        db_notification = NotificationDB(**notification.dict())
        self.db.add(db_notification)
        self.db.commit()
        self.db.refresh(db_notification)
        return db_notification

    def notify_contract_expiry(self, days_ahead: int = 30):
        """Notify about contracts expiring soon"""
        expiry_threshold = date.today() + timedelta(days=days_ahead)
        
        expiring_contracts = self.db.query(ContractDB).filter(
            ContractDB.end_date <= expiry_threshold,
            ContractDB.end_date >= date.today(),
            ContractDB.status.in_(['active', 'signed'])
        ).all()
        
        notifications_created = 0
        
        for contract in expiring_contracts:
            # Check if notification already exists
            existing_notification = self.db.query(NotificationDB).filter(
                NotificationDB.related_contract_id == contract.id,
                NotificationDB.type == 'contract_expiry',
                NotificationDB.created_at >= datetime.now() - timedelta(days=7)
            ).first()
            
            if not existing_notification:
                # Get all users (in real app, you might want to notify specific roles)
                users = self.db.query(UserDB).filter(UserDB.is_active == True).all()
                
                for user in users:
                    days_until_expiry = (contract.end_date - date.today()).days
                    
                    notification = NotificationCreate(
                        user_id=user.id,
                        title="Скоро истекает договор аренды",
                        message=f"Договор № {contract.contract_number} с клиентом {contract.client_name} "
                               f"истекает через {days_until_expiry} дней ({contract.end_date.strftime('%d.%m.%Y')})",
                        type="contract_expiry",
                        related_contract_id=contract.id
                    )
                    
                    self.create_notification(notification)
                    notifications_created += 1
        
        logger.info(f"Created {notifications_created} contract expiry notifications")
        return notifications_created

    def notify_document_expiry(self, days_ahead: int = 30):
        """Notify about documents expiring soon"""
        expiry_threshold = date.today() + timedelta(days=days_ahead)
        
        expiring_documents = self.db.query(DocumentDB).filter(
            DocumentDB.expiry_date <= expiry_threshold,
            DocumentDB.expiry_date >= date.today()
        ).all()
        
        notifications_created = 0
        
        for document in expiring_documents:
            # Check if notification already exists
            existing_notification = self.db.query(NotificationDB).filter(
                NotificationDB.related_document_id == document.id,
                NotificationDB.type == 'document_expiry',
                NotificationDB.created_at >= datetime.now() - timedelta(days=7)
            ).first()
            
            if not existing_notification:
                # Notify the uploader and admins
                users_to_notify = [document.uploader]
                admin_users = self.db.query(UserDB).filter(
                    UserDB.role == 'admin',
                    UserDB.is_active == True
                ).all()
                users_to_notify.extend(admin_users)
                
                for user in users_to_notify:
                    days_until_expiry = (document.expiry_date - date.today()).days
                    
                    notification = NotificationCreate(
                        user_id=user.id,
                        title="Скоро истекает срок действия документа",
                        message=f"Документ '{document.title}' истекает через {days_until_expiry} дней "
                               f"({document.expiry_date.strftime('%d.%m.%Y')})",
                        type="document_expiry",
                        related_document_id=document.id
                    )
                    
                    self.create_notification(notification)
                    notifications_created += 1
        
        logger.info(f"Created {notifications_created} document expiry notifications")
        return notifications_created

    def notify_payment_due(self):
        """Notify about upcoming rent payments"""
        # This would typically be called monthly or based on contract terms
        today = date.today()
        payment_due_date = date(today.year, today.month, 10)  # Assuming rent is due on 10th
        
        if today.day >= 5 and today.day <= 10:  # Notify 5 days before due date
            active_contracts = self.db.query(ContractDB).filter(
                ContractDB.status == 'active',
                ContractDB.start_date <= today,
                ContractDB.end_date >= today
            ).all()
            
            notifications_created = 0
            
            for contract in active_contracts:
                # Check if notification already sent this month
                existing_notification = self.db.query(NotificationDB).filter(
                    NotificationDB.related_contract_id == contract.id,
                    NotificationDB.type == 'payment_due',
                    NotificationDB.created_at >= datetime(today.year, today.month, 1)
                ).first()
                
                if not existing_notification:
                    users = self.db.query(UserDB).filter(UserDB.is_active == True).all()
                    
                    for user in users:
                        notification = NotificationCreate(
                            user_id=user.id,
                            title="Напоминание об оплате аренды",
                            message=f"Напоминаем об оплате аренды по договору № {contract.contract_number} "
                                   f"с клиентом {contract.client_name}. "
                                   f"Сумма: {contract.rental_amount} тенге. Срок оплаты: до 10 числа.",
                            type="payment_due",
                            related_contract_id=contract.id
                        )
                        
                        self.create_notification(notification)
                        notifications_created += 1
            
            logger.info(f"Created {notifications_created} payment due notifications")
            return notifications_created

    def send_custom_notification(self, user_ids: List[int], title: str, message: str, 
                                notification_type: str = "info", contract_id: int = None, 
                                document_id: int = None):
        """Send custom notification to specific users"""
        notifications_created = 0
        
        for user_id in user_ids:
            notification = NotificationCreate(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type,
                related_contract_id=contract_id,
                related_document_id=document_id
            )
            
            self.create_notification(notification)
            notifications_created += 1
        
        return notifications_created

    def cleanup_old_notifications(self, days_old: int = 90):
        """Remove old read notifications"""
        cutoff_date = datetime.now() - timedelta(days=days_old)
        
        deleted_count = self.db.query(NotificationDB).filter(
            NotificationDB.is_read == True,
            NotificationDB.created_at < cutoff_date
        ).delete()
        
        self.db.commit()
        logger.info(f"Cleaned up {deleted_count} old notifications")
        return deleted_count