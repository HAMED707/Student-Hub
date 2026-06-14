#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
for i in $(seq 1 30); do
    python manage.py migrate --noinput && break
    echo "  attempt $i/30 failed — retrying in 3s..."
    sleep 3
done

python manage.py collectstatic --noinput --clear

exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
