import secrets
import string

KEY_LENGTH = 8
ALPHABET = string.ascii_letters + string.digits


def generate_unique_key(length: int = KEY_LENGTH) -> str:
    """
    Generate a cryptographically secure random access key.
    Uses secrets.choice() (OS-level entropy) instead of random.choice().
    """
    return ''.join(secrets.choice(ALPHABET) for _ in range(length))
