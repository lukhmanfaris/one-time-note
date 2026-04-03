import time
from typing import Literal, Optional, Tuple

import streamlit as st

_SESSION_KEY = "notes"

# Return type for get(): status + optional ciphertext
GetResult = Literal["ok", "expired", "not_found"]


class NoteStorage:
    """
    In-memory note store backed by st.session_state.

    Each record shape:
        {
            "ciphertext": bytes,       # Fernet-encrypted note content
            "created_at": float,       # time.time() at save
            "ttl_seconds": int         # expiry window
        }

    Notes are deleted on first successful retrieval (one-time read).
    Expired notes are deleted when accessed or when cleanup_expired() is called.
    """

    def __init__(self) -> None:
        if _SESSION_KEY not in st.session_state:
            st.session_state[_SESSION_KEY] = {}

    @property
    def _store(self) -> dict:
        return st.session_state[_SESSION_KEY]

    def save(self, access_key: str, ciphertext: bytes, ttl_seconds: int) -> None:
        """Persist an encrypted note under access_key with the given TTL."""
        self._store[access_key] = {
            "ciphertext": ciphertext,
            "created_at": time.time(),
            "ttl_seconds": ttl_seconds,
        }

    def get(self, access_key: str) -> Tuple[GetResult, Optional[bytes]]:
        """
        Retrieve and immediately delete a note by access_key.

        Returns:
            ("ok", ciphertext)    — note found, valid, now deleted (one-time read)
            ("expired", None)     — note existed but TTL elapsed; deleted
            ("not_found", None)   — no note with this key
        """
        record = self._store.get(access_key)
        if record is None:
            return "not_found", None

        age = time.time() - record["created_at"]
        if age > record["ttl_seconds"]:
            del self._store[access_key]
            return "expired", None

        ciphertext = record["ciphertext"]
        del self._store[access_key]
        return "ok", ciphertext

    def cleanup_expired(self) -> int:
        """Delete all expired notes. Returns count removed. Call on each page load."""
        now = time.time()
        expired = [
            k for k, v in self._store.items()
            if now - v["created_at"] > v["ttl_seconds"]
        ]
        for k in expired:
            del self._store[k]
        return len(expired)
