class TestCheckSetup:
    def test_no_user(self, client):
        resp = client.get("/api/auth/check")
        assert resp.status_code == 200
        assert resp.json() == {"setup_complete": False}

    def test_has_user(self, client, user):
        resp = client.get("/api/auth/check")
        assert resp.json() == {"setup_complete": True}


class TestSetup:
    def test_first_setup(self, client):
        resp = client.post("/api/auth/setup", json={"username": "admin", "password": "pass123"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_duplicate_setup(self, client, user):
        resp = client.post("/api/auth/setup", json={"username": "other", "password": "pass"})
        assert resp.status_code == 400
        assert "already exists" in resp.json()["detail"]

    def test_missing_fields(self, client):
        resp = client.post("/api/auth/setup", json={"username": "a"})
        assert resp.status_code == 422


class TestLogin:
    def test_success(self, client, user):
        resp = client.post("/api/auth/login", json={"username": "testuser", "password": "testpass123"})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_wrong_password(self, client, user):
        resp = client.post("/api/auth/login", json={"username": "testuser", "password": "wrong"})
        assert resp.status_code == 401

    def test_wrong_username(self, client, user):
        resp = client.post("/api/auth/login", json={"username": "nobody", "password": "testpass123"})
        assert resp.status_code == 401


class TestMe:
    def test_authenticated(self, client, auth_headers):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["username"] == "testuser"

    def test_no_token(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_invalid_token(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer bad.token.here"})
        assert resp.status_code == 401


class TestSkill:
    def test_returns_skill(self, client, auth_headers):
        resp = client.get("/api/auth/skill", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "skill" in data
        assert "X-Portals AI Skill" in data["skill"]
        assert "Bearer" in data["skill"]
        assert "/api/portals" in data["skill"]
        assert "/api/groups" in data["skill"]
        assert "curl" in data["skill"]

    def test_no_auth(self, client):
        resp = client.get("/api/auth/skill")
        assert resp.status_code == 401

    def test_contains_token(self, client, auth_headers):
        resp = client.get("/api/auth/skill", headers=auth_headers)
        skill = resp.json()["skill"]
        assert "Authorization: Bearer eyJ" in skill
