package com.localon.place;
import com.localon.region.Region; import jakarta.persistence.*; import lombok.*; import java.util.*;
@Entity @Table(name="places") @Getter @Setter @NoArgsConstructor public class Place {
 @Id private String id; @Column(nullable=false) private String name; @Column(nullable=false) private String category; private String address; @Column(length=1200) private String description; private String hours; private String closedInfo; private String parking; private Double latitude; private Double longitude; private int localScore; private int popularityScore; private int stayMinutes; private int estimatedCost; private boolean sampleData=true;
 @ManyToOne(fetch=FetchType.LAZY) private Region region;
 @ElementCollection(fetch=FetchType.EAGER) @CollectionTable(name="place_themes",joinColumns=@JoinColumn(name="place_id")) @Column(name="theme") private Set<String> themes=new LinkedHashSet<>();
 @ElementCollection(fetch=FetchType.EAGER) @CollectionTable(name="place_reasons",joinColumns=@JoinColumn(name="place_id")) @Column(name="reason",length=500) private List<String> reasons=new ArrayList<>();
}
