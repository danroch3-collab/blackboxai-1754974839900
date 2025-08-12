"""
PORTAFOLIO ROCHA - FASTAPI DEMO
Desarrollador: Rocha
Descripción: API REST moderna con FastAPI, documentación automática y autenticación JWT
"""

from fastapi import FastAPI, HTTPException, Depends, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import sqlite3
import os
from contextlib import contextmanager
import logging

# ===================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ===================================

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración JWT
SECRET_KEY = "rocha_portfolio_fastapi_secret_key_2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Configuración de base de datos
DATABASE_URL = "fastapi_demo.db"

# Inicializar FastAPI
app = FastAPI(
    title="Rocha Portfolio - FastAPI Demo",
    description="API REST de demostración desarrollada con FastAPI para el portafolio de Rocha",
    version="1.0.0",
    contact={
        "name": "Rocha",
        "email": "rocha.dev@email.com",
    },
    license_info={
        "name": "MIT",
    },
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios exactos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ===================================
# MODELOS PYDANTIC
# ===================================

class UserBase(BaseModel):
    """Modelo base para usuario"""
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario único")
    email: EmailStr = Field(..., description="Dirección de email válida")
    full_name: Optional[str] = Field(None, max_length=100, description="Nombre completo del usuario")
    
    @validator('username')
    def validate_username(cls, v):
        if not v.isalnum():
            raise ValueError('El nombre de usuario solo puede contener letras y números')
        return v.lower()

class UserCreate(UserBase):
    """Modelo para crear usuario"""
    password: str = Field(..., min_length=6, description="Contraseña (mínimo 6 caracteres)")
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v

class UserResponse(UserBase):
    """Modelo de respuesta para usuario"""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    """Modelo para login de usuario"""
    username: str = Field(..., description="Nombre de usuario")
    password: str = Field(..., description="Contraseña")

class Token(BaseModel):
    """Modelo para token de acceso"""
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

class TaskBase(BaseModel):
    """Modelo base para tarea"""
    title: str = Field(..., min_length=1, max_length=200, description="Título de la tarea")
    description: Optional[str] = Field(None, max_length=1000, description="Descripción detallada")
    priority: str = Field("medium", regex="^(low|medium|high)$", description="Prioridad de la tarea")
    status: str = Field("pending", regex="^(pending|in_progress|completed)$", description="Estado de la tarea")

class TaskCreate(TaskBase):
    """Modelo para crear tarea"""
    pass

class TaskUpdate(BaseModel):
    """Modelo para actualizar tarea"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: Optional[str] = Field(None, regex="^(low|medium|high)$")
    status: Optional[str] = Field(None, regex="^(pending|in_progress|completed)$")

class TaskResponse(TaskBase):
    """Modelo de respuesta para tarea"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class APIResponse(BaseModel):
    """Modelo genérico de respuesta de API"""
    success: bool
    message: str
    data: Optional[Dict[Any, Any]] = None
    errors: Optional[List[str]] = None

# ===================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===================================

def init_database():
    """Inicializa la base de datos con las tablas necesarias"""
    try:
        with sqlite3.connect(DATABASE_URL) as conn:
            cursor = conn.cursor()
            
            # Tabla de usuarios
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    full_name TEXT,
                    hashed_password TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tabla de tareas
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    priority TEXT DEFAULT 'medium',
                    status TEXT DEFAULT 'pending',
                    user_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Crear usuario de demostración
            demo_password = pwd_context.hash("demo123")
            cursor.execute('''
                INSERT OR IGNORE INTO users (username, email, full_name, hashed_password)
                VALUES (?, ?, ?, ?)
            ''', ("demo", "demo@rocha-portfolio.com", "Usuario Demo", demo_password))
            
            # Crear tareas de demostración
            demo_tasks = [
                ("Implementar autenticación JWT", "Sistema de autenticación seguro con tokens JWT", "high", "completed", 1),
                ("Crear documentación API", "Documentación automática con Swagger/OpenAPI", "medium", "completed", 1),
                ("Validación con Pydantic", "Modelos de validación robustos", "medium", "in_progress", 1),
                ("Manejo de errores", "Sistema completo de manejo de excepciones", "low", "pending", 1),
                ("Tests unitarios", "Cobertura completa de tests", "medium", "pending", 1)
            ]
            
            cursor.executemany('''
                INSERT OR IGNORE INTO tasks (title, description, priority, status, user_id)
                VALUES (?, ?, ?, ?, ?)
            ''', demo_tasks)
            
            conn.commit()
            logger.info("✅ Base de datos inicializada correctamente")
            
    except Exception as e:
        logger.error(f"❌ Error al inicializar base de datos: {e}")
        raise

@contextmanager
def get_db():
    """Context manager para conexiones de base de datos"""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# ===================================
# UTILIDADES DE AUTENTICACIÓN
# ===================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera hash de contraseña"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_username(username: str):
    """Obtiene un usuario por nombre de usuario"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            user = cursor.execute(
                "SELECT * FROM users WHERE username = ?", (username,)
            ).fetchone()
            return dict(user) if user else None
    except Exception as e:
        logger.error(f"Error al obtener usuario: {e}")
        return None

def get_user_by_id(user_id: int):
    """Obtiene un usuario por ID"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            user = cursor.execute(
                "SELECT * FROM users WHERE id = ?", (user_id,)
            ).fetchone()
            return dict(user) if user else None
    except Exception as e:
        logger.error(f"Error al obtener usuario por ID: {e}")
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Obtiene el usuario actual desde el token JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = get_user_by_username(username)
    if user is None:
        raise credentials_exception
    
    return user

# ===================================
# RUTAS DE AUTENTICACIÓN
# ===================================

@app.post("/auth/register", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """
    Registra un nuevo usuario en el sistema
    
    - **username**: Nombre de usuario único (solo letras y números)
    - **email**: Dirección de email válida
    - **password**: Contraseña (mínimo 6 caracteres)
    - **full_name**: Nombre completo (opcional)
    """
    try:
        # Verificar si el usuario ya existe
        existing_user = get_user_by_username(user.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está registrado"
            )
        
        # Crear nuevo usuario
        hashed_password = get_password_hash(user.password)
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (username, email, full_name, hashed_password)
                VALUES (?, ?, ?, ?)
            ''', (user.username, user.email, user.full_name, hashed_password))
            conn.commit()
            user_id = cursor.lastrowid
        
        logger.info(f"Usuario registrado: {user.username}")
        
        return APIResponse(
            success=True,
            message="Usuario registrado exitosamente",
            data={"user_id": user_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al registrar usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.post("/auth/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    """
    Autentica un usuario y devuelve un token JWT
    
    - **username**: Nombre de usuario
    - **password**: Contraseña
    """
    try:
        # Verificar credenciales
        user = get_user_by_username(user_credentials.username)
        if not user or not verify_password(user_credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario inactivo"
            )
        
        # Crear token de acceso
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["username"]}, expires_delta=access_token_expires
        )
        
        # Preparar respuesta del usuario
        user_response = UserResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            is_active=user["is_active"],
            created_at=datetime.fromisoformat(user["created_at"])
        )
        
        logger.info(f"Usuario autenticado: {user['username']}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Obtiene la información del usuario autenticado
    """
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        is_active=current_user["is_active"],
        created_at=datetime.fromisoformat(current_user["created_at"])
    )

# ===================================
# RUTAS DE TAREAS (CRUD)
# ===================================

@app.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene las tareas del usuario autenticado
    
    - **status**: Filtrar por estado (pending, in_progress, completed)
    - **priority**: Filtrar por prioridad (low, medium, high)
    - **limit**: Número máximo de resultados
    - **offset**: Número de resultados a omitir
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Construir query dinámicamente
            query = "SELECT * FROM tasks WHERE user_id = ?"
            params = [current_user["id"]]
            
            if status:
                query += " AND status = ?"
                params.append(status)
            
            if priority:
                query += " AND priority = ?"
                params.append(priority)
            
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            tasks = cursor.execute(query, params).fetchall()
            
            return [
                TaskResponse(
                    id=task["id"],
                    title=task["title"],
                    description=task["description"],
                    priority=task["priority"],
                    status=task["status"],
                    user_id=task["user_id"],
                    created_at=datetime.fromisoformat(task["created_at"]),
                    updated_at=datetime.fromisoformat(task["updated_at"])
                )
                for task in tasks
            ]
            
    except Exception as e:
        logger.error(f"Error al obtener tareas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener tareas"
        )

@app.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crea una nueva tarea para el usuario autenticado
    
    - **title**: Título de la tarea (obligatorio)
    - **description**: Descripción detallada (opcional)
    - **priority**: Prioridad (low, medium, high)
    - **status**: Estado inicial (pending, in_progress, completed)
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO tasks (title, description, priority, status, user_id)
                VALUES (?, ?, ?, ?, ?)
            ''', (task.title, task.description, task.priority, task.status, current_user["id"]))
            conn.commit()
            task_id = cursor.lastrowid
            
            # Obtener la tarea creada
            created_task = cursor.execute(
                "SELECT * FROM tasks WHERE id = ?", (task_id,)
            ).fetchone()
            
            logger.info(f"Tarea creada: {task.title} por usuario {current_user['username']}")
            
            return TaskResponse(
                id=created_task["id"],
                title=created_task["title"],
                description=created_task["description"],
                priority=created_task["priority"],
                status=created_task["status"],
                user_id=created_task["user_id"],
                created_at=datetime.fromisoformat(created_task["created_at"]),
                updated_at=datetime.fromisoformat(created_task["updated_at"])
            )
            
    except Exception as e:
        logger.error(f"Error al crear tarea: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear tarea"
        )

@app.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene una tarea específica por ID
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            task = cursor.execute(
                "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
                (task_id, current_user["id"])
            ).fetchone()
            
            if not task:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tarea no encontrada"
                )
            
            return TaskResponse(
                id=task["id"],
                title=task["title"],
                description=task["description"],
                priority=task["priority"],
                status=task["status"],
                user_id=task["user_id"],
                created_at=datetime.fromisoformat(task["created_at"]),
                updated_at=datetime.fromisoformat(task["updated_at"])
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener tarea: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener tarea"
        )

@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Actualiza una tarea existente
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Verificar que la tarea existe y pertenece al usuario
            existing_task = cursor.execute(
                "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
                (task_id, current_user["id"])
            ).fetchone()
            
            if not existing_task:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tarea no encontrada"
                )
            
            # Preparar campos a actualizar
            update_fields = []
            update_values = []
            
            if task_update.title is not None:
                update_fields.append("title = ?")
                update_values.append(task_update.title)
            
            if task_update.description is not None:
                update_fields.append("description = ?")
                update_values.append(task_update.description)
            
            if task_update.priority is not None:
                update_fields.append("priority = ?")
                update_values.append(task_update.priority)
            
            if task_update.status is not None:
                update_fields.append("status = ?")
                update_values.append(task_update.status)
            
            if not update_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No hay campos para actualizar"
                )
            
            # Agregar updated_at y condiciones WHERE
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_values.extend([task_id, current_user["id"]])
            
            # Ejecutar actualización
            query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
            cursor.execute(query, update_values)
            conn.commit()
            
            # Obtener tarea actualizada
            updated_task = cursor.execute(
                "SELECT * FROM tasks WHERE id = ?", (task_id,)
            ).fetchone()
            
            logger.info(f"Tarea actualizada: {task_id} por usuario {current_user['username']}")
            
            return TaskResponse(
                id=updated_task["id"],
                title=updated_task["title"],
                description=updated_task["description"],
                priority=updated_task["priority"],
                status=updated_task["status"],
                user_id=updated_task["user_id"],
                created_at=datetime.fromisoformat(updated_task["created_at"]),
                updated_at=datetime.fromisoformat(updated_task["updated_at"])
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar tarea: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar tarea"
        )

@app.delete("/tasks/{task_id}", response_model=APIResponse)
async def delete_task(
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Elimina una tarea
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            result = cursor.execute(
                "DELETE FROM tasks WHERE id = ? AND user_id = ?",
                (task_id, current_user["id"])
            )
            
            if result.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tarea no encontrada"
                )
            
            conn.commit()
            logger.info(f"Tarea eliminada: {task_id} por usuario {current_user['username']}")
            
            return APIResponse(
                success=True,
                message="Tarea eliminada exitosamente"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar tarea: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar tarea"
        )

# ===================================
# RUTAS DE ESTADÍSTICAS
# ===================================

@app.get("/stats", response_model=Dict[str, Any])
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """
    Obtiene estadísticas del usuario autenticado
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Estadísticas generales
            total_tasks = cursor.execute(
                "SELECT COUNT(*) as count FROM tasks WHERE user_id = ?",
                (current_user["id"],)
            ).fetchone()["count"]
            
            # Tareas por estado
            status_stats = cursor.execute('''
                SELECT status, COUNT(*) as count 
                FROM tasks 
                WHERE user_id = ? 
                GROUP BY status
            ''', (current_user["id"],)).fetchall()
            
            # Tareas por prioridad
            priority_stats = cursor.execute('''
                SELECT priority, COUNT(*) as count 
                FROM tasks 
                WHERE user_id = ? 
                GROUP BY priority
            ''', (current_user["id"],)).fetchall()
            
            # Tareas recientes (últimos 7 días)
            recent_tasks = cursor.execute('''
                SELECT COUNT(*) as count 
                FROM tasks 
                WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
            ''', (current_user["id"],)).fetchone()["count"]
            
            return {
                "total_tasks": total_tasks,
                "recent_tasks": recent_tasks,
                "status_distribution": {row["status"]: row["count"] for row in status_stats},
                "priority_distribution": {row["priority"]: row["count"] for row in priority_stats},
                "completion_rate": round(
                    (dict(status_stats).get("completed", 0) / total_tasks * 100) if total_tasks > 0 else 0,
                    2
                )
            }
            
    except Exception as e:
        logger.error(f"Error al obtener estadísticas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener estadísticas"
        )

# ===================================
# RUTAS GENERALES
# ===================================

@app.get("/", response_model=Dict[str, Any])
async def root():
    """
    Endpoint raíz con información de la API
    """
    return {
        "message": "Rocha Portfolio - FastAPI Demo",
        "version": "1.0.0",
        "description": "API REST de demostración desarrollada con FastAPI",
        "developer": "Rocha",
        "documentation": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "auth": ["/auth/register", "/auth/login", "/auth/me"],
            "tasks": ["/tasks", "/tasks/{id}"],
            "stats": ["/stats"]
        },
        "demo_credentials": {
            "username": "demo",
            "password": "demo123"
        }
    }

@app.get("/health")
async def health_check():
    """
    Endpoint de verificación de salud
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# ===================================
# MANEJO DE ERRORES
# ===================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Manejo personalizado de excepciones HTTP"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Manejo general de excepciones"""
    logger.error(f"Error no manejado: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Error interno del servidor",
            "status_code": 500
        }
    )

# ===================================
# EVENTOS DE INICIO Y CIERRE
# ===================================

@app.on_event("startup")
async def startup_event():
    """Eventos al iniciar la aplicación"""
    logger.info("🚀 Iniciando FastAPI Demo - Portafolio Rocha")
    init_database()
    logger.info("📚 Documentación disponible en: /docs")
    logger.info("🔑 Credenciales demo: usuario=demo, password=demo123")

@app.on_event("shutdown")
async def shutdown_event():
    """Eventos al cerrar la aplicación"""
    logger.info("🛑 Cerrando FastAPI Demo")

# ===================================
# EJECUCIÓN PRINCIPAL
# ===================================

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Iniciando FastAPI Demo - Portafolio Rocha")
    print("📚 Documentación: http://localhost:8000/docs")
    print("🔑 Credenciales demo:")
    print("   Usuario: demo")
    print("   Contraseña: demo123")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
