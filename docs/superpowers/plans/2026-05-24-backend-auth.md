# Backend Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un backend Spring Boot avec inscription société + authentification JWT (access token + refresh token), multi-tenant par `company_id`, profils H2/dev et MySQL-PostgreSQL/prod.

**Architecture:** Monolithe modulaire Spring Boot 3.x. Chaque module a ses couches controller → service → repository → entity. Le JWT embarque `userId`, `companyId`, `role` pour filtrer les données par société sur toutes les requêtes futures.

**Tech Stack:** Spring Boot 3.3, Spring Security 6, Spring Data JPA, Hibernate 6, jjwt 0.12.3, H2 (dev), MySQL/PostgreSQL (prod), Flyway, Lombok, SpringDoc OpenAPI 2.5, JUnit 5, Mockito.

---

## File Map

```
comptabilite-backend/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/compta/
    │   │   ├── ComptaApplication.java
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java
    │   │   │   └── OpenApiConfig.java
    │   │   ├── common/
    │   │   │   ├── BaseEntity.java
    │   │   │   └── exception/
    │   │   │       ├── ApiException.java
    │   │   │       ├── ErrorResponse.java
    │   │   │       └── GlobalExceptionHandler.java
    │   │   ├── auth/
    │   │   │   ├── controller/AuthController.java
    │   │   │   ├── service/AuthService.java
    │   │   │   ├── dto/
    │   │   │   │   ├── RegisterRequest.java
    │   │   │   │   ├── LoginRequest.java
    │   │   │   │   ├── RefreshRequest.java
    │   │   │   │   ├── AuthResponse.java
    │   │   │   │   └── AccessTokenResponse.java
    │   │   │   ├── entity/RefreshToken.java
    │   │   │   ├── repository/RefreshTokenRepository.java
    │   │   │   └── jwt/
    │   │   │       ├── JwtService.java
    │   │   │       └── JwtAuthFilter.java
    │   │   ├── company/
    │   │   │   ├── entity/
    │   │   │   │   ├── Company.java
    │   │   │   │   └── CompanyBankDetails.java
    │   │   │   └── repository/
    │   │   │       ├── CompanyRepository.java
    │   │   │       └── CompanyBankDetailsRepository.java
    │   │   └── user/
    │   │       ├── entity/
    │   │       │   ├── User.java
    │   │       │   └── Role.java
    │   │       └── repository/UserRepository.java
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       ├── application-prod.yml
    │       └── db/migration/
    │           └── V1__create_auth_tables.sql
    └── test/
        └── java/com/compta/
            ├── auth/
            │   ├── jwt/JwtServiceTest.java
            │   └── AuthControllerIntegrationTest.java
            └── ComptaApplicationTests.java
```

---

## Task 1: Initialiser le projet Spring Boot

**Files:**
- Create: `pom.xml`
- Create: `src/main/java/com/compta/ComptaApplication.java`
- Create: `src/test/java/com/compta/ComptaApplicationTests.java`

- [ ] **Step 1: Créer pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.0</version>
        <relativePath/>
    </parent>

    <groupId>com.compta</groupId>
    <artifactId>comptabilite-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>comptabilite-backend</name>
    <description>Backend Spring Boot - Application de comptabilité</description>

    <properties>
        <java.version>21</java.version>
        <jjwt.version>0.12.3</jjwt.version>
        <springdoc.version>2.5.0</springdoc.version>
    </properties>

    <dependencies>
        <!-- Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- H2 (dev) -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- MySQL (prod) -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- PostgreSQL (prod) -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Flyway -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-mysql</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- OpenAPI / Swagger UI -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>${springdoc.version}</version>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: Créer la classe principale**

`src/main/java/com/compta/ComptaApplication.java`
```java
package com.compta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ComptaApplication {
    public static void main(String[] args) {
        SpringApplication.run(ComptaApplication.class, args);
    }
}
```

- [ ] **Step 3: Créer le test de démarrage**

`src/test/java/com/compta/ComptaApplicationTests.java`
```java
package com.compta;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("dev")
class ComptaApplicationTests {

    @Test
    void contextLoads() {
    }
}
```

- [ ] **Step 4: Vérifier que le projet compile**

```bash
cd /home/houssem/projects/compta/comptabilite-backend
mvn compile -q
```
Expected: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git init
git add pom.xml src/main/java/com/compta/ComptaApplication.java src/test/java/com/compta/ComptaApplicationTests.java
git commit -m "chore: initialize Spring Boot project"
```

---

## Task 2: Configurer les profils et la migration Flyway

**Files:**
- Create: `src/main/resources/application.yml`
- Create: `src/main/resources/application-dev.yml`
- Create: `src/main/resources/application-prod.yml`
- Create: `src/main/resources/db/migration/V1__create_auth_tables.sql`

- [ ] **Step 1: Créer application.yml (config commune)**

`src/main/resources/application.yml`
```yaml
spring:
  profiles:
    active: dev
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 10MB
  jpa:
    open-in-view: false

app:
  jwt:
    secret: ${JWT_SECRET:devSecretKeyComptaApp123456789012345678901234}
    access-token-expiration: 900000       # 15 minutes en ms
    refresh-token-expiration: 604800000   # 7 jours en ms
  upload:
    dir: ${UPLOAD_DIR:uploads}

server:
  port: 8080

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
```

- [ ] **Step 2: Créer application-dev.yml**

`src/main/resources/application-dev.yml`
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:comptadb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;NON_KEYWORDS=VALUE
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  flyway:
    enabled: true
    locations: classpath:db/migration
```

- [ ] **Step 3: Créer application-prod.yml**

`src/main/resources/application-prod.yml`
```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false
  flyway:
    enabled: true
    locations: classpath:db/migration
```

> **Note prod MySQL:** ajouter `spring.datasource.driver-class-name: com.mysql.cj.jdbc.Driver`
> **Note prod PostgreSQL:** ajouter `spring.datasource.driver-class-name: org.postgresql.Driver`

- [ ] **Step 4: Créer la migration Flyway V1**

`src/main/resources/db/migration/V1__create_auth_tables.sql`
```sql
CREATE TABLE companies (
    id            VARCHAR(36)  NOT NULL,
    name          VARCHAR(255) NOT NULL,
    siret         VARCHAR(14),
    vat_number    VARCHAR(50),
    sector        VARCHAR(100),
    street_number VARCHAR(20),
    street_name   VARCHAR(255),
    complement    VARCHAR(255),
    district      VARCHAR(100),
    city          VARCHAR(100),
    postal_code   VARCHAR(20),
    country       VARCHAR(100) DEFAULT 'France',
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    logo_path     VARCHAR(500),
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    CONSTRAINT pk_companies PRIMARY KEY (id),
    CONSTRAINT uq_companies_email UNIQUE (email)
);

CREATE TABLE users (
    id            VARCHAR(36)  NOT NULL,
    company_id    VARCHAR(36)  NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE company_bank_details (
    id             VARCHAR(36)  NOT NULL,
    company_id     VARCHAR(36)  NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    bank_name      VARCHAR(255) NOT NULL,
    iban           VARCHAR(34)  NOT NULL,
    swift_bic      VARCHAR(11),
    is_default     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL,
    CONSTRAINT pk_bank_details PRIMARY KEY (id),
    CONSTRAINT fk_bank_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE refresh_tokens (
    id         VARCHAR(36)  NOT NULL,
    user_id    VARCHAR(36)  NOT NULL,
    token      VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL,
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
    CONSTRAINT uq_refresh_token UNIQUE (token),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_users_company  ON users(company_id);
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_refresh_token  ON refresh_tokens(token);
CREATE INDEX idx_refresh_user   ON refresh_tokens(user_id);
CREATE INDEX idx_bank_company   ON company_bank_details(company_id);
```

- [ ] **Step 5: Vérifier que le contexte Spring démarre avec H2 + Flyway**

```bash
mvn test -Dtest=ComptaApplicationTests -q
```
Expected: `BUILD SUCCESS` — les 4 tables sont créées par Flyway.

- [ ] **Step 6: Commit**

```bash
git add src/main/resources/
git commit -m "chore: configure dev/prod profiles and Flyway migration V1"
```

---

## Task 3: Créer les entités JPA

**Files:**
- Create: `src/main/java/com/compta/common/BaseEntity.java`
- Create: `src/main/java/com/compta/user/entity/Role.java`
- Create: `src/main/java/com/compta/company/entity/Company.java`
- Create: `src/main/java/com/compta/company/entity/CompanyBankDetails.java`
- Create: `src/main/java/com/compta/user/entity/User.java`
- Create: `src/main/java/com/compta/auth/entity/RefreshToken.java`

- [ ] **Step 1: Créer BaseEntity**

`src/main/java/com/compta/common/BaseEntity.java`
```java
package com.compta.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @UuidGenerator
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private UUID id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 2: Créer l'enum Role**

`src/main/java/com/compta/user/entity/Role.java`
```java
package com.compta.user.entity;

public enum Role {
    ADMIN,
    USER,
    VIEWER
}
```

- [ ] **Step 3: Créer l'entité Company**

`src/main/java/com/compta/company/entity/Company.java`
```java
package com.compta.company.entity;

import com.compta.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "companies")
public class Company extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "siret", length = 14)
    private String siret;

    @Column(name = "vat_number", length = 50)
    private String vatNumber;

    @Column(name = "sector", length = 100)
    private String sector;

    @Column(name = "street_number", length = 20)
    private String streetNumber;

    @Column(name = "street_name", length = 255)
    private String streetName;

    @Column(name = "complement", length = 255)
    private String complement;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "country", length = 100)
    private String country = "France";

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "logo_path", length = 500)
    private String logoPath;
}
```

- [ ] **Step 4: Créer CompanyBankDetails**

`src/main/java/com/compta/company/entity/CompanyBankDetails.java`
```java
package com.compta.company.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "company_bank_details")
public class CompanyBankDetails {

    @Id
    @UuidGenerator
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "account_holder", nullable = false, length = 255)
    private String accountHolder;

    @Column(name = "bank_name", nullable = false, length = 255)
    private String bankName;

    @Column(name = "iban", nullable = false, length = 34)
    private String iban;

    @Column(name = "swift_bic", length = 11)
    private String swiftBic;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 5: Créer l'entité User**

`src/main/java/com/compta/user/entity/User.java`
```java
package com.compta.user.entity;

import com.compta.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "company_id", nullable = false, length = 36)
    private UUID companyId;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role = Role.ADMIN;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
```

- [ ] **Step 6: Créer l'entité RefreshToken**

`src/main/java/com/compta/auth/entity/RefreshToken.java`
```java
package com.compta.auth.entity;

import com.compta.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @UuidGenerator
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token", nullable = false, unique = true, length = 512)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked", nullable = false)
    private boolean revoked = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 7: Vérifier que le contexte démarre avec les entités**

```bash
mvn test -Dtest=ComptaApplicationTests -q
```
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Commit**

```bash
git add src/main/java/com/compta/common/ src/main/java/com/compta/company/entity/ src/main/java/com/compta/user/entity/ src/main/java/com/compta/auth/entity/
git commit -m "feat: add JPA entities (Company, User, RefreshToken)"
```

---

## Task 4: Créer les repositories

**Files:**
- Create: `src/main/java/com/compta/company/repository/CompanyRepository.java`
- Create: `src/main/java/com/compta/company/repository/CompanyBankDetailsRepository.java`
- Create: `src/main/java/com/compta/user/repository/UserRepository.java`
- Create: `src/main/java/com/compta/auth/repository/RefreshTokenRepository.java`

- [ ] **Step 1: Créer CompanyRepository**

`src/main/java/com/compta/company/repository/CompanyRepository.java`
```java
package com.compta.company.repository;

import com.compta.company.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    boolean existsByEmail(String email);
}
```

- [ ] **Step 2: Créer CompanyBankDetailsRepository**

`src/main/java/com/compta/company/repository/CompanyBankDetailsRepository.java`
```java
package com.compta.company.repository;

import com.compta.company.entity.CompanyBankDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CompanyBankDetailsRepository extends JpaRepository<CompanyBankDetails, UUID> {
}
```

- [ ] **Step 3: Créer UserRepository**

`src/main/java/com/compta/user/repository/UserRepository.java`
```java
package com.compta.user.repository;

import com.compta.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

- [ ] **Step 4: Créer RefreshTokenRepository**

`src/main/java/com/compta/auth/repository/RefreshTokenRepository.java`
```java
package com.compta.auth.repository;

import com.compta.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user.id = :userId AND rt.revoked = false")
    void revokeAllByUserId(UUID userId);
}
```

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/compta/company/repository/ src/main/java/com/compta/user/repository/ src/main/java/com/compta/auth/repository/
git commit -m "feat: add Spring Data repositories"
```

---

## Task 5: Créer les DTOs et la gestion d'erreurs

**Files:**
- Create: `src/main/java/com/compta/auth/dto/RegisterRequest.java`
- Create: `src/main/java/com/compta/auth/dto/LoginRequest.java`
- Create: `src/main/java/com/compta/auth/dto/RefreshRequest.java`
- Create: `src/main/java/com/compta/auth/dto/AuthResponse.java`
- Create: `src/main/java/com/compta/auth/dto/AccessTokenResponse.java`
- Create: `src/main/java/com/compta/common/exception/ApiException.java`
- Create: `src/main/java/com/compta/common/exception/ErrorResponse.java`
- Create: `src/main/java/com/compta/common/exception/GlobalExceptionHandler.java`

- [ ] **Step 1: Créer RegisterRequest**

`src/main/java/com/compta/auth/dto/RegisterRequest.java`
```java
package com.compta.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    @NotBlank(message = "La raison sociale est obligatoire")
    private String companyName;

    private String siret;
    private String vatNumber;
    private String sector;
    private String streetNumber;
    private String streetName;
    private String complement;
    private String district;
    private String city;
    private String postalCode;
    private String country;
    private String phone;

    // Coordonnées bancaires (optionnelles)
    private String accountHolder;
    private String bankName;
    private String iban;
    private String swiftBic;
}
```

- [ ] **Step 2: Créer LoginRequest**

`src/main/java/com/compta/auth/dto/LoginRequest.java`
```java
package com.compta.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;
}
```

- [ ] **Step 3: Créer RefreshRequest**

`src/main/java/com/compta/auth/dto/RefreshRequest.java`
```java
package com.compta.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefreshRequest {

    @NotBlank(message = "Le refresh token est obligatoire")
    private String refreshToken;
}
```

- [ ] **Step 4: Créer AuthResponse**

`src/main/java/com/compta/auth/dto/AuthResponse.java`
```java
package com.compta.auth.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserDto user;

    @Getter
    @Builder
    public static class UserDto {
        private UUID id;
        private String email;
        private String firstName;
        private String lastName;
        private String role;
        private UUID companyId;
        private String companyName;
    }
}
```

- [ ] **Step 5: Créer AccessTokenResponse**

`src/main/java/com/compta/auth/dto/AccessTokenResponse.java`
```java
package com.compta.auth.dto;

public record AccessTokenResponse(String accessToken) {}
```

- [ ] **Step 6: Créer ApiException**

`src/main/java/com/compta/common/exception/ApiException.java`
```java
package com.compta.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(message, HttpStatus.BAD_REQUEST);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(message, HttpStatus.UNAUTHORIZED);
    }

    public static ApiException notFound(String message) {
        return new ApiException(message, HttpStatus.NOT_FOUND);
    }

    public static ApiException conflict(String message) {
        return new ApiException(message, HttpStatus.CONFLICT);
    }
}
```

- [ ] **Step 7: Créer ErrorResponse**

`src/main/java/com/compta/common/exception/ErrorResponse.java`
```java
package com.compta.common.exception;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ErrorResponse {
    private int status;
    private String message;
    private LocalDateTime timestamp;
}
```

- [ ] **Step 8: Créer GlobalExceptionHandler**

`src/main/java/com/compta/common/exception/GlobalExceptionHandler.java`
```java
package com.compta.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(
                ErrorResponse.builder()
                        .status(ex.getStatus().value())
                        .message(ex.getMessage())
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(
                ErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message(message)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(
                ErrorResponse.builder()
                        .status(HttpStatus.PAYLOAD_TOO_LARGE.value())
                        .message("Le fichier logo dépasse la taille maximale autorisée (5 MB)")
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
```

- [ ] **Step 9: Commit**

```bash
git add src/main/java/com/compta/auth/dto/ src/main/java/com/compta/common/exception/
git commit -m "feat: add DTOs and global exception handler"
```

---

## Task 6: Implémenter JwtService (TDD)

**Files:**
- Create: `src/main/java/com/compta/auth/jwt/JwtService.java`
- Create: `src/main/java/com/compta/auth/jwt/JwtAuthFilter.java`
- Test: `src/test/java/com/compta/auth/jwt/JwtServiceTest.java`

- [ ] **Step 1: Écrire le test JwtService qui échoue**

`src/test/java/com/compta/auth/jwt/JwtServiceTest.java`
```java
package com.compta.auth.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private final UUID userId = UUID.randomUUID();
    private final UUID companyId = UUID.randomUUID();
    private final String role = "ADMIN";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(
                "testSecretKeyForJwtThatIsLongEnough1234567890",
                900_000L  // 15 min
        );
    }

    @Test
    void generateAccessToken_shouldReturnNonNullToken() {
        String token = jwtService.generateAccessToken(userId, companyId, role);
        assertThat(token).isNotBlank();
    }

    @Test
    void extractUserId_shouldReturnOriginalUserId() {
        String token = jwtService.generateAccessToken(userId, companyId, role);
        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    void extractCompanyId_shouldReturnOriginalCompanyId() {
        String token = jwtService.generateAccessToken(userId, companyId, role);
        assertThat(jwtService.extractCompanyId(token)).isEqualTo(companyId);
    }

    @Test
    void extractRole_shouldReturnOriginalRole() {
        String token = jwtService.generateAccessToken(userId, companyId, role);
        assertThat(jwtService.extractRole(token)).isEqualTo(role);
    }

    @Test
    void isTokenValid_shouldReturnTrueForValidToken() {
        String token = jwtService.generateAccessToken(userId, companyId, role);
        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_shouldReturnFalseForTamperedToken() {
        String token = jwtService.generateAccessToken(userId, companyId, role) + "tampered";
        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_shouldReturnFalseForExpiredToken() {
        JwtService shortLived = new JwtService(
                "testSecretKeyForJwtThatIsLongEnough1234567890",
                1L  // expire immédiatement
        );
        String token = shortLived.generateAccessToken(userId, companyId, role);
        assertThat(shortLived.isTokenValid(token)).isFalse();
    }
}
```

- [ ] **Step 2: Exécuter le test et vérifier qu'il échoue**

```bash
mvn test -Dtest=JwtServiceTest -q 2>&1 | tail -5
```
Expected: `BUILD FAILURE` — `JwtService` n'existe pas encore.

- [ ] **Step 3: Implémenter JwtService**

`src/main/java/com/compta/auth/jwt/JwtService.java`
```java
package com.compta.auth.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiration}") long accessTokenExpiration) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
    }

    public String generateAccessToken(UUID userId, UUID companyId, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("companyId", companyId.toString())
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(secretKey)
                .compact();
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public UUID extractCompanyId(String token) {
        return UUID.fromString(parseClaims(token).get("companyId", String.class));
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
```

- [ ] **Step 4: Exécuter les tests et vérifier qu'ils passent**

```bash
mvn test -Dtest=JwtServiceTest -q
```
Expected: `BUILD SUCCESS` — 7 tests passent.

- [ ] **Step 5: Implémenter JwtAuthFilter**

`src/main/java/com/compta/auth/jwt/JwtAuthFilter.java`
```java
package com.compta.auth.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        UUID userId = jwtService.extractUserId(token);
        UUID companyId = jwtService.extractCompanyId(token);
        String role = jwtService.extractRole(token);

        var auth = new UsernamePasswordAuthenticationToken(
                userId,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        auth.setDetails(companyId);
        SecurityContextHolder.getContext().setAuthentication(auth);

        filterChain.doFilter(request, response);
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/compta/auth/jwt/ src/test/java/com/compta/auth/jwt/
git commit -m "feat: implement JWT service and filter (TDD)"
```

---

## Task 7: Configurer Spring Security

**Files:**
- Create: `src/main/java/com/compta/config/SecurityConfig.java`
- Create: `src/main/java/com/compta/config/OpenApiConfig.java`

- [ ] **Step 1: Créer SecurityConfig**

`src/main/java/com/compta/config/SecurityConfig.java`
```java
package com.compta.config;

import com.compta.auth.jwt.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/h2-console/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .headers(headers ->
                        headers.frameOptions(frame -> frame.disable()))  // H2 console
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

- [ ] **Step 2: Créer OpenApiConfig**

`src/main/java/com/compta/config/OpenApiConfig.java`
```java
package com.compta.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Comptabilité API")
                        .description("API Backend — Application de comptabilité")
                        .version("1.0"))
                .addSecurityItem(new SecurityRequirement().addList("Bearer"))
                .components(new Components()
                        .addSecuritySchemes("Bearer", new SecurityScheme()
                                .name("Bearer")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
```

- [ ] **Step 3: Vérifier que le contexte démarre**

```bash
mvn test -Dtest=ComptaApplicationTests -q
```
Expected: `BUILD SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add src/main/java/com/compta/config/
git commit -m "feat: configure Spring Security and OpenAPI"
```

---

## Task 8: Implémenter AuthService (TDD)

**Files:**
- Create: `src/main/java/com/compta/auth/service/AuthService.java`
- Test: `src/test/java/com/compta/auth/AuthServiceTest.java`

- [ ] **Step 1: Écrire les tests AuthService qui échouent**

`src/test/java/com/compta/auth/AuthServiceTest.java`
```java
package com.compta.auth;

import com.compta.auth.dto.*;
import com.compta.auth.entity.RefreshToken;
import com.compta.auth.jwt.JwtService;
import com.compta.auth.repository.RefreshTokenRepository;
import com.compta.auth.service.AuthService;
import com.compta.common.exception.ApiException;
import com.compta.company.entity.Company;
import com.compta.company.repository.CompanyBankDetailsRepository;
import com.compta.company.repository.CompanyRepository;
import com.compta.user.entity.Role;
import com.compta.user.entity.User;
import com.compta.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private CompanyRepository companyRepository;
    @Mock private CompanyBankDetailsRepository bankDetailsRepository;
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private JwtService jwtService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private Company savedCompany;
    private User savedUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setFirstName("Houssem");
        registerRequest.setLastName("Dupont");
        registerRequest.setEmail("admin@masociete.fr");
        registerRequest.setPassword("password123");
        registerRequest.setCompanyName("Ma Société SARL");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@masociete.fr");
        loginRequest.setPassword("password123");

        savedCompany = new Company();
        savedCompany.setName("Ma Société SARL");
        savedCompany.setEmail("admin@masociete.fr");

        savedUser = new User();
        savedUser.setEmail("admin@masociete.fr");
        savedUser.setPasswordHash("$2a$10$hashedpassword");
        savedUser.setFirstName("Houssem");
        savedUser.setLastName("Dupont");
        savedUser.setRole(Role.ADMIN);
        savedUser.setActive(true);
    }

    @Test
    void register_shouldReturnAuthResponseWithTokens() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(companyRepository.save(any())).thenReturn(savedCompany);
        when(userRepository.save(any())).thenReturn(savedUser);
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenReturn(new RefreshToken());

        AuthResponse response = authService.register(registerRequest, null);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isNotBlank();
        assertThat(response.getUser().getEmail()).isEqualTo("admin@masociete.fr");
    }

    @Test
    void register_shouldThrowConflict_whenEmailAlreadyExists() {
        when(userRepository.existsByEmail("admin@masociete.fr")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest, null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("existe déjà");
    }

    @Test
    void login_shouldReturnAuthResponseWithTokens() {
        when(userRepository.findByEmail("admin@masociete.fr")).thenReturn(Optional.of(savedUser));
        when(passwordEncoder.matches("password123", "$2a$10$hashedpassword")).thenReturn(true);
        when(companyRepository.findById(any())).thenReturn(Optional.of(savedCompany));
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenReturn(new RefreshToken());

        AuthResponse response = authService.login(loginRequest);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isNotBlank();
    }

    @Test
    void login_shouldThrowUnauthorized_whenEmailNotFound() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("incorrect");
    }

    @Test
    void login_shouldThrowUnauthorized_whenPasswordWrong() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(savedUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("incorrect");
    }

    @Test
    void refresh_shouldReturnNewAccessToken() {
        RefreshToken token = new RefreshToken();
        token.setUser(savedUser);
        token.setRevoked(false);
        token.setExpiresAt(LocalDateTime.now().plusDays(1));

        when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(token));
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("new-access-token");

        AccessTokenResponse response = authService.refresh(new RefreshRequest() {{
            setRefreshToken("valid-refresh-token");
        }});

        assertThat(response.accessToken()).isEqualTo("new-access-token");
    }

    @Test
    void refresh_shouldThrowUnauthorized_whenTokenRevoked() {
        RefreshToken token = new RefreshToken();
        token.setRevoked(true);
        token.setExpiresAt(LocalDateTime.now().plusDays(1));

        when(refreshTokenRepository.findByToken(anyString())).thenReturn(Optional.of(token));

        RefreshRequest req = new RefreshRequest();
        req.setRefreshToken("revoked-token");

        assertThatThrownBy(() -> authService.refresh(req))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("révoqué");
    }
}
```

- [ ] **Step 2: Exécuter les tests et vérifier qu'ils échouent**

```bash
mvn test -Dtest=AuthServiceTest -q 2>&1 | tail -5
```
Expected: `BUILD FAILURE` — `AuthService` n'existe pas encore.

- [ ] **Step 3: Implémenter AuthService**

`src/main/java/com/compta/auth/service/AuthService.java`
```java
package com.compta.auth.service;

import com.compta.auth.dto.*;
import com.compta.auth.entity.RefreshToken;
import com.compta.auth.jwt.JwtService;
import com.compta.auth.repository.RefreshTokenRepository;
import com.compta.common.exception.ApiException;
import com.compta.company.entity.Company;
import com.compta.company.entity.CompanyBankDetails;
import com.compta.company.repository.CompanyBankDetailsRepository;
import com.compta.company.repository.CompanyRepository;
import com.compta.user.entity.Role;
import com.compta.user.entity.User;
import com.compta.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CompanyRepository companyRepository;
    private final CompanyBankDetailsRepository bankDetailsRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.refresh-token-expiration}")
    private long refreshTokenExpirationMs;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional
    public AuthResponse register(RegisterRequest request, MultipartFile logo) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw ApiException.conflict("Un compte avec cet email existe déjà");
        }

        Company company = buildCompany(request);
        Company savedCompany = companyRepository.save(company);

        if (logo != null && !logo.isEmpty()) {
            savedCompany.setLogoPath(saveLogo(logo, savedCompany.getId()));
            savedCompany = companyRepository.save(savedCompany);
        }

        if (request.getIban() != null && !request.getIban().isBlank()) {
            CompanyBankDetails bank = new CompanyBankDetails();
            bank.setCompany(savedCompany);
            bank.setAccountHolder(request.getAccountHolder());
            bank.setBankName(request.getBankName());
            bank.setIban(request.getIban());
            bank.setSwiftBic(request.getSwiftBic());
            bank.setDefault(true);
            bankDetailsRepository.save(bank);
        }

        User user = buildUser(request, savedCompany.getId());
        User savedUser = userRepository.save(user);

        return buildAuthResponse(savedUser, savedCompany);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> ApiException.unauthorized("Email ou mot de passe incorrect"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Email ou mot de passe incorrect");
        }

        if (!user.isActive()) {
            throw ApiException.unauthorized("Compte désactivé");
        }

        Company company = companyRepository.findById(user.getCompanyId())
                .orElseThrow(() -> ApiException.notFound("Société non trouvée"));

        return buildAuthResponse(user, company);
    }

    @Transactional
    public AccessTokenResponse refresh(RefreshRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> ApiException.unauthorized("Token invalide"));

        if (refreshToken.isRevoked()) {
            throw ApiException.unauthorized("Token révoqué");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.unauthorized("Token expiré");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(
                user.getId(), user.getCompanyId(), user.getRole().name());

        return new AccessTokenResponse(newAccessToken);
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    // ---- Private helpers ----

    private Company buildCompany(RegisterRequest req) {
        Company c = new Company();
        c.setName(req.getCompanyName());
        c.setSiret(req.getSiret());
        c.setVatNumber(req.getVatNumber());
        c.setSector(req.getSector());
        c.setStreetNumber(req.getStreetNumber());
        c.setStreetName(req.getStreetName());
        c.setComplement(req.getComplement());
        c.setDistrict(req.getDistrict());
        c.setCity(req.getCity());
        c.setPostalCode(req.getPostalCode());
        c.setCountry(req.getCountry() != null ? req.getCountry() : "France");
        c.setEmail(req.getEmail());
        c.setPhone(req.getPhone());
        return c;
    }

    private User buildUser(RegisterRequest req, UUID companyId) {
        User u = new User();
        u.setCompanyId(companyId);
        u.setEmail(req.getEmail());
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        u.setFirstName(req.getFirstName());
        u.setLastName(req.getLastName());
        u.setRole(Role.ADMIN);
        u.setActive(true);
        return u;
    }

    private AuthResponse buildAuthResponse(User user, Company company) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getCompanyId(), user.getRole().name());
        String refreshTokenValue = UUID.randomUUID().toString();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(refreshTokenValue);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000));
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole().name())
                        .companyId(user.getCompanyId())
                        .companyName(company.getName())
                        .build())
                .build();
    }

    private String saveLogo(MultipartFile logo, UUID companyId) {
        try {
            Path uploadPath = Paths.get(uploadDir, "logos");
            Files.createDirectories(uploadPath);
            String filename = companyId + "_" + logo.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            logo.transferTo(filePath);
            return filePath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement du logo", e);
        }
    }
}
```

- [ ] **Step 4: Exécuter les tests et vérifier qu'ils passent**

```bash
mvn test -Dtest=AuthServiceTest -q
```
Expected: `BUILD SUCCESS` — 7 tests passent.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/compta/auth/service/ src/test/java/com/compta/auth/AuthServiceTest.java
git commit -m "feat: implement AuthService with register/login/refresh/logout (TDD)"
```

---

## Task 9: Implémenter AuthController

**Files:**
- Create: `src/main/java/com/compta/auth/controller/AuthController.java`

- [ ] **Step 1: Créer AuthController**

`src/main/java/com/compta/auth/controller/AuthController.java`
```java
package com.compta.auth.controller;

import com.compta.auth.dto.*;
import com.compta.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Inscription, connexion et gestion des tokens")
public class AuthController {

    private final AuthService authService;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Inscription société + administrateur")
    public AuthResponse register(
            @Valid @ModelAttribute RegisterRequest request,
            @RequestParam(value = "logo", required = false) MultipartFile logo) {
        return authService.register(request, logo);
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion — retourne access token + refresh token")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renouveler l'access token via le refresh token")
    public AccessTokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Déconnexion — révoque le refresh token")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UUID userId) {
        authService.logout(userId);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/com/compta/auth/controller/
git commit -m "feat: add AuthController (register, login, refresh, logout)"
```

---

## Task 10: Tests d'intégration

**Files:**
- Test: `src/test/java/com/compta/auth/AuthControllerIntegrationTest.java`

- [ ] **Step 1: Écrire les tests d'intégration**

`src/test/java/com/compta/auth/AuthControllerIntegrationTest.java`
```java
package com.compta.auth;

import com.compta.auth.dto.AuthResponse;
import com.compta.auth.dto.LoginRequest;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthControllerIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    private static String refreshToken;
    private static String accessToken;

    @Test
    @Order(1)
    void register_shouldReturn201WithTokens() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("firstName", "Houssem");
        body.add("lastName", "Dupont");
        body.add("email", "admin@testcompany.fr");
        body.add("password", "password123");
        body.add("companyName", "Test Company SARL");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                "/api/auth/register", request, AuthResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getAccessToken()).isNotBlank();
        assertThat(response.getBody().getRefreshToken()).isNotBlank();
        assertThat(response.getBody().getUser().getEmail()).isEqualTo("admin@testcompany.fr");
        assertThat(response.getBody().getUser().getRole()).isEqualTo("ADMIN");

        refreshToken = response.getBody().getRefreshToken();
        accessToken = response.getBody().getAccessToken();
    }

    @Test
    @Order(2)
    void register_shouldReturn409_whenEmailAlreadyUsed() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("firstName", "Houssem");
        body.add("lastName", "Dupont");
        body.add("email", "admin@testcompany.fr");
        body.add("password", "password123");
        body.add("companyName", "Duplicate Company");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/auth/register", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @Order(3)
    void login_shouldReturn200WithTokens() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@testcompany.fr");
        loginRequest.setPassword("password123");

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                "/api/auth/login", loginRequest, AuthResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getAccessToken()).isNotBlank();
    }

    @Test
    @Order(4)
    void login_shouldReturn401_whenPasswordWrong() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@testcompany.fr");
        loginRequest.setPassword("wrongpassword");

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/auth/login", loginRequest, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @Order(5)
    void refresh_shouldReturn200WithNewAccessToken() {
        var body = new com.compta.auth.dto.RefreshRequest();
        body.setRefreshToken(refreshToken);

        ResponseEntity<com.compta.auth.dto.AccessTokenResponse> response = restTemplate.postForEntity(
                "/api/auth/refresh", body, com.compta.auth.dto.AccessTokenResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().accessToken()).isNotBlank();
    }

    @Test
    @Order(6)
    void logout_shouldReturn204() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/auth/logout", HttpMethod.POST, request, Void.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
```

- [ ] **Step 2: Exécuter tous les tests**

```bash
mvn test -q
```
Expected: `BUILD SUCCESS` — tous les tests passent (JwtServiceTest + AuthServiceTest + AuthControllerIntegrationTest + ComptaApplicationTests).

- [ ] **Step 3: Vérifier manuellement Swagger UI**

Démarrer le serveur :
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
Ouvrir : `http://localhost:8080/swagger-ui.html`

Vérifier que les 4 endpoints `/api/auth/**` apparaissent et sont documentés.

Arrêter avec `Ctrl+C`.

- [ ] **Step 4: Commit final**

```bash
git add src/test/java/com/compta/auth/AuthControllerIntegrationTest.java
git commit -m "test: add integration tests for AuthController"
```

---

## Résumé des endpoints livrés

| Méthode | Endpoint | Corps | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | `multipart/form-data` | Public |
| POST | `/api/auth/login` | `{ email, password }` | Public |
| POST | `/api/auth/refresh` | `{ refreshToken }` | Public |
| POST | `/api/auth/logout` | — | Bearer token |

## Vérification prod (optionnel)

Pour tester avec MySQL en local :
```bash
docker run -d --name compta-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=comptadb \
  -p 3306:3306 mysql:8

SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/comptadb \
SPRING_DATASOURCE_USERNAME=root \
SPRING_DATASOURCE_PASSWORD=root \
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```
