package com.sreehc.aiagent.infrastructure.image;

import com.sreehc.aiagent.domain.image.ImageGenerationJob;
import com.sreehc.aiagent.domain.image.ImageGenerationMode;
import com.sreehc.aiagent.domain.image.ImageGenerationStatus;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ImageRepository {
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public ImageRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long createJob(
            String jobId,
            long userId,
            Long sessionId,
            ImageGenerationMode mode,
            String promptText,
            String size,
            String sourceArtifactId,
            String resultArtifactId,
            ImageGenerationStatus status,
            String errorMessage
    ) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into image_generation_job (
                            job_id, user_id, session_id, mode, prompt_text, size,
                            source_artifact_id, result_artifact_id, status, error_message, created_at
                        )
                        values (
                            :jobId, :userId, :sessionId, :mode, :promptText, :size,
                            :sourceArtifactId, :resultArtifactId, :status, :errorMessage, now()
                        )
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("jobId", jobId)
                        .addValue("userId", userId)
                        .addValue("sessionId", sessionId)
                        .addValue("mode", mode.name())
                        .addValue("promptText", promptText)
                        .addValue("size", size)
                        .addValue("sourceArtifactId", sourceArtifactId)
                        .addValue("resultArtifactId", resultArtifactId)
                        .addValue("status", status.name())
                        .addValue("errorMessage", errorMessage),
                Long.class
        );
        if (id == null) {
            throw new IllegalStateException("Failed to create image generation job");
        }
        return id;
    }

    public List<ImageGenerationJob> listJobs(long userId, int pageNo, int pageSize) {
        int offset = Math.max(pageNo - 1, 0) * pageSize;
        return jdbcTemplate.query("""
                        select job.id, job.job_id, job.user_id, session.session_code, job.mode,
                               job.prompt_text, job.size, job.source_artifact_id, job.result_artifact_id,
                               job.status, job.error_message, job.created_at
                        from image_generation_job job
                        left join agent_session session on session.id = job.session_id
                        where job.user_id = :userId
                        order by job.created_at desc
                        limit :limit offset :offset
                        """,
                Map.of("userId", userId, "limit", pageSize, "offset", offset),
                (rs, rowNum) -> mapJob(rs));
    }

    private ImageGenerationJob mapJob(ResultSet rs) throws SQLException {
        return new ImageGenerationJob(
                rs.getLong("id"),
                rs.getString("job_id"),
                rs.getLong("user_id"),
                rs.getString("session_code"),
                ImageGenerationMode.valueOf(rs.getString("mode")),
                rs.getString("prompt_text"),
                rs.getString("size"),
                rs.getString("source_artifact_id"),
                rs.getString("result_artifact_id"),
                ImageGenerationStatus.valueOf(rs.getString("status")),
                rs.getString("error_message"),
                rs.getTimestamp("created_at").toInstant()
        );
    }
}
