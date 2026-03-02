package com.drona.lms.domain.repository;

import com.drona.lms.domain.entity.Role;
import com.drona.lms.domain.enums.RoleCode;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByCode(RoleCode code);
}
