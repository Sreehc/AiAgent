package com.sreehc.aiagent.trigger.knowledge;

import com.sreehc.aiagent.application.knowledge.KnowledgeBaseService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.knowledge.KnowledgeBase;
import com.sreehc.aiagent.domain.knowledge.KnowledgeDocument;
import com.sreehc.aiagent.domain.knowledge.SearchHit;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Validated
@RequestMapping("/api/v1/knowledge-bases")
public class KnowledgeBaseController {
    private final KnowledgeBaseService knowledgeBaseService;

    public KnowledgeBaseController(KnowledgeBaseService knowledgeBaseService) {
        this.knowledgeBaseService = knowledgeBaseService;
    }

    @PostMapping
    public ApiResponse<KnowledgeBaseResponse> createKnowledgeBase(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Valid @RequestBody CreateKnowledgeBaseRequest request
    ) {
        return ApiResponse.success(toKnowledgeBaseResponse(knowledgeBaseService.createKnowledgeBase(
                currentUser,
                new KnowledgeBaseService.CreateKnowledgeBaseCommand(request.name(), request.description())
        )));
    }

    @GetMapping
    public ApiResponse<List<KnowledgeBaseResponse>> listKnowledgeBases(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser
    ) {
        return ApiResponse.success(knowledgeBaseService.listKnowledgeBases(currentUser).stream()
                .map(this::toKnowledgeBaseResponse)
                .toList());
    }

    @PutMapping("/{kbId}")
    public ApiResponse<KnowledgeBaseResponse> updateKnowledgeBase(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId,
            @Valid @RequestBody UpdateKnowledgeBaseRequest request
    ) {
        return ApiResponse.success(toKnowledgeBaseResponse(knowledgeBaseService.updateKnowledgeBase(
                currentUser,
                kbId,
                new KnowledgeBaseService.UpdateKnowledgeBaseCommand(request.name(), request.description())
        )));
    }

    @DeleteMapping("/{kbId}")
    public ApiResponse<Void> deleteKnowledgeBase(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId
    ) {
        knowledgeBaseService.deleteKnowledgeBase(currentUser, kbId);
        return ApiResponse.success(null);
    }

    @PostMapping("/{kbId}/documents")
    public ApiResponse<DocumentResponse> uploadDocument(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId,
            @RequestPart("file") MultipartFile file
    ) {
        return ApiResponse.success(toDocumentResponse(knowledgeBaseService.uploadDocument(currentUser, kbId, file)));
    }

    @GetMapping("/{kbId}/documents")
    public ApiResponse<List<DocumentResponse>> listDocuments(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId
    ) {
        return ApiResponse.success(knowledgeBaseService.listDocuments(currentUser, kbId).stream()
                .map(this::toDocumentResponse)
                .toList());
    }

    @GetMapping("/{kbId}/documents/{documentId}")
    public ApiResponse<DocumentDetailResponse> getDocument(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId,
            @PathVariable String documentId
    ) {
        KnowledgeDocument document = knowledgeBaseService.getDocument(currentUser, kbId, documentId);
        String text = document.textContent() == null ? "" : document.textContent();
        return ApiResponse.success(new DocumentDetailResponse(
                toDocumentResponse(document),
                text.length() <= 4000 ? text : text.substring(0, 4000)
        ));
    }

    @GetMapping("/{kbId}/documents/{documentId}/download")
    public ApiResponse<DocumentDownloadResponse> downloadDocument(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId,
            @PathVariable String documentId
    ) {
        return ApiResponse.success(new DocumentDownloadResponse(knowledgeBaseService.createDocumentDownloadUrl(currentUser, kbId, documentId)));
    }

    @DeleteMapping("/{kbId}/documents/{documentId}")
    public ApiResponse<Void> deleteDocument(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId,
            @PathVariable String documentId
    ) {
        knowledgeBaseService.deleteDocument(currentUser, kbId, documentId);
        return ApiResponse.success(null);
    }

    @GetMapping("/{kbId}/documents/{documentId}/versions")
    public ApiResponse<List<DocumentResponse>> listDocumentVersions(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId,
            @PathVariable String documentId
    ) {
        return ApiResponse.success(knowledgeBaseService.listDocumentVersions(currentUser, kbId, documentId).stream()
                .map(this::toDocumentResponse)
                .toList());
    }

    @PostMapping("/{kbId}/documents/{documentId}/versions/{versionId}/restore")
    public ApiResponse<DocumentResponse> restoreDocumentVersion(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId,
            @PathVariable String documentId,
            @PathVariable String versionId
    ) {
        return ApiResponse.success(toDocumentResponse(knowledgeBaseService.restoreDocumentVersion(currentUser, kbId, documentId, versionId)));
    }

    @PostMapping("/{kbId}/documents/{documentId}/index")
    public ApiResponse<DocumentResponse> indexDocument(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId,
            @PathVariable String documentId
    ) {
        return ApiResponse.success(toDocumentResponse(knowledgeBaseService.indexDocument(currentUser, kbId, documentId)));
    }

    @PostMapping("/{kbId}/documents/{documentId}/reindex")
    public ApiResponse<DocumentResponse> reindexDocument(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId,
            @PathVariable String documentId
    ) {
        return ApiResponse.success(toDocumentResponse(knowledgeBaseService.reindexDocument(currentUser, kbId, documentId)));
    }

    @PostMapping("/{kbId}/search-test")
    public ApiResponse<List<SearchHitResponse>> searchTest(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String kbId,
            @Valid @RequestBody SearchTestRequest request
    ) {
        return ApiResponse.success(knowledgeBaseService.searchKnowledgeBase(
                currentUser,
                kbId,
                new KnowledgeBaseService.SearchCommand(request.query(), request.topK())
        ).stream().map(this::toSearchHitResponse).toList());
    }

    private KnowledgeBaseResponse toKnowledgeBaseResponse(KnowledgeBase knowledgeBase) {
        return new KnowledgeBaseResponse(
                knowledgeBase.kbId(),
                knowledgeBase.name(),
                knowledgeBase.description(),
                knowledgeBase.status().name(),
                knowledgeBase.documentCount(),
                knowledgeBase.createdAt().toString(),
                knowledgeBase.updatedAt().toString()
        );
    }

    private DocumentResponse toDocumentResponse(KnowledgeDocument document) {
        return new DocumentResponse(
                document.documentId(),
                document.fileName(),
                document.fileType(),
                document.parseStatus().name(),
                document.storageUri(),
                document.chunkCount(),
                document.versionNo(),
                document.fileSize(),
                document.lastError(),
                document.createdAt().toString()
        );
    }

    private SearchHitResponse toSearchHitResponse(SearchHit hit) {
        return new SearchHitResponse(
                hit.citationId(),
                hit.kbId(),
                hit.documentId(),
                hit.fileName(),
                hit.chunkId(),
                hit.chunkNo(),
                hit.sourceOffset(),
                hit.rank(),
                hit.sectionTitle(),
                hit.headingPath(),
                hit.tokenCount(),
                hit.retrievalStrategy(),
                hit.score(),
                hit.contentPreview()
        );
    }

    public record CreateKnowledgeBaseRequest(
            @NotBlank @Size(max = 128) String name,
            @Size(max = 255) String description
    ) {
    }

    public record UpdateKnowledgeBaseRequest(
            @NotBlank @Size(max = 128) String name,
            @Size(max = 255) String description
    ) {
    }

    public record SearchTestRequest(
            @NotBlank String query,
            @Min(1) @Max(20) int topK
    ) {
    }

    public record KnowledgeBaseResponse(
            String kbId,
            String name,
            String description,
            String status,
            int documentCount,
            String createdAt,
            String updatedAt
    ) {
    }

    public record DocumentResponse(
            String documentId,
            String fileName,
            String fileType,
            String parseStatus,
            String storageUri,
            int chunkCount,
            int versionNo,
            long fileSize,
            String lastError,
            String createdAt
    ) {
    }

    public record DocumentDetailResponse(
            DocumentResponse document,
            String preview
    ) {
    }

    public record DocumentDownloadResponse(
            String url
    ) {
    }

    public record SearchHitResponse(
            String citationId,
            String kbId,
            String documentId,
            String fileName,
            String chunkId,
            int chunkNo,
            int sourceOffset,
            int rank,
            String sectionTitle,
            String headingPath,
            int tokenCount,
            String retrievalStrategy,
            double score,
            String contentPreview
    ) {
    }
}
