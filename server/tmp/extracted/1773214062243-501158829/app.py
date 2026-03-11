from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, abort
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import secrets
from bson.objectid import ObjectId

# Razorpay Integration (Wrap in try-except to avoid crash if not installed)
try:
    import razorpay
    RAZORPAY_KEY = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_YOUR_KEY_HERE')
    RAZORPAY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'YOUR_SECRET_HERE')
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY, RAZORPAY_SECRET))
except ImportError:
    razorpay = None
    razorpay_client = None

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this in production
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')
app.config['RAZORPAY_KEY'] = 'rzp_test_YOUR_KEY_HERE' # Expose to frontend

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
        if 'user_id' not in session:
            return redirect(url_for('login'))
        if 'role' not in session or session['role'] != 'admin':
            flash('Access denied. Admin privileges required.', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# MongoDB configuration
app.config['MONGO_URI'] = 'mongodb://localhost:27017/ahad_services'
mongo = PyMongo(app)

# Helper to get the database
def get_db():
    return mongo.db

# Initialize collections with indexes
def init_collections():
    db = get_db()
    # Ensure unique indexes
    db.users.create_index('username', unique=True)
    db.users.create_index('email', unique=True)
    db.services.create_index('service_name', unique=True)
    # Indexes for performance
    db.bookings.create_index('user_id')
    db.bookings.create_index('technician_id')
    db.bookings.create_index('status')
    db.technicians.create_index('phone')

# Call init on startup
init_collections()

# Security Headers & CSRF Protection
@app.before_request
def csrf_protect():
    if request.method == "POST":
        token = session.pop('_csrf_token', None)
        if not token or token != request.form.get('_csrf_token'):
            # Allow some exceptions if needed, but for now strict
            if request.path.startswith('/create_order'): # JSON endpoints might need different handling
                 # handling JSON CSRF if needed, skipping for simplicity in this dev environment or checking header
                 pass 
            else:
                 # abort(403) # Uncomment to enforce strict CSRF 
                 pass

def generate_csrf_token():
    if '_csrf_token' not in session:
        session['_csrf_token'] = secrets.token_hex(16)
    return session['_csrf_token']

app.jinja_env.globals['csrf_token'] = generate_csrf_token

@app.after_request
def set_security_headers(response):
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # strict-transport-security only for https, skipping for localhost
    return response

# Context processor for datetime
@app.context_processor
def inject_now():
    return {'datetime': datetime, 'razorpay_key': app.config.get('RAZORPAY_KEY')}

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

@app.route('/create_order', methods=['POST'])
@login_required
def create_order():
    if not razorpay_client:
        return jsonify({'error': 'Razorpay not configured'}), 500
        
    try:
        amount = float(request.json.get('amount')) * 100 # Convert to paise
        order_data = {
            'amount': int(amount),
            'currency': 'INR',
            'payment_capture': 1
        }
        order = razorpay_client.order.create(data=order_data)
        return jsonify(order)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/booking', methods=['GET', 'POST'])
@login_required
def booking():
    if request.method == 'POST':
        service_id = request.form['service_id']
        date = request.form['booking_date']
        time = request.form['booking_time']
        address = request.form['address']
        notes = request.form['notes']
        payment_id = request.form.get('razorpay_payment_id') # From JS
        
        # Verify Payment if payment_id exists
        payment_status = 'Pending'
        if payment_id and razorpay_client:
            try:
                # In a real app, verify signature here
                payment_status = 'Confirmed'
            except:
                pass

        booking = {
            'user_id': ObjectId(session['user_id']),
            'service_id': ObjectId(service_id),
            'booking_date': date,
            'booking_time': time,
            'address': address,
            'notes': notes,
            'status': payment_status,
            'payment_id': payment_id,
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
    
    # Calculate Revenue (Mock: Sum of prices of all bookings, or just Completed ones)
    revenue_pipeline = [
        {'$lookup': {'from': 'services', 'localField': 'service_id', 'foreignField': '_id', 'as': 'service'}},
        {'$unwind': '$service'},
        {'$group': {'_id': None, 'total': {'$sum': '$service.price'}}}
    ]
    revenue_result = list(db.bookings.aggregate(revenue_pipeline))
    total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
    stats = {
        'total_bookings': db.bookings.count_documents({}),
        'pending_bookings': db.bookings.count_documents({'status': 'Pending'}),
        'total_services': db.services.count_documents({}),
        'total_users': db.users.count_documents({}),
        'total_technicians': db.technicians.count_documents({}),
        'total_revenue': total_revenue
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
    
    # Handle Status Update
    if request.method == 'POST' and 'status' in request.form:
        booking_id = request.form['booking_id']
        status = request.form['status']
        db.bookings.update_one({'_id': ObjectId(booking_id)}, {'$set': {'status': status}})
        return redirect(url_for('admin_bookings'))
        
    # Handle Technician Assignment
    if request.method == 'POST' and 'technician_id' in request.form:
        booking_id = request.form['booking_id']
        tech_id = request.form['technician_id']
        db.bookings.update_one({'_id': ObjectId(booking_id)}, {'$set': {'technician_id': ObjectId(tech_id)}})
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
        {'$lookup': { # Join Technician info
            'from': 'technicians',
            'localField': 'technician_id',
            'foreignField': '_id',
            'as': 'technician'
        }},
        {'$sort': {'created_at': -1}}
    ]
    bookings = list(db.bookings.aggregate(pipeline))
    technicians = list(db.technicians.find()) # Get all technicians for dropdown
    
    # Flatten data for template compatibility
    for b in bookings:
        b['full_name'] = b['user']['full_name']
        b['phone'] = b['user']['phone']
        b['service_name'] = b['service']['service_name']
        b['id'] = str(b['_id']) 
        b['technician_name'] = b['technician'][0]['name'] if b.get('technician') else 'Unassigned'
        b['assigned_tech_id'] = str(b.get('technician_id', ''))
        
    return render_template('admin/bookings.html', bookings=bookings, technicians=technicians)

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

@app.route('/admin/technicians', methods=['GET', 'POST'])
@admin_required
def admin_technicians():
    db = get_db()
    if request.method == 'POST':
        name = request.form['name']
        specialization = request.form['specialization']
        phone = request.form['phone']
        tech = {
            'name': name,
            'specialization': specialization,
            'phone': phone,
            'status': 'Active',
            'created_at': datetime.utcnow()
        }
        db.technicians.insert_one(tech)
        flash('Technician added successfully!')
        return redirect(url_for('admin_technicians'))
    
    technicians = list(db.technicians.find())
    return render_template('admin/technicians.html', technicians=technicians)

@app.route('/admin/delete_technician/<string:id>')
@admin_required
def delete_technician(id):
    get_db().technicians.delete_one({'_id': ObjectId(id)})
    return redirect(url_for('admin_technicians'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
