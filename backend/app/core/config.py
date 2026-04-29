import os

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "change-me-32-byte-key-1234567890ab")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/portals.db")
