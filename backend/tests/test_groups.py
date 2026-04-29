class TestListGroups:
    def test_empty(self, client, auth_headers):
        resp = client.get("/api/groups", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_with_groups(self, client, auth_headers, group):
        resp = client.get("/api/groups", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Group"

    def test_unauthenticated(self, client):
        resp = client.get("/api/groups")
        assert resp.status_code == 401

    def test_ordered_by_sort(self, client, auth_headers, db, user):
        from app.models.portal import Group
        g1 = Group(name="B", sort_order=2, user_id=user.id)
        g2 = Group(name="A", sort_order=1, user_id=user.id)
        db.add_all([g1, g2])
        db.commit()
        resp = client.get("/api/groups", headers=auth_headers)
        names = [g["name"] for g in resp.json()]
        assert names == ["A", "B"]


class TestCreateGroup:
    def test_success(self, client, auth_headers):
        resp = client.post("/api/groups", json={"name": "Servers", "icon": "server"}, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Servers"
        assert data["icon"] == "server"
        assert "id" in data

    def test_default_values(self, client, auth_headers):
        resp = client.post("/api/groups", json={"name": "G"}, headers=auth_headers)
        data = resp.json()
        assert data["icon"] == ""
        assert data["sort_order"] == 0

    def test_unauthenticated(self, client):
        resp = client.post("/api/groups", json={"name": "G"})
        assert resp.status_code == 401

    def test_missing_name(self, client, auth_headers):
        resp = client.post("/api/groups", json={"icon": "x"}, headers=auth_headers)
        assert resp.status_code == 422


class TestUpdateGroup:
    def test_update_name(self, client, auth_headers, group):
        resp = client.put(f"/api/groups/{group.id}", json={"name": "Renamed"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed"

    def test_update_sort_order(self, client, auth_headers, group):
        resp = client.put(f"/api/groups/{group.id}", json={"sort_order": 99}, headers=auth_headers)
        assert resp.json()["sort_order"] == 99

    def test_not_found(self, client, auth_headers):
        resp = client.put("/api/groups/9999", json={"name": "X"}, headers=auth_headers)
        assert resp.status_code == 404

    def test_unauthenticated(self, client, group):
        resp = client.put(f"/api/groups/{group.id}", json={"name": "X"})
        assert resp.status_code == 401


class TestDeleteGroup:
    def test_success(self, client, auth_headers, group):
        resp = client.delete(f"/api/groups/{group.id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True
        resp2 = client.get("/api/groups", headers=auth_headers)
        assert len(resp2.json()) == 0

    def test_not_found(self, client, auth_headers):
        resp = client.delete("/api/groups/9999", headers=auth_headers)
        assert resp.status_code == 404

    def test_unauthenticated(self, client, group):
        resp = client.delete(f"/api/groups/{group.id}")
        assert resp.status_code == 401
