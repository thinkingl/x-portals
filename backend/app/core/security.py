from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import base64
import hashlib
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, ENCRYPTION_KEY

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _get_fernet_key() -> bytes:
    key = hashlib.sha256(ENCRYPTION_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key)


fernet = Fernet(_get_fernet_key())


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def encrypt_password(password: str) -> str:
    if not password:
        return ""
    return fernet.encrypt(password.encode()).decode()


def decrypt_password(encrypted: str) -> str:
    if not encrypted:
        return ""
    try:
        return fernet.decrypt(encrypted.encode()).decode()
    except Exception:
        return ""
