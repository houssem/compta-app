package com.compta.user.service;

import com.compta.common.exception.ApiException;
import com.compta.user.dto.UserCreateRequest;
import com.compta.user.dto.UserResponse;
import com.compta.user.dto.UserUpdateRequest;
import com.compta.user.entity.Role;
import com.compta.user.entity.User;
import com.compta.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> findAllByCompany(UUID companyId) {
        return userRepository.findAllByCompanyId(companyId)
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse create(UUID companyId, UserCreateRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw ApiException.conflict("Cet email est déjà utilisé");
        }

        User user = new User();
        user.setCompanyId(companyId);
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setEmail(req.email());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(Role.valueOf(req.role()));
        user.setActive(true);

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(UUID id, UUID companyId, UserUpdateRequest req) {
        User user = findOwnedUser(id, companyId);

        if (userRepository.existsByEmailAndIdNot(req.email(), id)) {
            throw ApiException.conflict("Cet email est déjà utilisé");
        }

        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setEmail(req.email());
        user.setRole(Role.valueOf(req.role()));
        user.setActive(req.active());

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void delete(UUID id, UUID companyId, UUID requestingUserId) {
        if (id.equals(requestingUserId)) {
            throw ApiException.badRequest("Vous ne pouvez pas supprimer votre propre compte");
        }
        User user = findOwnedUser(id, companyId);
        userRepository.delete(user);
    }

    private User findOwnedUser(UUID id, UUID companyId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Utilisateur non trouvé"));
        if (!user.getCompanyId().equals(companyId)) {
            throw ApiException.notFound("Utilisateur non trouvé");
        }
        return user;
    }
}
