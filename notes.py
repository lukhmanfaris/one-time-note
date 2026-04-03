import streamlit as st

from modules.styles import page_setup

page_setup("One-Time Note")

home   = st.Page("pages/home.py",     title="Home",           default=True)
sender = st.Page("pages/sender.py",   title="Send a Note")
receiver = st.Page("pages/receiver.py", title="Retrieve a Note")

pg = st.navigation([home, sender, receiver], position="hidden")
pg.run()
