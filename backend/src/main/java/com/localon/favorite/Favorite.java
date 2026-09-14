package com.localon.favorite;
import com.localon.auth.User; import com.localon.place.Place; import jakarta.persistence.*; import lombok.*; import java.time.*;
@Entity @Table(name="favorites",uniqueConstraints=@UniqueConstraint(columnNames={"user_id","place_id"})) @Getter @Setter @NoArgsConstructor public class Favorite {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @ManyToOne(optional=false) private User user; @ManyToOne(optional=false) private Place place; @Column(nullable=false) private Instant createdAt=Instant.now();
 public Favorite(User user,Place place){this.user=user;this.place=place;}
}
