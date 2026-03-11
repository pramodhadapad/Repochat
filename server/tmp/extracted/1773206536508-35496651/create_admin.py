from app import app, get_db
from werkzeug.security import generate_password_hash
from datetime import datetime

def create_admin():
    with app.app_context():
        db = get_db()
        username = 'admin'
        password = 'admin123'
        email = 'admin@servenow.com'
        
        # Check if exists
        existing = db.users.find_one({'username': username})
        
        admin_data = {
            'username': username,
            'password': generate_password_hash(password),
            'email': email,
            'role': 'admin',
            'full_name': 'System Administrator',
            'phone': '0000000000',
            'created_at': datetime.utcnow()
        }
        
        if existing:
            db.users.update_one({'_id': existing['_id']}, {'$set': admin_data})
            print(f"Admin user '{username}' updated. Password reset to '{password}'.")
        else:
            db.users.insert_one(admin_data)
            print(f"Admin user '{username}' created with password '{password}'.")

if __name__ == "__main__":
    create_admin()
