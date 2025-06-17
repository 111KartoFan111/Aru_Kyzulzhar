"""
Simple API test script to verify backend functionality
Run with: python api_tests.py
"""
import requests
import json
from datetime import date, datetime

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test health check endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    print("✓ Health check passed")

def test_user_registration_and_login():
    """Test user registration and login"""
    # Register user
    user_data = {
        "email": "test@kyzylzhar.kz",
        "password": "testpassword123",
        "full_name": "Test User",
        "role": "admin"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
    if response.status_code == 400:
        print("ℹ User already exists, continuing with login test")
    else:
        assert response.status_code == 200
        print("✓ User registration passed")
    
    # Login
    login_data = {
        "username": user_data["email"],
        "password": user_data["password"]
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/token", data=login_data)
    assert response.status_code == 200
    
    token_data = response.json()
    access_token = token_data["access_token"]
    print("✓ User login passed")
    
    return access_token

def test_contract_creation(token):
    """Test contract creation"""
    headers = {"Authorization": f"Bearer {token}"}
    
    contract_data = {
        "client_name": "Иван Иванов",
        "client_phone": "+7 777 123 4567",
        "client_email": "ivan@example.com",
        "property_address": "г. Алматы, ул. Абая, 100, кв. 25",
        "property_type": "квартира",
        "rental_amount": 150000.00,
        "deposit_amount": 150000.00,
        "start_date": "2024-01-01",
        "end_date": "2024-12-31"
    }
    
    response = requests.post(f"{BASE_URL}/api/contracts/", json=contract_data, headers=headers)
    assert response.status_code == 200
    
    contract = response.json()
    print(f"✓ Contract creation passed. Contract number: {contract['contract_number']}")
    
    return contract["id"]

def test_contract_list(token):
    """Test contract listing"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/contracts/", headers=headers)
    assert response.status_code == 200
    
    contracts = response.json()
    print(f"✓ Contract listing passed. Found {len(contracts)} contracts")

def test_notifications(token):
    """Test notifications"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/notifications/", headers=headers)
    assert response.status_code == 200
    
    notifications = response.json()
    print(f"✓ Notifications listing passed. Found {len(notifications)} notifications")

def run_all_tests():
    """Run all API tests"""
    print("Starting API tests...\n")
    
    try:
        test_health_check()
        token = test_user_registration_and_login()
        contract_id = test_contract_creation(token)
        test_contract_list(token)
        test_notifications(token)
        
        print("\n🎉 All tests passed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()