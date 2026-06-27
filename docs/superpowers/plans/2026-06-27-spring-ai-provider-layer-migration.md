# Spring AI Provider Layer Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current custom `openai-compatible` chat / embedding / image-generation provider implementations with Spring AI-backed implementations while keeping the existing runtime orchestration, SSE event protocol, run state machine, audit, artifact, and MCP layers unchanged.

**Architecture:** Keep `application/*` and `domain/*` behavior stable. Introduce a Spring AI-backed infrastructure adapter layer that preserves the existing provider interfaces (`ChatModelProvider`, `EmbeddingProvider`, `ImageGenerationProvider`) so `SessionRunExecutor`, `QueryEmbeddingService`, `KnowledgeIndexExecutionService`, `ImageGenerationService`, `UserApiConfigService`, and `ModelRuntimeResolver` do not need semantic changes. Use a programmatic Spring AI factory per request because this codebase resolves model credentials dynamically per user and per admin config rather than from one static application-wide model bean.

**Tech Stack:** Java 21, Spring Boot 4.1.0, Spring AI 2.0.0, Spring AI OpenAI model modules, JUnit 5, existing Spring Boot test stack.

## Execution Notes

- 2026-06-27: Task 1 baseline compatibility landed in commit `658b187`.
- 2026-06-27: Tasks 2 through 6 implementation work landed in consolidated commit `48e382f` instead of one commit per task.
- 2026-06-27: Image edit parity was kept inside `SpringAiImageGenerationProvider` via direct multipart `/images/edits` HTTP calls, so no separate legacy production adapter remains.

---

## Scope And Non-Goals

- In scope:
  - `openai-compatible` chat provider implementation
  - `openai-compatible` embedding provider implementation
  - `openai-compatible` image generation implementation
  - shared Spring AI runtime factory / options mapping
  - tests and documentation for the new adapter layer
- Out of scope:
  - `SessionRunExecutor` orchestration semantics
  - plan / observe / judge / replan flow
  - SSE event names and payloads
  - artifact ledger and run audit schema
  - MCP runtime and MCP admin behavior
  - hybrid retrieval strategy, rerank, or RAG degraded semantics
  - runtime orchestration rewrite beyond provider replacement

## Assumptions

1. The platform baseline is now **Spring Boot 4.1.0** with **Spring AI 2.0.0** in [backend/pom.xml](/Users/cheers/Desktop/workspace/AiAgent/backend/pom.xml:7).
2. The provider-layer migration should build on that upgraded baseline instead of attempting a fallback path on Boot 3.5.x.
3. If Spring AI cannot reproduce the current `/images/edits` multipart behavior used by [OpenAiCompatibleImageGenerationProvider.java](/Users/cheers/Desktop/workspace/AiAgent/backend/src/main/java/com/sreehc/aiagent/infrastructure/model/OpenAiCompatibleImageGenerationProvider.java:74), keep the legacy image-edit subpath temporarily and migrate only text-to-image in this plan.

## File Map

**Create:**
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/springai/SpringAiRuntimeOptions.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/springai/SpringAiOpenAiFactory.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/SpringAiChatModelProvider.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/SpringAiEmbeddingProvider.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/SpringAiImageGenerationProvider.java`
- `backend/src/test/java/com/sreehc/aiagent/infrastructure/model/SpringAiChatModelProviderTest.java`
- `backend/src/test/java/com/sreehc/aiagent/infrastructure/knowledge/SpringAiEmbeddingProviderTest.java`
- `backend/src/test/java/com/sreehc/aiagent/infrastructure/model/SpringAiImageGenerationProviderTest.java`
- `backend/src/test/java/com/sreehc/aiagent/infrastructure/springai/SpringAiOpenAiFactoryTest.java`

**Modify:**
- `backend/pom.xml`
- `backend/src/main/resources/application.yml`
- `backend/src/main/java/com/sreehc/aiagent/app/AppProperties.java`
- `backend/src/main/java/com/sreehc/aiagent/application/account/UserApiConfigService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/ChatModelProviderRouter.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/EmbeddingProviderRouter.java`
- `backend/src/test/java/com/sreehc/aiagent/application/account/UserApiConfigServiceTest.java`
- `README.md`
- `docs/tech-design.md`

**Delete after parity is confirmed:**
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/OpenAiCompatibleChatModelProvider.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/OpenAiCompatibleEmbeddingProvider.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/OpenAiCompatibleImageGenerationProvider.java`

## Execution Rules

- Preserve `providerCode()` values already stored in config and DB. `openai-compatible` must continue to route successfully after the migration.
- Keep `local-mock` providers unchanged.
- Do not change exception codes thrown by `SessionRunExecutor`, `QueryEmbeddingService`, `ImageGenerationService`, or `UserApiConfigService`.
- Do not alter the `ModelRuntimeResolver` precedence chain.
- Do not introduce Spring AI types into `application/*` or `domain/*`.

### Task 1: Validate Spring AI Baseline On The Upgraded Platform

**Files:**
- Modify: `backend/pom.xml`
- Test: `backend/src/test/java/com/sreehc/aiagent/app/AiAgentApplicationTests.java`

- [x] **Step 1: Align Spring AI dependencies with the upgraded platform baseline**

Keep Spring AI dependency management and OpenAI model modules aligned in `backend/pom.xml` with the Boot 4.1.0 baseline. Prefer the smallest dependency set that supports chat, embedding, and image generation.

- [x] **Step 2: Run a narrow context-load test on Boot 4.1.0**

Run: `cd /Users/cheers/Desktop/workspace/AiAgent/backend && mvn -Dtest=AiAgentApplicationTests test`

Expected:
- PASS if Spring AI 2.0.0 is compatible with the upgraded Boot baseline
- FAIL fast if there is a BOM or auto-configuration incompatibility

- [x] **Step 3: Decide the branch**

If the test fails due to framework incompatibility:
- stop implementation
- record the exact incompatibility in the plan execution notes
- resolve the dependency mismatch before continuing provider migration

If the test passes:
- continue with this plan

- [x] **Step 4: Commit the compatibility spike**

```bash
cd /Users/cheers/Desktop/workspace/AiAgent
git add backend/pom.xml
git commit -m "build: add spring ai baseline dependencies"
```

### Task 2: Introduce A Dynamic Spring AI Factory Layer

**Files:**
- Create: `backend/src/main/java/com/sreehc/aiagent/infrastructure/springai/SpringAiRuntimeOptions.java`
- Create: `backend/src/main/java/com/sreehc/aiagent/infrastructure/springai/SpringAiOpenAiFactory.java`
- Modify: `backend/src/main/java/com/sreehc/aiagent/app/AppProperties.java`
- Modify: `backend/src/main/resources/application.yml`
- Test: `backend/src/test/java/com/sreehc/aiagent/infrastructure/springai/SpringAiOpenAiFactoryTest.java`

- [x] **Step 1: Add a Spring AI runtime options record**

Create a small immutable record that carries:
- `baseUrl`
- `apiKey`
- `model`
- `connectTimeoutMillis`
- `readTimeoutMillis`

This record is internal to the Spring AI adapter package and exists to normalize current `AppProperties` and `ModelRuntimeResolver` output into one shape.

- [x] **Step 2: Add a factory that builds Spring AI OpenAI clients programmatically**

Create `SpringAiOpenAiFactory` with methods shaped like:

```java
public OpenAiChatModel createChatModel(SpringAiRuntimeOptions options) { ... }

public OpenAiEmbeddingModel createEmbeddingModel(SpringAiRuntimeOptions options) { ... }

public OpenAiImageModel createImageModel(SpringAiRuntimeOptions options) { ... }
```

Reason:
- the codebase resolves credentials dynamically per request
- a singleton auto-configured model bean is the wrong boundary here

- [x] **Step 3: Add tests for base URL normalization and missing credential errors**

Test cases:
- trims trailing `/`
- rejects blank base URL
- rejects blank API key
- carries configured timeout values into the factory-built client options

- [x] **Step 4: Run the new factory tests**

Run: `cd /Users/cheers/Desktop/workspace/AiAgent/backend && mvn -Dtest=SpringAiOpenAiFactoryTest test`

Expected: PASS

- [x] **Step 5: Commit**

```bash
cd /Users/cheers/Desktop/workspace/AiAgent
git add backend/src/main/java/com/sreehc/aiagent/infrastructure/springai \
        backend/src/test/java/com/sreehc/aiagent/infrastructure/springai \
        backend/src/main/java/com/sreehc/aiagent/app/AppProperties.java \
        backend/src/main/resources/application.yml
git commit -m "feat: add dynamic spring ai factory layer"
```

### Task 3: Replace The Chat Provider Implementation

**Files:**
- Create: `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/SpringAiChatModelProvider.java`
- Modify: `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/ChatModelProviderRouter.java`
- Modify: `backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java`
- Test: `backend/src/test/java/com/sreehc/aiagent/infrastructure/model/SpringAiChatModelProviderTest.java`

- [x] **Step 1: Write provider tests first**

Cover:
- `providerCode()` remains `openai-compatible`
- prompt text is sent as a single user message
- returned text maps back to `ChatCompletion.text()`
- provider wraps Spring AI or HTTP-level failures as `ModelProviderException`

- [x] **Step 2: Implement `SpringAiChatModelProvider` behind the existing interface**

Implementation constraints:
- implement `ChatModelProvider`
- use `SpringAiOpenAiFactory`
- construct runtime options from `ChatRequest`
- do not change `ChatModelProvider.ChatRequest`

- [x] **Step 3: Preserve fallback behavior in `SessionRunExecutor`**

Confirm [SessionRunExecutor.java](/Users/cheers/Desktop/workspace/AiAgent/backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java:563) still:
- resolves runtime model the same way
- catches provider errors the same way
- returns the same local-mock fallback in non-production

This should be a no-op or near-no-op in behavior. The goal is provider replacement, not orchestration change.

- [x] **Step 4: Run targeted tests**

Run:
- `cd /Users/cheers/Desktop/workspace/AiAgent/backend && mvn -Dtest=SpringAiChatModelProviderTest test`
- `cd /Users/cheers/Desktop/workspace/AiAgent/backend && mvn -Dtest=SessionServiceTest test`

Expected: PASS

- [x] **Step 5: Commit**

```bash
cd /Users/cheers/Desktop/workspace/AiAgent
git add backend/src/main/java/com/sreehc/aiagent/infrastructure/model/SpringAiChatModelProvider.java \
        backend/src/main/java/com/sreehc/aiagent/infrastructure/model/ChatModelProviderRouter.java \
        backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java \
        backend/src/test/java/com/sreehc/aiagent/infrastructure/model/SpringAiChatModelProviderTest.java
git commit -m "feat: migrate chat provider to spring ai"
```

### Task 4: Replace The Embedding Provider Implementation

**Files:**
- Create: `backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/SpringAiEmbeddingProvider.java`
- Modify: `backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/EmbeddingProviderRouter.java`
- Modify: `backend/src/main/java/com/sreehc/aiagent/application/knowledge/QueryEmbeddingService.java`
- Modify: `backend/src/main/java/com/sreehc/aiagent/application/knowledge/KnowledgeIndexExecutionService.java`
- Test: `backend/src/test/java/com/sreehc/aiagent/infrastructure/knowledge/SpringAiEmbeddingProviderTest.java`
- Test: `backend/src/test/java/com/sreehc/aiagent/infrastructure/knowledge/EmbeddingProviderRouterTest.java`

- [x] **Step 1: Write tests for vector literal compatibility**

The new provider must still return the current pgvector literal string format:

```text
[0.1,0.2,0.3]
```

Cover:
- successful embedding round-trip
- blank input normalization still produces a valid vector
- configured dimension mismatch still fails deterministically

- [x] **Step 2: Implement `SpringAiEmbeddingProvider`**

Implementation constraints:
- implement `EmbeddingProvider`
- keep both overloads:
  - default app config path
  - per-user runtime path
- convert Spring AI embedding response to the exact existing vector-literal string

- [x] **Step 3: Keep cache key semantics unchanged**

Verify [QueryEmbeddingService.java](/Users/cheers/Desktop/workspace/AiAgent/backend/src/main/java/com/sreehc/aiagent/application/knowledge/QueryEmbeddingService.java:29) still:
- uses the same cache key layout
- throws `EMBEDDING_PROVIDER_FAILED` on provider failures

- [x] **Step 4: Validate both query and indexing paths**

Run:
- `cd /Users/cheers/Desktop/workspace/AiAgent/backend && mvn -Dtest=SpringAiEmbeddingProviderTest,EmbeddingProviderRouterTest test`
- `cd /Users/cheers/Desktop/workspace/AiAgent/backend && mvn -Dtest=KnowledgeIndexJobServiceTest,RagEvaluationRegressionTest test`

Expected: PASS

- [x] **Step 5: Commit**

```bash
cd /Users/cheers/Desktop/workspace/AiAgent
git add backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/SpringAiEmbeddingProvider.java \
        backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/EmbeddingProviderRouter.java \
        backend/src/main/java/com/sreehc/aiagent/application/knowledge/QueryEmbeddingService.java \
        backend/src/main/java/com/sreehc/aiagent/application/knowledge/KnowledgeIndexExecutionService.java \
        backend/src/test/java/com/sreehc/aiagent/infrastructure/knowledge/SpringAiEmbeddingProviderTest.java \
        backend/src/test/java/com/sreehc/aiagent/infrastructure/knowledge/EmbeddingProviderRouterTest.java
git commit -m "feat: migrate embedding provider to spring ai"
```

### Task 5: Replace The Image Generation Provider Implementation

**Files:**
- Create: `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/SpringAiImageGenerationProvider.java`
- Modify: `backend/src/main/java/com/sreehc/aiagent/application/image/ImageGenerationService.java`
- Modify: `backend/src/main/java/com/sreehc/aiagent/application/account/UserApiConfigService.java`
- Test: `backend/src/test/java/com/sreehc/aiagent/infrastructure/model/SpringAiImageGenerationProviderTest.java`
- Test: `backend/src/test/java/com/sreehc/aiagent/application/account/UserApiConfigServiceTest.java`

- [x] **Step 1: Split text-to-image and image-edit parity checks**

Before implementation, write two test groups:
- text-to-image generation using Spring AI
- image edit behavior parity compared with the current multipart `/images/edits` path

- [x] **Step 2: Implement Spring AI text-to-image path**

Implementation constraints:
- implement `ImageGenerationProvider`
- preserve `providerCode()` as `openai-compatible`
- return the existing `GeneratedImage(content, contentType, fileExtension)` contract

- [x] **Step 3: Decide the image-edit branch**

If Spring AI reproduces the current edit API behavior:
- migrate both generation and edit into `SpringAiImageGenerationProvider`

If Spring AI does not reproduce it cleanly:
- keep the legacy edit path in place
- use Spring AI only for text generation
- document this explicitly in code comments and docs

- [x] **Step 4: Keep account connection tests behavior stable**

`UserApiConfigService.test(ModelType.IMAGE)` currently validates route availability without doing a paid generation request. Preserve that behavior.

- [x] **Step 5: Run targeted tests**

Run:
- `cd /Users/cheers/Desktop/workspace/AiAgent/backend && mvn -Dtest=SpringAiImageGenerationProviderTest,OpenAiCompatibleImageGenerationProviderTest test`
- `cd /Users/cheers/Desktop/workspace/AiAgent/backend && mvn -Dtest=UserApiConfigServiceTest test`

Expected:
- PASS
- If edit parity is not complete, legacy edit-path tests remain green

- [x] **Step 6: Commit**

```bash
cd /Users/cheers/Desktop/workspace/AiAgent
git add backend/src/main/java/com/sreehc/aiagent/infrastructure/model/SpringAiImageGenerationProvider.java \
        backend/src/main/java/com/sreehc/aiagent/application/image/ImageGenerationService.java \
        backend/src/main/java/com/sreehc/aiagent/application/account/UserApiConfigService.java \
        backend/src/test/java/com/sreehc/aiagent/infrastructure/model/SpringAiImageGenerationProviderTest.java \
        backend/src/test/java/com/sreehc/aiagent/application/account/UserApiConfigServiceTest.java
git commit -m "feat: migrate image provider to spring ai"
```

### Task 6: Remove Legacy OpenAI-Compatible Implementations

**Files:**
- Delete: `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/OpenAiCompatibleChatModelProvider.java`
- Delete: `backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/OpenAiCompatibleEmbeddingProvider.java`
- Delete: `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/OpenAiCompatibleImageGenerationProvider.java` if and only if image-edit parity is complete
- Modify: `README.md`
- Modify: `docs/tech-design.md`

- [x] **Step 1: Confirm no production path still references legacy classes**

Run:

```bash
cd /Users/cheers/Desktop/workspace/AiAgent
rg -n "OpenAiCompatible(ChatModelProvider|EmbeddingProvider|ImageGenerationProvider)" backend/src/main/java backend/src/test/java
```

Expected:
- no runtime references remain
- image provider may still remain temporarily if image-edit parity is incomplete

- [x] **Step 2: Delete only what is fully replaced**

Delete chat and embedding legacy implementations after tests are green.

Delete image legacy implementation only if both generation and edit paths are covered by the Spring AI provider.

- [x] **Step 3: Update docs**

Update:
- `README.md`
- `docs/tech-design.md`

Document:
- Spring AI-backed provider layer
- retained local-mock providers
- whether image edit still uses the temporary legacy adapter

- [x] **Step 4: Run full backend regression**

Run: `cd /Users/cheers/Desktop/workspace/AiAgent/backend && mvn test`

Expected: PASS

- [x] **Step 5: Commit**

```bash
cd /Users/cheers/Desktop/workspace/AiAgent
git add README.md docs/tech-design.md backend/src/main/java backend/src/test/java
git commit -m "refactor: remove legacy openai-compatible providers"
```

### Task 7: Final Verification And Rollback Gate

**Files:**
- No new files

- [x] **Step 1: Verify critical runtime paths**

Run this ordered suite:

```bash
cd /Users/cheers/Desktop/workspace/AiAgent/backend
mvn -Dtest=AiAgentApplicationTests,SessionControllerContractTest,AccountControllerContractTest,KnowledgeBaseControllerContractTest test
```

Expected: PASS

- [x] **Step 2: Verify no semantic drift in orchestration layer**

Manual code review checklist:
- `SessionRunExecutor.completeWithChatProvider(...)` still resolves runtime config and fallback exactly once
- `QueryEmbeddingService` cache semantics unchanged
- `KnowledgeIndexExecutionService` still writes pgvector literal strings
- `ImageGenerationService` still produces the same artifact and job records

- [x] **Step 3: Define rollback trigger**

Rollback immediately if any of these occur:
- changed SSE event payloads
- changed error codes or HTTP status codes
- changed embedding storage format
- broken personal API config tests
- broken image edit behavior

- [x] **Step 4: Tag the migration boundary commit**

```bash
cd /Users/cheers/Desktop/workspace/AiAgent
git tag spring-ai-provider-migration-cutover
```

## Parallelism Notes

- Tasks 3 and 4 can be implemented in parallel after Task 2 is merged.
- Task 5 should not start until Task 2 is merged, but it does not depend on Task 3 or Task 4.
- Task 6 must wait for Tasks 3, 4, and 5 to finish.
- Task 7 is strictly last.

## Review Checklist

- [x] `openai-compatible` provider code remains valid in admin and user configuration.
- [x] `local-mock` remains the dev fallback.
- [x] No Spring AI type leaks into `application/*` or `domain/*`.
- [x] No run-state or SSE semantic changes.
- [x] Image edit parity decision is explicit, not implicit.
- [x] Full backend test suite passes before deleting legacy implementations.
