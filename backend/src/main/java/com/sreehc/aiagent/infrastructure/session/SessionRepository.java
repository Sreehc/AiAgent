package com.sreehc.aiagent.infrastructure.session;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.session.AgentMode;
import com.sreehc.aiagent.domain.session.AgentSession;
import com.sreehc.aiagent.domain.session.ArtifactRecord;
import com.sreehc.aiagent.domain.session.ArtifactType;
import com.sreehc.aiagent.domain.session.ExecutionPlanStep;
import com.sreehc.aiagent.domain.session.ExecutionRun;
import com.sreehc.aiagent.domain.session.PlanStepStatus;
import com.sreehc.aiagent.domain.session.RunStatus;
import com.sreehc.aiagent.domain.session.SessionMessage;
import com.sreehc.aiagent.domain.session.SessionStatus;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SessionRepository {
    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public SessionRepository(NamedParameterJdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public long createSession(String sessionCode, long userId, String title, AgentMode agentMode) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into agent_session (session_code, user_id, title, agent_mode, status, created_at, updated_at)
                        values (:sessionCode, :userId, :title, :agentMode, :status, now(), now())
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("sessionCode", sessionCode)
                        .addValue("userId", userId)
                        .addValue("title", title)
                        .addValue("agentMode", agentMode.name())
                        .addValue("status", SessionStatus.IDLE.name()),
                Long.class
        );
        if (id == null) {
            throw new IllegalStateException("Failed to create session");
        }
        return id;
    }

    public List<AgentSession> listSessions(long userId, int pageNo, int pageSize) {
        int offset = Math.max(pageNo - 1, 0) * pageSize;
        return jdbcTemplate.query("""
                        select id, session_code, user_id, title, agent_mode, status, created_at, updated_at
                        from agent_session
                        where user_id = :userId
                        order by created_at desc
                        limit :limit offset :offset
                        """,
                Map.of("userId", userId, "limit", pageSize, "offset", offset),
                (rs, rowNum) -> mapSession(rs));
    }

    public Optional<AgentSession> findSessionByCode(long userId, String sessionCode) {
        return jdbcTemplate.query("""
                        select id, session_code, user_id, title, agent_mode, status, created_at, updated_at
                        from agent_session
                        where user_id = :userId and session_code = :sessionCode
                        """,
                Map.of("userId", userId, "sessionCode", sessionCode),
                rs -> rs.next() ? Optional.of(mapSession(rs)) : Optional.empty());
    }

    public Optional<AgentSession> findSessionById(long userId, long sessionId) {
        return jdbcTemplate.query("""
                        select id, session_code, user_id, title, agent_mode, status, created_at, updated_at
                        from agent_session
                        where user_id = :userId and id = :sessionId
                        """,
                Map.of("userId", userId, "sessionId", sessionId),
                rs -> rs.next() ? Optional.of(mapSession(rs)) : Optional.empty());
    }

    public boolean deleteSession(long userId, String sessionCode) {
        return jdbcTemplate.update("""
                        delete from agent_session
                        where user_id = :userId and session_code = :sessionCode
                        """,
                Map.of("userId", userId, "sessionCode", sessionCode)) == 1;
    }

    public long createRun(
            String runCode,
            long sessionId,
            long userId,
            String queryText,
            AgentMode executionMode,
            List<String> knowledgeBaseIds
    ) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into execution_run (
                            run_code, session_id, user_id, query_text, execution_mode,
                            knowledge_base_ids, retrieval_query, recall_set, final_evidence_set,
                            status, created_at, updated_at
                        )
                        values (
                            :runCode, :sessionId, :userId, :queryText, :executionMode,
                            cast(:knowledgeBaseIds as jsonb), null, '[]'::jsonb, '[]'::jsonb,
                            :status, now(), now()
                        )
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("runCode", runCode)
                        .addValue("sessionId", sessionId)
                        .addValue("userId", userId)
                        .addValue("queryText", queryText)
                        .addValue("executionMode", executionMode.name())
                        .addValue("knowledgeBaseIds", toJson(knowledgeBaseIds))
                        .addValue("status", RunStatus.PENDING.name()),
                Long.class
        );
        if (id == null) {
            throw new IllegalStateException("Failed to create run");
        }
        return id;
    }

    public Optional<ExecutionRun> findRunByCode(long sessionId, String runCode) {
        return jdbcTemplate.query("""
                        select id, run_code, session_id, user_id, query_text, execution_mode,
                               knowledge_base_ids, retrieval_query, recall_set, final_evidence_set,
                               status, error_message, started_at,
                               completed_at, created_at, updated_at
                        from execution_run
                        where session_id = :sessionId and run_code = :runCode
                        """,
                Map.of("sessionId", sessionId, "runCode", runCode),
                rs -> rs.next() ? Optional.of(mapRun(rs)) : Optional.empty());
    }

    public Optional<ExecutionRun> findRunById(long sessionId, long runId) {
        return jdbcTemplate.query("""
                        select id, run_code, session_id, user_id, query_text, execution_mode,
                               knowledge_base_ids, retrieval_query, recall_set, final_evidence_set,
                               status, error_message, started_at,
                               completed_at, created_at, updated_at
                        from execution_run
                        where session_id = :sessionId and id = :runId
                        """,
                Map.of("sessionId", sessionId, "runId", runId),
                rs -> rs.next() ? Optional.of(mapRun(rs)) : Optional.empty());
    }

    public Optional<ExecutionRun> findLatestRun(long sessionId) {
        return jdbcTemplate.query("""
                        select id, run_code, session_id, user_id, query_text, execution_mode,
                               knowledge_base_ids, retrieval_query, recall_set, final_evidence_set,
                               status, error_message, started_at,
                               completed_at, created_at, updated_at
                        from execution_run
                        where session_id = :sessionId
                        order by created_at desc
                        limit 1
                        """,
                Map.of("sessionId", sessionId),
                rs -> rs.next() ? Optional.of(mapRun(rs)) : Optional.empty());
    }

    public Optional<ExecutionRun> findLatestPendingRun(long sessionId) {
        return jdbcTemplate.query("""
                        select id, run_code, session_id, user_id, query_text, execution_mode,
                               knowledge_base_ids, retrieval_query, recall_set, final_evidence_set,
                               status, error_message, started_at,
                               completed_at, created_at, updated_at
                        from execution_run
                        where session_id = :sessionId and status = :status
                        order by created_at desc
                        limit 1
                        """,
                Map.of("sessionId", sessionId, "status", RunStatus.PENDING.name()),
                rs -> rs.next() ? Optional.of(mapRun(rs)) : Optional.empty());
    }

    public List<ExecutionRun> listRuns(long sessionId) {
        return jdbcTemplate.query("""
                        select id, run_code, session_id, user_id, query_text, execution_mode,
                               knowledge_base_ids, retrieval_query, recall_set, final_evidence_set,
                               status, error_message, started_at,
                               completed_at, created_at, updated_at
                        from execution_run
                        where session_id = :sessionId
                        order by created_at desc
                        """,
                Map.of("sessionId", sessionId),
                (rs, rowNum) -> mapRun(rs));
    }

    public List<String> listBoundKnowledgeBaseIds(long sessionId) {
        return jdbcTemplate.query("""
                        select kb.kb_id
                        from session_kb_binding binding
                        join knowledge_base kb on kb.id = binding.knowledge_base_id
                        where binding.session_id = :sessionId
                        order by binding.created_at asc
                        """,
                Map.of("sessionId", sessionId),
                (rs, rowNum) -> rs.getString("kb_id"));
    }

    public void markSessionStatus(long sessionId, SessionStatus status) {
        jdbcTemplate.update("""
                        update agent_session
                        set status = :status,
                            updated_at = now()
                        where id = :sessionId
                        """,
                Map.of("sessionId", sessionId, "status", status.name()));
    }

    public boolean markRunStarted(long runId) {
        int updated = jdbcTemplate.update("""
                        update execution_run
                        set status = :toStatus,
                            started_at = now(),
                            updated_at = now()
                        where id = :runId
                          and status = :fromStatus
                        """,
                Map.of(
                        "runId", runId,
                        "fromStatus", RunStatus.PENDING.name(),
                        "toStatus", RunStatus.RUNNING.name()
                ));
        return updated == 1;
    }

    public void refreshPendingRun(
            long runId,
            String queryText,
            AgentMode executionMode,
            List<String> knowledgeBaseIds
    ) {
        jdbcTemplate.update("""
                        update execution_run
                        set query_text = :queryText,
                            execution_mode = :executionMode,
                            knowledge_base_ids = cast(:knowledgeBaseIds as jsonb),
                            retrieval_query = null,
                            recall_set = '[]'::jsonb,
                            final_evidence_set = '[]'::jsonb,
                            updated_at = now()
                        where id = :runId and status = :status
                        """,
                new MapSqlParameterSource()
                        .addValue("runId", runId)
                        .addValue("queryText", queryText)
                        .addValue("executionMode", executionMode.name())
                        .addValue("knowledgeBaseIds", toJson(knowledgeBaseIds))
                        .addValue("status", RunStatus.PENDING.name()));
    }

    public void updateRunRetrievalAudit(long runId, String retrievalQuery, String recallSetJson, String finalEvidenceSetJson) {
        jdbcTemplate.update("""
                        update execution_run
                        set retrieval_query = :retrievalQuery,
                            recall_set = cast(:recallSetJson as jsonb),
                            final_evidence_set = cast(:finalEvidenceSetJson as jsonb),
                            updated_at = now()
                        where id = :runId
                        """,
                new MapSqlParameterSource()
                        .addValue("runId", runId)
                        .addValue("retrievalQuery", retrievalQuery)
                        .addValue("recallSetJson", recallSetJson)
                        .addValue("finalEvidenceSetJson", finalEvidenceSetJson));
    }

    public void markRunCompleted(long runId) {
        jdbcTemplate.update("""
                        update execution_run
                        set status = :status,
                            completed_at = now(),
                            updated_at = now()
                        where id = :runId
                        """,
                Map.of("runId", runId, "status", RunStatus.COMPLETED.name()));
    }

    public void markRunFailed(long runId, String errorMessage) {
        jdbcTemplate.update("""
                        update execution_run
                        set status = :status,
                            error_message = :errorMessage,
                            completed_at = now(),
                            updated_at = now()
                        where id = :runId
                        """,
                Map.of("runId", runId, "status", RunStatus.FAILED.name(), "errorMessage", errorMessage));
    }

    public long createPlanStep(long runId, String stepCode, int stepNo, String title, PlanStepStatus status) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into execution_plan_step (
                            step_code, run_id, step_no, title, status, created_at, updated_at
                        )
                        values (
                            :stepCode, :runId, :stepNo, :title, :status, now(), now()
                        )
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("stepCode", stepCode)
                        .addValue("runId", runId)
                        .addValue("stepNo", stepNo)
                        .addValue("title", title)
                        .addValue("status", status.name()),
                Long.class
        );
        if (id == null) {
            throw new IllegalStateException("Failed to create plan step");
        }
        return id;
    }

    public void markPlanStepRunning(long runId, int stepNo, String toolName, String toolInput) {
        jdbcTemplate.update("""
                        update execution_plan_step
                        set status = :status,
                            tool_name = :toolName,
                            tool_input = :toolInput,
                            updated_at = now()
                        where run_id = :runId and step_no = :stepNo
                        """,
                Map.of(
                        "runId", runId,
                        "stepNo", stepNo,
                        "status", PlanStepStatus.RUNNING.name(),
                        "toolName", toolName,
                        "toolInput", toolInput
                ));
    }

    public void markPlanStepCompleted(long runId, int stepNo, String toolOutput) {
        jdbcTemplate.update("""
                        update execution_plan_step
                        set status = :status,
                            tool_output = :toolOutput,
                            updated_at = now()
                        where run_id = :runId and step_no = :stepNo
                        """,
                Map.of(
                        "runId", runId,
                        "stepNo", stepNo,
                        "status", PlanStepStatus.COMPLETED.name(),
                        "toolOutput", toolOutput
                ));
    }

    public List<ExecutionPlanStep> listPlanSteps(long runId) {
        return jdbcTemplate.query("""
                        select id, step_code, run_id, step_no, title, status,
                               tool_name, tool_input, tool_output, created_at, updated_at
                        from execution_plan_step
                        where run_id = :runId
                        order by step_no asc
                        """,
                Map.of("runId", runId),
                (rs, rowNum) -> mapPlanStep(rs));
    }

    public long createArtifact(
            String artifactCode,
            long userId,
            Long sessionId,
            Long runId,
            ArtifactType artifactType,
            String title,
            String content,
            String storageUri,
            String mimeType
    ) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into artifact_record (
                            artifact_code, user_id, session_id, run_id, artifact_type,
                            title, content, storage_uri, mime_type, created_at
                        )
                        values (
                            :artifactCode, :userId, :sessionId, :runId, :artifactType,
                            :title, :content, :storageUri, :mimeType, now()
                        )
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("artifactCode", artifactCode)
                        .addValue("userId", userId)
                        .addValue("sessionId", sessionId)
                        .addValue("runId", runId)
                        .addValue("artifactType", artifactType.name())
                        .addValue("title", title)
                        .addValue("content", content)
                        .addValue("storageUri", storageUri)
                        .addValue("mimeType", mimeType),
                Long.class
        );
        if (id == null) {
            throw new IllegalStateException("Failed to create artifact");
        }
        return id;
    }

    public List<ArtifactRecord> listArtifacts(long sessionId) {
        return jdbcTemplate.query("""
                        select id, artifact_code, user_id, session_id, run_id, artifact_type,
                               title, content, storage_uri, mime_type, created_at
                        from artifact_record
                        where session_id = :sessionId
                        order by created_at desc
                        """,
                Map.of("sessionId", sessionId),
                (rs, rowNum) -> mapArtifact(rs));
    }

    public Optional<ArtifactRecord> findArtifactByCode(long userId, String artifactCode) {
        return jdbcTemplate.query("""
                        select id, artifact_code, user_id, session_id, run_id, artifact_type,
                               title, content, storage_uri, mime_type, created_at
                        from artifact_record
                        where user_id = :userId and artifact_code = :artifactCode
                        """,
                Map.of("userId", userId, "artifactCode", artifactCode),
                rs -> rs.next() ? Optional.of(mapArtifact(rs)) : Optional.empty());
    }

    public void createMessage(String messageCode, long sessionId, Long runId, String roleCode, String content) {
        jdbcTemplate.update("""
                        insert into session_message (message_code, session_id, run_id, role_code, content, created_at)
                        values (:messageCode, :sessionId, :runId, :roleCode, :content, now())
                        """,
                new MapSqlParameterSource()
                        .addValue("messageCode", messageCode)
                        .addValue("sessionId", sessionId)
                        .addValue("runId", runId)
                        .addValue("roleCode", roleCode)
                        .addValue("content", content));
    }

    public List<SessionMessage> listMessages(long sessionId) {
        return jdbcTemplate.query("""
                        select id, message_code, session_id, run_id, role_code, content, created_at
                        from session_message
                        where session_id = :sessionId
                        order by created_at asc
                        """,
                Map.of("sessionId", sessionId),
                (rs, rowNum) -> mapMessage(rs));
    }

    private AgentSession mapSession(ResultSet rs) throws SQLException {
        return new AgentSession(
                rs.getLong("id"),
                rs.getString("session_code"),
                rs.getLong("user_id"),
                rs.getString("title"),
                AgentMode.valueOf(rs.getString("agent_mode")),
                SessionStatus.valueOf(rs.getString("status")),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private ExecutionRun mapRun(ResultSet rs) throws SQLException {
        return new ExecutionRun(
                rs.getLong("id"),
                rs.getString("run_code"),
                rs.getLong("session_id"),
                rs.getLong("user_id"),
                rs.getString("query_text"),
                rs.getString("retrieval_query"),
                AgentMode.valueOf(rs.getString("execution_mode")),
                fromJson(rs.getString("knowledge_base_ids")),
                RunStatus.valueOf(rs.getString("status")),
                rs.getString("error_message"),
                rs.getString("recall_set"),
                rs.getString("final_evidence_set"),
                toInstant(rs.getTimestamp("started_at")),
                toInstant(rs.getTimestamp("completed_at")),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private ExecutionPlanStep mapPlanStep(ResultSet rs) throws SQLException {
        return new ExecutionPlanStep(
                rs.getLong("id"),
                rs.getString("step_code"),
                rs.getLong("run_id"),
                rs.getInt("step_no"),
                rs.getString("title"),
                PlanStepStatus.valueOf(rs.getString("status")),
                rs.getString("tool_name"),
                rs.getString("tool_input"),
                rs.getString("tool_output"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private ArtifactRecord mapArtifact(ResultSet rs) throws SQLException {
        return new ArtifactRecord(
                rs.getLong("id"),
                rs.getString("artifact_code"),
                rs.getLong("user_id"),
                rs.getObject("session_id") == null ? null : rs.getLong("session_id"),
                rs.getObject("run_id") == null ? null : rs.getLong("run_id"),
                ArtifactType.valueOf(rs.getString("artifact_type")),
                rs.getString("title"),
                rs.getString("content"),
                rs.getString("storage_uri"),
                rs.getString("mime_type"),
                rs.getTimestamp("created_at").toInstant()
        );
    }

    private SessionMessage mapMessage(ResultSet rs) throws SQLException {
        return new SessionMessage(
                rs.getLong("id"),
                rs.getString("message_code"),
                rs.getLong("session_id"),
                rs.getObject("run_id") == null ? null : rs.getLong("run_id"),
                rs.getString("role_code"),
                rs.getString("content"),
                rs.getTimestamp("created_at").toInstant()
        );
    }

    private String toJson(List<String> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize JSON", exception);
        }
    }

    private List<String> fromJson(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(value, STRING_LIST);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to deserialize JSON", exception);
        }
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}
