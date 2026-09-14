package com.localon.course;
import com.localon.auth.User; import com.localon.region.Region; import jakarta.persistence.*; import lombok.*; import java.time.*; import java.util.*;
@Entity @Table(name="saved_courses") @Getter @Setter @NoArgsConstructor public class SavedCourse {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @ManyToOne(optional=false) private User user; @ManyToOne(optional=false) private Region region; @Column(nullable=false) private String title; private int localRatio; private String durationCode; @Column(nullable=false) private Instant createdAt=Instant.now();
 @ElementCollection @CollectionTable(name="saved_course_themes",joinColumns=@JoinColumn(name="course_id")) private List<String> themes=new ArrayList<>();
 @ElementCollection @CollectionTable(name="saved_course_places",joinColumns=@JoinColumn(name="course_id")) @OrderColumn(name="place_order") private List<String> placeIds=new ArrayList<>();
}
