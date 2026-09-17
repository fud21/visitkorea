package com.localon.config;
import com.localon.place.*; import com.localon.region.*; import lombok.RequiredArgsConstructor; import org.springframework.beans.factory.annotation.Value; import org.springframework.boot.CommandLineRunner; import org.springframework.core.io.ClassPathResource; import org.springframework.stereotype.Component; import java.io.*; import java.nio.charset.StandardCharsets; import java.util.*;
@Component @RequiredArgsConstructor public class DataSeeder implements CommandLineRunner {
 private final RegionRepository regions; private final PlaceRepository places;
 @Value("${localon.dataset.path:}") private String datasetPath;
 @Override public void run(String... args) throws Exception {
  if(datasetPath!=null&&!datasetPath.isBlank()) return;
  if(regions.count()==0){loadRegions();} if(places.count()==0){seedPlaces();}
 }
 private void loadRegions() throws Exception {
  try(var br=reader("provinces.csv")){br.readLine();String line;while((line=br.readLine())!=null){String[] a=line.split(",");regions.save(new Region(Region.RegionType.PROVINCE,a[0],null,Long.parseLong(a[1]),Double.parseDouble(a[2])));}}
  try(var br=reader("municipalities.csv")){br.readLine();String line;while((line=br.readLine())!=null){String[] a=line.split(",");regions.save(new Region(Region.RegionType.MUNICIPALITY,a[1],a[0],Long.parseLong(a[2]),Double.parseDouble(a[3])));}}
 }
 private BufferedReader reader(String name)throws Exception{return new BufferedReader(new InputStreamReader(new ClassPathResource(name).getInputStream(),StandardCharsets.UTF_8));}
 private void seedPlaces(){
  add("bulguksa","불국사","대표 관광지","경주시","경북 경주시 불국로 385",42,98,60,6000,35.7900,129.3320,Set.of("문화·역사","대표 관광지"),"경주의 대표 관광지를 코스의 앵커로 사용합니다.");
  add("seongdong-market","성동시장","전통시장","경주시","경북 경주시 원화로281번길 일대",88,62,45,10000,35.8442,129.2185,Set.of("전통시장","현지인 맛집","먹거리"),"관광 명소 위주 일정에서 지역 생활 상권으로 동선을 확장하기 좋습니다.");
  add("gyeongju-ricecake","경주 로컬 떡집","떡집","경주시","경북 경주시 도심 생활권",92,54,25,7000,35.8428,129.2119,Set.of("떡집","현지인 맛집"),"지역 간식 테마와 잘 맞고 짧게 들르기 좋은 로컬 후보입니다.");
  add("hwangseong-local","황성동 생활권 산책","생활 관광","경주시","경북 경주시 황성동 일대",84,43,50,0,35.8598,129.2120,Set.of("자연/힐링","생활권"),"관광 집중지역 외부의 생활권 체류시간을 늘릴 수 있습니다.");
  add("gyeongju-cafe","경주 로컬 카페","카페","경주시","경북 경주시 도심권",79,71,40,6500,35.8385,129.2090,Set.of("카페","빵집"),"관광지 사이 휴식 지점으로 넣기 좋은 카페 후보입니다.");
  add("donggung","동궁과 월지","문화·역사","경주시","경북 경주시 원화로 102",48,95,60,3000,35.8349,129.2265,Set.of("문화·역사","대표 관광지"),"대표 관광 수요를 반영하는 앵커 장소입니다.");
  add("buyeo-market","부여 전통시장 후보","전통시장","부여군","충남 부여군 부여읍",86,48,45,9000,36.2757,126.9098,Set.of("전통시장","현지인 맛집"),"부여 생활권 상권을 경험할 수 있는 초기 샘플 장소입니다.");
  add("busosanseong","부소산성","문화·역사","부여군","충남 부여군 부여읍 부소로 31",52,91,80,3000,36.2819,126.9127,Set.of("문화·역사","자연/힐링"),"대표 역사 관광지를 앵커로 활용합니다.");
  add("yeongju-market","영주 전통시장 후보","전통시장","영주시","경북 영주시 도심권",87,50,45,9000,36.8057,128.6240,Set.of("전통시장","현지인 맛집"),"영주 도심 생활권 방문을 유도하는 초기 샘플입니다.");
  add("sosu-seowon","소수서원","문화·역사","영주시","경북 영주시 순흥면 소백로 2740",50,90,70,3000,36.9253,128.5804,Set.of("문화·역사","자연/힐링"),"지역 대표 관광지 역할의 앵커 장소입니다.");
  add("gunsan-market","군산 전통시장 후보","전통시장","군산시","전북 군산시 도심권",85,55,45,10000,35.9677,126.7366,Set.of("전통시장","현지인 맛집"),"근대문화 관광과 생활 상권을 연결하는 초기 샘플입니다.");
  add("gunsan-modern","군산 근대역사거리","문화·역사","군산시","전북 군산시 해망로 일대",48,92,70,3000,35.9902,126.7119,Set.of("문화·역사","카페"),"군산의 대표 관광 동선을 구성하는 앵커 장소입니다.");
 }
 private void add(String id,String name,String category,String regionName,String address,double local,double popularity,int stay,int cost,double lat,double lon,Set<String> themes,String reason){
  Region r=regions.findByTypeAndName(Region.RegionType.MUNICIPALITY,regionName).orElse(null); if(r==null)return; Place p=new Place();p.setId(id);p.setName(name);p.setCategory(category);p.setRegion(r);p.setAddress(address);p.setDescription(reason);p.setHours("장소별 운영시간 확인 필요");p.setClosedInfo("장소별 상이");p.setParking("현장 정보 확인 필요");p.setLocalScore(local);p.setPopularityScore(popularity);p.setStayMinutes(stay);p.setEstimatedCost(cost);p.setLatitude(lat);p.setLongitude(lon);p.setThemes(new LinkedHashSet<>(themes));p.setReasons(new ArrayList<>(List.of(reason,"선택한 여행 테마와 이동 동선을 함께 고려합니다.")));p.setSampleData(true);places.save(p);
 }
}
