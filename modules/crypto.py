import base64

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Fixed salt — acceptable for this prototype because each note has a unique
# access key, making rainbow tables impractical. If this app ever moves to
# persistent storage, migrate to per-note random salts stored with the record.
_SALT: bytes = b"one-time-note-fixed-salt-v1"

# OWASP 2023 recommended minimum for PBKDF2-SHA256.
# Adds ~100-300ms latency per operation — intentional brute-force resistance.
_ITERATIONS: int = 260_000


def _derive_key(access_key: str) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_SALT,
        iterations=_ITERATIONS,
    )
    return base64.urlsafe_b64encode(kdf.derive(access_key.encode("utf-8")))


def encrypt(plaintext: str, access_key: str) -> bytes:
    """Encrypt plaintext using a key derived from access_key. Returns Fernet token."""
    return Fernet(_derive_key(access_key)).encrypt(plaintext.encode("utf-8"))


def decrypt(ciphertext: bytes, access_key: str) -> str:
    """Decrypt a Fernet token using a key derived from access_key.
    Raises cryptography.fernet.InvalidToken if the key is wrong or data is tampered."""
    return Fernet(_derive_key(access_key)).decrypt(ciphertext).decode("utf-8")
