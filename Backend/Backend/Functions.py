from flask import jsonify, request
from bson import ObjectId
from functools import wraps
import Backend.GlobalInfo.Helpers as HelperFunctions
import Backend.GlobalInfo.Messages as ResponseMessage
import bcrypt
import jwt
import random
import datetime
from flask_mail import Message, Mail
import Backend.GlobalInfo.keys as BaseDatos
from Backend.GlobalInfo.keys import JWT_SECRET_KEY
from pymongo import MongoClient

# ------------------- CONEXIÓN A MONGO -------------------
if BaseDatos.dbconn is None:
    mongoConnect = MongoClient(BaseDatos.strConnection)
    BaseDatos.dbconn = mongoConnect[BaseDatos.strDBConnection]

dbConnLocal = BaseDatos.dbconn
mail = Mail()

try:
    test = dbConnLocal.clUsuarios.find_one()
    print("Conexión a MongoDB exitosa")
except Exception as e:
    print("Error de conexión a MongoDB:", e)

# ------------------- DECORADOR TOKEN -------------------
def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'message': 'Token es requerido'}), 403
        try:
            decoded_token = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            current_user = dbConnLocal.clUsuarios.find_one({"idUsuario": decoded_token['idUsuario']})
            if not current_user:
                return jsonify({'message': 'Usuario no encontrado'}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token ha expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401
        return f(current_user, *args, **kwargs)
    return decorated_function

# ------------------- LOGIN + MFA -------------------
def fnLogin(email, password):
    try:
        user = dbConnLocal.clUsuarios.find_one({"strEmail": email})
        if user and bcrypt.checkpw(password.encode('utf-8'), user.get('strPassword','').encode('utf-8')):
            expiration_time = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            payload = {'idUsuario': user['idUsuario'], 'exp': expiration_time}
            token = jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

            verification_code = random.randint(100000, 999999)
            dbConnLocal.clUsuarios.update_one({"strEmail": email}, {"$set": {"verification_code": verification_code}})

            if send_verification_email(user['strEmail'], verification_code):
                return {'intResponse': 200, 'message': 'Código de verificación enviado', 'token': token}
            else:
                return {'intResponse': 500, 'Result': {'error': 'No se pudo enviar correo'}}
        else:
            return {'intResponse': 203, 'Result': {'usuario': {}, 'error': 'Usuario o contraseña incorrecta'}}
    except Exception as e:
        print('fnLogin', e)
        return {'intResponse': 500}

def send_verification_email(email, code):
    try:
        msg = Message('Código de Verificación', recipients=[email])
        msg.body = f'Tu código de verificación es: {code}'
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error al enviar correo: {e}")
        return False

# ------------------- USUARIOS -------------------
def obtener_usuarios():
    try:
        usuarios = list(dbConnLocal.clUsuarios.find({}))
        return [{
            "_id": str(u["_id"]),
            "idUsuario": u.get("idUsuario"),
            "strEmail": u.get("strEmail"),
            "strNombre": u.get("strNombre"),
            "rol": u.get("rol"),
            "fechaRegistro": u.get("fechaRegistro"),
            "ultimaActualizacion": u.get("ultimaActualizacion")
        } for u in usuarios]
    except Exception as e:
        HelperFunctions.PrintException()
        return []

def obtener_usuario(idUsuario):
    try:
        u = dbConnLocal.clUsuarios.find_one({"idUsuario": idUsuario})
        if u:
            return {
                "_id": str(u["_id"]),
                "idUsuario": u.get("idUsuario"),
                "strEmail": u.get("strEmail"),
                "strNombre": u.get("strNombre"),
                "rol": u.get("rol"),
                "fechaRegistro": u.get("fechaRegistro"),
                "ultimaActualizacion": u.get("ultimaActualizacion")
            }
        return None
    except Exception as e:
        HelperFunctions.PrintException()
        return None

def agregar_usuario(data):
    try:
        max_id = list(dbConnLocal.clUsuarios.aggregate([{"$group": {"_id": None, "maxId": {"$max": "$idUsuario"}}}]))
        nuevo_id = 1 if not max_id else max_id[0]['maxId'] + 1

        hashed_password = bcrypt.hashpw(data.get('strPassword','').encode('utf-8'), bcrypt.gensalt())
        nuevo_usuario = {
            "idUsuario": nuevo_id,
            "strEmail": data.get("strEmail"),
            "strPassword": hashed_password.decode('utf-8'),
            "strNombre": data.get("strNombre"),
            "rol": data.get("rol","alumno"),
            "fechaRegistro": datetime.datetime.utcnow(),
            "ultimaActualizacion": datetime.datetime.utcnow()
        }
        dbConnLocal.clUsuarios.insert_one(nuevo_usuario)
        return {'success': True}
    except Exception as e:
        HelperFunctions.PrintException()
        return {'success': False, 'error': 'No se pudo agregar usuario'}

def actualizar_usuario(idUsuario, data):
    try:
        u = dbConnLocal.clUsuarios.find_one({"idUsuario": idUsuario})
        if not u:
            return {'success': False, 'error': 'Usuario no encontrado'}
        data['ultimaActualizacion'] = datetime.datetime.utcnow()
        if 'strPassword' in data:
            data['strPassword'] = bcrypt.hashpw(data['strPassword'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        res = dbConnLocal.clUsuarios.update_one({"idUsuario": idUsuario}, {"$set": data})
        return {'success': res.modified_count > 0}
    except Exception as e:
        HelperFunctions.PrintException()
        return {'success': False, 'error': 'Error al actualizar usuario'}

def eliminar_usuario(idUsuario):
    try:
        res = dbConnLocal.clUsuarios.delete_one({"idUsuario": idUsuario})
        return {'success': res.deleted_count > 0}
    except Exception as e:
        HelperFunctions.PrintException()
        return {'success': False, 'error': 'Error al eliminar usuario'}

# ------------------- TAREAS -------------------
def obtener_tareas():
    try:
        tareas = list(dbConnLocal.clTasks.find({}))
        return [{
            "_id": str(t["_id"]),
            "idTarea": t.get("idTarea"),
            "titulo": t.get("titulo"),
            "descripcion": t.get("descripcion"),
            "fechaEntrega": t.get("fechaEntrega"),
            "prioridad": t.get("prioridad"),
            "estado": t.get("estado"),
            "usuarioAsignado": t.get("usuarioAsignado"),
            "creador": t.get("creador"),
            "fechaRegistro": t.get("fechaRegistro"),
            "ultimaActualizacion": t.get("ultimaActualizacion")
        } for t in tareas]
    except Exception as e:
        HelperFunctions.PrintException()
        return []

def obtener_tarea(idTarea):
    try:
        t = dbConnLocal.clTasks.find_one({"idTarea": idTarea})
        if t:
            return {
                "_id": str(t["_id"]),
                "idTarea": t.get("idTarea"),
                "titulo": t.get("titulo"),
                "descripcion": t.get("descripcion"),
                "fechaEntrega": t.get("fechaEntrega"),
                "prioridad": t.get("prioridad"),
                "estado": t.get("estado"),
                "usuarioAsignado": t.get("usuarioAsignado"),
                "creador": t.get("creador"),
                "fechaRegistro": t.get("fechaRegistro"),
                "ultimaActualizacion": t.get("ultimaActualizacion")
            }
        return None
    except Exception as e:
        HelperFunctions.PrintException()
        return None

def agregar_tarea(data):
    try:
        max_id = list(dbConnLocal.clTasks.aggregate([{"$group": {"_id": None, "maxId": {"$max": "$idTarea"}}}]))
        nuevo_id = 1 if not max_id else max_id[0]['maxId'] + 1
        nueva_tarea = {
            "idTarea": nuevo_id,
            "titulo": data.get("titulo"),
            "descripcion": data.get("descripcion"),
            "fechaEntrega": data.get("fechaEntrega"),
            "prioridad": data.get("prioridad","media"),
            "estado": data.get("estado","pendiente"),
            "usuarioAsignado": data.get("usuarioAsignado"),
            "creador": data.get("creador"),
            "fechaRegistro": datetime.datetime.utcnow(),
            "ultimaActualizacion": datetime.datetime.utcnow()
        }
        dbConnLocal.clTasks.insert_one(nueva_tarea)
        return {'success': True}
    except Exception as e:
        HelperFunctions.PrintException()
        return {'success': False, 'error': 'No se pudo agregar tarea'}

def actualizar_tarea(idTarea, data):
    try:
        t = dbConnLocal.clTasks.find_one({"idTarea": idTarea})
        if not t:
            return {'success': False, 'error': 'Tarea no encontrada'}
        data['ultimaActualizacion'] = datetime.datetime.utcnow()
        res = dbConnLocal.clTasks.update_one({"idTarea": idTarea}, {"$set": data})
        return {'success': res.modified_count > 0}
    except Exception as e:
        HelperFunctions.PrintException()
        return {'success': False, 'error': 'Error al actualizar tarea'}

def eliminar_tarea(idTarea):
    try:
        res = dbConnLocal.clTasks.delete_one({"idTarea": idTarea})
        return {'success': res.deleted_count > 0}
    except Exception as e:
        HelperFunctions.PrintException()
        return {'success': False, 'error': 'Error al eliminar tarea'}
