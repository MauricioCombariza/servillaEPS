#!/bin/sh
# wait-for-postgres.sh

set -e

# El host y el puerto se pueden pasar como argumentos
host="$1"
shift
cmd="$@"

# Bucle hasta que podamos conectarnos a PostgreSQL
# pg_isready es una utilidad de cliente de PostgreSQL que comprueba el estado de la conexión
until pg_isready -h "$host" -p 5432 -U "farmacia_user"; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
# Ejecuta el comando principal que se le pasó al script (nuestro comando de uvicorn)
exec $cmd