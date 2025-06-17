"""
Run background scheduler for automated tasks
Run with: python scripts/run_scheduler.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tasks.scheduler import TaskScheduler
import signal
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    print("\nShutting down scheduler...")
    scheduler.stop_scheduler()
    sys.exit(0)

if __name__ == "__main__":
    scheduler = TaskScheduler()
    
    # Setup signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Setup and run scheduler
    scheduler.setup_jobs()
    
    try:
        scheduler.run_scheduler()
    except KeyboardInterrupt:
        print("\nScheduler stopped by user")
        scheduler.stop_scheduler()