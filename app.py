from flask import Flask, render_template, request, redirect, url_for, session, flash
import mysql.connector
from datetime import timedelta

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'
app.permanent_session_lifetime = timedelta(minutes=10)
PASSWORD = "admin@srd"

# Database Connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="aMaR@123456",  # Set your MySQL password if needed
    database="srd"
)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/admin', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        input_password = request.form['password']
        if input_password == PASSWORD:
            session.permanent = True
            session['admin'] = True
            flash("Login successful!", "success")
            return redirect(url_for('dashboard'))
        else:
            flash("Incorrect password", "error")
            return render_template('admin.html')
    return render_template('admin.html')

@app.route('/dashboard')
def dashboard():
    if not session.get('admin'):
        flash("Please login as admin to view this page", "error")
        return redirect(url_for('admin_login'))
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM students ORDER BY rollno")
    students = cursor.fetchall()
    return render_template('dashboard.html', students=students)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if not session.get('admin'):
        flash("Only admin can register students", "error")
        return redirect(url_for('admin_login'))
    if request.method == 'POST':
        name = request.form['name']
        student_class = request.form['class']
        rollno = request.form['rollno']

        cursor = db.cursor()
        cursor.execute("INSERT INTO students (stdname, class, rollno) VALUES (%s, %s, %s)",
                       (name, student_class, rollno))
        db.commit()
        flash("Student registered successfully", "success")
        return redirect(url_for('dashboard'))
    return render_template('register.html')

@app.route('/delete/<int:rollno>', methods=['POST'])
def delete(rollno):
    if not session.get('admin'):
        flash("Unauthorized action", "error")
        return redirect(url_for('admin_login'))
    cursor = db.cursor()
    cursor.execute("DELETE FROM students WHERE rollno = %s", (rollno,))
    db.commit()
    flash("Student deleted successfully", "success")
    return redirect(url_for('dashboard'))

@app.route('/logout')
def logout():
    session.pop('admin', None)
    flash("Logged out successfully", "success")
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)
