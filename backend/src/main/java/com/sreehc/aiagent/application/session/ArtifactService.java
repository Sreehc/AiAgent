package com.sreehc.aiagent.application.session;

import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.application.common.UploadValidationService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.session.AgentSession;
import com.sreehc.aiagent.domain.session.ArtifactRecord;
import com.sreehc.aiagent.domain.session.ArtifactType;
import com.sreehc.aiagent.infrastructure.session.SessionRepository;
import com.sreehc.aiagent.infrastructure.storage.ObjectStorageService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ArtifactService {
    private final SessionRepository sessionRepository;
    private final ObjectStorageService objectStorageService;
    private final UploadValidationService uploadValidationService;

    public ArtifactService(SessionRepository sessionRepository, ObjectStorageService objectStorageService, UploadValidationService uploadValidationService) {
        this.sessionRepository = sessionRepository;
        this.objectStorageService = objectStorageService;
        this.uploadValidationService = uploadValidationService;
    }

    public List<ArtifactRecord> listArtifacts(SessionUser currentUser, String artifactType, Boolean reusable, int pageNo, int pageSize) {
        return sessionRepository.listUserArtifacts(currentUser.id(), artifactType, reusable, pageNo, Math.min(Math.max(pageSize, 1), 100));
    }

    public ArtifactRecord getArtifact(SessionUser currentUser, String artifactId) {
        return sessionRepository.findArtifactByCode(currentUser.id(), artifactId)
                .orElseThrow(() -> new AppException("ARTIFACT_NOT_FOUND", "Artifact not found", HttpStatus.NOT_FOUND));
    }

    public ReuseResult reuseArtifact(SessionUser currentUser, String artifactId) {
        ArtifactRecord artifact = getArtifact(currentUser, artifactId);
        if (!artifact.reusable()) {
            throw new AppException("ARTIFACT_NOT_REUSABLE", "Artifact is not reusable", HttpStatus.CONFLICT);
        }
        return new ReuseResult(artifact.artifactCode(), artifact.artifactType().name(), artifact.title(), artifact.content());
    }

    public String downloadUrl(SessionUser currentUser, String artifactId) {
        ArtifactRecord artifact = getArtifact(currentUser, artifactId);
        if (artifact.storageUri() == null || artifact.storageUri().isBlank()) {
            throw new AppException("ARTIFACT_NOT_DOWNLOADABLE", "Artifact has no downloadable object", HttpStatus.CONFLICT);
        }
        return objectStorageService.createDownloadUrl(artifact.storageUri());
    }

    public ArtifactRecord uploadAttachment(SessionUser currentUser, String sessionCode, MultipartFile file) {
        try {
            UploadValidationService.ValidatedUpload upload = uploadValidationService.validateDocument(file);
            AgentSession session = sessionCode == null || sessionCode.isBlank()
                    ? null
                    : sessionRepository.findSessionByCode(currentUser.id(), sessionCode)
                    .orElseThrow(() -> new AppException("SESSION_NOT_FOUND", "Session not found", HttpStatus.NOT_FOUND));
            byte[] bytes = file.getBytes();
            String artifactCode = nextCode("art");
            String storageUri = objectStorageService.upload("artifacts/" + currentUser.id() + "/" + artifactCode + "-" + upload.fileName(), bytes, upload.contentType());
            sessionRepository.createArtifact(
                    artifactCode,
                    currentUser.id(),
                    session == null ? null : session.id(),
                    null,
                    ArtifactType.ATTACHMENT,
                    upload.fileName(),
                    new String(bytes, StandardCharsets.UTF_8),
                    storageUri,
                    upload.contentType()
            );
            return getArtifact(currentUser, artifactCode);
        } catch (AppException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AppException("ARTIFACT_UPLOAD_FAILED", "Artifact upload failed", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String nextCode(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    public record ReuseResult(
            String artifactId,
            String artifactType,
            String title,
            String content
    ) {
    }
}
