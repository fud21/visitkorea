package com.localon.region;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class RegionDiscoverService {

    private final RestClient restClient =
            RestClient.builder()
                    .baseUrl("http://host.docker.internal:8000")
                    .build();

    public JsonNode discover(
            String type,
            int limit
    ) {

        String resolvedType =
                type == null || type.isBlank()
                        ? "default"
                        : type;

        try {

            return restClient
                    .get()
                    .uri(
                            "/discover?type={type}&limit={limit}",
                            resolvedType,
                            limit
                    )
                    .retrieve()
                    .body(JsonNode.class);

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Python 지역 발견 API 호출에 실패했습니다: "
                            + e.getMessage(),
                    e
            );
        }
    }
}