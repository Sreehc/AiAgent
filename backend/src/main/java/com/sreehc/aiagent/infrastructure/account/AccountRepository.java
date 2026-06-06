package com.sreehc.aiagent.infrastructure.account;

import com.sreehc.aiagent.domain.account.InviteRegistration;
import com.sreehc.aiagent.domain.account.LoginLogEntry;
import com.sreehc.aiagent.domain.account.UserAccount;
import com.sreehc.aiagent.domain.account.UserRole;
import com.sreehc.aiagent.domain.account.UserStatus;
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
public class AccountRepository {
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AccountRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<InviteRegistration> findInvite(String inviteToken) {
        String sql = """
                select id, invite_token, status, expires_at
                from invite_registration
                where invite_token = :inviteToken
                """;
        return jdbcTemplate.query(sql, Map.of("inviteToken", inviteToken), rs -> rs.next()
                ? Optional.of(new InviteRegistration(
                rs.getLong("id"),
                rs.getString("invite_token"),
                rs.getString("status"),
                rs.getTimestamp("expires_at").toInstant()
        ))
                : Optional.empty());
    }

    public boolean existsByUsername(String username) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(1) from user_account where username = :username",
                Map.of("username", username),
                Integer.class
        );
        return count != null && count > 0;
    }

    public long createUser(String username, String displayName, String passwordHash, UserStatus status) {
        Long userId = jdbcTemplate.queryForObject("""
                        insert into user_account (username, display_name, password_hash, status, created_at, updated_at)
                        values (:username, :displayName, :passwordHash, :status, now(), now())
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("username", username)
                        .addValue("displayName", displayName)
                        .addValue("passwordHash", passwordHash)
                        .addValue("status", status.name()),
                Long.class
        );
        if (userId == null) {
            throw new IllegalStateException("Failed to create user");
        }
        return userId;
    }

    public void assignRole(long userId, UserRole role) {
        jdbcTemplate.update("""
                        insert into user_role_relation (user_id, role_code, created_at)
                        values (:userId, :roleCode, now())
                        on conflict (user_id, role_code) do nothing
                        """,
                Map.of("userId", userId, "roleCode", role.name()));
    }

    public void markInviteUsed(long inviteId, long boundUserId) {
        jdbcTemplate.update("""
                        update invite_registration
                        set status = 'USED', bound_user_id = :boundUserId, used_at = now()
                        where id = :inviteId
                        """,
                Map.of("inviteId", inviteId, "boundUserId", boundUserId));
    }

    public Optional<UserAccount> findByUsername(String username) {
        String sql = """
                select id, username, display_name, password_hash, status, email, phone
                from user_account
                where username = :username
                """;
        return jdbcTemplate.query(sql, Map.of("username", username), rs -> rs.next()
                ? Optional.of(mapUser(rs, loadRoles(rs.getLong("id"))))
                : Optional.empty());
    }

    public Optional<UserAccount> findById(long id) {
        String sql = """
                select id, username, display_name, password_hash, status, email, phone
                from user_account
                where id = :id
                """;
        return jdbcTemplate.query(sql, Map.of("id", id), rs -> rs.next()
                ? Optional.of(mapUser(rs, loadRoles(id)))
                : Optional.empty());
    }

    public void updateProfile(long userId, String displayName, String email, String phone) {
        jdbcTemplate.update("""
                        update user_account
                        set display_name = :displayName,
                            email = :email,
                            phone = :phone,
                            updated_at = now()
                        where id = :userId
                        """,
                Map.of(
                        "userId", userId,
                        "displayName", displayName,
                        "email", email,
                        "phone", phone
                ));
    }

    public void updatePassword(long userId, String passwordHash) {
        jdbcTemplate.update("""
                        update user_account
                        set password_hash = :passwordHash,
                            updated_at = now()
                        where id = :userId
                        """,
                Map.of("userId", userId, "passwordHash", passwordHash));
    }

    public void writeLoginLog(Long userId, String username, String loginIp, String userAgent, String loginResult) {
        jdbcTemplate.update("""
                        insert into login_log (user_id, username, login_ip, user_agent, login_result, login_at)
                        values (:userId, :username, :loginIp, :userAgent, :loginResult, now())
                        """,
                new MapSqlParameterSource()
                        .addValue("userId", userId)
                        .addValue("username", username)
                        .addValue("loginIp", loginIp)
                        .addValue("userAgent", userAgent)
                        .addValue("loginResult", loginResult));
    }

    public List<LoginLogEntry> findLoginLogs(long userId, int pageNo, int pageSize) {
        int offset = Math.max(pageNo - 1, 0) * pageSize;
        return jdbcTemplate.query("""
                        select login_ip, user_agent, login_result, login_at
                        from login_log
                        where user_id = :userId
                        order by login_at desc
                        limit :limit offset :offset
                        """,
                Map.of("userId", userId, "limit", pageSize, "offset", offset),
                (rs, rowNum) -> new LoginLogEntry(
                        rs.getString("login_ip"),
                        rs.getString("user_agent"),
                        rs.getString("login_result"),
                        rs.getTimestamp("login_at").toInstant()
                ));
    }

    public Optional<UserAccount> findByUsernameOrEmail(String usernameOrEmail) {
        String sql = """
                select id, username, display_name, password_hash, status, email, phone
                from user_account
                where username = :value or email = :value
                """;
        return jdbcTemplate.query(sql, Map.of("value", usernameOrEmail), rs -> rs.next()
                ? Optional.of(mapUser(rs, loadRoles(rs.getLong("id"))))
                : Optional.empty());
    }

    public void createPasswordResetToken(String tokenHash, long userId, String requestIp, Instant expiresAt) {
        jdbcTemplate.update("""
                        insert into password_reset_token (token_hash, user_id, request_ip, expires_at, created_at)
                        values (:tokenHash, :userId, :requestIp, :expiresAt, now())
                        """,
                new MapSqlParameterSource()
                        .addValue("tokenHash", tokenHash)
                        .addValue("userId", userId)
                        .addValue("requestIp", requestIp)
                        .addValue("expiresAt", Timestamp.from(expiresAt)));
    }

    public Optional<PasswordResetTokenRecord> findPasswordResetToken(String tokenHash) {
        return jdbcTemplate.query("""
                        select id, token_hash, user_id, request_ip, expires_at, used_at, created_at
                        from password_reset_token
                        where token_hash = :tokenHash
                        """,
                Map.of("tokenHash", tokenHash),
                rs -> rs.next() ? Optional.of(new PasswordResetTokenRecord(
                        rs.getLong("id"),
                        rs.getString("token_hash"),
                        rs.getLong("user_id"),
                        rs.getString("request_ip"),
                        rs.getTimestamp("expires_at").toInstant(),
                        rs.getTimestamp("used_at") == null ? null : rs.getTimestamp("used_at").toInstant(),
                        rs.getTimestamp("created_at").toInstant()
                )) : Optional.empty());
    }

    public void markPasswordResetTokenUsed(long tokenId) {
        jdbcTemplate.update("""
                        update password_reset_token
                        set used_at = now()
                        where id = :tokenId
                        """,
                Map.of("tokenId", tokenId));
    }

    public record PasswordResetTokenRecord(
            long id,
            String tokenHash,
            long userId,
            String requestIp,
            Instant expiresAt,
            Instant usedAt,
            Instant createdAt
    ) {
    }

    private UserAccount mapUser(ResultSet rs, List<UserRole> roles) throws SQLException {
        return new UserAccount(
                rs.getLong("id"),
                rs.getString("username"),
                rs.getString("display_name"),
                rs.getString("password_hash"),
                UserStatus.valueOf(rs.getString("status")),
                rs.getString("email"),
                rs.getString("phone"),
                roles
        );
    }

    private List<UserRole> loadRoles(long userId) {
        return jdbcTemplate.query("""
                        select role_code
                        from user_role_relation
                        where user_id = :userId
                        """,
                Map.of("userId", userId),
                (rs, rowNum) -> UserRole.valueOf(rs.getString("role_code")));
    }
}
