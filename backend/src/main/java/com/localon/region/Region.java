package com.localon.region;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name="regions", uniqueConstraints=@UniqueConstraint(columnNames={"type","name","province_name"})) @Getter @Setter @NoArgsConstructor
public class Region {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private RegionType type;
 @Column(nullable=false) private String name;
 private String provinceName;
 private long visitorCount;
 private double visitorRatio;
 public Region(RegionType type,String name,String provinceName,long visitorCount,double visitorRatio){this.type=type;this.name=name;this.provinceName=provinceName;this.visitorCount=visitorCount;this.visitorRatio=visitorRatio;}
 public enum RegionType { PROVINCE, MUNICIPALITY }
}
