package com.sreehc.aiagent.infrastructure.knowledge;

import com.sreehc.aiagent.domain.knowledge.RagEvaluationRun;
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
public class RagEvaluationRepository {
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public RagEvaluationRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void createCompletedRun(String evalId, long userId, String knowledgeBaseIdsJson, String casesJson, String metricsJson) {
        jdbcTemplate.update("""
                        insert into rag_evaluation_run (
                            eval_id, user_id, knowledge_base_ids, cases, metrics, status, created_at, completed_at
                        )
                        values (
                            :evalId, :userId, cast(:knowledgeBaseIdsJson as jsonb), cast(:casesJson as jsonb),
                            cast(:metricsJson as jsonb), 'COMPLETED', now(), now()
                        )
                        """,
                new MapSqlParameterSource()
                        .addValue("evalId", evalId)
                        .addValue("userId", userId)
                        .addValue("knowledgeBaseIdsJson", knowledgeBaseIdsJson)
                        .addValue("casesJson", casesJson)
                        .addValue("metricsJson", metricsJson));
    }

    public List<RagEvaluationRun> listRuns(long userId, int limit) {
        return jdbcTemplate.query("""
                        select id, eval_id, user_id, knowledge_base_ids::text, cases::text, metrics::text,
                               status, error_message, created_at, completed_at
                        from rag_evaluation_run
                        where user_id = :userId
                        order by created_at desc
                        limit :limit
                        """,
                Map.of("userId", userId, "limit", limit),
                (rs, rowNum) -> mapRun(rs));
    }

    public Optional<RagEvaluationRun> findRun(long userId, String evalId) {
        return jdbcTemplate.query("""
                        select id, eval_id, user_id, knowledge_base_ids::text, cases::text, metrics::text,
                               status, error_message, created_at, completed_at
                        from rag_evaluation_run
                        where user_id = :userId and eval_id = :evalId
                        """,
                Map.of("userId", userId, "evalId", evalId),
                rs -> rs.next() ? Optional.of(mapRun(rs)) : Optional.empty());
    }

    public void createCase(String caseId, long userId, String query, String expectedCitationIdsJson, String expectedTextContainsJson, boolean enabled) {
        jdbcTemplate.update("""
                        insert into rag_evaluation_case (
                            case_id, user_id, query, expected_citation_ids, expected_text_contains, enabled, created_at, updated_at
                        )
                        values (
                            :caseId, :userId, :query, cast(:expectedCitationIdsJson as jsonb),
                            cast(:expectedTextContainsJson as jsonb), :enabled, now(), now()
                        )
                        """,
                new MapSqlParameterSource()
                        .addValue("caseId", caseId)
                        .addValue("userId", userId)
                        .addValue("query", query)
                        .addValue("expectedCitationIdsJson", expectedCitationIdsJson)
                        .addValue("expectedTextContainsJson", expectedTextContainsJson)
                        .addValue("enabled", enabled));
    }

    public void updateCase(long userId, String caseId, String query, String expectedCitationIdsJson, String expectedTextContainsJson, boolean enabled) {
        jdbcTemplate.update("""
                        update rag_evaluation_case
                        set query = :query,
                            expected_citation_ids = cast(:expectedCitationIdsJson as jsonb),
                            expected_text_contains = cast(:expectedTextContainsJson as jsonb),
                            enabled = :enabled,
                            updated_at = now()
                        where user_id = :userId and case_id = :caseId
                        """,
                new MapSqlParameterSource()
                        .addValue("userId", userId)
                        .addValue("caseId", caseId)
                        .addValue("query", query)
                        .addValue("expectedCitationIdsJson", expectedCitationIdsJson)
                        .addValue("expectedTextContainsJson", expectedTextContainsJson)
                        .addValue("enabled", enabled));
    }

    public void deleteCase(long userId, String caseId) {
        jdbcTemplate.update("""
                        delete from rag_evaluation_case
                        where user_id = :userId and case_id = :caseId
                        """,
                Map.of("userId", userId, "caseId", caseId));
    }

    public List<EvaluationCaseRow> listCases(long userId) {
        return jdbcTemplate.query("""
                        select id, case_id, user_id, query, expected_citation_ids::text, expected_text_contains::text,
                               enabled, created_at, updated_at
                        from rag_evaluation_case
                        where user_id = :userId
                        order by created_at desc
                        """,
                Map.of("userId", userId),
                (rs, rowNum) -> new EvaluationCaseRow(
                        rs.getLong("id"),
                        rs.getString("case_id"),
                        rs.getLong("user_id"),
                        rs.getString("query"),
                        rs.getString("expected_citation_ids"),
                        rs.getString("expected_text_contains"),
                        rs.getBoolean("enabled"),
                        rs.getTimestamp("created_at").toInstant(),
                        rs.getTimestamp("updated_at").toInstant()
                ));
    }

    private RagEvaluationRun mapRun(ResultSet rs) throws SQLException {
        return new RagEvaluationRun(
                rs.getLong("id"),
                rs.getString("eval_id"),
                rs.getLong("user_id"),
                rs.getString("knowledge_base_ids"),
                rs.getString("cases"),
                rs.getString("metrics"),
                rs.getString("status"),
                rs.getString("error_message"),
                rs.getTimestamp("created_at").toInstant(),
                toInstant(rs.getTimestamp("completed_at"))
        );
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    public record EvaluationCaseRow(
            long id,
            String caseId,
            long userId,
            String query,
            String expectedCitationIdsJson,
            String expectedTextContainsJson,
            boolean enabled,
            Instant createdAt,
            Instant updatedAt
    ) {
    }
}
