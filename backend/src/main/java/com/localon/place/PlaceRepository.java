package com.localon.place;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlaceRepository extends JpaRepository<Place, String> {
    List<Place> findTop100ByOrderByNameAsc();

    @Query("""
            select distinct p from Place p
            where p.region.id = :regionId
               or (:provinceName is not null and p.region.provinceName = :provinceName)
            """)
    List<Place> findRegionCandidates(
            @Param("regionId") Long regionId,
            @Param("provinceName") String provinceName,
            Pageable pageable
    );

    @Query("""
            select distinct p from Place p left join p.themes theme
            where (p.region.id = :regionId
               or (:provinceName is not null and p.region.provinceName = :provinceName))
              and (theme = :theme
               or lower(p.category) like lower(concat('%', :theme, '%')))
            """)
    List<Place> findRegionCandidatesByTheme(
            @Param("regionId") Long regionId,
            @Param("provinceName") String provinceName,
            @Param("theme") String theme,
            Pageable pageable
    );

    @Query("""
            select distinct p from Place p
            where lower(p.name) like lower(concat('%', :q, '%'))
               or lower(p.category) like lower(concat('%', :q, '%'))
               or lower(p.address) like lower(concat('%', :q, '%'))
            """)
    List<Place> search(@Param("q") String q, Pageable pageable);
}
