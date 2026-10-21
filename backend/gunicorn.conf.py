"""Bounded production workers; tune replicas against measured load and DB budget."""

import os

bind = "0.0.0.0:8000"
worker_class = "gthread"
workers = int(os.getenv("GUNICORN_WORKERS", "2"))
threads = int(os.getenv("GUNICORN_THREADS", "4"))
worker_connections = int(os.getenv("GUNICORN_WORKER_CONNECTIONS", "256"))
backlog = 2048
timeout = 45
graceful_timeout = 45
keepalive = 5
max_requests = 2000
max_requests_jitter = 200
accesslog = "-"
errorlog = "-"
access_log_format = '%(h)s %(m)s %(U)s %(s)s %(L)s'
# Do not preload: each worker creates its own Django/psycopg pool after fork.
preload_app = False
