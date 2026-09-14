package com.localon.region;
import com.localon.common.NotFoundException; import lombok.RequiredArgsConstructor; import org.springframework.stereotype.Service; import java.util.*;
@Service @RequiredArgsConstructor public class RegionService {
 private final RegionRepository repo;
 public List<Response> provinces(){return repo.findByTypeOrderByVisitorRatioDesc(Region.RegionType.PROVINCE).stream().map(Response::of).toList();}
 public List<Response> municipalities(String province){return repo.findByTypeAndProvinceNameOrderByVisitorRatioDesc(Region.RegionType.MUNICIPALITY,province).stream().map(Response::of).toList();}
 public Response one(String key){ Region r=resolve(key); return Response.of(r); }
 public Region resolve(String key){ final String resolvedKey=alias(key); try{long id=Long.parseLong(resolvedKey); return repo.findById(id).orElseThrow(()->new NotFoundException("지역을 찾을 수 없습니다: "+resolvedKey));}catch(NumberFormatException ignored){} return repo.findFirstByName(resolvedKey).orElseThrow(()->new NotFoundException("지역을 찾을 수 없습니다: "+resolvedKey)); }
 private String alias(String key){ if(key==null)return null; return switch(key){case "gyeongju"->"경주시"; case "buyeo"->"부여군"; case "yeongju"->"영주시"; case "gunsan"->"군산시"; default->key;}; }
 public record Response(Long id,String name,String provinceName,String type,long visitorCount,double visitorRatio){ public static Response of(Region r){return new Response(r.getId(),r.getName(),r.getProvinceName(),r.getType().name(),r.getVisitorCount(),r.getVisitorRatio());}}
}
