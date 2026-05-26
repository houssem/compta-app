# Client Form — 10 Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter 10 améliorations du formulaire client : contacts multiples, champs manquants (type, notes, catégorie), statut éditable, auto-devise, validation matricule fiscal, et fixes UX mineurs.

**Architecture:** Les contacts multiples migrent vers une table `client_contacts` séparée. Les champs simples (type, notes, catégorie) s'ajoutent à la table `clients`. Le frontend utilise un `FormArray` pour les contacts et des signals `computed()` pour la logique conditionnelle.

**Tech Stack:** Spring Boot 3 / Java 17 / Flyway (backend) — Angular 17 / Reactive Forms / Signals (frontend)

---

## Fichiers modifiés

### Backend
| Fichier | Action |
|---|---|
| `src/main/resources/db/migration/V2__create_clients_suppliers.sql` | Modifier : + colonnes client_type, notes, category ; - colonnes contact_* ; + table client_contacts |
| `src/main/java/com/compta/client/entity/Client.java` | Modifier : + clientType, notes, category ; - contactName, contactRole, contactEmail, contactPhone |
| `src/main/java/com/compta/client/entity/ClientContact.java` | Créer : entité JPA pour client_contacts |
| `src/main/java/com/compta/client/repository/ClientContactRepository.java` | Créer : JpaRepository<ClientContact, UUID> |
| `src/main/java/com/compta/client/dto/ClientRequest.java` | Modifier : contact → contacts (List), + clientType, notes, category, status |
| `src/main/java/com/compta/client/dto/ClientResponse.java` | Modifier : idem |
| `src/main/java/com/compta/client/service/ClientService.java` | Modifier : applyRequest() pour contacts list + nouveaux champs |

### Frontend
| Fichier | Action |
|---|---|
| `src/app/shared/models/client.model.ts` | Modifier : contacts[], + clientType, notes, category, status ; + COUNTRY_CURRENCY_MAP |
| `src/app/features/clients/new-client/new-client.component.ts` | Modifier : FormArray contacts, validateurs, auto-devise, isTunisian |
| `src/app/features/clients/new-client/new-client.component.html` | Modifier : toutes les sections |
| `src/app/features/clients/new-client/new-client.component.scss` | Modifier : styles contacts dynamiques |

---

## Task 1 — DB & Backend : nouveaux champs simples (type, notes, catégorie, statut)

**Fichiers :**
- Modifier : `src/main/resources/db/migration/V2__create_clients_suppliers.sql`
- Modifier : `src/main/java/com/compta/client/entity/Client.java`
- Modifier : `src/main/java/com/compta/client/dto/ClientRequest.java`
- Modifier : `src/main/java/com/compta/client/dto/ClientResponse.java`
- Modifier : `src/main/java/com/compta/client/service/ClientService.java`

- [ ] **Step 1 : Ajouter les colonnes dans V2 (table clients)**

Dans `V2__create_clients_suppliers.sql`, après `assujetti_tva` ajouter :

```sql
client_type         VARCHAR(20)   NOT NULL DEFAULT 'PROFESSIONNEL',
category            VARCHAR(100),
notes               TEXT,
```

Et modifier la colonne `status` pour qu'elle inclue `SUSPENDU` (déjà VARCHAR(20), aucun changement DDL).

- [ ] **Step 2 : Mettre à jour l'entité Client.java**

Ajouter après `assujettiTva` :

```java
@Column(name = "client_type", nullable = false, length = 20)
private String clientType = "PROFESSIONNEL";

@Column(name = "category", length = 100)
private String category;

@Column(name = "notes", columnDefinition = "TEXT")
private String notes;
```

- [ ] **Step 3 : Mettre à jour ClientRequest.java**

Ajouter dans le record principal :

```java
String clientType,   // PROFESSIONNEL | PARTICULIER
String category,
String notes,
String status,       // ACTIVE | INACTIVE | SUSPENDU (null en création = ACTIVE)
```

- [ ] **Step 4 : Mettre à jour ClientResponse.java**

Ajouter dans le record principal :

```java
String clientType,
String category,
String notes,
```

(status est déjà dans ClientResponse)

Mettre à jour `from(Client c)` :

```java
return new ClientResponse(
    c.getId(), c.getCode(), c.getName(), c.getLegalForm(),
    c.getRneNumber(), c.getMatriculeFiscal(), c.getRegimeFiscal(),
    c.isAssujettiTva(), c.getClientType(), c.getCategory(), c.getNotes(),
    c.getWebsite(), c.getStatus(), c.getCreatedAt(),
    ...
);
```

- [ ] **Step 5 : Mettre à jour ClientService.applyRequest()**

```java
client.setClientType(req.clientType() != null ? req.clientType() : "PROFESSIONNEL");
client.setCategory(req.category());
client.setNotes(req.notes());
if (req.status() != null) {
    client.setStatus(req.status());
}
```

- [ ] **Step 6 : Build backend**

```bash
mvn clean package -DskipTests -q
```

Attendu : `BUILD SUCCESS`

- [ ] **Step 7 : Commit**

```bash
git add src/main/resources/db/migration/V2__create_clients_suppliers.sql \
        src/main/java/com/compta/client/
git commit -m "feat(client): add clientType, category, notes, editable status"
```

---

## Task 2 — DB & Backend : contacts multiples

**Fichiers :**
- Modifier : `src/main/resources/db/migration/V2__create_clients_suppliers.sql`
- Créer : `src/main/java/com/compta/client/entity/ClientContact.java`
- Créer : `src/main/java/com/compta/client/repository/ClientContactRepository.java`
- Modifier : `src/main/java/com/compta/client/entity/Client.java`
- Modifier : `src/main/java/com/compta/client/dto/ClientRequest.java`
- Modifier : `src/main/java/com/compta/client/dto/ClientResponse.java`
- Modifier : `src/main/java/com/compta/client/service/ClientService.java`

- [ ] **Step 1 : Ajouter la table client_contacts dans V2**

Dans `V2__create_clients_suppliers.sql`, après la table clients, avant la table suppliers :

```sql
CREATE TABLE client_contacts (
    id          VARCHAR(36)   NOT NULL,
    client_id   VARCHAR(36)   NOT NULL,
    full_name   VARCHAR(200)  NOT NULL,
    role        VARCHAR(100),
    email       VARCHAR(255),
    phone       VARCHAR(50),
    is_primary  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP     NOT NULL,
    updated_at  TIMESTAMP     NOT NULL,
    CONSTRAINT pk_client_contacts PRIMARY KEY (id),
    CONSTRAINT fk_client_contacts_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_client_contacts_client ON client_contacts(client_id);
```

Et **supprimer** de la table clients les colonnes :
`contact_name`, `contact_role`, `contact_phone`, `contact_email`
(conserver `email` et `phone` comme champs de contact principal pour affichage rapide dans les listes)

- [ ] **Step 2 : Créer ClientContact.java**

```java
package com.compta.client.entity;

import com.compta.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "client_contacts")
public class ClientContact extends BaseEntity {

    @Column(name = "client_id", nullable = false, length = 36)
    private UUID clientId;

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

- [ ] **Step 3 : Créer ClientContactRepository.java**

```java
package com.compta.client.repository;

import com.compta.client.entity.ClientContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ClientContactRepository extends JpaRepository<ClientContact, UUID> {
    List<ClientContact> findAllByClientIdOrderByPrimaryDesc(UUID clientId);

    @Modifying
    @Query("DELETE FROM ClientContact c WHERE c.clientId = :clientId")
    void deleteAllByClientId(UUID clientId);
}
```

- [ ] **Step 4 : Mettre à jour Client.java**

Supprimer :
```java
// SUPPRIMER ces 4 champs :
private String contactName;
private String contactRole;
private String contactPhone;
private String contactEmail;
```

Conserver `email` et `phone` (utilisés comme email/phone du contact principal pour les listes).

- [ ] **Step 5 : Mettre à jour ClientRequest.java**

Remplacer `ContactDto contact` par :

```java
@NotNull(message = "Au moins un contact est obligatoire")
@Size(min = 1, message = "Au moins un contact est obligatoire")
@Valid List<ContactDto> contacts,
```

Mettre à jour `ContactDto` :

```java
public record ContactDto(
        @NotBlank(message = "Le nom du contact est obligatoire")
        String fullName,
        String role,
        String email,   // optionnel
        String phone,
        boolean isPrimary
) {}
```

Ajouter l'import : `import java.util.List;` et `import jakarta.validation.constraints.Size;`

- [ ] **Step 6 : Mettre à jour ClientResponse.java**

Remplacer `ContactDto contact` par `List<ContactDto> contacts`.

Mettre à jour `ContactDto` :

```java
public record ContactDto(
    String fullName, String role, String email, String phone, boolean isPrimary
) {}
```

Mettre à jour `from(Client c)` — contacts seront chargés dans le service, passer `List.of()` pour l'instant (le service les injectera).

Ajouter une méthode statique alternative :

```java
public static ClientResponse from(Client c, List<ClientContact> contacts) {
    return new ClientResponse(
        c.getId(), c.getCode(), c.getName(), c.getLegalForm(),
        c.getRneNumber(), c.getMatriculeFiscal(), c.getRegimeFiscal(),
        c.isAssujettiTva(), c.getClientType(), c.getCategory(), c.getNotes(),
        c.getWebsite(), c.getStatus(), c.getCreatedAt(),
        contacts.stream().map(cc -> new ContactDto(
            cc.getFullName(), cc.getRole(), cc.getEmail(), cc.getPhone(), cc.isPrimary()
        )).toList(),
        new AddressDto(...),
        new FinancialDto(...)
    );
}
```

- [ ] **Step 7 : Mettre à jour ClientService.java**

Injecter `ClientContactRepository` :

```java
private final ClientContactRepository contactRepository;
```

Mettre à jour `getAll()` — pour la liste, passer une liste vide de contacts (performance) :

```java
public List<ClientResponse> getAll(UUID companyId) {
    return clientRepository.findAllByCompanyIdOrderByCreatedAtDesc(companyId)
            .stream()
            .map(c -> ClientResponse.from(c, contactRepository.findAllByClientIdOrderByPrimaryDesc(c.getId())))
            .toList();
}
```

Mettre à jour `getById()` :

```java
public ClientResponse getById(UUID id, UUID companyId) {
    Client client = clientRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> ApiException.notFound("Client introuvable"));
    List<ClientContact> contacts = contactRepository.findAllByClientIdOrderByPrimaryDesc(client.getId());
    return ClientResponse.from(client, contacts);
}
```

Mettre à jour `applyRequest()` — ajouter gestion contacts :

```java
private void applyContacts(Client client, List<ClientRequest.ContactDto> dtos) {
    contactRepository.deleteAllByClientId(client.getId());
    if (dtos == null || dtos.isEmpty()) return;

    // S'assurer qu'un contact est primary
    boolean hasPrimary = dtos.stream().anyMatch(ClientRequest.ContactDto::isPrimary);

    for (int i = 0; i < dtos.size(); i++) {
        ClientRequest.ContactDto dto = dtos.get(i);
        ClientContact cc = new ClientContact();
        cc.setClientId(client.getId());
        cc.setFullName(dto.fullName());
        cc.setRole(dto.role());
        cc.setEmail(dto.email());
        cc.setPhone(dto.phone());
        cc.setPrimary(!hasPrimary ? i == 0 : dto.isPrimary());
        contactRepository.save(cc);
    }

    // Mettre à jour email/phone du client depuis le contact principal
    dtos.stream()
        .filter(d -> !hasPrimary ? dtos.indexOf(d) == 0 : d.isPrimary())
        .findFirst()
        .ifPresent(primary -> {
            client.setEmail(primary.email());
            client.setPhone(primary.phone());
        });
}
```

Appeler dans `create()` et `update()` après `clientRepository.save(client)` :

```java
applyContacts(saved, req.contacts());
return ClientResponse.from(saved, contactRepository.findAllByClientIdOrderByPrimaryDesc(saved.getId()));
```

- [ ] **Step 8 : Build backend**

```bash
mvn clean package -DskipTests -q
```

Attendu : `BUILD SUCCESS`

- [ ] **Step 9 : Commit**

```bash
git add src/main/resources/db/migration/V2__create_clients_suppliers.sql \
        src/main/java/com/compta/client/
git commit -m "feat(client): multiple contacts via client_contacts table"
```

---

## Task 3 — Frontend : fixes simples (items 2, 8, 9, 10)

**Fichiers :**
- Modifier : `src/app/features/clients/new-client/new-client.component.ts`
- Modifier : `src/app/features/clients/new-client/new-client.component.html`

- [ ] **Step 1 : Email optionnel — supprimer Validators.required**

Dans `new-client.component.ts`, changer :

```typescript
// Avant
email: ['', [Validators.required, Validators.email]],

// Après
email: ['', Validators.email],
```

- [ ] **Step 2 : Rue optionnelle — supprimer Validators.required**

```typescript
// Avant
streetName: ['', Validators.required],

// Après
streetName: [''],
```

Supprimer aussi le message d'erreur `streetName` dans le template HTML.

- [ ] **Step 3 : Pays demi-largeur — changer nc-grid--1 en nc-grid--2**

Dans le template HTML, section 03 :

```html
<!-- Avant -->
<div class="nc-grid nc-grid--1">
  <div class="nc-field">
    <label class="nc-label" for="country">...

<!-- Après -->
<div class="nc-grid nc-grid--2">
  <div class="nc-field">
    <label class="nc-label" for="country">...
  </div>
  <div></div>  <!-- colonne vide pour garder alignement -->
</div>
```

- [ ] **Step 4 : Validation matricule fiscal tunisien**

Dans `new-client.component.ts`, ajouter validator après `optionalPhone` :

```typescript
function tunisianTaxId(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').trim()
  if (!v) return null
  // Format : 7 chiffres + 1 lettre majuscule + / + lettre(s) + / + 3 chiffres
  return /^\d{7}[A-Z]\/[A-Z]{1,3}\/\d{3}$/.test(v) ? null : { invalidTaxId: true }
}
```

Dans le groupe du formulaire :

```typescript
matriculeFiscal: [''],  // validator appliqué dynamiquement
```

Dans `ngOnInit()`, après création du formulaire, écouter le pays pour activer/désactiver le validator :

```typescript
this.form.get('country')!.valueChanges.subscribe((country: string) => {
  const ctrl = this.form.get('matriculeFiscal')!
  if (country === 'Tunisie') {
    ctrl.setValidators(tunisianTaxId)
  } else {
    ctrl.clearValidators()
  }
  ctrl.updateValueAndValidity()
  // ... reste du code existant
})
// Déclencher une fois pour l'état initial
this.form.get('country')!.setValue(this.form.get('country')!.value, { emitEvent: true })
```

Dans le template HTML, après le champ matriculeFiscal (section Tunisie) :

```html
@if (f['matriculeFiscal'].hasError('invalidTaxId') && f['matriculeFiscal'].touched) {
  <p class="nc-field-error">
    <span class="material-symbols-outlined">error</span>
    Format attendu : 1234567A/P/000
  </p>
}
```

- [ ] **Step 5 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur

- [ ] **Step 6 : Commit**

```bash
git add src/app/features/clients/new-client/
git commit -m "fix(client-form): email optional, street optional, country half-width, matricule validation"
```

---

## Task 4 — Frontend : nouveaux champs (type, notes, catégorie, statut)

**Fichiers :**
- Modifier : `src/app/shared/models/client.model.ts`
- Modifier : `src/app/features/clients/new-client/new-client.component.ts`
- Modifier : `src/app/features/clients/new-client/new-client.component.html`

- [ ] **Step 1 : Mettre à jour client.model.ts**

Dans `CreateClientDto`, ajouter :

```typescript
export interface CreateClientDto {
  companyName: string
  legalForm: string
  clientType: string      // 'PROFESSIONNEL' | 'PARTICULIER'
  category: string
  notes: string
  rneNumber: string
  matriculeFiscal: string
  regimeFiscal: string
  assujettiTva: boolean
  website: string
  contacts: ClientContact[]
  billingAddress: ClientAddress
  financial: ClientFinancial
}

export interface Client extends CreateClientDto {
  id: string
  reference: string
  status: string
  createdAt: string
}
```

Ajouter constantes :

```typescript
export const CLIENT_TYPES = [
  { value: 'PROFESSIONNEL', label: 'Professionnel (B2B)' },
  { value: 'PARTICULIER',   label: 'Particulier (B2C)'  },
]

export const CLIENT_STATUSES = [
  { value: 'ACTIVE',    label: 'Actif'     },
  { value: 'INACTIVE',  label: 'Inactif'   },
  { value: 'SUSPENDU',  label: 'Suspendu'  },
]
```

- [ ] **Step 2 : Ajouter les contrôles dans le composant**

Dans `new-client.component.ts`, importer `CLIENT_TYPES`, `CLIENT_STATUSES` et ajouter :

```typescript
clientTypes   = CLIENT_TYPES
clientStatuses = CLIENT_STATUSES
```

Dans le groupe du formulaire, ajouter :

```typescript
clientType: ['PROFESSIONNEL'],
category:   [''],
notes:      [''],
status:     ['ACTIVE'],
```

Dans `patchValue` (mode édition) :

```typescript
clientType: client.clientType,
category:   client.category,
notes:      client.notes,
status:     client.status,
```

Dans `save()` DTO :

```typescript
clientType: v.clientType,
category:   v.category,
notes:      v.notes,
status:     v.status,
```

- [ ] **Step 3 : Ajouter les champs dans le template HTML**

**Section 01**, après le champ `legalForm` dans la grille 2 colonnes, ajouter une grille :

```html
<div class="nc-grid nc-grid--2">
  <div class="nc-field">
    <label class="nc-label" for="clientType">Type de client</label>
    <select id="clientType" class="nc-select" formControlName="clientType">
      @for (t of clientTypes; track t.value) {
        <option [value]="t.value">{{ t.label }}</option>
      }
    </select>
  </div>

  <div class="nc-field">
    <label class="nc-label" for="category">Catégorie</label>
    <input id="category" class="nc-input" type="text"
      placeholder="VIP, Grossiste, Standard…"
      formControlName="category" />
  </div>
</div>
```

**Statut** — visible uniquement en mode édition, à la fin de la section 01 :

```html
@if (editMode()) {
  <div class="nc-grid nc-grid--2">
    <div class="nc-field">
      <label class="nc-label" for="status">Statut</label>
      <select id="status" class="nc-select" formControlName="status">
        @for (s of clientStatuses; track s.value) {
          <option [value]="s.value">{{ s.label }}</option>
        }
      </select>
    </div>
    <div></div>
  </div>
}
```

**Notes** — nouvelle section 05 après les conditions commerciales :

```html
<!-- 05 — Notes internes -->
<section class="nc-section nc-anim-5">
  <div class="nc-section__head">
    <span class="nc-section__num">05</span>
    <div class="nc-section__icon-wrap">
      <span class="material-symbols-outlined">notes</span>
    </div>
    <div class="nc-section__meta">
      <h2 class="nc-section__title">Notes internes</h2>
      <p class="nc-section__desc">Remarques visibles uniquement par votre équipe</p>
    </div>
  </div>
  <div class="nc-section__body">
    <div class="nc-grid nc-grid--1">
      <div class="nc-field">
        <label class="nc-label" for="notes">Notes</label>
        <textarea id="notes" class="nc-textarea" rows="4"
          placeholder="Informations internes sur ce client…"
          formControlName="notes"></textarea>
      </div>
    </div>
  </div>
</section>
```

Mettre à jour le footer à `nc-anim-6`.

- [ ] **Step 4 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5 : Commit**

```bash
git add src/app/shared/models/client.model.ts \
        src/app/features/clients/new-client/
git commit -m "feat(client-form): add clientType, category, notes, editable status"
```

---

## Task 5 — Frontend : auto-devise par pays

**Fichiers :**
- Modifier : `src/app/shared/models/client.model.ts`
- Modifier : `src/app/features/clients/new-client/new-client.component.ts`

- [ ] **Step 1 : Ajouter COUNTRY_CURRENCY_MAP dans client.model.ts**

```typescript
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'Tunisie':         'TND',
  'Algérie':         'TND',
  'Maroc':           'TND',
  'Libye':           'TND',
  'France':          'EUR',
  'Allemagne':       'EUR',
  'Italie':          'EUR',
  'Espagne':         'EUR',
  'Royaume-Uni':     'GBP',
  'États-Unis':      'USD',
  'Émirats arabes':  'USD',
  'Arabie Saoudite': 'USD',
  'Autre':           'TND',
}
```

- [ ] **Step 2 : Utiliser la map dans le valueChanges du pays**

Dans `new-client.component.ts`, importer `COUNTRY_CURRENCY_MAP` et mettre à jour le subscriber :

```typescript
this.form.get('country')!.valueChanges.subscribe((country: string) => {
  this.selectedCountry.set(country)

  // Auto-devise
  const suggestedCurrency = COUNTRY_CURRENCY_MAP[country] ?? 'TND'
  this.form.patchValue({ currency: suggestedCurrency }, { emitEvent: false })

  // TVA par défaut
  if (country !== 'Tunisie') {
    this.form.patchValue({ defaultVatRate: 0, regimeFiscal: '' }, { emitEvent: false })
  } else {
    this.form.patchValue({ defaultVatRate: 19 }, { emitEvent: false })
  }

  // Validators matricule
  const ctrl = this.form.get('matriculeFiscal')!
  if (country === 'Tunisie') {
    ctrl.setValidators(tunisianTaxId)
  } else {
    ctrl.clearValidators()
  }
  ctrl.updateValueAndValidity()
})
```

- [ ] **Step 3 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4 : Commit**

```bash
git add src/app/shared/models/client.model.ts \
        src/app/features/clients/new-client/new-client.component.ts
git commit -m "feat(client-form): auto-suggest currency when country changes"
```

---

## Task 6 — Frontend : contacts multiples (FormArray)

**Fichiers :**
- Modifier : `src/app/shared/models/client.model.ts`
- Modifier : `src/app/features/clients/new-client/new-client.component.ts`
- Modifier : `src/app/features/clients/new-client/new-client.component.html`
- Modifier : `src/app/features/clients/new-client/new-client.component.scss`

- [ ] **Step 1 : Mettre à jour ClientContact dans client.model.ts**

```typescript
export interface ClientContact {
  fullName: string
  role: string
  email: string
  phone: string
  isPrimary: boolean
}
```

- [ ] **Step 2 : Mettre à jour le composant pour FormArray**

Dans `new-client.component.ts`, ajouter l'import `FormArray` et remplacer les champs contact par :

```typescript
import { ..., FormArray, FormControl } from '@angular/forms'
```

Supprimer du groupe de formulaire :
```typescript
// SUPPRIMER :
fullName:    ['', Validators.required],
contactRole: [''],
email:       ['', Validators.email],
phone:       ['', optionalPhone],
```

Ajouter dans le groupe :
```typescript
contacts: this.fb.array([this.newContactGroup(true)])
```

Ajouter la méthode helper :
```typescript
get contactsArray(): FormArray {
  return this.form.get('contacts') as FormArray
}

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
  this.contactsArray.removeAt(index)
  // Si on supprime le primary, le premier devient primary
  if (this.contactsArray.at(0).get('isPrimary')?.value === false) {
    const hadPrimary = this.contactsArray.controls.some(c => c.get('isPrimary')?.value)
    if (!hadPrimary) {
      this.contactsArray.at(0).get('isPrimary')?.setValue(true)
    }
  }
}

setPrimary(index: number): void {
  this.contactsArray.controls.forEach((ctrl, i) => {
    ctrl.get('isPrimary')?.setValue(i === index)
  })
}
```

Mettre à jour `patchValue` en mode édition :
```typescript
// Remplacer le patchValue contact par :
if (client.contacts?.length) {
  this.contactsArray.clear()
  client.contacts.forEach((c, i) => {
    const g = this.newContactGroup(c.isPrimary)
    g.patchValue({ fullName: c.fullName, role: c.role, email: c.email, phone: c.phone })
    this.contactsArray.push(g)
  })
}
```

Mettre à jour `save()` DTO :
```typescript
// Remplacer contact: {...} par :
contacts: this.contactsArray.getRawValue().map((c: any) => ({
  fullName:  c.fullName,
  role:      c.role,
  email:     c.email,
  phone:     c.phone,
  isPrimary: c.isPrimary,
})),
```

- [ ] **Step 3 : Mettre à jour le template HTML — section 02**

Remplacer entièrement la section 02 :

```html
<!-- 02 — Contacts -->
<section class="nc-section nc-anim-2">
  <div class="nc-section__head">
    <span class="nc-section__num">02</span>
    <div class="nc-section__icon-wrap">
      <span class="material-symbols-outlined">people</span>
    </div>
    <div class="nc-section__meta">
      <h2 class="nc-section__title">Contacts</h2>
      <p class="nc-section__desc">Interlocuteurs pour les factures et relances</p>
    </div>
  </div>
  <div class="nc-section__body" formArrayName="contacts">

    @for (contact of contactsArray.controls; track $index) {
      <div class="nc-contact-card" [formGroupName]="$index">
        <div class="nc-contact-card__head">
          <span class="nc-contact-card__num">Contact {{ $index + 1 }}</span>
          <div class="nc-contact-card__actions">
            @if (!contact.get('isPrimary')?.value) {
              <button type="button" class="nc-btn-link" (click)="setPrimary($index)">
                <span class="material-symbols-outlined">star</span>
                Définir principal
              </button>
            } @else {
              <span class="nc-badge-primary">
                <span class="material-symbols-outlined">star</span>
                Principal
              </span>
            }
            @if (contactsArray.length > 1) {
              <button type="button" class="nc-btn-link nc-btn-link--danger" (click)="removeContact($index)">
                <span class="material-symbols-outlined">delete</span>
              </button>
            }
          </div>
        </div>

        <div class="nc-grid nc-grid--2">
          <div class="nc-field">
            <label class="nc-label">Nom complet <span class="nc-required">*</span></label>
            <input class="nc-input" type="text" placeholder="Ahmed Ben Ali"
              formControlName="fullName"
              [class.nc-input--error]="contact.get('fullName')?.invalid && contact.get('fullName')?.touched" />
            @if (contact.get('fullName')?.invalid && contact.get('fullName')?.touched) {
              <p class="nc-field-error">
                <span class="material-symbols-outlined">error</span>
                Le nom est requis.
              </p>
            }
          </div>
          <div class="nc-field">
            <label class="nc-label">Fonction</label>
            <input class="nc-input" type="text" placeholder="Directeur financier…"
              formControlName="role" />
          </div>
        </div>

        <div class="nc-grid nc-grid--2">
          <div class="nc-field">
            <label class="nc-label">Email</label>
            <input class="nc-input" type="email" placeholder="contact@societe.tn"
              formControlName="email"
              [class.nc-input--error]="contact.get('email')?.invalid && contact.get('email')?.touched" />
            @if (contact.get('email')?.hasError('email') && contact.get('email')?.touched) {
              <p class="nc-field-error">
                <span class="material-symbols-outlined">error</span>
                Email invalide.
              </p>
            }
          </div>
          <div class="nc-field">
            <label class="nc-label">Téléphone</label>
            <input class="nc-input" type="tel" placeholder="+216 XX XXX XXX"
              formControlName="phone"
              [class.nc-input--error]="contact.get('phone')?.invalid && contact.get('phone')?.touched" />
            @if (contact.get('phone')?.hasError('invalidPhone') && contact.get('phone')?.touched) {
              <p class="nc-field-error">
                <span class="material-symbols-outlined">error</span>
                Numéro invalide.
              </p>
            }
          </div>
        </div>
      </div>
    }

    <button type="button" class="nc-btn-add-contact" (click)="addContact()">
      <span class="material-symbols-outlined">add</span>
      Ajouter un contact
    </button>

  </div>
</section>
```

- [ ] **Step 4 : Ajouter les styles dans le SCSS**

```scss
/* =====================================================
   CONTACT CARDS (FormArray)
   ===================================================== */
.nc-contact-card {
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
  background: #fff;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__num {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-on-surface-variant);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.nc-badge-primary {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(0, 30, 64, 0.07);
  padding: 4px 10px;
  border-radius: 20px;

  .material-symbols-outlined { font-size: 14px; }
}

.nc-btn-link {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-on-surface-variant);
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;

  &:hover { background: rgba(0,0,0,0.04); }
  &--danger { color: #d32f2f; }
  .material-symbols-outlined { font-size: 16px; }
}

.nc-btn-add-contact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  background: none;
  border: 1.5px dashed var(--color-primary);
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: background 0.15s;

  &:hover { background: rgba(0, 30, 64, 0.04); }
  .material-symbols-outlined { font-size: 18px; }
}
```

- [ ] **Step 5 : Vérification TypeScript**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur

- [ ] **Step 6 : Build backend final**

```bash
mvn clean package -DskipTests -q
```

- [ ] **Step 7 : Commit final**

```bash
git add src/app/shared/models/client.model.ts \
        src/app/features/clients/new-client/
git commit -m "feat(client-form): multiple contacts with FormArray, primary contact selection"
```

---

## Vérification end-to-end

- [ ] Démarrer le backend : `mvn spring-boot:run`
- [ ] Démarrer le frontend : `npm start`
- [ ] Ouvrir http://localhost:4200/client/create
- [ ] Vérifier :
  - Pays = Tunisie → RNE, Matricule fiscal, Régime fiscal visibles
  - Changer pays = France → champs TN masqués, devise auto → EUR
  - Taper `AZERTY` dans matricule fiscal → erreur de validation
  - Taper `1234567A/P/000` → valid
  - Ajouter 2 contacts → les 2 s'affichent
  - Définir contact 2 comme principal → étoile se déplace
  - Supprimer contact → le premier redevient principal
  - Remplir section Notes → texte sauvegardé
  - Sélectionner Type = Particulier → sauvegardé
  - En mode édition → dropdown Statut visible, peut passer à Inactif
