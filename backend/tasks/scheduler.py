import asyncio
import schedule
import time
from datetime import datetime
from sqlalchemy.orm import Session
from models import get_db
from services.notification_service import NotificationService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TaskScheduler:
    def __init__(self):
        self.is_running = False

    def setup_jobs(self):
        """Setup scheduled jobs"""
        # Check for expiring contracts daily at 9 AM
        schedule.every().day.at("09:00").do(self.check_contract_expiry)
        
        # Check for expiring documents daily at 9:15 AM
        schedule.every().day.at("09:15").do(self.check_document_expiry)
        
        # Send payment reminders monthly on the 5th at 10 AM
        schedule.every().month.do(self.send_payment_reminders)
        
        # Cleanup old notifications weekly on Sunday at 2 AM
        schedule.every().sunday.at("02:00").do(self.cleanup_notifications)
        
        logger.info("Scheduled jobs configured")

    def check_contract_expiry(self):
        """Check for contracts expiring soon"""
        try:
            db = next(get_db())
            notification_service = NotificationService(db)
            
            # Check for contracts expiring in 30, 7, and 1 days
            for days in [30, 7, 1]:
                count = notification_service.notify_contract_expiry(days)
                logger.info(f"Created {count} notifications for contracts expiring in {days} days")
            
            db.close()
        except Exception as e:
            logger.error(f"Error checking contract expiry: {e}")

    def check_document_expiry(self):
        """Check for documents expiring soon"""
        try:
            db = next(get_db())
            notification_service = NotificationService(db)
            
            # Check for documents expiring in 30, 7, and 1 days
            for days in [30, 7, 1]:
                count = notification_service.notify_document_expiry(days)
                logger.info(f"Created {count} notifications for documents expiring in {days} days")
            
            db.close()
        except Exception as e:
            logger.error(f"Error checking document expiry: {e}")

    def send_payment_reminders(self):
        """Send payment reminder notifications"""
        try:
            db = next(get_db())
            notification_service = NotificationService(db)
            
            count = notification_service.notify_payment_due()
            logger.info(f"Created {count} payment reminder notifications")
            
            db.close()
        except Exception as e:
            logger.error(f"Error sending payment reminders: {e}")

    def cleanup_notifications(self):
        """Clean up old notifications"""
        try:
            db = next(get_db())
            notification_service = NotificationService(db)
            
            count = notification_service.cleanup_old_notifications(90)
            logger.info(f"Cleaned up {count} old notifications")
            
            db.close()
        except Exception as e:
            logger.error(f"Error cleaning up notifications: {e}")

    def run_scheduler(self):
        """Run the scheduler"""
        self.is_running = True
        logger.info("Task scheduler started")
        
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

    def stop_scheduler(self):
        """Stop the scheduler"""
        self.is_running = False
        logger.info("Task scheduler stopped")