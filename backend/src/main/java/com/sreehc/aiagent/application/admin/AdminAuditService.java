package com.sreehc.aiagent.application.admin;

import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import java.util.List;
import java.util.Map;
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

    public List<Map<String, Object>> listUsers(SessionUser currentUser, String keyword, int pageNo, int pageSize) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return jdbcTemplate.queryForList("""
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
                        .addValue("offset", offset(pageNo, pageSize)));
    }

    public List<Map<String, Object>> listRuns(SessionUser currentUser, String status, String keyword, int pageNo, int pageSize) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return jdbcTemplate.queryForList("""
                        select r.run_code, r.query_text, r.execution_mode, r.status, r.error_message,
                               r.started_at, r.completed_at, r.heartbeat_at, r.created_at,
                               s.session_code, s.title as session_title,
                               u.username
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
                        .addValue("offset", offset(pageNo, pageSize)));
    }

    public List<Map<String, Object>> listToolInvocations(SessionUser currentUser, String status, String keyword, int pageNo, int pageSize) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return jdbcTemplate.queryForList("""
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
                        .addValue("offset", offset(pageNo, pageSize)));
    }

    public List<Map<String, Object>> listLoginLogs(SessionUser currentUser, String result, String keyword, int pageNo, int pageSize) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return jdbcTemplate.queryForList("""
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
                        .addValue("offset", offset(pageNo, pageSize)));
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
}
