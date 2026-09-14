package com.localon.place;
import com.localon.common.NotFoundException; import com.localon.region.*; import lombok.RequiredArgsConstructor; import org.springframework.stereotype.Service; import java.util.*;
@Service @RequiredArgsConstructor public class PlaceService {
 private final PlaceRepository repo; private final RegionService regions;
 public PlaceResponse one(String id){return PlaceResponse.of(repo.findById(id).orElseThrow(()->new NotFoundException("장소를 찾을 수 없습니다: "+id)));}
 public List<PlaceResponse> search(String q){return (q==null||q.isBlank()?repo.findAll():repo.search(q)).stream().map(PlaceResponse::of).toList();}
 public List<PlaceResponse> byRegion(String key,String theme,int limit){Region r=regions.resolve(key); return repo.findByRegion_Id(r.getId()).stream().filter(p->theme==null||theme.isBlank()||p.getThemes().contains(theme)||p.getCategory().contains(theme)).limit(Math.max(1,Math.min(limit,100))).map(PlaceResponse::of).toList();}
 public List<Place> entitiesFor(Region r){return repo.findByRegion_Id(r.getId());}
 public Place entity(String id){return repo.findById(id).orElseThrow(()->new NotFoundException("장소를 찾을 수 없습니다: "+id));}
 public record PlaceResponse(String id,String name,String category,String address,String description,List<String> reasons,String hours,String closed,String parking,Integer localScore,Integer popularityScore,Integer stayMinutes,Integer estimatedCost,Double latitude,Double longitude,Set<String> themes,boolean sampleData){public static PlaceResponse of(Place p){return new PlaceResponse(p.getId(),p.getName(),p.getCategory(),p.getAddress(),p.getDescription(),p.getReasons(),p.getHours(),p.getClosedInfo(),p.getParking(),p.getLocalScore(),p.getPopularityScore(),p.getStayMinutes(),p.getEstimatedCost(),p.getLatitude(),p.getLongitude(),p.getThemes(),p.isSampleData());}}
}
