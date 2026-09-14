package com.localon.common;
import org.springframework.http.*; import org.springframework.web.bind.MethodArgumentNotValidException; import org.springframework.web.bind.annotation.*; import java.time.*; import java.util.*;
@RestControllerAdvice public class ApiExceptionHandler {
 @ExceptionHandler(NotFoundException.class) ResponseEntity<?> notFound(NotFoundException e){ return body(HttpStatus.NOT_FOUND,e.getMessage()); }
 @ExceptionHandler(UnauthorizedException.class) ResponseEntity<?> unauthorized(UnauthorizedException e){ return body(HttpStatus.UNAUTHORIZED,e.getMessage()); }
 @ExceptionHandler(IllegalArgumentException.class) ResponseEntity<?> bad(IllegalArgumentException e){ return body(HttpStatus.BAD_REQUEST,e.getMessage()); }
 @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> validation(MethodArgumentNotValidException e){ var errors=e.getBindingResult().getFieldErrors().stream().collect(java.util.stream.Collectors.toMap(x->x.getField(),x->Optional.ofNullable(x.getDefaultMessage()).orElse("invalid"),(a,b)->a)); return ResponseEntity.badRequest().body(Map.of("timestamp",Instant.now(),"status",400,"message","validation failed","errors",errors)); }
 private ResponseEntity<?> body(HttpStatus s,String m){ return ResponseEntity.status(s).body(Map.of("timestamp",Instant.now(),"status",s.value(),"message",m)); }
}
