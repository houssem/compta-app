package com.compta.user.repository;

import com.compta.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findAllByCompanyId(UUID companyId);
    boolean existsByEmailAndIdNot(String email, UUID id);
}
