import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://tracker:tracker_secret@localhost:5432/christoph47",
)
