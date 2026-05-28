# Supplier Multi-Contact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mirror the client multi-contact structure on the supplier page — multiple contacts with fullName, role, email, phone, and isPrimary, stored in a normalized `supplier_contacts` table.

**Architecture:** New `SupplierContact` JPA entity with its own repository (mirrors `ClientContact`). `SupplierService` drops embedded contact handling and gains `applyContacts()` (mirrors `ClientService`). Frontend replaces flat contact fields with a `contacts` FormArray (mirrors `NewClientComponent`).

**Tech Stack:** Spring Boot 3 / JPA / Flyway (backend) · Angular 17 standalone components / ReactiveFormsModule (frontend)

---

## File Map

| Action | File |
|---|---|
| Create | `comptabilite-backend/src/main/resources/db/migration/V10__supplier_contacts.sql` |
| Create | `comptabilite-backend/src/main/java/com/compta/supplier/entity/SupplierContact.java` |
| Create | `comptabilite-backend/src/main/java/com/compta/supplier/repository/SupplierContactRepository.java` |
| Modify | `comptabilite-backend/src/main/java/com/compta/supplier/entity/Supplier.java` |
| Modify | `comptabilite-backend/src/main/java/com/compta/supplier/dto/SupplierRequest.java` |
| Modify | `comptabilite-backend/src/main/java/com/compta/supplier/dto/SupplierResponse.java` |
| Modify | `comptabilite-backend/src/main/java/com/compta/supplier/service/SupplierService.java` |
| Modify | `comptabilite-frontend/src/app/shared/models/supplier.model.ts` |
| Modify | `comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.ts` |
| Modify | `comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.html` |

---

### Task 1: Flyway migration — create supplier_contacts, drop embedded columns

**Files:**
- Create: `comptabilite-backend/src/main/resources/db/migration/V10__supplier_contacts.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- V10__supplier_contacts.sql

CREATE TABLE supplier_contacts (
    id          VARCHAR(36)  NOT NULL,
    supplier_id VARCHAR(36)  NOT NULL,
    full_name   VARCHAR(200) NOT NULL,
    role        VARCHAR(100),
    email       VARCHAR(255),
    phone       VARCHAR(50),
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP    NOT NULL,
    CONSTRAINT pk_supplier_contacts PRIMARY KEY (id),
    CONSTRAINT fk_supplier_contacts_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

ALTER TABLE suppliers DROP COLUMN contact_name;
ALTER TABLE suppliers DROP COLUMN contact_role;
ALTER TABLE suppliers DROP COLUMN contact_phone;
ALTER TABLE suppliers DROP COLUMN contact_email;
```

- [ ] **Step 2: Verify migration runs**

```bash
cd comptabilite-backend
mvn spring-boot:run
```

Expected: app starts cleanly, no Flyway errors. Stop the server (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git add comptabilite-backend/src/main/resources/db/migration/V10__supplier_contacts.sql
git commit -m "db: add supplier_contacts table, drop embedded contact columns (V10)"
```

---

### Task 2: SupplierContact entity

**Files:**
- Create: `comptabilite-backend/src/main/java/com/compta/supplier/entity/SupplierContact.java`

- [ ] **Step 1: Create the entity**

```java
package com.compta.supplier.entity;

import com.compta.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "supplier_contacts")
public class SupplierContact extends BaseEntity {

    @Column(name = "supplier_id", nullable = false, length = 36)
    private UUID supplierId;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "role", length = 100)
    private String role;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "is_primary", nullable = false)
    private boolean primary = false;
}
```

- [ ] **Step 2: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/supplier/entity/SupplierContact.java
git commit -m "feat: add SupplierContact entity"
```

---

### Task 3: SupplierContactRepository

**Files:**
- Create: `comptabilite-backend/src/main/java/com/compta/supplier/repository/SupplierContactRepository.java`

- [ ] **Step 1: Create the repository**

```java
package com.compta.supplier.repository;

import com.compta.supplier.entity.SupplierContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface SupplierContactRepository extends JpaRepository<SupplierContact, UUID> {

    List<SupplierContact> findAllBySupplierIdOrderByPrimaryDesc(UUID supplierId);

    @Modifying
    @Query("DELETE FROM SupplierContact c WHERE c.supplierId = :supplierId")
    void deleteAllBySupplierId(UUID supplierId);
}
```

- [ ] **Step 2: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/supplier/repository/SupplierContactRepository.java
git commit -m "feat: add SupplierContactRepository"
```

---

### Task 4: Remove embedded contact fields from Supplier entity

**Files:**
- Modify: `comptabilite-backend/src/main/java/com/compta/supplier/entity/Supplier.java`

- [ ] **Step 1: Remove the four contact fields**

Delete lines 70–80 from `Supplier.java` (the four `@Column` fields and their accessors):

```java
    // DELETE these four fields:
    @Column(name = "contact_name", length = 200)
    private String contactName;

    @Column(name = "contact_role", length = 100)
    private String contactRole;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;
```

After deletion, the field sequence should jump from `website` directly to `paymentTerms`.

- [ ] **Step 2: Check only the entity file for syntax errors**

```bash
cd comptabilite-backend
mvn compile -q 2>&1 | grep "Supplier.java"
```

Expected: No errors on `Supplier.java` itself. `SupplierService.java` will fail (it still calls `setContactName()` etc.) — that is expected and fixed in Task 7. Do not be blocked by `SupplierService` errors here.

- [ ] **Step 3: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/supplier/entity/Supplier.java
git commit -m "feat: remove embedded contact columns from Supplier entity"
```

---

### Task 5: Update SupplierRequest DTO

**Files:**
- Modify: `comptabilite-backend/src/main/java/com/compta/supplier/dto/SupplierRequest.java`

- [ ] **Step 1: Replace the file content**

```java
package com.compta.supplier.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SupplierRequest(

        @NotBlank(message = "La raison sociale est obligatoire")
        String companyName,

        String website,

        @NotBlank(message = "La catégorie est obligatoire")
        String category,

        String status,

        String rneNumber,
        String regimeFiscal,
        Boolean assujettiTva,

        @NotNull(message = "Au moins un contact est obligatoire")
        @Size(min = 1, message = "Au moins un contact est obligatoire")
        @Valid List<ContactDto> contacts,

        @NotNull(message = "L'adresse est obligatoire")
        @Valid AddressDto address,

        @Valid FinancialDto financial

) {
    public record ContactDto(
            @NotBlank(message = "Le nom du contact est obligatoire")
            String fullName,
            String role,
            String email,
            String phone,
            @JsonProperty("isPrimary") boolean isPrimary
    ) {}

    public record AddressDto(
            String street,
            String city,
            String postalCode,
            String country
    ) {}

    public record FinancialDto(
            String taxId,
            String currency,
            String paymentTerms
    ) {}
}
```

- [ ] **Step 2: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/supplier/dto/SupplierRequest.java
git commit -m "feat: update SupplierRequest — contact → contacts list with role/isPrimary"
```

Note: `mvn compile` will fail until Task 7 because `SupplierService` still uses the old `req.contact()` accessor. This is expected — proceed to Task 6.

---

### Task 6: Update SupplierResponse DTO

**Files:**
- Modify: `comptabilite-backend/src/main/java/com/compta/supplier/dto/SupplierResponse.java`

- [ ] **Step 1: Replace the file content**

```java
package com.compta.supplier.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.compta.supplier.entity.Supplier;
import com.compta.supplier.entity.SupplierContact;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SupplierResponse(
        UUID id,
        String reference,
        String companyName,
        String website,
        String category,
        String rneNumber,
        String regimeFiscal,
        boolean assujettiTva,
        String status,
        LocalDateTime createdAt,
        List<ContactDto> contacts,
        AddressDto address,
        FinancialDto financial
) {
    public record ContactDto(
            UUID id,
            String fullName,
            String role,
            String email,
            String phone,
            @JsonProperty("isPrimary") boolean isPrimary
    ) {}

    public record AddressDto(String street, String city, String postalCode, String country) {}

    public record FinancialDto(String taxId, String currency, String paymentTerms) {}

    public static SupplierResponse from(Supplier s, List<SupplierContact> contacts) {
        return new SupplierResponse(
                s.getId(),
                s.getCode(),
                s.getName(),
                s.getWebsite(),
                s.getCategory(),
                s.getRneNumber(),
                s.getRegimeFiscal(),
                s.isAssujettiTva(),
                s.getStatus(),
                s.getCreatedAt(),
                contacts.stream().map(c -> new ContactDto(
                        c.getId(), c.getFullName(), c.getRole(),
                        c.getEmail(), c.getPhone(), c.isPrimary()
                )).toList(),
                new AddressDto(s.getStreetName(), s.getCity(), s.getPostalCode(), s.getCountry()),
                new FinancialDto(s.getMatriculeFiscal(), s.getCurrency(), s.getPaymentTerms())
        );
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/supplier/dto/SupplierResponse.java
git commit -m "feat: update SupplierResponse — contact → contacts list with id/role/isPrimary"
```

Note: `mvn compile` will fail until Task 7 because `SupplierService` calls the old single-arg `SupplierResponse.from()`. Proceed to Task 7 immediately.

---

### Task 7: Update SupplierService

**Files:**
- Modify: `comptabilite-backend/src/main/java/com/compta/supplier/service/SupplierService.java`

- [ ] **Step 1: Replace the file content**

```java
package com.compta.supplier.service;

import com.compta.common.exception.ApiException;
import com.compta.supplier.dto.SupplierRequest;
import com.compta.supplier.dto.SupplierResponse;
import com.compta.supplier.entity.Supplier;
import com.compta.supplier.entity.SupplierContact;
import com.compta.supplier.repository.SupplierContactRepository;
import com.compta.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierContactRepository contactRepository;

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAll(UUID companyId) {
        return supplierRepository.findAllByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(s -> SupplierResponse.from(s,
                        contactRepository.findAllBySupplierIdOrderByPrimaryDesc(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public SupplierResponse getById(UUID id, UUID companyId) {
        Supplier supplier = supplierRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> ApiException.notFound("Fournisseur introuvable"));
        List<SupplierContact> contacts =
                contactRepository.findAllBySupplierIdOrderByPrimaryDesc(supplier.getId());
        return SupplierResponse.from(supplier, contacts);
    }

    @Transactional
    public SupplierResponse create(SupplierRequest req, UUID companyId) {
        Supplier supplier = new Supplier();
        supplier.setCompanyId(companyId);
        supplier.setCode(generateCode(companyId));
        applyRequest(supplier, req);
        Supplier saved = supplierRepository.save(supplier);
        applyContacts(saved, req.contacts());
        return SupplierResponse.from(saved,
                contactRepository.findAllBySupplierIdOrderByPrimaryDesc(saved.getId()));
    }

    @Transactional
    public SupplierResponse update(UUID id, SupplierRequest req, UUID companyId) {
        Supplier supplier = supplierRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> ApiException.notFound("Fournisseur introuvable"));
        applyRequest(supplier, req);
        Supplier saved = supplierRepository.save(supplier);
        applyContacts(saved, req.contacts());
        return SupplierResponse.from(saved,
                contactRepository.findAllBySupplierIdOrderByPrimaryDesc(saved.getId()));
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        if (!supplierRepository.existsByIdAndCompanyId(id, companyId)) {
            throw ApiException.notFound("Fournisseur introuvable");
        }
        supplierRepository.deleteById(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void applyRequest(Supplier supplier, SupplierRequest req) {
        supplier.setName(req.companyName());
        supplier.setWebsite(req.website());
        supplier.setCategory(req.category());
        supplier.setRneNumber(req.rneNumber());
        supplier.setRegimeFiscal(req.regimeFiscal() != null ? req.regimeFiscal() : "REEL");
        supplier.setAssujettiTva(req.assujettiTva() != null ? req.assujettiTva() : true);
        if (req.status() != null) {
            supplier.setStatus(req.status());
        }

        if (req.address() != null) {
            supplier.setStreetName(req.address().street());
            supplier.setCity(req.address().city());
            supplier.setPostalCode(req.address().postalCode());
            supplier.setCountry(req.address().country() != null ? req.address().country() : "Tunisie");
        }

        if (req.financial() != null) {
            supplier.setMatriculeFiscal(req.financial().taxId());
            supplier.setCurrency(req.financial().currency() != null ? req.financial().currency() : "TND");
            supplier.setPaymentTerms(req.financial().paymentTerms());
        }
    }

    @Transactional
    private void applyContacts(Supplier supplier, List<SupplierRequest.ContactDto> dtos) {
        contactRepository.deleteAllBySupplierId(supplier.getId());
        if (dtos == null || dtos.isEmpty()) return;

        boolean hasPrimary = dtos.stream().anyMatch(SupplierRequest.ContactDto::isPrimary);

        for (int i = 0; i < dtos.size(); i++) {
            SupplierRequest.ContactDto dto = dtos.get(i);
            SupplierContact sc = new SupplierContact();
            sc.setSupplierId(supplier.getId());
            sc.setFullName(dto.fullName());
            sc.setRole(dto.role());
            sc.setEmail(dto.email());
            sc.setPhone(dto.phone());
            sc.setPrimary(!hasPrimary ? i == 0 : dto.isPrimary());
            contactRepository.save(sc);
        }

        // Sync email/phone from primary contact to supplier row
        SupplierRequest.ContactDto primary = hasPrimary
                ? dtos.stream().filter(SupplierRequest.ContactDto::isPrimary).findFirst().orElse(dtos.get(0))
                : dtos.get(0);
        supplier.setEmail(primary.email());
        supplier.setPhone(primary.phone());
        supplierRepository.save(supplier);
    }

    private String generateCode(UUID companyId) {
        long count = supplierRepository.countByCompanyId(companyId);
        return String.format("FRN-%03d", count + 1);
    }
}
```

- [ ] **Step 2: Full backend build and test**

```bash
cd comptabilite-backend
mvn clean package -DskipTests -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Start backend and smoke-test**

```bash
mvn spring-boot:run
```

In a second terminal, create a supplier:
```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | grep -o '"accessToken":"[^"]*"'
```

Then (replace TOKEN):
```bash
curl -s -X POST http://localhost:8080/api/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "companyName": "Test SARL",
    "category": "Informatique",
    "contacts": [
      {"fullName": "Ahmed Ben Ali", "role": "DG", "email": "ahmed@test.tn", "phone": "+21671000000", "isPrimary": true}
    ],
    "address": {"street": "Rue test", "city": "Tunis", "postalCode": "1000", "country": "Tunisie"},
    "financial": {"taxId": "", "currency": "TND", "paymentTerms": "Net 30"}
  }'
```

Expected: 200 response with `"contacts": [{"id": "...", "fullName": "Ahmed Ben Ali", "role": "DG", ...}]`

Stop the server.

- [ ] **Step 4: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/supplier/service/SupplierService.java
git commit -m "feat: update SupplierService — multi-contact save/update with applyContacts()"
```

---

### Task 8: Update frontend supplier model

**Files:**
- Modify: `comptabilite-frontend/src/app/shared/models/supplier.model.ts`

- [ ] **Step 1: Replace the file content**

```typescript
// src/app/shared/models/supplier.model.ts

export interface SupplierContact {
  id?: string
  fullName: string
  role: string
  email: string
  phone: string
  isPrimary: boolean
}

export interface SupplierAddress {
  street: string
  city: string
  postalCode: string
  country: string
}

export interface SupplierFinancial {
  taxId: string
  currency: string
  paymentTerms: string
}

export interface CreateSupplierDto {
  companyName: string
  website: string
  category: string
  contacts: SupplierContact[]
  address: SupplierAddress
  financial: SupplierFinancial
}

export interface Supplier {
  id: string
  reference: string
  companyName: string
  website: string
  category: string
  rneNumber: string
  regimeFiscal: string
  assujettiTva: boolean
  status: string
  createdAt: string
  contacts: SupplierContact[]
  address: SupplierAddress
  financial: SupplierFinancial
}

export const SUPPLIER_CATEGORIES = [
  'Informatique',
  'Transport',
  'Fournitures',
  'Services professionnels',
  'Télécommunications',
  'Autre',
] as const
```

Note: `Supplier` is now explicit (not `extends CreateSupplierDto`) because the response shape includes `id`, `reference`, `rneNumber`, etc. that aren't in the create DTO.

- [ ] **Step 2: Check for TypeScript errors**

```bash
cd comptabilite-frontend
npx tsc --noEmit 2>&1 | head -40
```

Expected: Errors related to `new-supplier.component.ts` (references `supplier.contact` which no longer exists). These will be fixed in Task 9.

- [ ] **Step 3: Commit**

```bash
git add comptabilite-frontend/src/app/shared/models/supplier.model.ts
git commit -m "feat: update SupplierContact model — add role/isPrimary, contact → contacts[]"
```

---

### Task 9: Update new-supplier.component.ts

**Files:**
- Modify: `comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.ts`

- [ ] **Step 1: Replace the file content**

```typescript
// src/app/features/suppliers/new-supplier/new-supplier.component.ts
import { Component, signal, computed, OnInit } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms'
import { RouterLink, Router, ActivatedRoute } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { SupplierService } from '../supplier.service'
import { CreateSupplierDto, SUPPLIER_CATEGORIES } from '../../../shared/models/supplier.model'
import { COUNTRIES, CURRENCIES, PAYMENT_TERMS, COUNTRY_CURRENCY_MAP } from '../../../shared/models/client.model'

function optionalUrl(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').trim()
  if (!v) return null
  return /^https?:\/\/.+\..+/.test(v) ? null : { invalidUrl: true }
}

function optionalPhone(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').trim()
  if (!v) return null
  return /^[+\d][\d\s\-(). ]{5,}$/.test(v) ? null : { invalidPhone: true }
}

@Component({
  selector: 'app-new-supplier',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './new-supplier.component.html',
  styleUrl: './new-supplier.component.scss'
})
export class NewSupplierComponent implements OnInit {

  form!: FormGroup
  readonly categories   = SUPPLIER_CATEGORIES
  readonly countries    = COUNTRIES
  readonly currencies   = CURRENCIES
  readonly paymentTerms = PAYMENT_TERMS

  editMode      = signal(false)
  loading       = signal(false)
  formSubmitted = signal(false)
  errorMsg      = signal('')

  private selectedCountry = signal('Tunisie')
  isTunisian = computed(() => this.selectedCountry() === 'Tunisie')

  get f() { return this.form.controls }

  get contactsArray(): FormArray {
    return this.form.get('contacts') as FormArray
  }

  private supplierId: string | null = null

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private supplierService: SupplierService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      companyName:  ['', Validators.required],
      website:      ['', optionalUrl],
      category:     ['', Validators.required],
      rneNumber:    [''],
      taxId:        [''],
      regimeFiscal: ['REEL'],
      assujettiTva: [true],
      contacts:     this.fb.array([this.newContactGroup(true)]),
      street:       [''],
      city:         [''],
      postalCode:   [''],
      country:      ['Tunisie'],
      currency:     ['TND'],
      paymentTerms: ['Net 30'],
    })

    this.form.get('country')!.valueChanges.subscribe((country: string) => {
      this.selectedCountry.set(country)
      const suggestedCurrency = COUNTRY_CURRENCY_MAP[country] ?? 'TND'
      this.form.patchValue({ currency: suggestedCurrency }, { emitEvent: false })
      if (country !== 'Tunisie') {
        this.form.patchValue({ regimeFiscal: '' }, { emitEvent: false })
      } else {
        this.form.patchValue({ regimeFiscal: 'REEL' }, { emitEvent: false })
      }
    })

    this.supplierId = this.route.snapshot.paramMap.get('id')
    if (this.supplierId) {
      this.editMode.set(true)
      this.supplierService.getById(this.supplierId).subscribe({
        next: (supplier) => {
          this.selectedCountry.set(supplier.address.country ?? 'Tunisie')
          this.form.patchValue({
            companyName:  supplier.companyName,
            website:      supplier.website,
            category:     supplier.category,
            rneNumber:    supplier.rneNumber ?? '',
            taxId:        supplier.financial.taxId,
            regimeFiscal: supplier.regimeFiscal ?? 'REEL',
            assujettiTva: supplier.assujettiTva ?? true,
            street:       supplier.address.street,
            city:         supplier.address.city,
            postalCode:   supplier.address.postalCode,
            country:      supplier.address.country,
            currency:     supplier.financial.currency,
            paymentTerms: supplier.financial.paymentTerms,
          })
          if (supplier.contacts?.length) {
            const groups = supplier.contacts.map(c => {
              const g = this.newContactGroup(c.isPrimary)
              g.patchValue({ fullName: c.fullName, role: c.role, email: c.email, phone: c.phone })
              return g
            })
            this.form.setControl('contacts', this.fb.array(groups))
          }
        },
        error: () => this.router.navigate(['/suppliers'])
      })
    }
  }

  // ── Contact helpers ─────────────────────────────────────────

  newContactGroup(isPrimary = false): FormGroup {
    return this.fb.group({
      fullName:  ['', Validators.required],
      role:      [''],
      email:     ['', Validators.email],
      phone:     ['', optionalPhone],
      isPrimary: [isPrimary],
    })
  }

  addContact(): void {
    this.contactsArray.push(this.newContactGroup(false))
  }

  removeContact(index: number): void {
    if (this.contactsArray.length === 1) return
    const wasPrimary = this.contactsArray.at(index).get('isPrimary')?.value
    this.contactsArray.removeAt(index)
    if (wasPrimary) {
      this.contactsArray.at(0).get('isPrimary')?.setValue(true)
    }
  }

  setPrimary(index: number): void {
    this.contactsArray.controls.forEach((ctrl, i) => {
      ctrl.get('isPrimary')?.setValue(i === index)
    })
  }

  // ── Save ────────────────────────────────────────────────────

  save(): void {
    this.form.markAllAsTouched()
    this.formSubmitted.set(true)
    if (this.form.invalid) return

    this.loading.set(true)
    this.errorMsg.set('')

    const v = this.form.getRawValue()
    const dto: CreateSupplierDto = {
      companyName: v.companyName,
      website:     v.website,
      category:    v.category,
      contacts:    this.contactsArray.getRawValue().map((c: any) => ({
        fullName:  c.fullName,
        role:      c.role,
        email:     c.email,
        phone:     c.phone,
        isPrimary: c.isPrimary,
      })),
      address: {
        street:     v.street,
        city:       v.city,
        postalCode: v.postalCode,
        country:    v.country,
      },
      financial: {
        taxId:        v.taxId,
        currency:     v.currency,
        paymentTerms: v.paymentTerms,
      },
    }

    const request$ = this.editMode()
      ? this.supplierService.update(this.supplierId!, dto)
      : this.supplierService.create(dto)

    request$.subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/suppliers']) },
      error: (e) => {
        this.errorMsg.set(e?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.')
        this.loading.set(false)
      }
    })
  }

  cancel(): void {
    this.router.navigate(['/suppliers'])
  }
}
```

- [ ] **Step 2: Check TypeScript**

```bash
cd comptabilite-frontend
npx tsc --noEmit 2>&1 | head -40
```

Expected: No errors (or only errors from the HTML template that `tsc --noEmit` does not check).

- [ ] **Step 3: Commit**

```bash
git add comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.ts
git commit -m "feat: new-supplier — replace flat contact with FormArray (multi-contact)"
```

---

### Task 10: Update new-supplier.component.html — multi-contact UI

**Files:**
- Modify: `comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.html`

- [ ] **Step 1: Replace section 02 (lines 160–211) with the multi-contact FormArray block**

Replace the entire section `<!-- 02 — Contact principal -->` with:

```html
    <!-- 02 — Contacts -->
    <section class="ns-section ns-anim-2">
      <div class="ns-section__head">
        <span class="ns-section__num">02</span>
        <div class="ns-section__icon-wrap">
          <span class="material-symbols-outlined">people</span>
        </div>
        <div class="ns-section__meta">
          <h2 class="ns-section__title">{{ 'NEW_SUPPLIER.SECTION_CONTACT' | translate }}</h2>
          <p class="ns-section__desc">Interlocuteurs pour les commandes et factures</p>
        </div>
      </div>
      <div class="ns-section__body" formArrayName="contacts">

        @for (contact of contactsArray.controls; track $index) {
          <div class="ns-contact-card" [formGroupName]="$index">
            <div class="ns-contact-card__head">
              <span class="ns-contact-card__num">Contact {{ $index + 1 }}</span>
              <div class="ns-contact-card__actions">
                @if (!contact.get('isPrimary')?.value) {
                  <button type="button" class="ns-btn-link" (click)="setPrimary($index)">
                    <span class="material-symbols-outlined">star</span>
                    Définir principal
                  </button>
                } @else {
                  <span class="ns-badge-primary">
                    <span class="material-symbols-outlined">star</span>
                    Principal
                  </span>
                }
                @if (contactsArray.length > 1) {
                  <button type="button" class="ns-btn-link ns-btn-link--danger" (click)="removeContact($index)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                }
              </div>
            </div>

            <div class="ns-grid ns-grid--2">
              <div class="ns-field">
                <label class="ns-label">Nom complet <span class="ns-required">*</span></label>
                <input class="ns-input" type="text" placeholder="Ahmed Ben Ali"
                  formControlName="fullName"
                  [class.ns-input--error]="contact.get('fullName')?.invalid && contact.get('fullName')?.touched" />
                @if (contact.get('fullName')?.invalid && contact.get('fullName')?.touched) {
                  <p class="ns-field-error">
                    <span class="material-symbols-outlined">error</span>
                    Le nom est requis.
                  </p>
                }
              </div>
              <div class="ns-field">
                <label class="ns-label">Fonction</label>
                <input class="ns-input" type="text" placeholder="Directeur financier…"
                  formControlName="role" />
              </div>
            </div>

            <div class="ns-grid ns-grid--2">
              <div class="ns-field">
                <label class="ns-label">Email</label>
                <input class="ns-input" type="email" placeholder="contact@fournisseur.tn"
                  formControlName="email"
                  [class.ns-input--error]="contact.get('email')?.invalid && contact.get('email')?.touched" />
                @if (contact.get('email')?.hasError('email') && contact.get('email')?.touched) {
                  <p class="ns-field-error">
                    <span class="material-symbols-outlined">error</span>
                    Email invalide.
                  </p>
                }
              </div>
              <div class="ns-field">
                <label class="ns-label">Téléphone</label>
                <input class="ns-input" type="tel" placeholder="+216 XX XXX XXX"
                  formControlName="phone"
                  [class.ns-input--error]="contact.get('phone')?.invalid && contact.get('phone')?.touched" />
                @if (contact.get('phone')?.hasError('invalidPhone') && contact.get('phone')?.touched) {
                  <p class="ns-field-error">
                    <span class="material-symbols-outlined">error</span>
                    Numéro invalide.
                  </p>
                }
              </div>
            </div>
          </div>
        }

        <button type="button" class="ns-btn-add-contact" (click)="addContact()">
          <span class="material-symbols-outlined">add</span>
          Ajouter un contact
        </button>

      </div>
    </section>
```

- [ ] **Step 2: Build the frontend**

```bash
cd comptabilite-frontend
npm run build 2>&1 | tail -20
```

Expected: Build succeeds (or only warnings, no errors).

- [ ] **Step 3: Run dev server and manually test**

```bash
npm start
```

Open http://localhost:4200/supplier/create. Verify:
- Section 02 shows "Contact 1" with fullName (required), Fonction, Email, Téléphone
- "Ajouter un contact" button adds a second contact card
- Removing the non-primary contact works; removing is disabled when only 1 contact
- "Définir principal" promotes a contact; the star badge appears
- Saving a new supplier with 2 contacts succeeds and navigates to `/suppliers`
- Editing an existing supplier loads its contacts correctly

- [ ] **Step 4: Commit**

```bash
git add comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.html
git commit -m "feat: new-supplier HTML — multi-contact FormArray UI (matches client form)"
```

---

### Task 11: CSS — add contact card styles to supplier stylesheet

**Files:**
- Modify: `comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.scss`

The new HTML uses `ns-contact-card`, `ns-contact-card__head`, `ns-contact-card__num`, `ns-contact-card__actions`, `ns-badge-primary`, `ns-btn-link`, `ns-btn-link--danger`, `ns-btn-add-contact`. Check whether these are already defined globally or in the stylesheet.

- [ ] **Step 1: Check the existing stylesheet**

Open `new-supplier.component.scss` and search for `contact-card`. If the styles are absent, append the following block:

```scss
// ── Contact cards ─────────────────────────────────────────────

.ns-contact-card {
  border: 1px solid var(--surface-border, #334155);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  background: var(--surface-section, #1e293b);
}

.ns-contact-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.ns-contact-card__num {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-color-secondary, #94a3b8);
}

.ns-contact-card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ns-badge-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #f59e0b;

  .material-symbols-outlined { font-size: 1rem; }
}

.ns-btn-link {
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: var(--primary-color, #6366f1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.15s;

  &:hover { background: rgba(99, 102, 241, 0.08); }

  .material-symbols-outlined { font-size: 1rem; }

  &--danger {
    color: #ef4444;
    &:hover { background: rgba(239, 68, 68, 0.08); }
  }
}

.ns-btn-add-contact {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: 1px dashed var(--surface-border, #334155);
  border-radius: 8px;
  padding: 0.625rem 1rem;
  width: 100%;
  justify-content: center;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-color-secondary, #94a3b8);
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: var(--primary-color, #6366f1);
    color: var(--primary-color, #6366f1);
  }

  .material-symbols-outlined { font-size: 1.125rem; }
}
```

- [ ] **Step 2: Build and verify no style errors**

```bash
cd comptabilite-frontend
npm run build 2>&1 | tail -10
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.scss
git commit -m "style: add contact card styles to supplier form"
```
