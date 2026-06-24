package com.sreehc.aiagent.application.admin;

import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditService {
    private final AdminAuthorizationService adminAuthorizationService;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AdminAuditService(AdminAuthorizationService adminAuthorizationService, NamedParameterJdbcTemplate jdbcTemplate) {
        this.adminAuthorizationService = adminAuthorizationService;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<UserAuditRow> listUsers(SessionUser currentUser, String keyword, int pageNo, int pageSize) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return jdbcTemplate.query("""
                        select u.id, u.username, u.email, u.display_name, u.status, u.created_at, u.updated_at,
                               coalesce(string_agg(r.role_code, ',' order by r.role_code), '') as roles
                        from user_account u
                        left join user_role_relation r on r.user_id = u.id
                        where (:keyword is null
                            or u.username ilike :keywordLike
                            or u.email ilike :keywordLike
                            or u.display_name ilike :keywordLike)
                        group by u.id
                        order by u.created_at desc
                        limit :limit
                        offset :offset
                        """,
                new MapSqlParameterSource()
                        .addValue("keyword", blankToNull(keyword))
                        .addValue("keywordLike", like(keyword))
                        .addValue("limit", normalizedPageSize(pageSize))
                        .addValue("offset", offset(pageNo, pageSize)),
                (rs, rowNum) -> new UserAuditRow(
                        toIso(rs.getTimestamp("created_at")),
                        rs.getString("username"),
                        "USER_STATE",
                        "u_" + rs.getLong("id"),
                        rs.getString("roles"),
                        rs.getString("status"),
                        null,
                        rs.getString("email"),
                        rs.getString("display_name"),
                        toIso(rs.getTimestamp("updated_at"))
                ));
    }

    public List<RunAuditRow> listRuns(SessionUser currentUser, String status, String keyword, int pageNo, int pageSize) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return jdbcTemplate.query("""
                        select r.run_code, r.query_text, r.execution_mode, r.status, r.error_message,
                               r.started_at, r.completed_at, r.heartbeat_at, r.created_at,
                               s.session_code, s.title as session_title,
                               u.username,
                               (
                                   select count(1)
                                   from tool_invocation t
                                   where t.execution_run_id = r.id
                               ) as tool_call_count,
                               (
                                   select count(1)
                                   from artifact_record a
                                   where a.run_id = r.id
                               ) as artifact_count,
                               case
                                   when r.started_at is not null and r.completed_at is not null
                                   then (extract(epoch from (r.completed_at - r.started_at)) * 1000)::bigint
                                   else null
                               end as duration_ms
                        from execution_run r
                        join agent_session s on s.id = r.session_id
                        join user_account u on u.id = r.user_id
                        where (:status is null or r.status = :status)
                          and (:keyword is null
                            or r.run_code ilike :keywordLike
                            or r.query_text ilike :keywordLike
                            or s.session_code ilike :keywordLike
                            or s.title ilike :keywordLike
                            or u.username ilike :keywordLike)
                        order by r.created_at desc
                        limit :limit
                        offset :offset
                        """,
                new MapSqlParameterSource()
                        .addValue("status", blankToNull(status))
                        .addValue("keyword", blankToNull(keyword))
                        .addValue("keywordLike", like(keyword))
                        .addValue("limit", normalizedPageSize(pageSize))
                        .addValue("offset", offset(pageNo, pageSize)),
                (rs, rowNum) -> new RunAuditRow(
                        toIso(rs.getTimestamp("created_at")),
                        rs.getString("username"),
                        rs.getString("session_code"),
                        rs.getString("run_code"),
                        rs.getString("query_text"),
                        rs.getString("execution_mode"),
                        rs.getString("status"),
                        getNullableLong(rs, "duration_ms"),
                        rs.getString("error_message"),
                        rs.getLong("tool_call_count"),
                        rs.getLong("artifact_count"),
                        rs.getString("session_title")
                ));
    }

    public List<ToolInvocationAuditRow> listToolInvocations(SessionUser currentUser, String status, String keyword, int pageNo, int pageSize) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return jdbcTemplate.query("""
                        select t.tool_call_id, t.tool_name, t.tool_type, t.status, t.started_at, t.ended_at,
                               t.request_payload::text as request_payload,
                               t.response_payload::text as response_payload,
                               r.run_code,
                               u.username
                        from tool_invocation t
                        join execution_run r on r.id = t.execution_run_id
                        join user_account u on u.id = r.user_id
                        where (:status is null or t.status = :status)
                          and (:keyword is null
                            or t.tool_call_id ilike :keywordLike
                            or t.tool_name ilike :keywordLike
                            or t.tool_type ilike :keywordLike
                            or r.run_code ilike :keywordLike
                            or u.username ilike :keywordLike)
                        order by t.started_at desc
                        limit :limit
                        offset :offset
                        """,
                new MapSqlParameterSource()
                        .addValue("status", blankToNull(status))
                        .addValue("keyword", blankToNull(keyword))
                        .addValue("keywordLike", like(keyword))
                        .addValue("limit", normalizedPageSize(pageSize))
                        .addValue("offset", offset(pageNo, pageSize)),
                (rs, rowNum) -> new ToolInvocationAuditRow(
                        toIso(rs.getTimestamp("started_at")),
                        rs.getString("tool_type"),
                        rs.getString("tool_name"),
                        rs.getString("run_code"),
                        rs.getString("tool_call_id"),
                        rs.getString("status"),
                        durationBetween(rs.getTimestamp("started_at"), rs.getTimestamp("ended_at")),
                        "SUCCESS".equalsIgnoreCase(rs.getString("status")) ? null : rs.getString("status"),
                        summarize(rs.getString("request_payload")),
                        summarize(rs.getString("response_payload"))
                ));
    }

    public List<LoginAuditRow> listLoginLogs(SessionUser currentUser, String result, String keyword, int pageNo, int pageSize) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return jdbcTemplate.query("""
                        select id, user_id, username, login_ip, user_agent, login_result, login_at
                        from login_log
                        where (:result is null or login_result = :result)
                          and (:keyword is null
                            or username ilike :keywordLike
                            or login_ip ilike :keywordLike
                            or user_agent ilike :keywordLike)
                        order by login_at desc
                        limit :limit
                        offset :offset
                        """,
                new MapSqlParameterSource()
                        .addValue("result", blankToNull(result))
                        .addValue("keyword", blankToNull(keyword))
                        .addValue("keywordLike", like(keyword))
                        .addValue("limit", normalizedPageSize(pageSize))
                        .addValue("offset", offset(pageNo, pageSize)),
                (rs, rowNum) -> new LoginAuditRow(
                        toIso(rs.getTimestamp("login_at")),
                        rs.getString("username"),
                        rs.getString("login_ip"),
                        rs.getString("user_agent"),
                        rs.getString("login_result"),
                        "FAILED".equalsIgnoreCase(rs.getString("login_result")) ? rs.getString("login_result") : null
                ));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String like(String value) {
        return value == null || value.isBlank() ? null : "%" + value.trim() + "%";
    }

    private int normalizedPageSize(int pageSize) {
        return Math.min(Math.max(pageSize, 1), 200);
    }

    private int offset(int pageNo, int pageSize) {
        return (Math.max(pageNo, 1) - 1) * normalizedPageSize(pageSize);
    }

    private String toIso(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().toString();
    }

    private Long getNullableLong(ResultSet rs, String columnName) throws SQLException {
        long value = rs.getLong(columnName);
        return rs.wasNull() ? null : value;
    }

    private Long durationBetween(Timestamp startedAt, Timestamp endedAt) {
        if (startedAt == null || endedAt == null) {
            return null;
        }
        return endedAt.toInstant().toEpochMilli() - startedAt.toInstant().toEpochMilli();
    }

    private String summarize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.replaceAll("\\s+", " ").trim();
        return normalized.length() <= 180 ? normalized : normalized.substring(0, 180) + "...";
    }

    public record UserAuditRow(
            String createdAt,
            String username,
            String action,
            String target,
            String roleChange,
            String result,
            String ip,
            String email,
            String displayName,
            String updatedAt
    ) {
    }

    public record RunAuditRow(
            String createdAt,
            String username,
            String sessionId,
            String runId,
            String taskTitle,
            String executionMode,
            String status,
            Long durationMs,
            String errorSummary,
            long toolCallCount,
            long artifactCount,
            String sessionTitle
    ) {
    }

    public record ToolInvocationAuditRow(
            String createdAt,
            String serverCode,
            String toolName,
            String runId,
            String toolCallId,
            String status,
            Long durationMs,
            String errorType,
            String inputSummary,
            String outputSummary
    ) {
    }

    public record LoginAuditRow(
            String createdAt,
            String username,
            String ip,
            String userAgent,
            String result,
            String failureReason
    ) {
    }
}
