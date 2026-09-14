package com.localon.auth;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor public class User {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true) private String email;
 @Column(nullable=false) private String passwordHash;
 @Column(nullable=false) private String nickname;
 public User(String email,String passwordHash,String nickname){this.email=email;this.passwordHash=passwordHash;this.nickname=nickname;}
}
