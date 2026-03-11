import sqlite3

DB_NAME = "ahad_services.db"

updates = [
    ('ac_install.jpg', 'AC Installation'),
    ('ac_repair.jpg', 'AC Repair & Service'),
    ('washing_machine.jpg', 'Washing Machine Repair'),
    ('fridge_repair.jpg', 'Refrigerator Repair'),
    ('computer_repair.jpg', 'Computer/Laptop Service'),
    ('projector.jpg', 'Projector Service')
]

conn = sqlite3.connect(DB_NAME)
cursor = conn.cursor()

for image, service in updates:
    cursor.execute("UPDATE services SET image_url = ? WHERE service_name = ?", (image, service))
    print(f"Updated {service} -> {image}")

conn.commit()
conn.close()
print("Database update complete.")
