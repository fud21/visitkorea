package com.localon.place;
import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param; import java.util.*;
public interface PlaceRepository extends JpaRepository<Place,String>{
 List<Place> findByRegion_Id(Long regionId);
 @Query("select distinct p from Place p where lower(p.name) like lower(concat('%',:q,'%')) or lower(p.category) like lower(concat('%',:q,'%')) or lower(p.address) like lower(concat('%',:q,'%'))") List<Place> search(@Param("q") String q);
}
