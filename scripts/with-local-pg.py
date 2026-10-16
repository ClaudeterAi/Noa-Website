"""Boot an embedded Postgres (pgserver), export DATABASE_URL, run the given command, shut down.
Usage: python3 scripts/with-local-pg.py <cmd...>   (local development only; production uses RDS)"""
import os, subprocess, sys, pgserver
srv = pgserver.get_server(os.path.expanduser("~/pgdata"))
try:
    srv.psql("create database noa;")
except Exception:
    pass
env = dict(os.environ, DATABASE_URL="postgresql://postgres:@/noa?host=" + os.path.expanduser("~/pgdata"))
rc = subprocess.call(sys.argv[1:], env=env)
sys.exit(rc)
