from flask_cors import CORS, cross_origin
from pymongo import MongoClient
from bson import ObjectId
import os
import sys
import Backend.Functions as callMethod
from Backend.Functions import token_required

import Backend.GlobalInfo.Helpers as HelperFunctions
import Backend.GlobalInfo.Messages as ResponseMessage
from flask import Flask, jsonify, request
import json
import Backend.GlobalInfo.keys as BaseDatos
from Backend.Functions import dbConnLocal  # Para la BD
from flask_mail import Mail, Message

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuración de Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'omar.rod.fraf@gmail.com'
app.config['MAIL_PASSWORD'] = 'svxf owxq meja eavy'
app.config['MAIL_DEFAULT_SENDER'] = 'omar.rod.fraf@gmail.com'
mail = Mail(app)

# ------------------- LOGIN / MFA -------------------

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('strEmail')
        password = data.get('strPassword')
        response = callMethod.fnLogin(email, password)
        return jsonify(response), response['intResponse']
    except Exception as e:
        print(str(e))
        return jsonify({'error': 'Error en la petición'}), 400

@app.route('/verify', methods=['POST'])
@token_required
def verify_code(current_user):
    try:
        data = request.get_json()
        email = current_user['strEmail']
        entered_code = data.get('code')
        user = dbConnLocal.clUsuarios.find_one({"strEmail": email})

        if user:
            stored_code = user.get('verification_code')
            if str(entered_code) == str(stored_code):
                return jsonify({'message': 'Código verificado correctamente'}), 200
            else:
                return jsonify({'message': 'Código incorrecto'}), 400
        else:
            return jsonify({'message': 'Usuario no encontrado'}), 404
    except Exception as e:
        print(str(e))
        return jsonify({'message': 'Error al verificar el código'}), 500

# ------------------- REGISTRO PÚBLICO -------------------

@app.route('/register', methods=['POST'])
def register():
    """Endpoint público para registro de nuevos usuarios"""
    try:
        data = request.get_json()
        email = data.get('strEmail')
        password = data.get('strPassword')
        nombre = data.get('strNombre')
        
        response = callMethod.fnRegister(email, password, nombre)
        return jsonify(response), response['intResponse']
    except Exception as e:
        print(str(e))
        return jsonify({'error': 'Error en la petición de registro'}), 400

# ------------------- TAREAS -------------------

@app.route('/tasks', methods=['GET'])
@token_required
def obtener_tareas(current_user):
    try:
        tareas = callMethod.obtener_tareas()
        return jsonify(tareas), 200
    except Exception as e:
        HelperFunctions.PrintException()
        return jsonify({'error': 'Error al obtener tareas'}), 500

@app.route('/tasks/<int:idTarea>', methods=['GET'])
@token_required
def obtener_tarea(current_user, idTarea):
    try:
        tarea = callMethod.obtener_tarea(idTarea)
        if tarea:
            return jsonify(tarea), 200
        else:
            return jsonify({'error': 'Tarea no encontrada'}), 404
    except Exception as e:
        HelperFunctions.PrintException()
        return jsonify({'error': 'Error al obtener tarea'}), 500

@app.route('/tasks/agregar', methods=['POST'])
@token_required
def agregar_tarea(current_user):
    try:
        data = request.get_json()
        resultado = callMethod.agregar_tarea(data)
        if resultado['success']:
            return jsonify({'message': 'Tarea agregada correctamente'}), 201
        else:
            return jsonify({'error': resultado['error']}), 400
    except Exception as e:
        HelperFunctions.PrintException()
        return jsonify({'error': 'Error al agregar tarea'}), 500

@app.route('/tasks/actualizar/<int:idTarea>', methods=['PUT'])
@token_required
def actualizar_tarea(current_user, idTarea):
    try:
        data = request.get_json()
        resultado = callMethod.actualizar_tarea(idTarea, data)
        if resultado['success']:
            return jsonify({'message': 'Tarea actualizada correctamente'}), 200
        else:
            return jsonify({'error': resultado['error']}), 400
    except Exception as e:
        HelperFunctions.PrintException()
        return jsonify({'error': 'Error al actualizar tarea'}), 500

@app.route('/tasks/eliminar/<int:idTarea>', methods=['DELETE'])
@token_required
def eliminar_tarea(current_user, idTarea):
    try:
        resultado = callMethod.eliminar_tarea(idTarea)
        if resultado['success']:
            return jsonify({'message': 'Tarea eliminada correctamente'}), 200
        else:
            return jsonify({'error': resultado['error']}), 404
    except Exception as e:
        HelperFunctions.PrintException()
        return jsonify({'error': 'Error al eliminar tarea'}), 500

# ------------------- USUARIOS -------------------

@app.route('/usuarios', methods=['GET'])
@token_required
def obtener_usuarios(current_user):
    try:
        usuarios = callMethod.obtener_usuarios()
        return jsonify(usuarios), 200
    except Exception as e:
        HelperFunctions.PrintException()
        return jsonify({'error': 'Error al obtener usuarios'}), 500

@app.route('/usuarios/<int:idUsuario>', methods=['GET'])
@token_required
def obtener_usuario(current_user, idUsuario):
    try:
        usuario = callMethod.obtener_usuario(idUsuario)
        if usuario:
            return jsonify(usuario), 200
        else:
            return jsonify({'error': 'Usuario no encontrado'}), 404
    except Exception as e:
        HelperFunctions.PrintException()
        return jsonify({'error': 'Error al obtener usuario'}), 500

@app.route('/usuarios/agregar', methods=['POST'])
@token_required
def agregar_usuario(current_user):
    try:
        data = request.get_json()
        resultado = callMethod.agregar_usuario(data)
        if resultado['success']:
            return jsonify({'message': 'Usuario agregado correctamente'}), 201
        else:
            return jsonify({'error': resultado['error']}), 400
    except Exception as e:
        HelperFunctions.PrintException()
        return jsonify({'error': 'Error al agregar usuario'}), 500

@app.route('/usuarios/actualizar/<int:idUsuario>', methods=['PUT'])
@token_required
def actualizar_usuario(current_user, idUsuario):
    try:
        data = request.get_json()
        resultado = callMethod.actualizar_usuario(idUsuario, data)
        if resultado['success']:
            return jsonify({'message': 'Usuario actualizado correctamente'}), 200
        else:
            return jsonify({'error': resultado['error']}), 400
    except Exception as e:
        HelperFunctions.PrintException()
        return jsonify({'error': 'Error al actualizar usuario'}), 500

@app.route('/usuarios/eliminar/<int:idUsuario>', methods=['DELETE'])
@token_required
def eliminar_usuario(current_user, idUsuario):
    try:
        resultado = callMethod.eliminar_usuario(idUsuario)
        if resultado['success']:
            return jsonify({'message': 'Usuario eliminado correctamente'}), 200
        else:
            return jsonify({'error': resultado['error']}), 404
    except Exception as e:
        HelperFunctions.PrintException()
        return jsonify({'error': 'Error al eliminar usuario'}), 500

# ------------------- MAIN -------------------

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
