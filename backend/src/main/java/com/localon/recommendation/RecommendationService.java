package com.localon.recommendation;
import com.localon.place.*; import com.localon.region.*; import jakarta.validation.constraints.*; import lombok.RequiredArgsConstructor; import org.springframework.stereotype.Service; import java.util.*;
@Service @RequiredArgsConstructor public class RecommendationService {
 private final RegionService regions; private final PlaceService places;
 public RecommendationResponse recommend(RecommendationRequest req){
  String key=req.regionId()!=null&&!req.regionId().isBlank()?req.regionId():req.regionName(); if(key==null||key.isBlank()) throw new IllegalArgumentException("regionId 또는 regionName이 필요합니다.");
  Region region=regions.resolve(key); int local=Math.max(0,Math.min(100,req.localRatio())); List<String> themes=req.selectedThemes()==null?List.of():req.selectedThemes();
  int maxStops=switch(Optional.ofNullable(req.duration()).orElse("half")){case "2h"->3; case "day"->6; default->4;};
  List<Place> candidates=new ArrayList<>(places.entitiesFor(region)); boolean placeholder=candidates.isEmpty(); if(placeholder)candidates=placeholderPlaces(region,themes);
  final int localRatio=local; candidates.sort(Comparator.comparingDouble((Place p)->score(p,themes,localRatio)).reversed()); List<Place> chosen=candidates.stream().limit(maxStops).toList();
  int mins=chosen.stream().mapToInt(Place::getStayMinutes).sum()+Math.max(0,chosen.size()-1)*20; int cost=chosen.stream().mapToInt(Place::getEstimatedCost).sum(); double distance=Math.max(1.5,chosen.size()*3.8); int actualLocal=(int)Math.round(chosen.stream().mapToInt(Place::getLocalScore).average().orElse(local));
  List<Stop> stops=new ArrayList<>(); for(int i=0;i<chosen.size();i++){Place p=chosen.get(i);stops.add(new Stop(p.getId(),i+1,p.getName(),p.getCategory(),p.getStayMinutes()+"분",p.getLocalScore(),p.getAddress(),p.getLatitude(),p.getLongitude(),reason(p,themes),p.isSampleData()||placeholder));}
  String notice=placeholder?"실제 POI가 없는 지역이라 테마 기반 슬롯을 생성했습니다. 관광 API 연결 후 실제 장소로 교체됩니다.":"프론트 샘플과 연동 가능한 초기 POI 데이터입니다.";
  return new RecommendationResponse(UUID.randomUUID().toString(),region.getName(),new Summary(formatMinutes(mins),String.format(Locale.US,"%.1f km",distance),actualLocal,"약 "+String.format("%,d",cost)+"원"),stops,placeholder?"PLACEHOLDER":"SAMPLE",notice);
 }
 private double score(Place p,List<String> themes,int localRatio){double lw=localRatio/100.0; double themeScore=themes.stream().anyMatch(t->p.getThemes().contains(t)||p.getCategory().contains(t))?100:45; return p.getLocalScore()*lw+p.getPopularityScore()*(1-lw)+themeScore*.25;}
 private String reason(Place p,List<String> themes){return themes.stream().filter(t->p.getThemes().contains(t)||p.getCategory().contains(t)).findFirst().map(t->"선택한 '"+t+"' 테마와 잘 맞고 Local Score가 높은 장소입니다.").orElse(p.getReasons().isEmpty()?"지역 방문 분산과 이동 동선을 고려한 후보입니다.":p.getReasons().get(0));}
 private List<Place> placeholderPlaces(Region r,List<String> themes){List<String> cats=new ArrayList<>(themes); if(cats.isEmpty())cats.addAll(List.of("전통시장","현지인 맛집","카페","자연/힐링")); List<Place> out=new ArrayList<>(); for(int i=0;i<Math.min(6,cats.size()+2);i++){String cat=cats.get(i%cats.size());Place p=new Place();p.setId("placeholder-"+r.getId()+"-"+i);p.setName(r.getName()+" "+cat+" 후보");p.setCategory(cat);p.setAddress("실제 POI 데이터 연결 예정");p.setDescription("실제 장소 데이터 연결 전 추천 슬롯입니다.");p.setLocalScore(Math.max(55,88-i*5));p.setPopularityScore(55+i*3);p.setStayMinutes(35+i*5);p.setEstimatedCost(cat.contains("맛집")?12000:cat.contains("카페")?6000:3000);p.setThemes(new LinkedHashSet<>(Set.of(cat)));p.setReasons(new ArrayList<>(List.of("사용자 선택 테마와 지역 조건을 반영한 임시 후보입니다.")));p.setSampleData(true);out.add(p);}return out;}
 private String formatMinutes(int m){return (m/60)+"시간 "+(m%60)+"분";}
 public record RecommendationRequest(String regionId,String regionName,@Min(0) @Max(100) int localRatio,List<String> selectedThemes,String duration){}
 public record Summary(String duration,String distance,int localRatio,String budget){}
 public record Stop(String id,int order,String name,String type,String stay,int localScore,String address,Double latitude,Double longitude,String reason,boolean sampleData){}
 public record RecommendationResponse(String id,String regionName,Summary summary,List<Stop> stops,String dataStatus,String notice){}
}
