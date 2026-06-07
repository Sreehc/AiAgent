#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASE_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEPLOY_CONF="${RELEASE_DIR}/.deploy/deploy.conf"
APP_ENV_SOURCE="${RELEASE_DIR}/.deploy/app.env"

if [[ ! -f "${DEPLOY_CONF}" ]]; then
  echo "deploy config not found: ${DEPLOY_CONF}" >&2
  exit 1
fi

if [[ ! -f "${APP_ENV_SOURCE}" ]]; then
  echo "app env not found: ${APP_ENV_SOURCE}" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "${DEPLOY_CONF}"

APP_NAME="${APP_NAME:-aiagent}"
APP_DOMAIN="${APP_DOMAIN:-_}"
APP_SERVER_NAMES="${APP_SERVER_NAMES:-${APP_DOMAIN}}"
APP_BACKEND_PORT="${APP_BACKEND_PORT:-18080}"
DEPLOY_MODE="${DEPLOY_MODE:-auto}"
DEPLOY_BASE_PATH="${DEPLOY_BASE_PATH:-/srv/deploy}"
APP_ROOT="${DEPLOY_BASE_PATH%/}/${APP_NAME}"
APP_SHARED_DIR="${APP_ROOT}/shared"
APP_LOG_DIR="${APP_SHARED_DIR}/logs"
CURRENT_LINK="${APP_ROOT}/current"
SHARED_RUNTIME_ROOT="${SHARED_RUNTIME_ROOT:-/srv/shared-web-runtime}"
SHARED_RUNTIME_IMAGE="${SHARED_RUNTIME_IMAGE:-shared-web-runtime:latest}"
SHARED_RUNTIME_CONTAINER="${SHARED_RUNTIME_CONTAINER:-shared-web-runtime}"
SHARED_RUNTIME_HTTP_PORT="${SHARED_RUNTIME_HTTP_PORT:-80}"
SHARED_RUNTIME_BACKEND_PORT_START="${SHARED_RUNTIME_BACKEND_PORT_START:-18080}"
SHARED_RUNTIME_BACKEND_PORT_END="${SHARED_RUNTIME_BACKEND_PORT_END:-18120}"
SHARED_RUNTIME_REBUILD="${SHARED_RUNTIME_REBUILD:-false}"
SERVICE_USER="${SERVICE_USER:-$(id -un)}"
SERVICE_GROUP="${SERVICE_GROUP:-$(id -gn)}"
NGINX_CONFIG_DIR="${NGINX_CONFIG_DIR:-}"
PRIMARY_SERVER_NAME="$(printf '%s\n' "${APP_SERVER_NAMES}" | awk '{print $1}')"

log() {
  printf '[deploy] %s\n' "$*"
}

require_root_runner() {
  if [[ "$(id -u)" -eq 0 ]]; then
    ROOT_RUNNER=""
    return
  fi

  if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
    ROOT_RUNNER="sudo"
    return
  fi

  echo "root or passwordless sudo is required on the deployment host" >&2
  exit 1
}

run_root() {
  if [[ -n "${ROOT_RUNNER}" ]]; then
    "${ROOT_RUNNER}" "$@"
  else
    "$@"
  fi
}

docker_run() {
  if docker ps >/dev/null 2>&1; then
    docker "$@"
  else
    run_root docker "$@"
  fi
}

java_major_version() {
  local version
  version="$(
    java -version 2>&1 \
      | awk -F '"' '/version/ {print $2; exit}' \
      | awk -F '.' '{print $1}'
  )"
  if [[ -z "${version}" ]]; then
    echo 0
    return
  fi
  echo "${version}"
}

has_native_runtime() {
  command -v nginx >/dev/null 2>&1 \
    && command -v systemctl >/dev/null 2>&1 \
    && command -v java >/dev/null 2>&1 \
    && [[ "$(java_major_version)" -ge 21 ]]
}

host_nginx_available() {
  command -v nginx >/dev/null 2>&1
}

has_docker_runtime() {
  command -v docker >/dev/null 2>&1 || run_root docker version >/dev/null 2>&1
}

ensure_layout() {
  run_root mkdir -p "${APP_ROOT}/releases" "${APP_SHARED_DIR}" "${APP_LOG_DIR}"
  run_root cp "${APP_ENV_SOURCE}" "${APP_SHARED_DIR}/app.env"
  run_root ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"
}

cleanup_releases() {
  mapfile -t releases < <(find "${APP_ROOT}/releases" -mindepth 1 -maxdepth 1 -type d -print0 | xargs -0 ls -1dt)
  if (( ${#releases[@]} <= 5 )); then
    return
  fi

  local index
  for (( index=5; index<${#releases[@]}; index++ )); do
    run_root rm -rf "${releases[index]}"
  done
}

render_nginx_conf() {
  cat <<EOF
server {
    listen 80;
    server_name ${APP_SERVER_NAMES};

    root ${CURRENT_LINK}/frontend/dist;
    index index.html;
    client_max_body_size 50m;

    location /api/ {
        proxy_pass http://127.0.0.1:${APP_BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /actuator/ {
        proxy_pass http://127.0.0.1:${APP_BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
}

write_native_nginx_conf() {
  local config_dir="${NGINX_CONFIG_DIR}"
  if [[ -z "${config_dir}" && -d /www/server/panel/vhost/nginx ]]; then
    config_dir="/www/server/panel/vhost/nginx"
  fi

  if [[ -n "${config_dir}" ]]; then
    run_root mkdir -p "${config_dir}"
    render_nginx_conf | run_root tee "${config_dir}/${APP_NAME}.conf" >/dev/null
  elif [[ -d /etc/nginx/sites-available && -d /etc/nginx/sites-enabled ]]; then
    local available="/etc/nginx/sites-available/${APP_NAME}.conf"
    local enabled="/etc/nginx/sites-enabled/${APP_NAME}.conf"
    render_nginx_conf | run_root tee "${available}" >/dev/null
    run_root ln -sfn "${available}" "${enabled}"
  else
    render_nginx_conf | run_root tee "/etc/nginx/conf.d/${APP_NAME}.conf" >/dev/null
  fi
}

write_systemd_service() {
  cat <<EOF | run_root tee "/etc/systemd/system/${APP_NAME}.service" >/dev/null
[Unit]
Description=${APP_NAME} backend
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_GROUP}
WorkingDirectory=${CURRENT_LINK}/backend
EnvironmentFile=${APP_SHARED_DIR}/app.env
ExecStart=/usr/bin/env java -jar ${CURRENT_LINK}/backend/app.jar --server.port=${APP_BACKEND_PORT}
SuccessExitStatus=143
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
}

deploy_native() {
  log "deploy mode: native"
  ensure_layout
  write_systemd_service
  write_native_nginx_conf
  run_root systemctl daemon-reload
  run_root systemctl enable "${APP_NAME}.service" >/dev/null
  run_root systemctl restart "${APP_NAME}.service"
  run_root nginx -t
  run_root systemctl reload nginx || run_root systemctl restart nginx
  curl --fail --silent --show-error --retry 10 --retry-connrefused \
    "http://127.0.0.1:${APP_BACKEND_PORT}/api/v1/health" >/dev/null
  cleanup_releases
}

ensure_shared_runtime_container() {
  local recreate_container="false"

  run_root mkdir -p \
    "${SHARED_RUNTIME_ROOT}/nginx/conf.d" \
    "${SHARED_RUNTIME_ROOT}/supervisor/conf.d" \
    "${SHARED_RUNTIME_ROOT}/logs"

  if [[ "${SHARED_RUNTIME_REBUILD}" == "true" ]] || ! docker_run image inspect "${SHARED_RUNTIME_IMAGE}" >/dev/null 2>&1; then
    log "building shared runtime image: ${SHARED_RUNTIME_IMAGE}"
    docker_run build \
      -t "${SHARED_RUNTIME_IMAGE}" \
      -f "${RELEASE_DIR}/infra/docker/shared-runtime/Dockerfile" \
      "${RELEASE_DIR}"
    recreate_container="${SHARED_RUNTIME_REBUILD}"
  fi

  if [[ "${recreate_container}" == "true" ]] && docker_run container inspect "${SHARED_RUNTIME_CONTAINER}" >/dev/null 2>&1; then
    log "recreating shared runtime container: ${SHARED_RUNTIME_CONTAINER}"
    docker_run rm -f "${SHARED_RUNTIME_CONTAINER}" >/dev/null
  fi

  if ! docker_run container inspect "${SHARED_RUNTIME_CONTAINER}" >/dev/null 2>&1; then
    log "starting shared runtime container: ${SHARED_RUNTIME_CONTAINER}"
    local port_args=(
      -p "127.0.0.1:${SHARED_RUNTIME_BACKEND_PORT_START}-${SHARED_RUNTIME_BACKEND_PORT_END}:${SHARED_RUNTIME_BACKEND_PORT_START}-${SHARED_RUNTIME_BACKEND_PORT_END}"
    )
    if ! host_nginx_available; then
      port_args+=(-p "${SHARED_RUNTIME_HTTP_PORT}:80")
    fi

    docker_run run -d \
      --name "${SHARED_RUNTIME_CONTAINER}" \
      --restart unless-stopped \
      -v "${DEPLOY_BASE_PATH}:${DEPLOY_BASE_PATH}" \
      --add-host host.docker.internal:host-gateway \
      "${port_args[@]}" \
      -v "${SHARED_RUNTIME_ROOT}/nginx/conf.d:/etc/nginx/conf.d" \
      -v "${SHARED_RUNTIME_ROOT}/supervisor/conf.d:/etc/supervisor/conf.d" \
      -v "${SHARED_RUNTIME_ROOT}/logs:/var/log/supervisor" \
      "${SHARED_RUNTIME_IMAGE}"
  elif [[ "$(docker_run inspect -f '{{.State.Running}}' "${SHARED_RUNTIME_CONTAINER}")" != "true" ]]; then
    docker_run start "${SHARED_RUNTIME_CONTAINER}" >/dev/null
  fi
}

write_shared_runtime_supervisor_conf() {
  local supervisor_conf="${SHARED_RUNTIME_ROOT}/supervisor/conf.d/${APP_NAME}.conf"
  cat <<EOF | run_root tee "${supervisor_conf}" >/dev/null
[program:${APP_NAME}]
directory=${CURRENT_LINK}/backend
command=/bin/bash -lc 'set -a && source ${APP_SHARED_DIR}/app.env && set +a && exec java -jar ${CURRENT_LINK}/backend/app.jar --server.port=${APP_BACKEND_PORT}'
autostart=true
autorestart=true
stopsignal=TERM
stopasgroup=true
killasgroup=true
stdout_logfile=${APP_LOG_DIR}/backend.out.log
stderr_logfile=${APP_LOG_DIR}/backend.err.log
EOF
}

write_shared_runtime_nginx_conf() {
  local nginx_conf="${SHARED_RUNTIME_ROOT}/nginx/conf.d/${APP_NAME}.conf"
  render_nginx_conf | run_root tee "${nginx_conf}" >/dev/null
}

deploy_shared_runtime() {
  log "deploy mode: docker-shared-runtime"
  ensure_layout
  ensure_shared_runtime_container
  write_shared_runtime_supervisor_conf
  if host_nginx_available; then
    write_native_nginx_conf
  else
    write_shared_runtime_nginx_conf
  fi

  docker_run exec "${SHARED_RUNTIME_CONTAINER}" supervisorctl reread
  docker_run exec "${SHARED_RUNTIME_CONTAINER}" supervisorctl update
  docker_run exec "${SHARED_RUNTIME_CONTAINER}" supervisorctl restart "${APP_NAME}" >/dev/null \
    || docker_run exec "${SHARED_RUNTIME_CONTAINER}" supervisorctl start "${APP_NAME}" >/dev/null
  if host_nginx_available; then
    run_root nginx -t
    run_root systemctl reload nginx || run_root systemctl restart nginx
  else
    docker_run exec "${SHARED_RUNTIME_CONTAINER}" nginx -t
    docker_run exec "${SHARED_RUNTIME_CONTAINER}" nginx -s reload
  fi

  if host_nginx_available; then
    curl --fail --silent --show-error --retry 10 --retry-connrefused \
      "http://127.0.0.1:${APP_BACKEND_PORT}/api/v1/health" >/dev/null
  elif [[ "${PRIMARY_SERVER_NAME}" == "_" ]]; then
    curl --fail --silent --show-error --retry 10 --retry-connrefused \
      "http://127.0.0.1:${SHARED_RUNTIME_HTTP_PORT}/api/v1/health" >/dev/null
  else
    curl --fail --silent --show-error --retry 10 --retry-connrefused \
      -H "Host: ${PRIMARY_SERVER_NAME}" \
      "http://127.0.0.1:${SHARED_RUNTIME_HTTP_PORT}/api/v1/health" >/dev/null
  fi

  cleanup_releases
}

main() {
  require_root_runner

  case "${DEPLOY_MODE}" in
    native)
      deploy_native
      ;;
    docker)
      has_docker_runtime || {
        echo "docker is not available on the deployment host" >&2
        exit 1
      }
      deploy_shared_runtime
      ;;
    auto)
      if has_native_runtime; then
        deploy_native
      elif has_docker_runtime; then
        deploy_shared_runtime
      else
        echo "neither native runtime nor docker is available on the deployment host" >&2
        exit 1
      fi
      ;;
    *)
      echo "unsupported DEPLOY_MODE: ${DEPLOY_MODE}" >&2
      exit 1
      ;;
  esac

  log "deployment completed for ${APP_NAME}"
}

main "$@"
