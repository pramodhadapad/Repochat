import sqlite3

conn = sqlite3.connect('ahad_services.db')
cursor = conn.cursor()
cursor.execute('SELECT id, service_name, image_url FROM services')
services = cursor.fetchall()

with open('db_services.txt', 'w') as f:
    f.write(f"{'ID':<5} {'Service Name':<30} {'Image URL'}\n")
    f.write("-" * 60 + "\n")
    for service in services:
        f.write(f"{service[0]:<5} {service[1]:<30} {service[2]}\n")

conn.close()
