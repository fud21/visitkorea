package com.localon.recommendation;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/recommendations") @RequiredArgsConstructor public class RecommendationController { private final RecommendationService service; @PostMapping public RecommendationService.RecommendationResponse create(@Valid @RequestBody RecommendationService.RecommendationRequest r){return service.recommend(r);} }
