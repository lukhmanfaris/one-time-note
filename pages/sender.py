import streamlit as st
from cryptography.fernet import InvalidToken

from modules.crypto import encrypt
from modules.key_gen import generate_unique_key
from modules.storage import NoteStorage

storage = NoteStorage()

TTL_OPTIONS = {
    "1 hour":   3600,
    "24 hours": 86400,
    "7 days":   604800,
}

# ── Header ────────────────────────────────────────────────────────────────────
if st.button("Back to Home"):
    st.switch_page("pages/home.py")

st.markdown("<h1 class='page-title'>Send a Secret Note</h1>", unsafe_allow_html=True)
st.markdown(
    "<p class='page-subtitle'>Write your message below. "
    "A unique key will be generated — share it with the recipient.</p>",
    unsafe_allow_html=True,
)

# ── Form ──────────────────────────────────────────────────────────────────────
with st.form("sender_form", clear_on_submit=False):
    note_content = st.text_area(
        "Your secret note",
        placeholder="Paste a link, password, or any text you want to share securely...",
        height=180,
    )
    col_ttl, col_spacer = st.columns([2, 3])
    with col_ttl:
        ttl_label = st.selectbox("Expires after", list(TTL_OPTIONS.keys()))
    submitted = st.form_submit_button("Generate Key & Save Note")

# ── Result ────────────────────────────────────────────────────────────────────
if submitted:
    if not note_content.strip():
        st.warning("Please enter a note before saving.")
    else:
        access_key = generate_unique_key()
        try:
            ciphertext = encrypt(note_content.strip(), access_key)
            storage.save(access_key, ciphertext, TTL_OPTIONS[ttl_label])
            st.success("Note saved! Share the key below with the recipient.")
            with st.container(border=True):
                st.markdown("**Your access key** — click to copy:")
                st.code(access_key, language=None)
                st.markdown(
                    f"<p style='color:#6b7280; font-size:0.85rem; margin-top:0.3rem;'>"
                    f"This note will expire in <strong>{ttl_label}</strong>. "
                    f"It can only be read <strong>once</strong>.</p>",
                    unsafe_allow_html=True,
                )
        except Exception:
            st.error("Something went wrong while saving the note. Please try again.")
