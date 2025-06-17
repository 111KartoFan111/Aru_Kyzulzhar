"""
Database backup script
Run with: python scripts/backup_database.py
"""
import os
import subprocess
import datetime
from pathlib import Path

def backup_database():
    """Create database backup"""
    
    # Database connection details
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "document_management")
    db_user = os.getenv("DB_USER", "user")
    db_password = os.getenv("DB_PASSWORD", "password")
    
    # Create backup directory
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    
    # Generate backup filename with timestamp
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"backup_{db_name}_{timestamp}.sql"
    backup_path = backup_dir / backup_filename
    
    # Set password environment variable for pg_dump
    env = os.environ.copy()
    env["PGPASSWORD"] = db_password
    
    # Run pg_dump command
    cmd = [
        "pg_dump",
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name,
        "-f", str(backup_path),
        "--verbose"
    ]
    
    try:
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Database backup created successfully: {backup_path}")
            print(f"Backup size: {backup_path.stat().st_size / 1024 / 1024:.2f} MB")
        else:
            print(f"❌ Backup failed: {result.stderr}")
            
    except FileNotFoundError:
        print("❌ pg_dump not found. Make sure PostgreSQL client tools are installed.")
    except Exception as e:
        print(f"❌ Backup failed: {e}")

def restore_database(backup_file):
    """Restore database from backup file"""
    
    # Database connection details
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432") 
    db_name = os.getenv("DB_NAME", "document_management")
    db_user = os.getenv("DB_USER", "user")
    db_password = os.getenv("DB_PASSWORD", "password")
    
    # Set password environment variable
    env = os.environ.copy()
    env["PGPASSWORD"] = db_password
    
    # Run psql command to restore
    cmd = [
        "psql",
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name,
        "-f", backup_file
    ]
    
    try:
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Database restored successfully from: {backup_file}")
        else:
            print(f"❌ Restore failed: {result.stderr}")
            
    except Exception as e:
        print(f"❌ Restore failed: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        if len(sys.argv) > 2:
            restore_database(sys.argv[2])
        else:
            print("Usage: python backup_database.py restore <backup_file>")
    else:
        backup_database()