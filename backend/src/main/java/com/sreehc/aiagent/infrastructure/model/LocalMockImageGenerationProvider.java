package com.sreehc.aiagent.infrastructure.model;

import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Component;

@Component
public class LocalMockImageGenerationProvider implements ImageGenerationProvider {
    @Override
    public String providerCode() {
        return "local-mock";
    }

    @Override
    public GeneratedImage generate(ImageRequest request) {
        String prompt = escapeXml(request.prompt() == null ? "" : request.prompt());
        String size = request.size() == null || request.size().isBlank() ? "1024x1024" : request.size();
        String svg = """
                <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1024\" height=\"1024\" viewBox=\"0 0 1024 1024\">
                  <rect width=\"1024\" height=\"1024\" fill=\"#0f3d4c\"/>
                  <circle cx=\"820\" cy=\"160\" r=\"220\" fill=\"#f08648\" opacity=\"0.72\"/>
                  <text x=\"80\" y=\"140\" fill=\"#fff7e8\" font-size=\"42\" font-family=\"Arial\">AiAgent Local Mock</text>
                  <text x=\"80\" y=\"210\" fill=\"#fff7e8\" font-size=\"28\" font-family=\"Arial\">%s</text>
                  <foreignObject x=\"80\" y=\"280\" width=\"840\" height=\"440\">
                    <div xmlns=\"http://www.w3.org/1999/xhtml\" style=\"font-family:Arial;font-size:30px;line-height:1.5;color:#fff7e8;\">%s</div>
                  </foreignObject>
                </svg>
                """.formatted(escapeXml(size), prompt);
        return new GeneratedImage(svg.getBytes(StandardCharsets.UTF_8), "image/svg+xml", "svg");
    }

    private String escapeXml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
