import streamlit as st

_CSS = """
<style>
/* ── Hide default Streamlit chrome ── */
#MainMenu        { visibility: hidden; }
footer           { visibility: hidden; }
header           { visibility: hidden; }

/* ── App background ── */
.stApp {
    background-color: #f0f2f6;
}

/* ── Hero section ── */
.hero {
    text-align: center;
    padding: 2.5rem 1rem 1.5rem;
}
.hero h1 {
    font-size: 2.6rem;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 0.25rem;
}
.hero p {
    font-size: 1.1rem;
    color: #555;
    margin-top: 0;
}

/* ── Nav cards ── */
.nav-card {
    background: #ffffff;
    border-radius: 14px;
    padding: 1.8rem 1.5rem;
    box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    border: 1px solid #e4e7ed;
    text-align: center;
    height: 100%;
    transition: box-shadow 0.2s;
}
.nav-card:hover {
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
}
.nav-card .card-icon {
    font-size: 2.8rem;
    margin-bottom: 0.5rem;
}
.nav-card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0.5rem 0 0.4rem;
}
.nav-card p {
    font-size: 0.9rem;
    color: #6b7280;
    margin: 0 0 1.2rem;
}

/* ── Page headings ── */
h1.page-title {
    font-size: 1.9rem;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 0.2rem;
}
p.page-subtitle {
    color: #6b7280;
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
}

/* ── Primary button (full width inside containers) ── */
.stButton > button {
    width: 100%;
    border-radius: 8px;
    padding: 0.6rem 1.2rem;
    font-weight: 600;
    font-size: 0.95rem;
    border: none;
    background: #4f46e5;
    color: #ffffff;
    transition: background 0.2s, transform 0.1s;
}
.stButton > button:hover {
    background: #4338ca;
    transform: translateY(-1px);
}
.stButton > button:active {
    transform: translateY(0);
}

/* ── Code block (key display) ── */
.stCode {
    border-radius: 10px;
    font-size: 1.4rem !important;
    letter-spacing: 0.2em;
}

/* ── Success / warning / error banners ── */
.stSuccess, .stWarning, .stError {
    border-radius: 8px;
}

/* ── Divider ── */
hr {
    border: none;
    border-top: 1px solid #e4e7ed;
    margin: 1rem 0;
}
</style>
"""


def apply_global_styles() -> None:
    """Inject shared CSS into the page. Call once at the top of every page."""
    st.markdown(_CSS, unsafe_allow_html=True)


def page_setup(title: str, icon: str = None, layout: str = "centered") -> None:
    """Configure page metadata and apply global styles."""
    st.set_page_config(page_title=title, page_icon=icon, layout=layout)
    apply_global_styles()
