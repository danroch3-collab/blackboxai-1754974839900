"""
PORTAFOLIO ROCHA - DEMO FLASK APP
Desarrollador: Rocha
Descripción: Aplicación Flask de demostración con funcionalidades completas
"""

from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import sqlite3
import os

# ===================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ===================================

app = Flask(__name__)
app.secret_key = 'rocha_portfolio_demo_key_2024'
app.config['DATABASE'] = 'demo_database.db'

# ===================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===================================

def init_db():
    """Inicializa la base de datos con las tablas necesarias"""
    try:
        with sqlite3.connect(app.config['DATABASE']) as conn:
            cursor = conn.cursor()
            
            # Tabla de usuarios
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_admin BOOLEAN DEFAULT FALSE
                )
            ''')
            
            # Tabla de tareas (ejemplo de CRUD)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    priority TEXT DEFAULT 'medium',
                    user_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Insertar usuario admin por defecto
            admin_password = generate_password_hash('admin123')
            cursor.execute('''
                INSERT OR IGNORE INTO users (username, email, password_hash, is_admin)
                VALUES (?, ?, ?, ?)
            ''', ('admin', 'admin@rocha-portfolio.com', admin_password, True))
            
            # Insertar tareas de ejemplo
            sample_tasks = [
                ('Desarrollar API REST', 'Crear endpoints para la gestión de usuarios', 'completed', 'high', 1),
                ('Implementar autenticación', 'Sistema de login y registro seguro', 'completed', 'high', 1),
                ('Diseñar interfaz de usuario', 'UI/UX responsivo con Bootstrap', 'in_progress', 'medium', 1),
                ('Optimizar base de datos', 'Mejorar consultas y añadir índices', 'pending', 'medium', 1),
                ('Documentar código', 'Añadir comentarios y documentación', 'pending', 'low', 1)
            ]
            
            cursor.executemany('''
                INSERT OR IGNORE INTO tasks (title, description, status, priority, user_id)
                VALUES (?, ?, ?, ?, ?)
            ''', sample_tasks)
            
            conn.commit()
            print("✅ Base de datos inicializada correctamente")
            
    except Exception as e:
        print(f"❌ Error al inicializar base de datos: {e}")

# ===================================
# UTILIDADES DE BASE DE DATOS
# ===================================

def get_db_connection():
    """Obtiene una conexión a la base de datos"""
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def get_user_by_username(username):
    """Obtiene un usuario por su nombre de usuario"""
    try:
        conn = get_db_connection()
        user = conn.execute(
            'SELECT * FROM users WHERE username = ?', (username,)
        ).fetchone()
        conn.close()
        return user
    except Exception as e:
        print(f"❌ Error al obtener usuario: {e}")
        return None

def get_tasks_by_user(user_id, status=None):
    """Obtiene las tareas de un usuario"""
    try:
        conn = get_db_connection()
        if status:
            tasks = conn.execute(
                'SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
                (user_id, status)
            ).fetchall()
        else:
            tasks = conn.execute(
                'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
                (user_id,)
            ).fetchall()
        conn.close()
        return tasks
    except Exception as e:
        print(f"❌ Error al obtener tareas: {e}")
        return []

# ===================================
# DECORADORES
# ===================================

def login_required(f):
    """Decorador para rutas que requieren autenticación"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Debes iniciar sesión para acceder a esta página.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorador para rutas que requieren permisos de administrador"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Debes iniciar sesión para acceder a esta página.', 'warning')
            return redirect(url_for('login'))
        
        conn = get_db_connection()
        user = conn.execute(
            'SELECT is_admin FROM users WHERE id = ?', (session['user_id'],)
        ).fetchone()
        conn.close()
        
        if not user or not user['is_admin']:
            flash('No tienes permisos para acceder a esta página.', 'error')
            return redirect(url_for('dashboard'))
        
        return f(*args, **kwargs)
    return decorated_function

# ===================================
# RUTAS PRINCIPALES
# ===================================

@app.route('/')
def index():
    """Página principal de la aplicación"""
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Página de inicio de sesión"""
    if request.method == 'POST':
        try:
            username = request.form['username'].strip()
            password = request.form['password']
            
            # Validar campos
            if not username or not password:
                flash('Todos los campos son obligatorios.', 'error')
                return render_template('login.html')
            
            # Verificar usuario
            user = get_user_by_username(username)
            
            if user and check_password_hash(user['password_hash'], password):
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['is_admin'] = user['is_admin']
                
                flash(f'¡Bienvenido, {user["username"]}!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Credenciales incorrectas.', 'error')
                
        except Exception as e:
            print(f"❌ Error en login: {e}")
            flash('Error interno del servidor.', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Página de registro de usuarios"""
    if request.method == 'POST':
        try:
            username = request.form['username'].strip()
            email = request.form['email'].strip()
            password = request.form['password']
            confirm_password = request.form['confirm_password']
            
            # Validaciones
            if not all([username, email, password, confirm_password]):
                flash('Todos los campos son obligatorios.', 'error')
                return render_template('register.html')
            
            if password != confirm_password:
                flash('Las contraseñas no coinciden.', 'error')
                return render_template('register.html')
            
            if len(password) < 6:
                flash('La contraseña debe tener al menos 6 caracteres.', 'error')
                return render_template('register.html')
            
            # Verificar si el usuario ya existe
            if get_user_by_username(username):
                flash('El nombre de usuario ya está en uso.', 'error')
                return render_template('register.html')
            
            # Crear nuevo usuario
            password_hash = generate_password_hash(password)
            conn = get_db_connection()
            conn.execute(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                (username, email, password_hash)
            )
            conn.commit()
            conn.close()
            
            flash('Usuario registrado exitosamente. Puedes iniciar sesión.', 'success')
            return redirect(url_for('login'))
            
        except sqlite3.IntegrityError:
            flash('El email ya está registrado.', 'error')
        except Exception as e:
            print(f"❌ Error en registro: {e}")
            flash('Error interno del servidor.', 'error')
    
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    """Panel principal del usuario"""
    try:
        tasks = get_tasks_by_user(session['user_id'])
        
        # Estadísticas
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t['status'] == 'completed'])
        pending_tasks = len([t for t in tasks if t['status'] == 'pending'])
        in_progress_tasks = len([t for t in tasks if t['status'] == 'in_progress'])
        
        stats = {
            'total': total_tasks,
            'completed': completed_tasks,
            'pending': pending_tasks,
            'in_progress': in_progress_tasks,
            'completion_rate': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
        }
        
        return render_template('dashboard.html', tasks=tasks, stats=stats)
        
    except Exception as e:
        print(f"❌ Error en dashboard: {e}")
        flash('Error al cargar el dashboard.', 'error')
        return redirect(url_for('index'))

@app.route('/logout')
def logout():
    """Cerrar sesión"""
    session.clear()
    flash('Sesión cerrada exitosamente.', 'info')
    return redirect(url_for('index'))

# ===================================
# RUTAS DE TAREAS (CRUD)
# ===================================

@app.route('/tasks')
@login_required
def tasks():
    """Lista de tareas del usuario"""
    try:
        status_filter = request.args.get('status')
        tasks = get_tasks_by_user(session['user_id'], status_filter)
        return render_template('tasks.html', tasks=tasks, current_filter=status_filter)
    except Exception as e:
        print(f"❌ Error al obtener tareas: {e}")
        flash('Error al cargar las tareas.', 'error')
        return redirect(url_for('dashboard'))

@app.route('/tasks/create', methods=['GET', 'POST'])
@login_required
def create_task():
    """Crear nueva tarea"""
    if request.method == 'POST':
        try:
            title = request.form['title'].strip()
            description = request.form['description'].strip()
            priority = request.form['priority']
            
            if not title:
                flash('El título es obligatorio.', 'error')
                return render_template('create_task.html')
            
            conn = get_db_connection()
            conn.execute(
                'INSERT INTO tasks (title, description, priority, user_id) VALUES (?, ?, ?, ?)',
                (title, description, priority, session['user_id'])
            )
            conn.commit()
            conn.close()
            
            flash('Tarea creada exitosamente.', 'success')
            return redirect(url_for('tasks'))
            
        except Exception as e:
            print(f"❌ Error al crear tarea: {e}")
            flash('Error al crear la tarea.', 'error')
    
    return render_template('create_task.html')

@app.route('/tasks/<int:task_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_task(task_id):
    """Editar tarea existente"""
    try:
        conn = get_db_connection()
        task = conn.execute(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            (task_id, session['user_id'])
        ).fetchone()
        
        if not task:
            flash('Tarea no encontrada.', 'error')
            return redirect(url_for('tasks'))
        
        if request.method == 'POST':
            title = request.form['title'].strip()
            description = request.form['description'].strip()
            status = request.form['status']
            priority = request.form['priority']
            
            if not title:
                flash('El título es obligatorio.', 'error')
                return render_template('edit_task.html', task=task)
            
            conn.execute(
                '''UPDATE tasks 
                   SET title = ?, description = ?, status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ? AND user_id = ?''',
                (title, description, status, priority, task_id, session['user_id'])
            )
            conn.commit()
            conn.close()
            
            flash('Tarea actualizada exitosamente.', 'success')
            return redirect(url_for('tasks'))
        
        conn.close()
        return render_template('edit_task.html', task=task)
        
    except Exception as e:
        print(f"❌ Error al editar tarea: {e}")
        flash('Error al editar la tarea.', 'error')
        return redirect(url_for('tasks'))

@app.route('/tasks/<int:task_id>/delete', methods=['POST'])
@login_required
def delete_task(task_id):
    """Eliminar tarea"""
    try:
        conn = get_db_connection()
        result = conn.execute(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            (task_id, session['user_id'])
        )
        
        if result.rowcount > 0:
            conn.commit()
            flash('Tarea eliminada exitosamente.', 'success')
        else:
            flash('Tarea no encontrada.', 'error')
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error al eliminar tarea: {e}")
        flash('Error al eliminar la tarea.', 'error')
    
    return redirect(url_for('tasks'))

# ===================================
# API ENDPOINTS
# ===================================

@app.route('/api/tasks', methods=['GET'])
@login_required
def api_get_tasks():
    """API endpoint para obtener tareas"""
    try:
        tasks = get_tasks_by_user(session['user_id'])
        tasks_list = []
        
        for task in tasks:
            tasks_list.append({
                'id': task['id'],
                'title': task['title'],
                'description': task['description'],
                'status': task['status'],
                'priority': task['priority'],
                'created_at': task['created_at'],
                'updated_at': task['updated_at']
            })
        
        return jsonify({
            'success': True,
            'tasks': tasks_list,
            'total': len(tasks_list)
        })
        
    except Exception as e:
        print(f"❌ Error en API tasks: {e}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

@app.route('/api/tasks/<int:task_id>/status', methods=['PUT'])
@login_required
def api_update_task_status(task_id):
    """API endpoint para actualizar estado de tarea"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['pending', 'in_progress', 'completed']:
            return jsonify({
                'success': False,
                'error': 'Estado inválido'
            }), 400
        
        conn = get_db_connection()
        result = conn.execute(
            'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            (new_status, task_id, session['user_id'])
        )
        
        if result.rowcount > 0:
            conn.commit()
            conn.close()
            return jsonify({
                'success': True,
                'message': 'Estado actualizado correctamente'
            })
        else:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Tarea no encontrada'
            }), 404
            
    except Exception as e:
        print(f"❌ Error en API update status: {e}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

# ===================================
# RUTAS DE ADMINISTRACIÓN
# ===================================

@app.route('/admin')
@admin_required
def admin_panel():
    """Panel de administración"""
    try:
        conn = get_db_connection()
        
        # Estadísticas generales
        total_users = conn.execute('SELECT COUNT(*) as count FROM users').fetchone()['count']
        total_tasks = conn.execute('SELECT COUNT(*) as count FROM tasks').fetchone()['count']
        
        # Usuarios recientes
        recent_users = conn.execute(
            'SELECT username, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
        ).fetchall()
        
        # Tareas por estado
        task_stats = conn.execute('''
            SELECT status, COUNT(*) as count 
            FROM tasks 
            GROUP BY status
        ''').fetchall()
        
        conn.close()
        
        return render_template('admin.html', 
                             total_users=total_users,
                             total_tasks=total_tasks,
                             recent_users=recent_users,
                             task_stats=task_stats)
        
    except Exception as e:
        print(f"❌ Error en panel admin: {e}")
        flash('Error al cargar el panel de administración.', 'error')
        return redirect(url_for('dashboard'))

# ===================================
# MANEJO DE ERRORES
# ===================================

@app.errorhandler(404)
def not_found_error(error):
    """Manejo de error 404"""
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    """Manejo de error 500"""
    return render_template('errors/500.html'), 500

@app.errorhandler(403)
def forbidden_error(error):
    """Manejo de error 403"""
    return render_template('errors/403.html'), 403

# ===================================
# CONTEXTO DE PLANTILLAS
# ===================================

@app.context_processor
def inject_user():
    """Inyecta información del usuario en todas las plantillas"""
    return dict(
        current_user_id=session.get('user_id'),
        current_username=session.get('username'),
        is_admin=session.get('is_admin', False)
    )

# ===================================
# INICIALIZACIÓN Y EJECUCIÓN
# ===================================

if __name__ == '__main__':
    # Inicializar base de datos
    init_db()
    
    # Configuración para desarrollo
    app.config['DEBUG'] = True
    
    print("🚀 Iniciando Flask App Demo - Portafolio Rocha")
    print("📝 Credenciales de prueba:")
    print("   Usuario: admin")
    print("   Contraseña: admin123")
    print("🌐 Accede a: http://localhost:5000")
    
    # Ejecutar aplicación
    app.run(host='0.0.0.0', port=5000, debug=True)
