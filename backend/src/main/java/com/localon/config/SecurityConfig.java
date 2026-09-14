package com.localon.config;
import com.localon.auth.BearerTokenFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.cors.*;
import java.util.*;
@Configuration @RequiredArgsConstructor
public class SecurityConfig {
  private final BearerTokenFilter bearerTokenFilter;
  @Bean PasswordEncoder passwordEncoder(){ return new BCryptPasswordEncoder(); }
  @Bean SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http.csrf(c->c.disable()).cors(c->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .exceptionHandling(e->e.authenticationEntryPoint((request,response,exception)->response.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
      .authorizeHttpRequests(a->a.requestMatchers("/api/auth/**","/api/regions/**","/api/places/**","/api/recommendations/**","/api/search/**","/actuator/health").permitAll().anyRequest().authenticated())
      .addFilterBefore(bearerTokenFilter, UsernamePasswordAuthenticationFilter.class).build();
  }
  @Bean CorsConfigurationSource corsConfigurationSource(@Value("${localon.cors.allowed-origins}") String origins){
    var c=new CorsConfiguration(); c.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).toList()); c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS")); c.setAllowedHeaders(List.of("*")); c.setAllowCredentials(true);
    var s=new UrlBasedCorsConfigurationSource(); s.registerCorsConfiguration("/**",c); return s;
  }
}
