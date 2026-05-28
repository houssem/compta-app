# Supplier Multi-Contact Structure

**Date:** 2026-05-28
**Branch:** feat/FACT-2-Fournissuer
**Status:** Approved

## Goal

Mirror the client multi-contact structure on the supplier page. Clients support multiple contacts (fullName, role, email, phone, isPrimary) stored in a normalized `client_contacts` table. Suppliers currently store a single contact embedded directly in the `supplier` table with no `role` or `isPrimary` fields. This spec aligns the two.

## Decisions

- **Scope:** Full stack — database, backend, frontend.
- **Migration:** Fresh start — create new `supplier_contacts` table, drop old embedded columns, discard existing contact data (dev H2 environment, reset on each start).
- **Pattern:** Mirror `ClientContact` exactly. No shared abstractions.

---

## 1. Database — `V10__supplier_contacts.sql`

Create `supplier_contacts` table:

```sql
CREATE TABLE supplier_contacts (
    id          VARCHAR(36)  NOT NULL PRIMARY KEY,
    supplier_id VARCHAR(36)  NOT NULL,
    full_name   VARCHAR(200) NOT NULL,
    role        VARCHAR(100),
    email       VARCHAR(255),
    phone       VARCHAR(50),
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP    NOT NULL,
    CONSTRAINT fk_supplier_contacts_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);
```

Drop embedded contact columns from `supplier`:

```sql
ALTER TABLE supplier DROP COLUMN contact_name;
ALTER TABLE supplier DROP COLUMN contact_role;
ALTER TABLE supplier DROP COLUMN contact_phone;
ALTER TABLE supplier DROP COLUMN contact_email;
```

---

## 2. Backend

### `SupplierContact.java` (new entity)

Mirrors `ClientContact.java`:
- Fields: `id` (UUID, BaseEntity), `supplierId` (UUID), `fullName`, `role`, `email`, `phone`, `isPrimary`
- Table: `supplier_contacts`
- No `@ManyToOne` back-reference needed (consistent with ClientContact pattern)

### `SupplierRequest.java`

Before:
```java
@Valid ContactDto contact
record ContactDto(String fullName, String email, String phone)
```

After:
```java
@NotNull @Size(min = 1) @Valid List<ContactDto> contacts
record ContactDto(
    @NotBlank String fullName,
    String role,
    String email,
    String phone,
    @JsonProperty("isPrimary") boolean isPrimary
)
```

### `SupplierResponse.java`

Before:
```java
record ContactDto(String fullName, String email, String phone)
// field: ContactDto contact
```

After:
```java
record ContactDto(UUID id, String fullName, String role, String email, String phone, boolean isPrimary)
// field: List<ContactDto> contacts
```

### `Supplier.java`

- Remove: `contactName`, `contactRole`, `contactPhone`, `contactEmail` fields
- Add: `@OneToMany` collection `List<SupplierContact> contacts` (fetch = LAZY, cascade = ALL, orphanRemoval = true), mapped via `supplierId`

### `SupplierService.java`

Save and update logic mirrors `ClientService`:
- On create: persist each `ContactDto` as a `SupplierContact` row, enforce exactly one `isPrimary = true`
- On update: delete old contacts for the supplier, re-insert from request (same pattern as client)
- `getAll` / `getById` must be `@Transactional(readOnly = true)` to avoid `LazyInitializationException` when iterating contacts in `SupplierResponse::from`

### `SupplierRepository` / `SupplierContactRepository`

Add `SupplierContactRepository` (extends `JpaRepository<SupplierContact, UUID>`) with a `deleteAllBySupplierId(UUID supplierId)` method for update logic.

---

## 3. Frontend

### `supplier.model.ts`

Before:
```typescript
export interface SupplierContact { fullName: string; email: string; phone: string }
// in CreateSupplierDto: contact: SupplierContact
```

After:
```typescript
export interface SupplierContact {
  fullName: string; role: string; email: string; phone: string; isPrimary: boolean
}
// in CreateSupplierDto: contacts: SupplierContact[]
// in SupplierResponse: contacts: SupplierContact[] (with id field)
```

### `new-supplier.component.ts`

- Remove flat contact fields (`fullName`, `email`, `phone`) from the root `FormGroup`
- Add `contacts` `FormArray` to the root group
- Add helpers: `get contactsArray()`, `newContactGroup(isPrimary = false)`, `addContact()`, `removeContact(i)`, `setPrimary(i)`
- `ngOnInit` / `loadSupplier()`: populate FormArray from response `contacts[]`
- Save payload: `contacts: this.contactsArray.getRawValue()`

### `new-supplier.component.html`

Replace the single-contact section with the multi-contact FormArray block identical to the client form:
- `*ngFor` over `contactsArray.controls`
- Fields per row: fullName (required), role, email, phone
- "Set as primary" radio per contact
- Add contact / Remove contact buttons
- Same CSS classes / layout as client form

---

## Affected Files

| File | Change |
|---|---|
| `V10__supplier_contacts.sql` | New migration |
| `SupplierContact.java` | New entity |
| `SupplierContactRepository.java` | New repository |
| `Supplier.java` | Remove embedded contact fields, add OneToMany |
| `SupplierRequest.java` | `contact` → `contacts` list, add role/isPrimary |
| `SupplierResponse.java` | `contact` → `contacts` list, add id/role/isPrimary |
| `SupplierService.java` | Multi-contact save/update logic, @Transactional |
| `supplier.model.ts` | Update interface and DTOs |
| `new-supplier.component.ts` | FormArray logic |
| `new-supplier.component.html` | Multi-contact UI |
