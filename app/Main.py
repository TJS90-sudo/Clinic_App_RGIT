from flask import Flask
from datetime import timedelta
import os
from extensions import cors,limiter 
from dotenv import load_dotenv
from app.routes.admin_routes import admin 
from app.routes.appointment_routes import appointment 
from app.routes.page_routes import main 
from app.routes.auth_routes import auth 
from app.routes.staff_routes import staff
from app.routes.queue_and_schedule import queue_and_schedule 

load_dotenv()
 

def create_app():

    app = Flask( __name__,template_folder="frontend/pages")

    app.config["SUPABASE_URL"] = os.environ.get("SUPABASE_URL")
    app.config["SUPABASE_KEY"] = os.environ.get("SUPABASE_KEY")

    app.config.update(
        SECRET_KEY="supersecret",
        PERMANENT_SESSION_LIFETIME=timedelta(minutes=30)
    )

    cors.init_app(app, supports_credentials=True)
    limiter.init_app(app)
    app.register_blueprint(main)
    app.register_blueprint(auth)
    app.register_blueprint(admin)
    app.register_blueprint(appointment)
    app.register_blueprint(staff)
    app.register_blueprint(queue_and_schedule)
    return app





if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)

