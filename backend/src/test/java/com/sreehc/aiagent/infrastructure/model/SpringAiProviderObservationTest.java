package com.sreehc.aiagent.infrastructure.model;

import com.sreehc.aiagent.infrastructure.springai.SpringAiOpenAiFactory;
import com.sreehc.aiagent.infrastructure.springai.SpringAiRuntimeOptions;
import io.micrometer.observation.ObservationRegistry;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;
import org.springframework.ai.openai.OpenAiChatModel;

import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SpringAiProviderObservationTest {

    private final SpringAiOpenAiFactory factory = new SpringAiOpenAiFactory();

    @Test
    void shouldExposeObservationEnabledMetadataFromFactoryResolution() {
        SpringAiOpenAiFactory.ResolvedRuntimeOptions options = factory.resolveRuntimeOptions(new SpringAiRuntimeOptions(
                "https://example.com/v1/",
                "secret-key",
                "gpt-4o-mini",
                1234L,
                5678L,
                3,
                400L,
                true
        ));

        assertTrue(options.observationEnabled());
        assertTrue(options.retryEnabled());
    }

    @Test
    void shouldWireObservationRegistryWithoutApplicationLayerChanges() throws Exception {
        OpenAiChatModel enabled = factory.createChatModel(new SpringAiRuntimeOptions(
                "https://example.com/v1/",
                "secret-key",
                "gpt-4o-mini",
                1234L,
                5678L,
                2,
                300L,
                true
        ));
        OpenAiChatModel disabled = factory.createChatModel(new SpringAiRuntimeOptions(
                "https://example.com/v1/",
                "secret-key",
                "gpt-4o-mini",
                1234L,
                5678L,
                1,
                300L,
                false
        ));

        assertNotSame(ObservationRegistry.NOOP, observationRegistryOf(enabled));
        assertSame(ObservationRegistry.NOOP, observationRegistryOf(disabled));
    }

    private static ObservationRegistry observationRegistryOf(OpenAiChatModel model) throws Exception {
        Field field = model.getClass().getDeclaredField("observationRegistry");
        field.setAccessible(true);
        return (ObservationRegistry) field.get(model);
    }
}
