from sqlmodel import SQLModel, create_engine, Session
import os

DATABASE_FILE = os.path.join(os.path.dirname(__file__), "hackathon_coach.db")
DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

def create_db_and_tables():
    """Initializes the SQLite database and creates SQLModel tables."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """FastAPI dependency for database sessions."""
    with Session(engine) as session:
        yield session
