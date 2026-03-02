package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.User;
import com.drona.lms.domain.enums.RoleCode;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
        SELECT u FROM User u
        WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    Page<User> searchByEmailOrName(@Param("search") String search, Pageable pageable);

    @Query("""
        SELECT u FROM User u
        JOIN u.roles r
        WHERE r.code = :role
    """)
    Page<User> findByRole(@Param("role") RoleCode role, Pageable pageable);

    @Query("""
        SELECT u FROM User u
        JOIN u.roles r
        WHERE r.code = :role
          AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    Page<User> searchByEmailOrNameAndRole(@Param("search") String search, @Param("role") RoleCode role, Pageable pageable);
}
