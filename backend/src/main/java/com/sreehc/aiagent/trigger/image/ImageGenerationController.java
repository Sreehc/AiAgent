package com.sreehc.aiagent.trigger.image;

import com.sreehc.aiagent.application.image.ImageGenerationService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Validated
@RequestMapping("/api/v1/images")
public class ImageGenerationController {
    private final ImageGenerationService imageGenerationService;

    public ImageGenerationController(ImageGenerationService imageGenerationService) {
        this.imageGenerationService = imageGenerationService;
    }

    @PostMapping("/generations")
    public ApiResponse<ImageResponse> generate(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Validated @RequestBody GenerateImageRequest request
    ) {
        return ApiResponse.success(toImageResponse(imageGenerationService.generate(
                currentUser,
                new ImageGenerationService.GenerateImageCommand(request.prompt(), request.size(), request.sessionId())
        )));
    }

    @PostMapping("/edits")
    public ApiResponse<ImageResponse> edit(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Validated @ModelAttribute EditImageRequest request
    ) {
        return ApiResponse.success(toImageResponse(imageGenerationService.edit(
                currentUser,
                new ImageGenerationService.EditImageCommand(request.prompt(), request.size(), request.sessionId()),
                request.referenceImage()
        )));
    }

    @GetMapping("/history")
    public ApiResponse<HistoryResponse> history(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "12") @Min(1) @Max(60) int pageSize
    ) {
        ImageGenerationService.HistoryPage page = imageGenerationService.listHistory(currentUser, pageNo, pageSize);
        return ApiResponse.success(new HistoryResponse(
                page.pageNo(),
                page.pageSize(),
                page.items().stream().map(item -> new HistoryItemResponse(
                        item.jobId(),
                        item.mode().name(),
                        item.prompt(),
                        item.size(),
                        item.sessionId(),
                        item.sourceArtifactId(),
                        item.resultArtifactId(),
                        item.status().name(),
                        item.errorMessage(),
                        item.resultUrl(),
                        item.createdAt()
                )).toList()
        ));
    }

    private ImageResponse toImageResponse(ImageGenerationService.GeneratedImage generatedImage) {
        return new ImageResponse(
                generatedImage.jobId(),
                generatedImage.mode().name(),
                generatedImage.size(),
                generatedImage.sessionId(),
                generatedImage.sourceArtifactId(),
                generatedImage.artifact().artifactCode(),
                generatedImage.artifact().title(),
                generatedImage.artifact().storageUri(),
                generatedImage.artifact().mimeType(),
                generatedImage.resultUrl(),
                generatedImage.artifact().createdAt().toString()
        );
    }

    public record GenerateImageRequest(
            @NotBlank @Size(max = 2000) String prompt,
            @Size(max = 32) String size,
            @Size(max = 64) String sessionId
    ) {
    }

    public record EditImageRequest(
            @NotBlank @Size(max = 2000) String prompt,
            @Size(max = 32) String size,
            @Size(max = 64) String sessionId,
            MultipartFile referenceImage
    ) {
    }

    public record ImageResponse(
            String jobId,
            String mode,
            String size,
            String sessionId,
            String sourceArtifactId,
            String artifactId,
            String title,
            String storageUri,
            String mimeType,
            String resultUrl,
            String createdAt
    ) {
    }

    public record HistoryResponse(
            int pageNo,
            int pageSize,
            List<HistoryItemResponse> items
    ) {
    }

    public record HistoryItemResponse(
            String jobId,
            String mode,
            String prompt,
            String size,
            String sessionId,
            String sourceArtifactId,
            String resultArtifactId,
            String status,
            String errorMessage,
            String resultUrl,
            String createdAt
    ) {
    }
}
