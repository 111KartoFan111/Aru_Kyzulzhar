"""
Script to create sample data for testing
Run with: python scripts/create_sample_data.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from models import get_db, Base, engine
from models.user import UserDB
from models.contract import ContractDB
from models.document import DocumentDB
from models.notification import NotificationDB
from passlib.context import CryptContext
from datetime import date, datetime, timedelta
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_sample_data():
    """Create sample data for testing"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    
    try:
        # Create sample users
        users_data = [
            {
                "email": "admin@kyzylzhar.kz",
                "hashed_password": pwd_context.hash("admin123"),
                "full_name": "Администратор Системы",
                "role": "admin"
            },
            {
                "email": "manager@kyzylzhar.kz", 
                "hashed_password": pwd_context.hash("manager123"),
                "full_name": "Менеджер по Аренде",
                "role": "manager"
            },
            {
                "email": "user@kyzylzhar.kz",
                "hashed_password": pwd_context.hash("user123"),
                "full_name": "Пользователь",
                "role": "user"
            }
        ]
        
        users = []
        for user_data in users_data:
            existing_user = db.query(UserDB).filter(UserDB.email == user_data["email"]).first()
            if not existing_user:
                user = UserDB(**user_data)
                db.add(user)
                users.append(user)
        
        db.commit()
        
        if not users:
            users = db.query(UserDB).all()
        
        # Create sample contracts
        contracts_data = [
            {
                "contract_number": "KZH-2024-01-001",
                "client_name": "Айгерим Касымова",
                "client_phone": "+7 777 123 4567",
                "client_email": "aigerim@example.com",
                "property_address": "г. Алматы, ул. Абая, 45, кв. 12",
                "property_type": "квартира",
                "rental_amount": 180000.00,
                "deposit_amount": 180000.00,
                "start_date": date(2024, 1, 1),
                "end_date": date(2024, 12, 31),
                "status": "active",
                "created_by": users[0].id
            },
            {
                "contract_number": "KZH-2024-01-002", 
                "client_name": "Серик Жаксылыков",
                "client_phone": "+7 777 234 5678",
                "client_email": "serik@example.com",
                "property_address": "г. Алматы, ул. Толе би, 23, офис 301",
                "property_type": "офис",
                "rental_amount": 350000.00,
                "deposit_amount": 350000.00,
                "start_date": date(2024, 2, 1),
                "end_date": date(2025, 1, 31),
                "status": "active",
                "created_by": users[0].id
            },
            {
                "contract_number": "KZH-2024-01-003",
                "client_name": "Гульнара Оспанова", 
                "client_phone": "+7 777 345 6789",
                "client_email": "gulnara@example.com",
                "property_address": "г. Алматы, ул. Назарбаева, 67, помещение 1",
                "property_type": "торговое помещение",
                "rental_amount": 450000.00,
                "deposit_amount": 450000.00,
                "start_date": date(2024, 6, 1),
                "end_date": date(2024, 11, 30),  # Expires soon
                "status": "active",
                "created_by": users[1].id
            }
        ]
        
        contracts = []
        for contract_data in contracts_data:
            existing_contract = db.query(ContractDB).filter(ContractDB.contract_number == contract_data["contract_number"]).first()
            if not existing_contract:
                contract = ContractDB(**contract_data)
                db.add(contract)
                contracts.append(contract)
        
        db.commit()
        
        if not contracts:
            contracts = db.query(ContractDB).all()
        
        # Create sample documents
        documents_data = [
            {
                "title": "Паспорт клиента - Айгерим Касымова",
                "description": "Скан паспорта для договора аренды",
                "file_path": "/uploads/documents/passport_aigerim.pdf",
                "file_type": "application/pdf",
                "file_size": 2048576,
                "contract_id": contracts[0].id if contracts else 1,
                "uploaded_by": users[0].id,
                "tags": ["паспорт", "документы клиента"],
                "expiry_date": date(2025, 6, 15)
            },
            {
                "title": "Справка о доходах - Серик Жаксылыков",
                "description": "Справка с места работы о доходах",
                "file_path": "/uploads/documents/income_serik.pdf", 
                "file_type": "application/pdf",
                "file_size": 1024768,
                "contract_id": contracts[1].id if len(contracts) > 1 else 1,
                "uploaded_by": users[1].id,
                "tags": ["справка", "доходы"],
                "expiry_date": date(2024, 12, 31)
            },
            {
                "title": "План помещения",
                "description": "Планировка торгового помещения",
                "file_path": "/uploads/documents/floor_plan.jpg",
                "file_type": "image/jpeg", 
                "file_size": 5242880,
                "contract_id": contracts[2].id if len(contracts) > 2 else 1,
                "uploaded_by": users[0].id,
                "tags": ["план", "помещение"],
                "expiry_date": None
            }
        ]
        
        for doc_data in documents_data:
            existing_doc = db.query(DocumentDB).filter(DocumentDB.title == doc_data["title"]).first()
            if not existing_doc:
                document = DocumentDB(**doc_data)
                db.add(document)
        
        db.commit()
        
        # Create sample notifications
        notifications_data = [
            {
                "user_id": users[0].id,
                "title": "Скоро истекает договор",
                "message": "Договор KZH-2024-01-003 с клиентом Гульнара Оспанова истекает через 30 дней",
                "type": "contract_expiry",
                "is_read": False,
                "related_contract_id": contracts[2].id if len(contracts) > 2 else None
            },
            {
                "user_id": users[1].id,
                "title": "Загружен новый документ",
                "message": "Пользователь добавил новый документ: План помещения",
                "type": "document_upload", 
                "is_read": False
            },
            {
                "user_id": users[0].id,
                "title": "Напоминание об оплате",
                "message": "Напоминаем об оплате аренды по договору KZH-2024-01-001",
                "type": "payment_due",
                "is_read": True,
                "related_contract_id": contracts[0].id if contracts else None
            }
        ]
        
        for notif_data in notifications_data:
            notification = NotificationDB(**notif_data)
            db.add(notification)
        
        db.commit()
        
        print("✅ Sample data created successfully!")
        print(f"Created {len(users_data)} users")
        print(f"Created {len(contracts_data)} contracts")
        print(f"Created {len(documents_data)} documents") 
        print(f"Created {len(notifications_data)} notifications")
        
        print("\nSample login credentials:")
        print("Admin: admin@kyzylzhar.kz / admin123")
        print("Manager: manager@kyzylzhar.kz / manager123") 
        print("User: user@kyzylzhar.kz / user123")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()
