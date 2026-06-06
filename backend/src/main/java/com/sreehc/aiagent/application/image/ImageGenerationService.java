package com.sreehc.aiagent.application.image;

import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.application.admin.ModelRuntimeResolver;
import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.application.common.UploadValidationService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.admin.ModelType;
import com.sreehc.aiagent.domain.image.ImageGenerationJob;
import com.sreehc.aiagent.domain.image.ImageGenerationMode;
import com.sreehc.aiagent.domain.image.ImageGenerationStatus;
import com.sreehc.aiagent.domain.session.AgentSession;
import com.sreehc.aiagent.domain.session.ArtifactRecord;
import com.sreehc.aiagent.domain.session.ArtifactType;
import com.sreehc.aiagent.infrastructure.image.ImageRepository;
import com.sreehc.aiagent.infrastructure.session.SessionRepository;
import com.sreehc.aiagent.infrastructure.storage.ObjectStorageService;
import com.sreehc.aiagent.infrastructure.model.ImageGenerationProvider;
import com.sreehc.aiagent.infrastructure.model.ImageGenerationProviderRouter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImageGenerationService {
    private static final String DEFAULT_SIZE = "1024x1024";
    private static final String SVG_MIME_TYPE = "image/svg+xml";

    private final ImageRepository imageRepository;
    private final SessionRepository sessionRepository;
    private final ObjectStorageService objectStorageService;
    private final UploadValidationService uploadValidationService;
    private final ImageGenerationProviderRouter imageGenerationProviderRouter;
    private final ModelRuntimeResolver modelRuntimeResolver;
    private final AppProperties appProperties;

    public ImageGenerationService(
            ImageRepository imageRepository,
            SessionRepository sessionRepository,
            ObjectStorageService objectStorageService,
            UploadValidationService uploadValidationService,
            ImageGenerationProviderRouter imageGenerationProviderRouter,
            ModelRuntimeResolver modelRuntimeResolver,
            AppProperties appProperties
    ) {
        this.imageRepository = imageRepository;
        this.sessionRepository = sessionRepository;
        this.objectStorageService = objectStorageService;
        this.uploadValidationService = uploadValidationService;
        this.imageGenerationProviderRouter = imageGenerationProviderRouter;
        this.modelRuntimeResolver = modelRuntimeResolver;
        this.appProperties = appProperties;
    }

    @Transactional
    public GeneratedImage generate(SessionUser currentUser, GenerateImageCommand command) {
        AgentSession session = loadOptionalSession(currentUser, command.sessionId());
        String prompt = normalizePrompt(command.prompt());
        String size = normalizeSize(command.size());
        String artifactCode = nextCode("art");
        ImageGenerationProvider.GeneratedImage generated = generateImage(prompt, size, null, null);
        String storageUri = objectStorageService.upload(
                "images/" + currentUser.externalUserId() + "/" + artifactCode + "." + generated.fileExtension(),
                generated.content(),
                generated.contentType()
        );
        sessionRepository.createArtifact(
                artifactCode,
                currentUser.id(),
                session == null ? null : session.id(),
                null,
                ArtifactType.IMAGE,
                buildTitle(prompt),
                prompt,
                storageUri,
                generated.contentType()
        );
        String jobId = nextCode("imgjob");
        imageRepository.createJob(
                jobId,
                currentUser.id(),
                session == null ? null : session.id(),
                ImageGenerationMode.IMAGES,
                prompt,
                size,
                null,
                artifactCode,
                ImageGenerationStatus.COMPLETED,
                null
        );
        ArtifactRecord artifact = sessionRepository.findArtifactByCode(currentUser.id(), artifactCode)
                .orElseThrow(() -> new IllegalStateException("Failed to load generated artifact"));
        return new GeneratedImage(
                jobId,
                ImageGenerationMode.IMAGES,
                size,
                session == null ? null : session.sessionCode(),
                artifact,
                null,
                objectStorageService.createDownloadUrl(artifact.storageUri())
        );
    }

    @Transactional
    public GeneratedImage edit(SessionUser currentUser, EditImageCommand command, MultipartFile referenceFile) {
        if (referenceFile == null || referenceFile.isEmpty()) {
            throw new AppException("REFERENCE_IMAGE_REQUIRED", "Reference image is required", HttpStatus.BAD_REQUEST);
        }
        AgentSession session = loadOptionalSession(currentUser, command.sessionId());
        String prompt = normalizePrompt(command.prompt());
        String size = normalizeSize(command.size());
        UploadValidationService.ValidatedUpload upload = uploadValidationService.validateImage(referenceFile);
        String sourceArtifactCode = nextCode("art");
        String referenceFileName = upload.fileName();
        String referenceMimeType = upload.contentType();

        byte[] referenceBytes;
        try {
            referenceBytes = referenceFile.getBytes();
            String referenceStorageUri = objectStorageService.upload(
                    "images/" + currentUser.externalUserId() + "/" + sourceArtifactCode + "-" + referenceFileName,
                    referenceBytes,
                    referenceMimeType
            );
            sessionRepository.createArtifact(
                    sourceArtifactCode,
                    currentUser.id(),
                    session == null ? null : session.id(),
                    null,
                    ArtifactType.IMAGE_REFERENCE,
                    "Reference · " + referenceFileName,
                    prompt,
                    referenceStorageUri,
                    referenceMimeType
            );
        } catch (Exception exception) {
            throw new AppException("IMAGE_UPLOAD_FAILED", "Reference image upload failed", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String resultArtifactCode = nextCode("art");
        ImageGenerationProvider.GeneratedImage generated = generateImage(prompt, size, referenceBytes, referenceMimeType);
        String resultStorageUri = objectStorageService.upload(
                "images/" + currentUser.externalUserId() + "/" + resultArtifactCode + "." + generated.fileExtension(),
                generated.content(),
                generated.contentType()
        );
        sessionRepository.createArtifact(
                resultArtifactCode,
                currentUser.id(),
                session == null ? null : session.id(),
                null,
                ArtifactType.IMAGE,
                buildTitle(prompt),
                prompt,
                resultStorageUri,
                generated.contentType()
        );
        String jobId = nextCode("imgjob");
        imageRepository.createJob(
                jobId,
                currentUser.id(),
                session == null ? null : session.id(),
                ImageGenerationMode.EDITS,
                prompt,
                size,
                sourceArtifactCode,
                resultArtifactCode,
                ImageGenerationStatus.COMPLETED,
                null
        );
        ArtifactRecord artifact = sessionRepository.findArtifactByCode(currentUser.id(), resultArtifactCode)
                .orElseThrow(() -> new IllegalStateException("Failed to load edited artifact"));
        return new GeneratedImage(
                jobId,
                ImageGenerationMode.EDITS,
                size,
                session == null ? null : session.sessionCode(),
                artifact,
                sourceArtifactCode,
                objectStorageService.createDownloadUrl(artifact.storageUri())
        );
    }

    public HistoryPage listHistory(SessionUser currentUser, int pageNo, int pageSize) {
        List<HistoryItem> items = imageRepository.listJobs(currentUser.id(), pageNo, pageSize).stream()
                .map(job -> {
                    ArtifactRecord resultArtifact = sessionRepository.findArtifactByCode(currentUser.id(), job.resultArtifactId())
                            .orElse(null);
                    return new HistoryItem(
                            job.jobId(),
                            job.mode(),
                            job.promptText(),
                            job.size(),
                            job.sessionCode(),
                            job.sourceArtifactId(),
                            job.resultArtifactId(),
                            job.status(),
                            job.errorMessage(),
                            resultArtifact == null ? null : objectStorageService.createDownloadUrl(resultArtifact.storageUri()),
                            job.createdAt().toString()
                    );
                })
                .toList();
        return new HistoryPage(pageNo, pageSize, items);
    }

    private AgentSession loadOptionalSession(SessionUser currentUser, String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return null;
        }
        return sessionRepository.findSessionByCode(currentUser.id(), sessionId)
                .orElseThrow(() -> new AppException("SESSION_NOT_FOUND", "Session not found", HttpStatus.NOT_FOUND));
    }

    private String normalizePrompt(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            throw new AppException("PROMPT_REQUIRED", "Prompt is required", HttpStatus.BAD_REQUEST);
        }
        return prompt.trim();
    }

    private String normalizeSize(String size) {
        if (size == null || size.isBlank()) {
            return DEFAULT_SIZE;
        }
        return size.trim();
    }

    private ImageGenerationProvider.GeneratedImage generateImage(
            String prompt,
            String size,
            byte[] referenceImage,
            String referenceMimeType
    ) {
        try {
            AppProperties.Image image = appProperties.image();
            ModelRuntimeResolver.RuntimeModel runtimeModel = modelRuntimeResolver.find(ModelType.IMAGE, null)
                    .orElseGet(() -> new ModelRuntimeResolver.RuntimeModel(
                            image.modelCode(),
                            image.provider(),
                            ModelType.IMAGE,
                            image.baseUrl(),
                            image.apiKey()
                    ));
            ImageGenerationProvider provider = imageGenerationProviderRouter.route(runtimeModel.provider());
            return provider.generate(new ImageGenerationProvider.ImageRequest(
                    prompt,
                    size,
                    runtimeModel.modelCode(),
                    runtimeModel.baseUrl(),
                    runtimeModel.apiKey(),
                    referenceImage,
                    referenceMimeType
            ));
        } catch (Exception exception) {
            throw new AppException("IMAGE_GENERATION_FAILED", "Image provider failed", HttpStatus.BAD_GATEWAY);
        }
    }

    private String buildTitle(String prompt) {
        String title = prompt.length() > 36 ? prompt.substring(0, 36) + "..." : prompt;
        return "Image · " + title;
    }

    private String renderSvg(String prompt, String size, String referenceFileName) {
        String[] parts = size.toLowerCase().split("x");
        int width = 1024;
        int height = 1024;
        if (parts.length == 2) {
            try {
                width = Integer.parseInt(parts[0].trim());
                height = Integer.parseInt(parts[1].trim());
            } catch (NumberFormatException ignored) {
                width = 1024;
                height = 1024;
            }
        }
        String safePrompt = escapeXml(prompt);
        String referenceLabel = referenceFileName == null ? "Text-to-image mock render" : "Edited from " + escapeXml(referenceFileName);
        return """
                <svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">
                  <defs>
                    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%%" stop-color="#0f3d4c"/>
                      <stop offset="55%%" stop-color="#f08648"/>
                      <stop offset="100%%" stop-color="#f4d35e"/>
                    </linearGradient>
                  </defs>
                  <rect width="100%%" height="100%%" fill="url(#bg)"/>
                  <circle cx="%d" cy="%d" r="%d" fill="rgba(255,255,255,0.18)"/>
                  <rect x="72" y="72" width="%d" height="%d" rx="36" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.42)"/>
                  <text x="112" y="172" fill="#fff7e8" font-size="34" font-family="Arial, sans-serif">AiAgent Visual Workspace</text>
                  <text x="112" y="236" fill="#fff7e8" font-size="56" font-weight="700" font-family="Arial, sans-serif">%s</text>
                  <text x="112" y="314" fill="#fff7e8" font-size="28" font-family="Arial, sans-serif">%s</text>
                  <text x="112" y="%d" fill="#fff7e8" font-size="24" font-family="Arial, sans-serif">Prompt:</text>
                  <foreignObject x="112" y="%d" width="%d" height="%d">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:28px;line-height:1.45;color:#fff7e8;">
                      %s
                    </div>
                  </foreignObject>
                </svg>
                """.formatted(
                width,
                height,
                width,
                height,
                Math.max(width - 180, 200),
                Math.max(height / 5, 180),
                Math.max(Math.min(width, height) / 4, 120),
                Math.max(width - 144, 240),
                Math.max(height - 144, 240),
                size,
                referenceLabel,
                Math.max(height - 340, 380),
                Math.max(height - 300, 420),
                Math.max(width - 224, 220),
                220,
                safePrompt
        );
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "reference-image";
        }
        return fileName.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    private String escapeXml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private String nextCode(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    public record GenerateImageCommand(
            String prompt,
            String size,
            String sessionId
    ) {
    }

    public record EditImageCommand(
            String prompt,
            String size,
            String sessionId
    ) {
    }

    public record GeneratedImage(
            String jobId,
            ImageGenerationMode mode,
            String size,
            String sessionId,
            ArtifactRecord artifact,
            String sourceArtifactId,
            String resultUrl
    ) {
    }

    public record HistoryItem(
            String jobId,
            ImageGenerationMode mode,
            String prompt,
            String size,
            String sessionId,
            String sourceArtifactId,
            String resultArtifactId,
            ImageGenerationStatus status,
            String errorMessage,
            String resultUrl,
            String createdAt
    ) {
    }

    public record HistoryPage(
            int pageNo,
            int pageSize,
            List<HistoryItem> items
    ) {
    }
}
