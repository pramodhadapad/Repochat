import sqlite3
from werkzeug.security import generate_password_hash

# connect to sqlite database
conn = sqlite3.connect('ahad_services.db')
cursor = conn.cursor()

# new admin credentials
new_email = "admin@gmail.com"
new_password = "Admin@123"

# hash password (matches Flask best practice)
hashed_password = generate_password_hash(new_password)

# update admin user
cursor.execute("""
UPDATE users
SET email = ?, password = ?
WHERE role = 'admin'
""", (new_email, hashed_password))

conn.commit()
conn.close()

print("✅ Admin email and password updated successfully")
