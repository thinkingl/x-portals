from app.models.portal import Portal
from app.models.user import User
from app.core.security import encrypt_password, get_password_hash


class TestListPortals:
    def test_empty(self, client, auth_headers):
        resp = client.get("/api/portals", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_with_portals(self, client, auth_headers, portal):
        resp = client.get("/api/portals", headers=auth_headers)
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Portal"
        assert data[0]["url"] == "https://example.com"

    def test_password_decrypted(self, client, auth_headers, portal):
        resp = client.get("/api/portals", headers=auth_headers)
        assert resp.json()[0]["password"] == "secret123"

    def test_unauthenticated(self, client):
        resp = client.get("/api/portals")
        assert resp.status_code == 401

    def test_ordered_by_sort(self, client, auth_headers, db, user):
        p1 = Portal(name="B", url="https://b.com", sort_order=2, user_id=user.id)
        p2 = Portal(name="A", url="https://a.com", sort_order=1, user_id=user.id)
        db.add_all([p1, p2])
        db.commit()
        resp = client.get("/api/portals", headers=auth_headers)
        names = [p["name"] for p in resp.json()]
        assert names == ["A", "B"]


class TestListPortalsPublic:
    def test_empty(self, client):
        resp = client.get("/api/portals/public")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_visible_only(self, client, db, user, group):
        Portal(name="Visible", url="https://v.com", is_visible=True, user_id=user.id)
        db.add(Portal(name="Hidden", url="https://h.com", is_visible=False, user_id=user.id))
        db.commit()
        # Add visible separately to get proper default
        db.query(Portal).filter(Portal.name == "Visible").delete()
        p1 = Portal(name="Visible", url="https://v.com", is_visible=True, user_id=user.id)
        p2 = Portal(name="Hidden", url="https://h.com", is_visible=False, user_id=user.id)
        db.add_all([p1, p2])
        db.commit()
        resp = client.get("/api/portals/public")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Visible"

    def test_no_password_in_public(self, client, db, user):
        p = Portal(
            name="P", url="https://p.com", account="admin",
            password=encrypt_password("secret"), is_visible=True, user_id=user.id,
        )
        db.add(p)
        db.commit()
        resp = client.get("/api/portals/public")
        data = resp.json()[0]
        assert "password" not in data
        assert "account" not in data
        assert "notes" not in data


class TestCreatePortal:
    def test_success(self, client, auth_headers):
        resp = client.post("/api/portals", json={
            "name": "My Router", "url": "http://192.168.1.1",
            "account": "admin", "password": "pass123",
        }, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "My Router"
        assert data["url"] == "http://192.168.1.1"
        assert data["account"] == "admin"
        assert data["password"] == "pass123"

    def test_with_group(self, client, auth_headers, group):
        resp = client.post("/api/portals", json={
            "name": "P", "url": "https://p.com", "group_id": group.id,
        }, headers=auth_headers)
        assert resp.json()["group_id"] == group.id

    def test_default_values(self, client, auth_headers):
        resp = client.post("/api/portals", json={"name": "P", "url": "https://p.com"}, headers=auth_headers)
        data = resp.json()
        assert data["is_visible"] is True
        assert data["open_in_new_tab"] is True
        assert data["sort_order"] == 0
        assert data["notes"] == ""

    def test_unauthenticated(self, client):
        resp = client.post("/api/portals", json={"name": "P", "url": "https://p.com"})
        assert resp.status_code == 401

    def test_missing_required(self, client, auth_headers):
        resp = client.post("/api/portals", json={"name": "P"}, headers=auth_headers)
        assert resp.status_code == 422

    def test_password_encrypted_in_db(self, client, auth_headers, db):
        client.post("/api/portals", json={
            "name": "P", "url": "https://p.com", "password": "mypassword",
        }, headers=auth_headers)
        p = db.query(Portal).first()
        assert p.password != "mypassword"
        assert len(p.password) > 0


class TestUpdatePortal:
    def test_update_name(self, client, auth_headers, portal):
        resp = client.put(f"/api/portals/{portal.id}", json={"name": "Renamed"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed"

    def test_update_password(self, client, auth_headers, portal):
        resp = client.put(f"/api/portals/{portal.id}", json={"password": "newpass"}, headers=auth_headers)
        assert resp.json()["password"] == "newpass"

    def test_update_password_encrypted(self, client, auth_headers, portal, db):
        client.put(f"/api/portals/{portal.id}", json={"password": "newpass"}, headers=auth_headers)
        db.refresh(portal)
        assert portal.password != "newpass"

    def test_update_visibility(self, client, auth_headers, portal):
        resp = client.put(f"/api/portals/{portal.id}", json={"is_visible": False}, headers=auth_headers)
        assert resp.json()["is_visible"] is False

    def test_update_group(self, client, auth_headers, portal, group, db):
        from app.models.portal import Group
        g2 = Group(name="G2", user_id=portal.user_id)
        db.add(g2)
        db.commit()
        db.refresh(g2)
        resp = client.put(f"/api/portals/{portal.id}", json={"group_id": g2.id}, headers=auth_headers)
        assert resp.json()["group_id"] == g2.id

    def test_update_url(self, client, auth_headers, portal):
        resp = client.put(f"/api/portals/{portal.id}", json={"url": "https://new.com"}, headers=auth_headers)
        assert resp.json()["url"] == "https://new.com"

    def test_not_found(self, client, auth_headers):
        resp = client.put("/api/portals/9999", json={"name": "X"}, headers=auth_headers)
        assert resp.status_code == 404

    def test_unauthenticated(self, client, portal):
        resp = client.put(f"/api/portals/{portal.id}", json={"name": "X"})
        assert resp.status_code == 401


class TestDeletePortal:
    def test_success(self, client, auth_headers, portal):
        resp = client.delete(f"/api/portals/{portal.id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True
        resp2 = client.get("/api/portals", headers=auth_headers)
        assert len(resp2.json()) == 0

    def test_not_found(self, client, auth_headers):
        resp = client.delete("/api/portals/9999", headers=auth_headers)
        assert resp.status_code == 404

    def test_unauthenticated(self, client, portal):
        resp = client.delete(f"/api/portals/{portal.id}")
        assert resp.status_code == 401


class TestBatchSort:
    def test_update_sort_order(self, client, auth_headers, db, user):
        p1 = Portal(name="A", url="https://a.com", sort_order=0, user_id=user.id)
        p2 = Portal(name="B", url="https://b.com", sort_order=1, user_id=user.id)
        db.add_all([p1, p2])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)
        resp = client.post("/api/portals/sort", json={
            "items": [
                {"id": p1.id, "sort_order": 10},
                {"id": p2.id, "sort_order": 5},
            ]
        }, headers=auth_headers)
        assert resp.status_code == 200
        db.refresh(p1)
        db.refresh(p2)
        assert p1.sort_order == 10
        assert p2.sort_order == 5

    def test_update_group_via_sort(self, client, auth_headers, db, user, group):
        p = Portal(name="P", url="https://p.com", sort_order=0, user_id=user.id)
        db.add(p)
        db.commit()
        db.refresh(p)
        client.post("/api/portals/sort", json={
            "items": [{"id": p.id, "sort_order": 0, "group_id": group.id}]
        }, headers=auth_headers)
        db.refresh(p)
        assert p.group_id == group.id

    def test_unauthenticated(self, client):
        resp = client.post("/api/portals/sort", json={"items": []})
        assert resp.status_code == 401


class TestCrossUserIsolation:
    def test_user_cannot_see_other_portals(self, client, db):
        u1 = User(username="u1", password_hash=get_password_hash("p1"))
        u2 = User(username="u2", password_hash=get_password_hash("p2"))
        db.add_all([u1, u2])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)
        p = Portal(name="U1 Portal", url="https://u1.com", user_id=u1.id)
        db.add(p)
        db.commit()

        r1 = client.post("/api/auth/login", json={"username": "u2", "password": "p2"})
        h2 = {"Authorization": f"Bearer {r1.json()['access_token']}"}
        resp = client.get("/api/portals", headers=h2)
        assert len(resp.json()) == 0

    def test_user_cannot_delete_other_portal(self, client, db):
        u1 = User(username="u1", password_hash=get_password_hash("p1"))
        u2 = User(username="u2", password_hash=get_password_hash("p2"))
        db.add_all([u1, u2])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)
        p = Portal(name="U1 Portal", url="https://u1.com", user_id=u1.id)
        db.add(p)
        db.commit()
        db.refresh(p)

        r2 = client.post("/api/auth/login", json={"username": "u2", "password": "p2"})
        h2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}
        resp = client.delete(f"/api/portals/{p.id}", headers=h2)
        assert resp.status_code == 404
