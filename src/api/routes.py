"""
Rutas API (JWT + hash + perfil opcional + productos + carrito)
"""
from flask import request, jsonify, Blueprint
from api.models import db, User, Product, CartItem
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

api = Blueprint("api", __name__)
CORS(api)  # OJO: el CORS global lo ponemos también en app.py (recomendado)

# ---------------------------
# TEST
# ---------------------------
@api.route("/hello", methods=["GET"])
def hello():
    return jsonify({"message": "API funcionando ✅"}), 200

# ---------------------------
# AUTH
# ---------------------------

# Register
@api.route("/users", methods=["POST"])
def register_user():
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email y password son requeridos"}), 400

    # ¿Existe?
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "El email ya está registrado"}), 409

    hashed = generate_password_hash(password)

    user = User(
        email=email,
        password=hashed,
        is_active=True,
        name=data.get("name"),          # opcional
        lastname=data.get("lastname"),  # opcional
        address=data.get("address"),    # opcional
    )
    db.session.add(user)
    db.session.commit()

    return jsonify(user.serialize()), 201

# Login
@api.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email y password son requeridos"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Credenciales inválidas"}), 401

    # IMPORTANTE: identity como string para evitar "Subject must be a string"
    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.serialize()}), 200

# Perfil del usuario autenticado
@api.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(user.serialize()), 200

# Editar perfil (solo tu usuario)
@api.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json() or {}

    # Campos de perfil
    if "name" in data:
        user.name = data["name"]
    if "lastname" in data:
        user.lastname = data["lastname"]
    if "address" in data:
        user.address = data["address"]

    # Email opcional (si quieres permitirlo)
    if "email" in data and data["email"]:
        # evitar duplicado
        existing = User.query.filter(User.email == data["email"], User.id != user.id).first()
        if existing:
            return jsonify({"error": "Ese email ya está en uso"}), 409
        user.email = data["email"]

    # Password opcional
    if "password" in data and data["password"]:
        user.password = generate_password_hash(data["password"])

    db.session.commit()
    return jsonify(user.serialize()), 200

# ---------------------------
# USERS (solo si quieres en dev)
# ---------------------------
@api.route("/users", methods=["GET"])
def list_users():
    users = User.query.all()
    return jsonify([u.serialize() for u in users]), 200

# ---------------------------
# PRODUCTS
# ---------------------------
@api.route("/products", methods=["POST"])
def create_product():
    data = request.get_json() or {}

    if not data.get("title") or data.get("price_cents") is None:
        return jsonify({"error": "title y price_cents son requeridos"}), 400

    product = Product(
        title=data["title"],
        description=data.get("description", ""),
        price_cents=int(data["price_cents"]),
        image_url=data.get("image_url", ""),
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.serialize()), 201

@api.route("/products", methods=["GET"])
def get_products():
    products = Product.query.all()
    return jsonify([p.serialize() for p in products]), 200

@api.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(product.serialize()), 200

@api.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json() or {}
    if "title" in data:
        product.title = data["title"]
    if "description" in data:
        product.description = data["description"]
    if "price_cents" in data:
        product.price_cents = int(data["price_cents"])
    if "image_url" in data:
        product.image_url = data["image_url"]

    db.session.commit()
    return jsonify(product.serialize()), 200

@api.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"}), 200

# ---------------------------
# CART (solo del usuario autenticado)
# ---------------------------

# Obtener carrito del usuario
@api.route("/cart-items", methods=["GET"])
@jwt_required()
def get_cart_items():
    user_id = int(get_jwt_identity())
    items = CartItem.query.filter_by(user_id=user_id).all()
    return jsonify([i.serialize() for i in items]), 200

# Añadir/actualizar item en carrito
@api.route("/cart-items", methods=["POST"])
@jwt_required()
def add_cart_item():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 1))

    if not product_id:
        return jsonify({"error": "product_id es requerido"}), 400

    product = Product.query.get(int(product_id))
    if not product:
        return jsonify({"error": "Producto no existe"}), 404

    # Si ya existe, sumamos
    item = CartItem.query.filter_by(user_id=user_id, product_id=product.id).first()
    if item:
        item.quantity += quantity
    else:
        item = CartItem(user_id=user_id, product_id=product.id, quantity=quantity)
        db.session.add(item)

    db.session.commit()
    return jsonify(item.serialize()), 201

# Cambiar cantidad (sumar/restar)
@api.route("/cart-items/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_cart_item(item_id):
    user_id = int(get_jwt_identity())
    item = CartItem.query.get(item_id)
    if not item:
        return jsonify({"error": "CartItem not found"}), 404

    if item.user_id != user_id:
        return jsonify({"error": "No puedes modificar el carrito de otro usuario"}), 403

    data = request.get_json() or {}
    if "quantity" in data:
        item.quantity = max(1, int(data["quantity"]))

    db.session.commit()
    return jsonify(item.serialize()), 200

# Eliminar item
@api.route("/cart-items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_cart_item(item_id):
    user_id = int(get_jwt_identity())
    item = CartItem.query.get(item_id)
    if not item:
        return jsonify({"error": "CartItem not found"}), 404

    if item.user_id != user_id:
        return jsonify({"error": "No puedes borrar items de otro usuario"}), 403

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "CartItem deleted"}), 200
