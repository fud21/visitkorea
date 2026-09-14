package com.localon.favorite;
import com.localon.auth.AuthService; import com.localon.place.PlaceService; import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/favorites") @RequiredArgsConstructor public class FavoriteController {
 private final FavoriteRepository repo; private final AuthService auth; private final PlaceService places;
 @GetMapping public List<PlaceService.PlaceResponse> list(){var u=auth.current();return repo.findByUser_IdOrderByCreatedAtDesc(u.getId()).stream().map(x->PlaceService.PlaceResponse.of(x.getPlace())).toList();}
 @PostMapping("/{placeId}") public PlaceService.PlaceResponse add(@PathVariable String placeId){var u=auth.current();var p=places.entity(placeId);repo.findByUser_IdAndPlace_Id(u.getId(),placeId).orElseGet(()->repo.save(new Favorite(u,p)));return PlaceService.PlaceResponse.of(p);}
 @DeleteMapping("/{placeId}") public void remove(@PathVariable String placeId){var u=auth.current();repo.findByUser_IdAndPlace_Id(u.getId(),placeId).ifPresent(repo::delete);}
}
