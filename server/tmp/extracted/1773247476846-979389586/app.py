from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os
from bson.objectid import ObjectId

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this in production

app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')

# Authentication decorators
from functools import wraps

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'role' not in session or session['role'] != 'admin':
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function
app.secret_key = 'your_secret_key_here'  # Change this in production

# MongoDB configuration
app.config['MONGO_URI'] = 'mongodb://localhost:27017/ahad_services'
mongo = PyMongo(app)

# Helper to get the database
def get_db():
    return mongo.db

# Initialize collections with indexes if needed (optional)
def init_collections():
    db = get_db()
    # Ensure unique indexes
    db.users.create_index('username', unique=True)
    db.users.create_index('email', unique=True)
    db.services.create_index('service_name', unique=True)

# Call init on startup
init_collections()

# Context processor for datetime
@app.context_processor
def inject_now():
    return {'datetime': datetime}

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/services')
def services():
    services_raw = list(get_db().services.find())
    services = []
    for s in services_raw:
        s['id'] = str(s['_id'])
        services.append(s)
    return render_template('services.html', services=services)

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = generate_password_hash(request.form['password'])
        full_name = request.form['full_name']
        phone = request.form['phone']
        user = {
            'username': username,
            'email': email,
            'password': password,
            'full_name': full_name,
            'phone': phone,
            'role': 'customer',
            'created_at': datetime.utcnow()
        }
        try:
            get_db().users.insert_one(user)
            flash('Registration successful! Please login.')
            return redirect(url_for('login'))
        except Exception:
            flash('Username or Email already exists.')
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = get_db().users.find_one({'username': username})
        if user and check_password_hash(user['password'], password):
            session['user_id'] = str(user['_id'])
            session['username'] = user['username']
            session['role'] = user.get('role', 'customer')
            if user.get('role') == 'admin':
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form['email']
        phone = request.form['phone']
        user = get_db().users.find_one({'email': email, 'phone': phone})
        if user:
            session['reset_user_id'] = str(user['_id'])
            return redirect(url_for('reset_password'))
        else:
            flash('Details not found! Please check your email and phone.')
    return render_template('forgot_password.html')

@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    if 'reset_user_id' not in session:
        return redirect(url_for('login'))
    if request.method == 'POST':
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        if password != confirm_password:
            flash('Passwords do not match!')
            return render_template('reset_password.html')
        hashed_password = generate_password_hash(password)
        get_db().users.update_one({'_id': ObjectId(session['reset_user_id'])}, {'$set': {'password': hashed_password}})
        session.pop('reset_user_id', None)
        flash('Password reset successful! Please login.')
        return redirect(url_for('login'))
    return render_template('reset_password.html')

@app.route('/booking', methods=['GET', 'POST'])
@login_required
def booking():
    if request.method == 'POST':
        service_id = request.form['service_id']
        date = request.form['booking_date']
        time = request.form['booking_time']
        address = request.form['address']
        notes = request.form['notes']
        booking = {
            'user_id': ObjectId(session['user_id']),
            'service_id': ObjectId(service_id),
            'booking_date': date,
            'booking_time': time,
            'address': address,
            'notes': notes,
            'status': 'Pending',
            'created_at': datetime.utcnow()
        }
        get_db().bookings.insert_one(booking)
        flash('Booking submitted successfully!')
        return redirect(url_for('my_bookings'))
    
    # Process services to include string ID
    services_raw = list(get_db().services.find())
    services = []
    for s in services_raw:
        s['id'] = str(s['_id'])
        services.append(s)
        
    selected_service = request.args.get('service_id')
    return render_template('booking.html', services=services, selected_service=selected_service)

@app.route('/my_bookings')
@login_required
def my_bookings():
    bookings_raw = list(get_db().bookings.aggregate([
        {'$match': {'user_id': ObjectId(session['user_id'])}},
        {'$lookup': {
            'from': 'services',
            'localField': 'service_id',
            'foreignField': '_id',
            'as': 'service'
        }},
        {'$unwind': '$service'}
    ]))
    
    bookings = []
    for b in bookings_raw:
        b['id'] = str(b['_id'])
        b['service_name'] = b['service']['service_name']
        bookings.append(b)
        
    return render_template('my_bookings.html', bookings=bookings)

# Admin routes
@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    db = get_db()
    stats = {
        'total_bookings': db.bookings.count_documents({}),
        'pending_bookings': db.bookings.count_documents({'status': 'Pending'}),
        'total_services': db.services.count_documents({}),
        'total_users': db.users.count_documents({})
    }
    
    pipeline = [
        {'$lookup': {'from': 'users', 'localField': 'user_id', 'foreignField': '_id', 'as': 'user'}},
        {'$unwind': '$user'},
        {'$lookup': {'from': 'services', 'localField': 'service_id', 'foreignField': '_id', 'as': 'service'}},
        {'$unwind': '$service'},
        {'$sort': {'created_at': -1}},
        {'$limit': 5}
    ]
    
    recent_bookings_raw = list(db.bookings.aggregate(pipeline))
    recent_bookings = []
    for b in recent_bookings_raw:
        b['full_name'] = b['user']['full_name']
        b['service_name'] = b['service']['service_name']
        b['id'] = str(b['_id'])
        recent_bookings.append(b)

    return render_template('admin/dashboard.html', stats=stats, recent_bookings=recent_bookings)

@app.route('/admin/bookings', methods=['GET', 'POST'])
@admin_required
def admin_bookings():
    db = get_db()
    if request.method == 'POST':
        booking_id = request.form['booking_id']
        status = request.form['status']
        db.bookings.update_one({'_id': ObjectId(booking_id)}, {'$set': {'status': status}})
        return redirect(url_for('admin_bookings'))
    
    status_filter = request.args.get('status')
    query = {}
    if status_filter:
        query['status'] = status_filter
    
    # Use aggregate to join user info
    pipeline = [
        {'$match': query},
        {'$lookup': {
            'from': 'users',
            'localField': 'user_id',
            'foreignField': '_id',
            'as': 'user'
        }},
        {'$unwind': '$user'},
        {'$lookup': {
            'from': 'services',
            'localField': 'service_id',
            'foreignField': '_id',
            'as': 'service'
        }},
        {'$unwind': '$service'},
        {'$sort': {'created_at': -1}}
    ]
    bookings = list(db.bookings.aggregate(pipeline))
    
    # Flatten data for template compatibility
    for b in bookings:
        b['full_name'] = b['user']['full_name']
        b['phone'] = b['user']['phone']
        b['service_name'] = b['service']['service_name']
        b['id'] = str(b['_id']) # Important for template ID usage
        
    return render_template('admin/bookings.html', bookings=bookings)

@app.route('/admin/users')
@admin_required
def admin_users():
    users = list(get_db().users.find().sort('created_at', -1))
    return render_template('admin/users.html', users=users)

@app.route('/admin/services', methods=['GET', 'POST'])
@admin_required
def admin_services():
    db = get_db()
    if request.method == 'POST':
        name = request.form['service_name']
        price = float(request.form['price'])
        desc = request.form['description']
        image_url = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_url = filename
        service = {
            'service_name': name,
            'description': desc,
            'price': price,
            'image_url': image_url,
            'created_at': datetime.utcnow()
        }
        db.services.insert_one(service)
        return redirect(url_for('admin_services'))
    services = list(db.services.find())
    return render_template('admin/services.html', services=services)

@app.route('/admin/delete_service/<string:id>')
@admin_required
def delete_service(id):
    get_db().services.delete_one({'_id': ObjectId(id)})
    return redirect(url_for('admin_services'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
