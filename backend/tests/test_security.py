from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    encrypt_password,
    decrypt_password,
)
from datetime import timedelta


class TestPasswordHash:
    def test_hash_and_verify(self):
        hashed = get_password_hash("mypassword")
        assert hashed != "mypassword"
        assert verify_password("mypassword", hashed) is True

    def test_wrong_password(self):
        hashed = get_password_hash("mypassword")
        assert verify_password("wrong", hashed) is False

    def test_different_hashes(self):
        h1 = get_password_hash("same")
        h2 = get_password_hash("same")
        assert h1 != h2


class TestJWT:
    def test_create_and_decode(self):
        token = create_access_token({"sub": "admin"})
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "admin"
        assert "exp" in payload

    def test_custom_expiry(self):
        token = create_access_token({"sub": "u"}, expires_delta=timedelta(seconds=5))
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "u"

    def test_invalid_token(self):
        assert decode_access_token("invalid.token.here") is None

    def test_expired_token(self):
        token = create_access_token({"sub": "u"}, expires_delta=timedelta(seconds=-1))
        assert decode_access_token(token) is None

    def test_tampered_token(self):
        token = create_access_token({"sub": "admin"})
        tampered = token[:-5] + "XXXXX"
        assert decode_access_token(tampered) is None


class TestFernetEncryption:
    def test_encrypt_decrypt(self):
        encrypted = encrypt_password("mySecretPassword")
        assert encrypted != "mySecretPassword"
        decrypted = decrypt_password(encrypted)
        assert decrypted == "mySecretPassword"

    def test_empty_string(self):
        assert encrypt_password("") == ""
        assert decrypt_password("") == ""

    def test_different_ciphertext(self):
        e1 = encrypt_password("same")
        e2 = encrypt_password("same")
        assert e1 != e2

    def test_decrypt_invalid(self):
        assert decrypt_password("not-valid-fernet") == ""

    def test_unicode(self):
        val = "密码🔐test"
        assert decrypt_password(encrypt_password(val)) == val

    def test_long_password(self):
        val = "a" * 1000
        assert decrypt_password(encrypt_password(val)) == val
