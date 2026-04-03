import streamlit as st
from cryptography.fernet import InvalidToken

from modules.crypto import decrypt
from modules.storage import NoteStorage

storage = NoteStorage()

# ── Header ────────────────────────────────────────────────────────────────────
if st.button("Back to Home"):
    st.switch_page("pages/home.py")

st.markdown("<h1 class='page-title'>Retrieve a Secret Note</h1>", unsafe_allow_html=True)
st.markdown(
    "<p class='page-subtitle'>Enter the key the sender shared with you. "
    "The note will be shown once, then permanently deleted.</p>",
    unsafe_allow_html=True,
)

# ── Form ──────────────────────────────────────────────────────────────────────
with st.form("receiver_form"):
    input_key = st.text_input(
        "Access key",
        placeholder="e.g. Ab3Xy9Zq",
        max_chars=32,
    )
    submitted = st.form_submit_button("View Note")

# ── Result ────────────────────────────────────────────────────────────────────
if submitted:
    if not input_key.strip():
        st.warning("Please enter an access key.")
    else:
        result, ciphertext = storage.get(input_key.strip())

        if result == "ok":
            try:
                plaintext = decrypt(ciphertext, input_key.strip())
                st.success("Note retrieved! It has been permanently deleted.")
                with st.container(border=True):
                    st.markdown(
                        "<p style='color:#6b7280; font-size:0.8rem; margin-bottom:0.5rem;'>"
                        "Decrypted note</p>",
                        unsafe_allow_html=True,
                    )
                    st.divider()
                    st.markdown(
                        f"<div style='font-size:1rem; color:#1a1a2e; white-space:pre-wrap; "
                        f"word-break:break-word;'>{plaintext}</div>",
                        unsafe_allow_html=True,
                    )
            except InvalidToken:
                st.error("Decryption failed. The note could not be read.")

        elif result == "expired":
            st.warning("This note has expired and has been deleted.")

        elif result == "not_found":
            st.warning("Invalid key. Please check and try again.")
