from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.user import User
from app.schemas.schemas import UserCreate, UserLogin, Token

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    username = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_optional_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User | None:
    if not token:
        return None
    payload = decode_access_token(token)
    if payload is None:
        return None
    username = payload.get("sub")
    if username is None:
        return None
    return db.query(User).filter(User.username == username).first()


@router.post("/setup", response_model=Token)
def setup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists. Use login instead.")
    user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
    )
    db.add(user)
    db.commit()
    token = create_access_token(data={"sub": user.username})
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": user.username})
    return Token(access_token=token)


@router.get("/check")
def check_setup(db: Session = Depends(get_db)):
    has_user = db.query(User).first() is not None
    return {"setup_complete": has_user}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "id": current_user.id}


@router.get("/skill")
def get_skill(current_user: User = Depends(get_current_user), request: Request = None):
    token = create_access_token(data={"sub": current_user.username})
    base_url = str(request.base_url).rstrip("/") if request else "http://localhost:8001"
    skill = f"""# X-Portals AI Skill

You are an AI assistant managing personal service portals via the X-Portals API.

## Base URL
{base_url}

## Authentication
All management endpoints require a Bearer token. Include it in the Authorization header:
```
Authorization: Bearer {token}
```

## Endpoints

### Auth
- `GET /api/auth/check` — Check if setup is complete (no auth needed)
- `POST /api/auth/login` — Login, body: `{{"username": "...", "password": "..."}}`, returns `{{"access_token": "...", "token_type": "bearer"}}`
- `GET /api/auth/me` — Get current user info (auth required)

### Portals (auth required)
- `GET /api/portals` — List all portals (includes decrypted account/password)
- `POST /api/portals` — Create portal, body:
  ```json
  {{"name": "My Router", "url": "http://192.168.1.1", "icon": "", "group_id": null, "sort_order": 0, "account": "admin", "password": "secret", "notes": "some notes", "is_visible": true, "open_in_new_tab": true}}
  ```
- `PUT /api/portals/:id` — Update portal (partial update, only send fields to change)
- `DELETE /api/portals/:id` — Delete portal
- `POST /api/portals/sort` — Batch update sort order, body: `{{"items": [{{"id": 1, "sort_order": 0, "group_id": null}}]}}`

### Portals (public, no auth)
- `GET /api/portals/public` — List visible portals only (no sensitive fields)

### Groups (auth required)
- `GET /api/groups` — List all groups
- `POST /api/groups` — Create group, body: `{{"name": "Servers", "icon": "server", "sort_order": 0}}`
- `PUT /api/groups/:id` — Update group (partial update)
- `DELETE /api/groups/:id` — Delete group (portals in this group become ungrouped)

## Portal Fields
| Field | Type | Description |
|-------|------|-------------|
| name | string | Display name (required) |
| url | string | Access URL (required) |
| icon | string | Icon URL, empty = auto favicon |
| group_id | int/null | Group ID |
| sort_order | int | Display order |
| account | string | Login account |
| password | string | Login password (encrypted in DB, returned decrypted) |
| notes | string | Notes |
| is_visible | bool | Show on public page |
| open_in_new_tab | bool | Open in new tab |

## Group Fields
| Field | Type | Description |
|-------|------|-------------|
| name | string | Group name (required) |
| icon | string | Icon name |
| sort_order | int | Display order |

## Examples (curl)

```bash
# List all portals
curl -s -H "Authorization: Bearer {token}" {base_url}/api/portals | python3 -m json.tool

# Create a portal
curl -s -X POST -H "Authorization: Bearer {token}" -H "Content-Type: application/json" \\
  -d '{{"name":"PVE","url":"https://pve.local:8006","account":"root@pam","password":"mysecret","notes":"跳过证书警告"}}' \\
  {base_url}/api/portals

# Update a portal (partial)
curl -s -X PUT -H "Authorization: Bearer {token}" -H "Content-Type: application/json" \\
  -d '{{"notes":"已更新备注"}}' \\
  {base_url}/api/portals/1

# Delete a portal
curl -s -X DELETE -H "Authorization: Bearer {token}" {base_url}/api/portals/1

# Create a group
curl -s -X POST -H "Authorization: Bearer {token}" -H "Content-Type: application/json" \\
  -d '{{"name":"Home Lab","sort_order":0}}' \\
  {base_url}/api/groups
```
"""
    return {"skill": skill}
