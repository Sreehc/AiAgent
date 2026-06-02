package com.sreehc.aiagent.infrastructure.mcp;

import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpServerStatus;
import com.sreehc.aiagent.domain.mcp.McpTransportType;
import com.sreehc.aiagent.domain.mcp.ToolInvocationRecord;
import com.sreehc.aiagent.domain.mcp.ToolInvocationStatus;
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
public class McpServerRepository {
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public McpServerRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long createServer(
            String serverCode,
            String name,
            McpTransportType transportType,
            String endpoint,
            String commandLine,
            long createdBy
    ) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into mcp_server_config (
                            server_code, name, transport_type, endpoint, command_line, status, created_by, created_at, updated_at
                        )
                        values (
                            :serverCode, :name, :transportType, :endpoint, :commandLine, :status, :createdBy, now(), now()
                        )
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("serverCode", serverCode)
                        .addValue("name", name)
                        .addValue("transportType", transportType.name())
                        .addValue("endpoint", endpoint)
                        .addValue("commandLine", commandLine)
                        .addValue("status", McpServerStatus.ACTIVE.name())
                        .addValue("createdBy", createdBy),
                Long.class
        );
        if (id == null) {
            throw new IllegalStateException("Failed to create MCP server config");
        }
        return id;
    }

    public List<McpServerConfig> listServers() {
        return jdbcTemplate.query("""
                        select id, server_code, name, transport_type, endpoint, command_line, status, created_by, created_at, updated_at
                        from mcp_server_config
                        order by created_at desc
                """,
                (rs, rowNum) -> mapServer(rs));
    }

    public Optional<McpServerConfig> findById(long id) {
        return jdbcTemplate.query("""
                        select id, server_code, name, transport_type, endpoint, command_line, status, created_by, created_at, updated_at
                        from mcp_server_config
                        where id = :id
                        """,
                Map.of("id", id),
                rs -> rs.next() ? Optional.of(mapServer(rs)) : Optional.empty());
    }

    public Optional<McpServerConfig> findByServerCode(String serverCode) {
        return jdbcTemplate.query("""
                        select id, server_code, name, transport_type, endpoint, command_line, status, created_by, created_at, updated_at
                        from mcp_server_config
                        where server_code = :serverCode
                        """,
                Map.of("serverCode", serverCode),
                rs -> rs.next() ? Optional.of(mapServer(rs)) : Optional.empty());
    }

    public void updateServer(
            String serverCode,
            String name,
            McpTransportType transportType,
            String endpoint,
            String commandLine,
            boolean active
    ) {
        jdbcTemplate.update("""
                        update mcp_server_config
                        set name = :name,
                            transport_type = :transportType,
                            endpoint = :endpoint,
                            command_line = :commandLine,
                            status = :status,
                            updated_at = now()
                        where server_code = :serverCode
                        """,
                new MapSqlParameterSource()
                        .addValue("serverCode", serverCode)
                        .addValue("name", name)
                        .addValue("transportType", transportType.name())
                        .addValue("endpoint", endpoint)
                        .addValue("commandLine", commandLine)
                        .addValue("status", active ? McpServerStatus.ACTIVE.name() : McpServerStatus.INACTIVE.name()));
    }

    public void deleteServer(String serverCode) {
        jdbcTemplate.update("""
                        delete from mcp_server_config
                        where server_code = :serverCode
                        """,
                Map.of("serverCode", serverCode));
    }

    public List<McpServerConfig> listActiveServers() {
        return jdbcTemplate.query("""
                        select id, server_code, name, transport_type, endpoint, command_line, status, created_by, created_at, updated_at
                        from mcp_server_config
                        where status = :status
                        order by created_at asc
                        """,
                Map.of("status", McpServerStatus.ACTIVE.name()),
                (rs, rowNum) -> mapServer(rs));
    }

    public long createToolInvocation(
            long runId,
            String toolCallId,
            String toolName,
            String toolType,
            String requestPayload
    ) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into tool_invocation (
                            execution_run_id, tool_call_id, tool_name, tool_type, request_payload, status, started_at
                        )
                        values (
                            :runId, :toolCallId, :toolName, :toolType, cast(:requestPayload as jsonb), :status, now()
                        )
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("runId", runId)
                        .addValue("toolCallId", toolCallId)
                        .addValue("toolName", toolName)
                        .addValue("toolType", toolType)
                        .addValue("requestPayload", requestPayload)
                        .addValue("status", ToolInvocationStatus.RUNNING.name()),
                Long.class
        );
        if (id == null) {
            throw new IllegalStateException("Failed to create tool invocation");
        }
        return id;
    }

    public void markToolInvocationSuccess(long invocationId, String responsePayload) {
        jdbcTemplate.update("""
                        update tool_invocation
                        set response_payload = cast(:responsePayload as jsonb),
                            status = :status,
                            ended_at = now()
                        where id = :invocationId
                        """,
                Map.of(
                        "invocationId", invocationId,
                        "responsePayload", responsePayload,
                        "status", ToolInvocationStatus.SUCCESS.name()
                ));
    }

    public void markToolInvocationFailed(long invocationId, String responsePayload) {
        jdbcTemplate.update("""
                        update tool_invocation
                        set response_payload = cast(:responsePayload as jsonb),
                            status = :status,
                            ended_at = now()
                        where id = :invocationId
                        """,
                Map.of(
                        "invocationId", invocationId,
                        "responsePayload", responsePayload,
                        "status", ToolInvocationStatus.FAILED.name()
                ));
    }

    public List<ToolInvocationRecord> listByRunId(long runId) {
        return jdbcTemplate.query("""
                        select id, execution_run_id, tool_call_id, tool_name, tool_type, request_payload::text,
                               response_payload::text, status, started_at, ended_at
                        from tool_invocation
                        where execution_run_id = :runId
                        order by started_at asc
                        """,
                Map.of("runId", runId),
                (rs, rowNum) -> mapToolInvocation(rs));
    }

    private McpServerConfig mapServer(ResultSet rs) throws SQLException {
        return new McpServerConfig(
                rs.getLong("id"),
                rs.getString("server_code"),
                rs.getString("name"),
                McpTransportType.valueOf(rs.getString("transport_type")),
                rs.getString("endpoint"),
                rs.getString("command_line"),
                McpServerStatus.valueOf(rs.getString("status")),
                rs.getLong("created_by"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private ToolInvocationRecord mapToolInvocation(ResultSet rs) throws SQLException {
        return new ToolInvocationRecord(
                rs.getLong("id"),
                rs.getLong("execution_run_id"),
                rs.getString("tool_call_id"),
                rs.getString("tool_name"),
                rs.getString("tool_type"),
                rs.getString("request_payload"),
                rs.getString("response_payload"),
                ToolInvocationStatus.valueOf(rs.getString("status")),
                rs.getTimestamp("started_at").toInstant(),
                toInstant(rs.getTimestamp("ended_at"))
        );
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}
