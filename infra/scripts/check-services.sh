#!/usr/bin/env bash

set -euo pipefail

docker ps --format '{{.Names}}' | grep -E '^(kafka|minio|PostgreSQL|redis)$'

