package com.localon;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class MemberFlowTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void signupFavoriteAndCourseFlow() throws Exception {
        var signup = mvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "member-flow@example.com", "password", "testpass123", "nickname", "여행자"))))
                .andExpect(status().isOk()).andReturn();
        JsonNode response = objectMapper.readTree(signup.getResponse().getContentAsString());
        String bearer = "Bearer " + response.get("accessToken").asText();

        mvc.perform(get("/api/auth/me").header("Authorization", bearer))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nickname").value("여행자"));
        mvc.perform(put("/api/auth/me").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "member-updated@example.com", "nickname", "수정된여행자"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("member-updated@example.com"))
                .andExpect(jsonPath("$.nickname").value("수정된여행자"));
        mvc.perform(post("/api/favorites/seongdong-market").header("Authorization", bearer))
                .andExpect(status().isOk());
        mvc.perform(get("/api/favorites").header("Authorization", bearer))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value("seongdong-market"));
        mvc.perform(post("/api/courses").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "regionId", "gyeongju", "title", "테스트 코스", "localRatio", 70,
                                "selectedThemes", List.of("전통시장"), "duration", "half",
                                "placeIds", List.of("seongdong-market")))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("테스트 코스"));
        mvc.perform(get("/api/courses").header("Authorization", bearer))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].placeIds[0]").value("seongdong-market"));
    }

    @Test
    void protectedEndpointRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/favorites")).andExpect(status().isUnauthorized());
    }
}
