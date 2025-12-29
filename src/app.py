import os
from datetime import timedelta
from flask import Flask, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from src.api.models import db
from src.api.routes import api
from src.api.utils import APIException, generate_sitemap
from src.api.admin import setup_admin
from src.api.commands import setup_commands

static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../dist/")

app = Flask(__name__)
app.url_map.strict_slashes = False

db_url = os.getenv("DATABASE_URL")
if db_url:
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url.replace("postgres://", "postgresql://")
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:////tmp/test.db"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["JWT_SECRET_KEY"] = os.getenv("FLASK_APP_KEY", "super-secret-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

db.init_app(app)
Migrate(app, db, compare_type=True)
JWTManager(app)

CORS(app, resources={r"/api/*": {"origins": "*"}})

setup_admin(app)
setup_commands(app)

app.register_blueprint(api, url_prefix="/api")

@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

@app.route("/")
def index():
    index_path = os.path.join(static_file_dir, "index.html")
    if os.path.isfile(index_path):
        return send_from_directory(static_file_dir, "index.html")
    return generate_sitemap(app)

@app.route("/<path:path>", methods=["GET"])
def serve_any_other_file(path):
    requested_path = os.path.join(static_file_dir, path)
    if os.path.isfile(requested_path):
        response = send_from_directory(static_file_dir, path)
    else:
        response = send_from_directory(static_file_dir, "index.html")
    response.cache_control.max_age = 0
    return response

if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=PORT)
