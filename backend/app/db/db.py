import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')
if db_url:
        engine = create_engine(db_url)
