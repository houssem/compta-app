# Auth API — Documentation

Base URL : `http://localhost:8080/api/auth`

---

## 1. Register — Inscription

Crée une société, son administrateur, et optionnellement ses coordonnées bancaires.

```
POST /api/auth/register
Content-Type: multipart/form-data
Auth required: Non
```

### Champs de la requête

#### Utilisateur (obligatoires)

| Champ       | Type   | Obligatoire | Contraintes         | Exemple          |
|-------------|--------|-------------|---------------------|------------------|
| `firstName` | String | Oui         | Non vide            | `Houssem`        |
| `lastName`  | String | Oui         | Non vide            | `Ben Ali`        |
| `email`     | String | Oui         | Format email valide | `houssem@masociete.fr` |
| `password`  | String | Oui         | Minimum 8 caractères| `password123`    |

#### Société (obligatoires)

| Champ         | Type   | Obligatoire | Contraintes    | Exemple             |
|---------------|--------|-------------|----------------|---------------------|
| `companyName` | String | Oui         | Non vide       | `Ma Société SARL`   |

#### Société (optionnels)

| Champ          | Type   | Obligatoire | Contraintes     | Exemple               |
|----------------|--------|-------------|-----------------|------------------------|
| `siret`        | String | Non         | Max 14 car.     | `12345678901234`       |
| `vatNumber`    | String | Non         | Max 50 car.     | `FR12345678901`        |
| `sector`       | String | Non         | -               | `Informatique`         |
| `streetNumber` | String | Non         | -               | `12`                   |
| `streetName`   | String | Non         | -               | `Rue de la Paix`       |
| `complement`   | String | Non         | -               | `Bât. B`               |
| `district`     | String | Non         | -               | `Ile-de-France`        |
| `city`         | String | Non         | -               | `Paris`                |
| `postalCode`   | String | Non         | -               | `75001`                |
| `country`      | String | Non         | Défaut: France  | `France`               |
| `phone`        | String | Non         | Max 50 car.     | `+33612345678`         |
| `logo`         | File   | Non         | PNG/JPEG/WebP/GIF | *(fichier image)*    |

#### Coordonnées bancaires

> Si `iban` est fourni, alors `accountHolder` et `bankName` deviennent **obligatoires**.

| Champ           | Type   | Obligatoire       | Contraintes | Exemple                       |
|-----------------|--------|-------------------|-------------|-------------------------------|
| `iban`          | String | Non               | Max 34 car. | `FR7630006000011234567890189` |
| `accountHolder` | String | Si IBAN fourni    | Non vide    | `Ma Société SARL`             |
| `bankName`      | String | Si IBAN fourni    | Non vide    | `BNP Paribas`                 |
| `swiftBic`      | String | Non               | Max 11 car. | `BNPAFRPP`                    |

### Exemple curl — minimal

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -F "firstName=Houssem" \
  -F "lastName=Ben Ali" \
  -F "email=houssem@masociete.fr" \
  -F "password=password123" \
  -F "companyName=Ma Société SARL"
```

### Exemple curl — complet

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -F "firstName=Houssem" \
  -F "lastName=Ben Ali" \
  -F "email=houssem@masociete.fr" \
  -F "password=password123" \
  -F "companyName=Ma Société SARL" \
  -F "siret=12345678901234" \
  -F "vatNumber=FR12345678901" \
  -F "sector=Informatique" \
  -F "streetNumber=12" \
  -F "streetName=Rue de la Paix" \
  -F "city=Paris" \
  -F "postalCode=75001" \
  -F "country=France" \
  -F "phone=+33612345678" \
  -F "accountHolder=Ma Société SARL" \
  -F "bankName=BNP Paribas" \
  -F "iban=FR7630006000011234567890189" \
  -F "swiftBic=BNPAFRPP" \
  -F "logo=@/chemin/vers/logo.png"
```

### Réponse — 201 Created

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "houssem@masociete.fr",
    "firstName": "Houssem",
    "lastName": "Ben Ali",
    "role": "ADMIN",
    "companyId": "e5f6g7h8-...",
    "companyName": "Ma Société SARL"
  }
}
```

### Erreurs possibles

| Code | Cas                                         |
|------|---------------------------------------------|
| 400  | Champ obligatoire manquant ou invalide      |
| 400  | IBAN fourni sans accountHolder ou bankName  |
| 400  | Format image non supporté                   |
| 409  | Email déjà utilisé                          |

---

## 2. Login — Connexion

```
POST /api/auth/login
Content-Type: application/json
Auth required: Non
```

### Champs de la requête

| Champ      | Type   | Obligatoire | Contraintes         | Exemple                  |
|------------|--------|-------------|---------------------|--------------------------|
| `email`    | String | Oui         | Format email valide | `houssem@masociete.fr`   |
| `password` | String | Oui         | Non vide            | `password123`            |

### Exemple curl

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "houssem@masociete.fr",
    "password": "password123"
  }'
```

### Réponse — 200 OK

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "houssem@masociete.fr",
    "firstName": "Houssem",
    "lastName": "Ben Ali",
    "role": "ADMIN",
    "companyId": "e5f6g7h8-...",
    "companyName": "Ma Société SARL"
  }
}
```

### Erreurs possibles

| Code | Cas                                              |
|------|--------------------------------------------------|
| 400  | Champ obligatoire manquant                       |
| 401  | Email introuvable, mot de passe incorrect, ou compte désactivé |

---

## 3. Refresh — Renouveler l'access token

```
POST /api/auth/refresh
Content-Type: application/json
Auth required: Non
```

### Champs de la requête

| Champ          | Type   | Obligatoire | Exemple                                    |
|----------------|--------|-------------|--------------------------------------------|
| `refreshToken` | String | Oui         | `550e8400-e29b-41d4-a716-446655440000`     |

### Exemple curl

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Réponse — 200 OK

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Erreurs possibles

| Code | Cas                              |
|------|----------------------------------|
| 401  | Token invalide, révoqué ou expiré |
| 401  | Compte utilisateur désactivé     |

---

## 4. Logout — Déconnexion

```
POST /api/auth/logout
Auth required: Oui (Bearer token)
```

### Header requis

```
Authorization: Bearer <accessToken>
```

### Exemple curl

```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

### Réponse — 204 No Content

*(corps vide)*

### Erreurs possibles

| Code | Cas                        |
|------|----------------------------|
| 401  | Token absent ou invalide   |

---

## Structure du JWT (Access Token)

L'access token est un JWT signé HS256. Il contient :

| Claim       | Description                    |
|-------------|--------------------------------|
| `sub`       | ID de l'utilisateur (UUID)     |
| `companyId` | ID de la société (UUID)        |
| `role`      | Rôle (`ADMIN`)                 |
| `iat`       | Date d'émission                |
| `exp`       | Expiration : **15 minutes**    |
| `jti`       | ID unique du token             |

Le refresh token est un UUID simple stocké en base, valide **7 jours**.
À chaque login ou register, tous les anciens refresh tokens sont révoqués — une seule session active par utilisateur.
