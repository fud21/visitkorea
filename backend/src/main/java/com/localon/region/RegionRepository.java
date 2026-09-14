package com.localon.region;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface RegionRepository extends JpaRepository<Region,Long>{
 List<Region> findByTypeOrderByVisitorRatioDesc(Region.RegionType type);
 List<Region> findByTypeAndProvinceNameOrderByVisitorRatioDesc(Region.RegionType type,String provinceName);
 Optional<Region> findFirstByName(String name);
 Optional<Region> findByTypeAndName(Region.RegionType type,String name);
 Optional<Region> findByTypeAndNameAndProvinceName(Region.RegionType type,String name,String provinceName);
}
