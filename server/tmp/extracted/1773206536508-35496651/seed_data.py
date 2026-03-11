from app import app, get_db
from werkzeug.security import generate_password_hash
from datetime import datetime

def seed():
    with app.app_context():
        db = get_db()
        
        # 1. Clear existing data (optional, but good for reset)
        db.users.delete_many({})
        db.services.delete_many({})
        # db.bookings.delete_many({}) 
        # db.technicians.delete_many({})
        
        print("Cleared users and services collections.")

        # 2. Create Admin
        admin_pass = generate_password_hash('admin123')
        admin = {
            'username': 'admin',
            'email': 'admin@ahad.com',
            'password': admin_pass,
            'full_name': 'System Admin',
            'phone': '0000000000',
            'role': 'admin',
            'created_at': datetime.utcnow()
        }
        try:
            db.users.insert_one(admin)
            print("Admin user created (admin/admin123).")
        except Exception as e:
            print(f"Admin already exists or error: {e}")

        # 3. Create Services
        services = [
            {
                'service_name': 'AC Installation', 
                'description': 'Professional Air Conditioner installation service', 
                'price': 1500.00, 
                'image_url': 'ac_install.jpg',
                'created_at': datetime.utcnow()
            },
            {
                'service_name': 'AC Repair & Service', 
                'description': 'Expert AC repair and maintenance', 
                'price': 800.00, 
                'image_url': 'ac_repair.jpg',
                'created_at': datetime.utcnow()
            },
            {
                'service_name': 'Washing Machine Repair', 
                'description': 'Front load and top load washing machine repair', 
                'price': 600.00, 
                'image_url': 'washing_machine.jpg',
                'created_at': datetime.utcnow()
            },
            {
                'service_name': 'Refrigerator Repair', 
                'description': 'Single and double door fridge repair services', 
                'price': 700.00, 
                'image_url': 'fridge_repair.jpg',
                'created_at': datetime.utcnow()
            },
             {
                'service_name': 'Computer/Laptop Service', 
                'description': 'Desktop and Laptop hardware/software support', 
                'price': 500.00, 
                'image_url': 'computer_repair.jpg',
                'created_at': datetime.utcnow()
            },
            {
                'service_name': 'Projector Service', 
                'description': 'Projector cleaning and lamp replacement', 
                'price': 1200.00, 
                'image_url': 'projector.jpg',
                'created_at': datetime.utcnow()
            }
        ]
        
        db.services.insert_many(services)
        print(f"Inserted {len(services)} services.")
        
        # 4. Create Dummy Technician
        technician = {
            'name': 'Ali Khan',
            'specialization': 'AC & Refrigerator',
            'phone': '9876543210',
            'status': 'active',
            'created_at': datetime.utcnow()
        }
        db.technicians.insert_one(technician)
        print("Inserted 1 dummy technician.")

if __name__ == '__main__':
    seed()
