package com.localon.auth;
import jakarta.persistence.*; import lombok.*; import java.time.*;
@Entity @Table(name="auth_tokens") @Getter @Setter @NoArgsConstructor public class AuthToken {
 @Id private String token; @ManyToOne(fetch=FetchType.EAGER,optional=false) private User user; @Column(nullable=false) private Instant expiresAt;
 public AuthToken(String token,User user,Instant expiresAt){this.token=token;this.user=user;this.expiresAt=expiresAt;}
}
