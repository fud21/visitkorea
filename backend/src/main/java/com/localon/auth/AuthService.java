package com.localon.auth;
import com.localon.common.UnauthorizedException; import jakarta.transaction.Transactional; import jakarta.validation.constraints.*; import lombok.RequiredArgsConstructor; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Service; import java.time.*; import java.util.*;
@Service @RequiredArgsConstructor public class AuthService {
 private final UserRepository users; private final AuthTokenRepository tokens; private final PasswordEncoder encoder;
 @Transactional public AuthResponse signup(SignupRequest r){String email=r.email().trim().toLowerCase(); if(users.existsByEmail(email)) throw new IllegalArgumentException("이미 가입된 이메일입니다."); return issue(users.save(new User(email,encoder.encode(r.password()),r.nickname().trim())));}
 @Transactional public AuthResponse login(LoginRequest r){var u=users.findByEmail(r.email().trim().toLowerCase()).orElseThrow(()->new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.")); if(!encoder.matches(r.password(),u.getPasswordHash())) throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."); return issue(u);}
 @Transactional public UserResponse updateProfile(ProfileUpdateRequest r){var u=current();String email=r.email().trim().toLowerCase();users.findByEmail(email).filter(other->!other.getId().equals(u.getId())).ifPresent(other->{throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");});u.setEmail(email);u.setNickname(r.nickname().trim());return UserResponse.of(users.save(u));}
 public User current(){var a=SecurityContextHolder.getContext().getAuthentication(); if(a==null||!(a.getPrincipal() instanceof User u)) throw new UnauthorizedException("로그인이 필요합니다."); return u;}
 @Transactional public void logout(String token){if(token!=null) tokens.deleteByToken(token);}
 private AuthResponse issue(User u){String token=UUID.randomUUID().toString()+UUID.randomUUID(); Instant exp=Instant.now().plus(Duration.ofDays(30)); tokens.save(new AuthToken(token,u,exp)); return new AuthResponse(token,exp,new UserResponse(u.getId(),u.getEmail(),u.getNickname()));}
 public record SignupRequest(@Email @NotBlank String email,@Size(min=8,max=100) String password,@NotBlank @Size(max=30) String nickname){}
 public record LoginRequest(@Email @NotBlank String email,@NotBlank String password){}
 public record ProfileUpdateRequest(@Email @NotBlank String email,@NotBlank @Size(max=30) String nickname){}
 public record AuthResponse(String accessToken,Instant expiresAt,UserResponse user){}
 public record UserResponse(Long id,String email,String nickname){public static UserResponse of(User u){return new UserResponse(u.getId(),u.getEmail(),u.getNickname());}}
}
