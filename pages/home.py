import streamlit as st

from modules.storage import NoteStorage

NoteStorage().cleanup_expired()

# ── Hero ──────────────────────────────────────────────────────────────────────
st.markdown(
    """
    <div class="hero">
        <h1>One-Time Note</h1>
        <p>Share secrets safely — no login, no trace, one read only.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

st.write("")

# ── Nav cards ─────────────────────────────────────────────────────────────────
left, right = st.columns(2, gap="large")

with left:
    with st.container(border=True):
        st.markdown(
            """
            <div style="text-align:center; padding:0.5rem 0 0.8rem;">
                <h3 style="margin:0.4rem 0 0.3rem; font-weight:700; color:#1a1a2e;">Send a Note</h3>
                <p style="color:#6b7280; font-size:0.9rem; margin:0 0 1rem;">
                    Type your secret, generate a key,<br>and share it with someone.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("Send a Note", key="btn_sender"):
            st.switch_page("pages/sender.py")

with right:
    with st.container(border=True):
        st.markdown(
            """
            <div style="text-align:center; padding:0.5rem 0 0.8rem;">
                <h3 style="margin:0.4rem 0 0.3rem; font-weight:700; color:#1a1a2e;">Retrieve a Note</h3>
                <p style="color:#6b7280; font-size:0.9rem; margin:0 0 1rem;">
                    Enter the key you received<br>to read the secret note.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("Retrieve a Note", key="btn_receiver"):
            st.switch_page("pages/receiver.py")

st.write("")
st.markdown(
    "<p style='text-align:center; color:#9ca3af; font-size:0.8rem;'>"
    "Notes are encrypted, stored in memory, and deleted after reading."
    "</p>",
    unsafe_allow_html=True,
)
