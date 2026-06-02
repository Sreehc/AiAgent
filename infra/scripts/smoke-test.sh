#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_USERNAME="${ADMIN_USERNAME:-sessiontester1780414266}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Passw0rd!}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

json_field() {
  local file="$1"
  local expr="$2"
  python3 - "$file" "$expr" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as fh:
    value = json.load(fh)

for token in sys.argv[2].split("."):
    if token:
        value = value[token]

if isinstance(value, bool):
    print("true" if value else "false")
elif value is None:
    print("")
else:
    print(value)
PY
}

request_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local token="${4:-}"
  local output="$5"
  local status_file="$6"

  local headers=(-H "Accept: application/json")
  if [[ -n "$token" ]]; then
    headers+=(-H "Authorization: Bearer ${token}")
  fi

  if [[ -n "$body" ]]; then
    headers+=(-H "Content-Type: application/json")
    curl -sS -o "$output" -w "%{http_code}" -X "$method" "${headers[@]}" "$url" -d "$body" > "$status_file"
  else
    curl -sS -o "$output" -w "%{http_code}" -X "$method" "${headers[@]}" "$url" > "$status_file"
  fi
}

assert_status() {
  local expected="$1"
  local actual
  actual="$(cat "$2")"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected HTTP ${expected}, got ${actual}" >&2
    cat "$3" >&2
    exit 1
  fi
}

assert_contains() {
  local needle="$1"
  local file="$2"
  if ! grep -q "$needle" "$file"; then
    echo "Expected response to contain: ${needle}" >&2
    cat "$file" >&2
    exit 1
  fi
}

echo "[1/8] health"
request_json GET "${BASE_URL}/api/v1/health" "" "" "$TMP_DIR/health.json" "$TMP_DIR/health.status"
assert_status 200 "$TMP_DIR/health.status" "$TMP_DIR/health.json"
assert_contains '"status":"UP"' "$TMP_DIR/health.json"

echo "[2/8] admin login"
request_json POST "${BASE_URL}/api/v1/auth/login" "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"${ADMIN_PASSWORD}\"}" "" "$TMP_DIR/admin-login.json" "$TMP_DIR/admin-login.status"
assert_status 200 "$TMP_DIR/admin-login.status" "$TMP_DIR/admin-login.json"
ADMIN_TOKEN="$(json_field "$TMP_DIR/admin-login.json" "data.accessToken")"

echo "[3/8] invalid login rejected"
request_json POST "${BASE_URL}/api/v1/auth/login" "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"wrong-password\"}" "" "$TMP_DIR/bad-login.json" "$TMP_DIR/bad-login.status"
assert_status 401 "$TMP_DIR/bad-login.status" "$TMP_DIR/bad-login.json"
assert_contains '"code":"AUTH_INVALID"' "$TMP_DIR/bad-login.json"

echo "[4/8] invite registration and admin permission guard"
request_json POST "${BASE_URL}/api/v1/admin/invites" '{"expiresInDays":7}' "$ADMIN_TOKEN" "$TMP_DIR/invite.json" "$TMP_DIR/invite.status"
assert_status 200 "$TMP_DIR/invite.status" "$TMP_DIR/invite.json"
INVITE_TOKEN="$(json_field "$TMP_DIR/invite.json" "data.inviteToken")"
TEMP_USER="smokeuser$(date +%s)"
request_json POST "${BASE_URL}/api/v1/auth/register-by-invite" "{\"inviteToken\":\"${INVITE_TOKEN}\",\"username\":\"${TEMP_USER}\",\"displayName\":\"Smoke User\",\"password\":\"Passw0rd!\"}" "" "$TMP_DIR/register.json" "$TMP_DIR/register.status"
assert_status 200 "$TMP_DIR/register.status" "$TMP_DIR/register.json"
request_json POST "${BASE_URL}/api/v1/auth/login" "{\"username\":\"${TEMP_USER}\",\"password\":\"Passw0rd!\"}" "" "$TMP_DIR/user-login.json" "$TMP_DIR/user-login.status"
assert_status 200 "$TMP_DIR/user-login.status" "$TMP_DIR/user-login.json"
USER_TOKEN="$(json_field "$TMP_DIR/user-login.json" "data.accessToken")"
request_json GET "${BASE_URL}/api/v1/admin/models" "" "$USER_TOKEN" "$TMP_DIR/forbidden.json" "$TMP_DIR/forbidden.status"
assert_status 403 "$TMP_DIR/forbidden.status" "$TMP_DIR/forbidden.json"
assert_contains '"code":"FORBIDDEN"' "$TMP_DIR/forbidden.json"

echo "[5/8] admin model config"
MODEL_CODE="smoke-model-$(date +%s)"
request_json POST "${BASE_URL}/api/v1/admin/models" "{\"modelCode\":\"${MODEL_CODE}\",\"name\":\"Smoke Chat Model\",\"provider\":\"openai-compatible\",\"modelType\":\"CHAT\",\"baseUrl\":\"https://api.openai.com/v1\",\"apiKey\":\"sk-smoke-12345678\",\"enabled\":true}" "$ADMIN_TOKEN" "$TMP_DIR/model.json" "$TMP_DIR/model.status"
assert_status 200 "$TMP_DIR/model.status" "$TMP_DIR/model.json"
request_json GET "${BASE_URL}/api/v1/admin/models" "" "$ADMIN_TOKEN" "$TMP_DIR/models.json" "$TMP_DIR/models.status"
assert_status 200 "$TMP_DIR/models.status" "$TMP_DIR/models.json"
assert_contains "${MODEL_CODE}" "$TMP_DIR/models.json"

echo "[6/8] session execution stream"
request_json POST "${BASE_URL}/api/v1/sessions" '{"title":"Smoke Session","agentMode":"REACT"}' "$ADMIN_TOKEN" "$TMP_DIR/session.json" "$TMP_DIR/session.status"
assert_status 200 "$TMP_DIR/session.status" "$TMP_DIR/session.json"
SESSION_ID="$(json_field "$TMP_DIR/session.json" "data.sessionId")"
curl -sS -o "$TMP_DIR/stream.txt" -X POST \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  "${BASE_URL}/api/v1/sessions/${SESSION_ID}/stream" \
  -d '{"query":"输出一份冒烟测试研究摘要","executionMode":"PLAN_EXECUTE","knowledgeBaseIds":[]}'
assert_contains 'session.completed' "$TMP_DIR/stream.txt"
assert_contains 'artifact.created' "$TMP_DIR/stream.txt"

echo "[7/8] image generation and replay"
request_json POST "${BASE_URL}/api/v1/images/generations" "{\"prompt\":\"生成一张冒烟测试封面图\",\"size\":\"1024x1024\",\"sessionId\":\"${SESSION_ID}\"}" "$ADMIN_TOKEN" "$TMP_DIR/image.json" "$TMP_DIR/image.status"
assert_status 200 "$TMP_DIR/image.status" "$TMP_DIR/image.json"
request_json GET "${BASE_URL}/api/v1/images/history?pageNo=1&pageSize=5" "" "$ADMIN_TOKEN" "$TMP_DIR/image-history.json" "$TMP_DIR/image-history.status"
assert_status 200 "$TMP_DIR/image-history.status" "$TMP_DIR/image-history.json"
assert_contains '生成一张冒烟测试封面图' "$TMP_DIR/image-history.json"
request_json GET "${BASE_URL}/api/v1/sessions/${SESSION_ID}/replay" "" "$ADMIN_TOKEN" "$TMP_DIR/replay.json" "$TMP_DIR/replay.status"
assert_status 200 "$TMP_DIR/replay.status" "$TMP_DIR/replay.json"
assert_contains '"artifactType":"IMAGE"' "$TMP_DIR/replay.json"
assert_contains '"artifactType":"REPORT"' "$TMP_DIR/replay.json"

echo "[8/8] knowledge base flow"
KB_NAME="Smoke KB $(date +%s)"
request_json POST "${BASE_URL}/api/v1/knowledge-bases" "{\"name\":\"${KB_NAME}\",\"description\":\"Smoke test knowledge base\"}" "$ADMIN_TOKEN" "$TMP_DIR/kb.json" "$TMP_DIR/kb.status"
assert_status 200 "$TMP_DIR/kb.status" "$TMP_DIR/kb.json"
KB_ID="$(json_field "$TMP_DIR/kb.json" "data.kbId")"
printf 'This is a smoke test knowledge document about battery storage costs.\n' > "$TMP_DIR/smoke-doc.txt"
curl -sS -o "$TMP_DIR/doc.json" -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -F "file=@${TMP_DIR}/smoke-doc.txt;type=text/plain" \
  "${BASE_URL}/api/v1/knowledge-bases/${KB_ID}/documents" > "$TMP_DIR/doc.status"
assert_status 200 "$TMP_DIR/doc.status" "$TMP_DIR/doc.json"
DOC_ID="$(json_field "$TMP_DIR/doc.json" "data.documentId")"
request_json POST "${BASE_URL}/api/v1/knowledge-bases/${KB_ID}/documents/${DOC_ID}/index" "" "$ADMIN_TOKEN" "$TMP_DIR/index.json" "$TMP_DIR/index.status"
assert_status 200 "$TMP_DIR/index.status" "$TMP_DIR/index.json"
request_json POST "${BASE_URL}/api/v1/knowledge-bases/${KB_ID}/search-test" '{"query":"battery storage costs","topK":3}' "$ADMIN_TOKEN" "$TMP_DIR/search.json" "$TMP_DIR/search.status"
assert_status 200 "$TMP_DIR/search.status" "$TMP_DIR/search.json"
assert_contains 'battery storage costs' "$TMP_DIR/search.json"

echo "Smoke test passed."
