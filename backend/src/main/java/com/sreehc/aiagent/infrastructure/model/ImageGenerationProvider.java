package com.sreehc.aiagent.infrastructure.model;

public interface ImageGenerationProvider {
    String providerCode();

    GeneratedImage generate(ImageRequest request);

    record ImageRequest(
            String prompt,
            String size,
            String modelCode,
            String baseUrl,
            String apiKey,
            byte[] referenceImage,
            String referenceMimeType
    ) {
    }

    record GeneratedImage(
            byte[] content,
            String contentType,
            String fileExtension
    ) {
    }
}
