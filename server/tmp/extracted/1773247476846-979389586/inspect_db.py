import sqlite3

conn = sqlite3.connect('ahad_services.db')
cursor = conn.cursor()
cursor.execute('SELECT id, service_name, image_url FROM services')
services = cursor.fetchall()

print(f"{'ID':<5} {'Service Name':<30} {'Image URL'}")
print("-" * 60)
for service in services:
    print(f"{service[0]:<5} {service[1]:<30} {service[2]}")

conn.close()
