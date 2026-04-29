import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.portal import Group, Portal
from app.core.security import get_password_hash, encrypt_password

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def user(db):
    u = User(username="testuser", password_hash=get_password_hash("testpass123"))
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def auth_headers(client, user):
    resp = client.post("/api/auth/login", json={"username": "testuser", "password": "testpass123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def group(db, user):
    g = Group(name="Test Group", icon="server", sort_order=0, user_id=user.id)
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


@pytest.fixture
def portal(db, user, group):
    p = Portal(
        name="Test Portal",
        url="https://example.com",
        icon="",
        group_id=group.id,
        sort_order=0,
        account="admin",
        password=encrypt_password("secret123"),
        notes="test notes",
        is_visible=True,
        open_in_new_tab=True,
        user_id=user.id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
