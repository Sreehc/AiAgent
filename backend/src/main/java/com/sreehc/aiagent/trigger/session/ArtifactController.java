package com.sreehc.aiagent.trigger.session;

import com.sreehc.aiagent.application.session.ArtifactService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.session.ArtifactRecord;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/artifacts")
public class ArtifactController {
    private final ArtifactService artifactService;

    public ArtifactController(ArtifactService artifactService) {
        this.artifactService = artifactService;
    }

    @GetMapping
    public ApiResponse<List<ArtifactResponse>> listArtifacts(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(required = false) String artifactType,
            @RequestParam(required = false) Boolean reusable,
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize
    ) {
        return ApiResponse.success(artifactService.listArtifacts(currentUser, artifactType, reusable, pageNo, pageSize).stream()
                .map(this::toResponse)
                .toList());
    }

    @GetMapping("/{artifactId}")
    public ApiResponse<ArtifactResponse> getArtifact(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String artifactId
    ) {
        return ApiResponse.success(toResponse(artifactService.getArtifact(currentUser, artifactId)));
    }

    @PostMapping
    public ApiResponse<ArtifactResponse> uploadArtifact(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(required = false) String sessionId,
            @RequestPart("file") MultipartFile file
    ) {
        return ApiResponse.success(toResponse(artifactService.uploadAttachment(currentUser, sessionId, file)));
    }

    @PostMapping("/{artifactId}/reuse")
    public ApiResponse<ReuseResponse> reuseArtifact(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String artifactId
    ) {
        ArtifactService.ReuseResult result = artifactService.reuseArtifact(currentUser, artifactId);
        return ApiResponse.success(new ReuseResponse(result.artifactId(), result.artifactType(), result.title(), result.content()));
    }

    @GetMapping("/{artifactId}/download")
    public ApiResponse<DownloadResponse> downloadArtifact(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String artifactId
    ) {
        return ApiResponse.success(new DownloadResponse(artifactService.downloadUrl(currentUser, artifactId)));
    }

    private ArtifactResponse toResponse(ArtifactRecord artifact) {
        return new ArtifactResponse(
                artifact.artifactCode(),
                artifact.artifactType().name(),
                artifact.title(),
                artifact.content(),
                artifact.storageUri(),
                artifact.mimeType(),
                artifact.metadataJson(),
                artifact.sourceArtifactId(),
                artifact.reusable(),
                artifact.createdAt().toString()
        );
    }

    public record ArtifactResponse(
            String artifactId,
            String artifactType,
            String title,
            String content,
            String storageUri,
            String mimeType,
            String metadata,
            Long sourceArtifactId,
            boolean reusable,
            String createdAt
    ) {
    }

    public record ReuseResponse(
            String artifactId,
            String artifactType,
            String title,
            String content
    ) {
    }

    public record DownloadResponse(
            String url
    ) {
    }
}
