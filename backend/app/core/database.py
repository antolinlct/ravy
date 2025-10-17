from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# URL complète vers la base PostgreSQL (à partir des variables du .env)
DATABASE_URL = (
    f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

# Création du moteur asynchrone
engine = create_async_engine(DATABASE_URL, echo=True)

# Création du générateur de sessions
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Dépendance FastAPI pour récupérer une session DB dans les routes
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
