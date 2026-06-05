package com.sreehc.aiagent.application.knowledge;

import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.knowledge.DocumentParseStatus;
import com.sreehc.aiagent.domain.knowledge.KnowledgeBase;
import com.sreehc.aiagent.domain.knowledge.KnowledgeDocument;
import com.sreehc.aiagent.domain.knowledge.SearchHit;
import com.sreehc.aiagent.infrastructure.knowledge.KnowledgeRepository;
import com.sreehc.aiagent.infrastructure.session.SessionRepository;
import com.sreehc.aiagent.infrastructure.storage.ObjectStorageService;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class KnowledgeBaseService {
    private final KnowledgeRepository knowledgeRepository;
    private final SessionRepository sessionRepository;
    private final ObjectStorageService objectStorageService;
    private final HybridSearchResultMerger hybridSearchResultMerger;
    private final RetrievalReranker retrievalReranker;
    private final ContextAssembler contextAssembler;
    private final QueryRewriteService queryRewriteService;
    private final KnowledgeIndexJobService knowledgeIndexJobService;
    private final QueryEmbeddingService queryEmbeddingService;

    public KnowledgeBaseService(
            KnowledgeRepository knowledgeRepository,
            SessionRepository sessionRepository,
            ObjectStorageService objectStorageService,
            HybridSearchResultMerger hybridSearchResultMerger,
            RetrievalReranker retrievalReranker,
            ContextAssembler contextAssembler,
            QueryRewriteService queryRewriteService,
            KnowledgeIndexJobService knowledgeIndexJobService,
            QueryEmbeddingService queryEmbeddingService
    ) {
        this.knowledgeRepository = knowledgeRepository;
        this.sessionRepository = sessionRepository;
        this.objectStorageService = objectStorageService;
        this.hybridSearchResultMerger = hybridSearchResultMerger;
        this.retrievalReranker = retrievalReranker;
        this.contextAssembler = contextAssembler;
        this.queryRewriteService = queryRewriteService;
        this.knowledgeIndexJobService = knowledgeIndexJobService;
        this.queryEmbeddingService = queryEmbeddingService;
    }

    @Transactional
    public KnowledgeBase createKnowledgeBase(SessionUser currentUser, CreateKnowledgeBaseCommand command) {
        long knowledgeBaseId = knowledgeRepository.createKnowledgeBase(
                nextCode("kb"),
                currentUser.id(),
                command.name(),
                command.description()
        );
        return knowledgeRepository.listKnowledgeBases(currentUser.id()).stream()
                .filter(item -> item.id() == knowledgeBaseId)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Failed to load created knowledge base"));
    }

    public List<KnowledgeBase> listKnowledgeBases(SessionUser currentUser) {
        return knowledgeRepository.listKnowledgeBases(currentUser.id());
    }

    @Transactional
    public KnowledgeBase updateKnowledgeBase(SessionUser currentUser, String kbId, UpdateKnowledgeBaseCommand command) {
        loadKnowledgeBase(currentUser, kbId);
        knowledgeRepository.updateKnowledgeBase(currentUser.id(), kbId, command.name(), command.description());
        return loadKnowledgeBase(currentUser, kbId);
    }

    @Transactional
    public void deleteKnowledgeBase(SessionUser currentUser, String kbId) {
        loadKnowledgeBase(currentUser, kbId);
        for (String storageUri : knowledgeRepository.listStorageUris(currentUser.id(), kbId)) {
            objectStorageService.delete(storageUri);
        }
        knowledgeRepository.deleteKnowledgeBase(currentUser.id(), kbId);
    }

    @Transactional
    public KnowledgeDocument uploadDocument(SessionUser currentUser, String kbId, MultipartFile file) {
        KnowledgeBase knowledgeBase = loadKnowledgeBase(currentUser, kbId);
        try {
            byte[] content = file.getBytes();
            String fileName = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
                    ? "document.txt"
                    : file.getOriginalFilename();
            String fileType = detectFileType(fileName, file.getContentType());
            String storageObjectName = knowledgeBase.kbId() + "/" + nextCode("doc-file") + "-" + fileName;
            String storageUri = objectStorageService.upload(storageObjectName, content, file.getContentType() == null ? "application/octet-stream" : file.getContentType());
            String textContent = new String(content, StandardCharsets.UTF_8);
            long documentInternalId = knowledgeRepository.createDocument(
                    knowledgeBase.id(),
                    nextCode("doc"),
                    fileName,
                    fileType,
                    storageUri,
                    textContent
            );
            return knowledgeRepository.listDocuments(currentUser.id(), kbId).stream()
                    .filter(item -> item.id() == documentInternalId)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Failed to load created document"));
        } catch (Exception exception) {
            throw new AppException("DOCUMENT_UPLOAD_FAILED", "Document upload failed", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public List<KnowledgeDocument> listDocuments(SessionUser currentUser, String kbId) {
        loadKnowledgeBase(currentUser, kbId);
        return knowledgeRepository.listDocuments(currentUser.id(), kbId);
    }

    @Transactional
    public KnowledgeDocument indexDocument(SessionUser currentUser, String kbId, String documentId) {
        KnowledgeDocument document = loadDocument(currentUser, kbId, documentId);
        knowledgeIndexJobService.enqueue(document, "INDEX");
        return loadDocument(currentUser, kbId, documentId);
    }

    @Transactional
    public KnowledgeDocument reindexDocument(SessionUser currentUser, String kbId, String documentId) {
        KnowledgeDocument document = loadDocument(currentUser, kbId, documentId);
        knowledgeIndexJobService.enqueue(document, "REINDEX");
        return loadDocument(currentUser, kbId, documentId);
    }

    public List<SearchHit> searchKnowledgeBase(SessionUser currentUser, String kbId, SearchCommand command) {
        loadKnowledgeBase(currentUser, kbId);
        return searchAcrossKnowledgeBases(currentUser, List.of(kbId), command.query(), command.topK());
    }

    public List<SearchHit> searchAcrossKnowledgeBases(SessionUser currentUser, List<String> kbIds, String query, int topK) {
        if (kbIds.isEmpty()) {
            return List.of();
        }
        List<KnowledgeBase> accessible = knowledgeRepository.findKnowledgeBases(currentUser.id(), kbIds);
        if (accessible.isEmpty()) {
            return List.of();
        }
        Set<String> accessibleIds = new LinkedHashSet<>();
        for (KnowledgeBase knowledgeBase : accessible) {
            accessibleIds.add(knowledgeBase.kbId());
        }
        List<String> kbIdList = new ArrayList<>(accessibleIds);
        int recallSize = Math.max(20, topK);
        QueryRewriteService.RewritePlan rewritePlan = queryRewriteService.rewrite(query);
        List<SearchHit> mergedHits;
        if (!rewritePlan.complex()) {
            mergedHits = retrieveSingleQuery(
                    currentUser.id(),
                    kbIdList,
                    rewritePlan.normalizedQuery(),
                    recallSize
            );
        } else {
            List<SearchHit> multiQueryHits = new ArrayList<>();
            for (String rewrittenQuery : rewritePlan.queries()) {
                multiQueryHits.addAll(retrieveSingleQuery(
                        currentUser.id(),
                        kbIdList,
                        rewrittenQuery,
                        Math.max(10, recallSize / 2)
                ));
            }
            mergedHits = hybridSearchResultMerger.merge(multiQueryHits, List.of(), recallSize);
        }
        List<SearchHit> rerankedHits = retrievalReranker.rerank(rewritePlan.normalizedQuery(), mergedHits, recallSize);
        return contextAssembler.assemble(rerankedHits, Math.max(1, topK));
    }

    @Transactional
    public List<String> bindSessionKnowledgeBases(SessionUser currentUser, String sessionCode, List<String> kbIds) {
        var session = sessionRepository.findSessionByCode(currentUser.id(), sessionCode)
                .orElseThrow(() -> new AppException("SESSION_NOT_FOUND", "Session not found", HttpStatus.NOT_FOUND));
        List<KnowledgeBase> knowledgeBases = knowledgeRepository.findKnowledgeBases(currentUser.id(), kbIds);
        if (knowledgeBases.size() != kbIds.size()) {
            throw new AppException("KB_NOT_FOUND", "Knowledge base not found", HttpStatus.NOT_FOUND);
        }
        knowledgeRepository.replaceSessionBindings(
                session.id(),
                knowledgeBases.stream().map(KnowledgeBase::id).toList()
        );
        return knowledgeRepository.listBoundKnowledgeBaseIds(session.id());
    }

    public List<String> listBoundKnowledgeBaseIds(long sessionInternalId) {
        return knowledgeRepository.listBoundKnowledgeBaseIds(sessionInternalId);
    }

    private KnowledgeBase loadKnowledgeBase(SessionUser currentUser, String kbId) {
        return knowledgeRepository.findKnowledgeBase(currentUser.id(), kbId)
                .orElseThrow(() -> new AppException("KB_NOT_FOUND", "Knowledge base not found", HttpStatus.NOT_FOUND));
    }

    private KnowledgeDocument loadDocument(SessionUser currentUser, String kbId, String documentId) {
        return knowledgeRepository.findDocument(currentUser.id(), kbId, documentId)
                .orElseThrow(() -> new AppException("DOCUMENT_NOT_FOUND", "Document not found", HttpStatus.NOT_FOUND));
    }

    private String detectFileType(String fileName, String contentType) {
        if (contentType != null && !contentType.isBlank()) {
            return contentType;
        }
        int index = fileName.lastIndexOf('.');
        return index >= 0 ? fileName.substring(index + 1).toLowerCase() : "txt";
    }

    private String nextCode(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String embedQuery(String query) {
        return queryEmbeddingService.embed(query);
    }

    private List<SearchHit> retrieveSingleQuery(long userId, List<String> kbIdList, String query, int recallSize) {
        List<SearchHit> vectorHits = knowledgeRepository.vectorRecall(
                userId,
                kbIdList,
                embedQuery(query),
                recallSize
        );
        List<SearchHit> keywordHits = knowledgeRepository.keywordRecall(
                userId,
                kbIdList,
                query,
                recallSize
        );
        return hybridSearchResultMerger.merge(vectorHits, keywordHits, recallSize);
    }

    public record CreateKnowledgeBaseCommand(
            String name,
            String description
    ) {
    }

    public record UpdateKnowledgeBaseCommand(
            String name,
            String description
    ) {
    }

    public record SearchCommand(
            String query,
            int topK
    ) {
    }
}
