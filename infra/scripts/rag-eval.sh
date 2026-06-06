#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Runs the RAG metric regression suite. The test validates metric thresholds and
# the evaluation harness shape. Use smoke-test.sh against a running backend to
# exercise upload -> index -> search APIs end to end.
mvn -f "$ROOT_DIR/backend/pom.xml" -q -Dtest=RagEvaluationRegressionTest test
