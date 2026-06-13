package com.sreehc.aiagent.application.session;

import com.sreehc.aiagent.domain.session.ArtifactRecord;
import com.sreehc.aiagent.domain.session.SessionMessage;
import com.sreehc.aiagent.infrastructure.session.SessionRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ConversationMemoryService {
    private static final int RECENT_MESSAGE_LIMIT = 8;

    private final SessionRepository sessionRepository;

    public ConversationMemoryService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public MemoryContext loadContext(long sessionId, long userId, List<String> artifactIds) {
        String summary = sessionRepository.findLatestSessionMemory(sessionId, "SUMMARY").orElse("");
        List<SessionMessage> recentMessages = sessionRepository.listMessages(sessionId).stream()
                .sorted(Comparator.comparing(SessionMessage::createdAt).reversed())
                .limit(RECENT_MESSAGE_LIMIT)
                .sorted(Comparator.comparing(SessionMessage::createdAt))
                .toList();
        List<ArtifactRecord> artifacts = sessionRepository.listUserArtifacts(userId, artifactIds);
        return new MemoryContext(summary, recentMessages, artifacts);
    }

    public void updateSummary(long sessionId, long userId, long runId, String reportContent) {
        String summary = reportContent == null ? "" : reportContent.strip();
        if (summary.length() > 3000) {
            summary = summary.substring(0, 3000);
        }
        if (!summary.isBlank()) {
            sessionRepository.upsertSessionMemory(sessionId, userId, "SUMMARY", summary, runId, estimateTokens(summary));
        }
    }

    public String rebuildSummary(long sessionId, long userId) {
        List<SessionMessage> messages = sessionRepository.listMessages(sessionId).stream()
                .sorted(Comparator.comparing(SessionMessage::createdAt))
                .toList();
        StringBuilder builder = new StringBuilder();
        builder.append("该会话已有 ").append(messages.size()).append(" 条消息。\n");
        for (SessionMessage message : messages.stream().skip(Math.max(0, messages.size() - 12)).toList()) {
            builder.append("- ")
                    .append(message.roleCode())
                    .append(": ")
                    .append(crop(message.content(), 500))
                    .append("\n");
        }
        String summary = crop(builder.toString().strip(), 3000);
        sessionRepository.upsertSessionMemory(sessionId, userId, "SUMMARY", summary, null, estimateTokens(summary));
        return summary;
    }

    public String toPrompt(MemoryContext context) {
        StringBuilder builder = new StringBuilder();
        if (context.summary() != null && !context.summary().isBlank()) {
            builder.append("会话摘要:\n").append(context.summary()).append("\n\n");
        }
        if (!context.recentMessages().isEmpty()) {
            builder.append("最近消息:\n");
            for (SessionMessage message : context.recentMessages()) {
                builder.append("- ").append(message.roleCode()).append(": ").append(crop(message.content(), 500)).append("\n");
            }
            builder.append("\n");
        }
        if (!context.inputArtifacts().isEmpty()) {
            builder.append("复用产物:\n");
            for (ArtifactRecord artifact : context.inputArtifacts()) {
                builder.append("- ")
                        .append(artifact.artifactType().name())
                        .append(" / ")
                        .append(artifact.title())
                        .append(": ")
                        .append(crop(artifact.content(), 800))
                        .append("\n");
            }
        }
        return builder.toString();
    }

    private int estimateTokens(String text) {
        return Math.max(1, text.length() / 4);
    }

    private String crop(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength) + "...";
    }

    public record MemoryContext(
            String summary,
            List<SessionMessage> recentMessages,
            List<ArtifactRecord> inputArtifacts
    ) {
    }
}
