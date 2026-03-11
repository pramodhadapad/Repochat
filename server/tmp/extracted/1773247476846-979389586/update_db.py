import sqlite3

conn = sqlite3.connect('ahad_services.db')
cursor = conn.cursor()

# 1. Update AC Repair & Service to use AC Installation image
cursor.execute("UPDATE services SET image_url = 'ac_install.jpg' WHERE service_name = 'AC Repair & Service'")

# 2. Update Refrigerator Repair to use the image that was on AC Repair (ac_repair.jpg)
cursor.execute("UPDATE services SET image_url = 'ac_repair.jpg' WHERE service_name = 'Refrigerator Repair'")

conn.commit()
print("Database updated successfully.")
conn.close()
