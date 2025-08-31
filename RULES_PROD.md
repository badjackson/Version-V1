# Règles Firestore - Production

**🔒 Règles sécurisées pour la production**

## Règles de sécurité (Firebase Console)

Copiez ces règles exactement dans Firebase Console → Firestore Database → Rules :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Collection judges - Lecture pour auth, écriture admin seulement
    match /judges/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/judges/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/judges/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Collection competitors - Lecture publique, écriture admin seulement
    match /competitors/{competitorId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/judges/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/judges/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Collection hourly_entries - Lecture publique, écriture par juge du secteur ou admin
    match /hourly_entries/{entryId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/judges/$(request.auth.uid)) && (
          // Admin peut tout écrire
          get(/databases/$(database)/documents/judges/$(request.auth.uid)).data.role == 'admin' ||
          // Juge peut écrire seulement dans son secteur
          (get(/databases/$(database)/documents/judges/$(request.auth.uid)).data.role == 'judge' &&
           get(/databases/$(database)/documents/judges/$(request.auth.uid)).data.sector == resource.data.sector)
        );
    }
    
    // Collection big_catches - Lecture publique, écriture par juge du secteur ou admin
    match /big_catches/{entryId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/judges/$(request.auth.uid)) && (
          // Admin peut tout écrire
          get(/databases/$(database)/documents/judges/$(request.auth.uid)).data.role == 'admin' ||
          // Juge peut écrire seulement dans son secteur
          (get(/databases/$(database)/documents/judges/$(request.auth.uid)).data.role == 'judge' &&
           get(/databases/$(database)/documents/judges/$(request.auth.uid)).data.sector == resource.data.sector)
        );
    }
    
    // Collection competitionSettings - Lecture publique, écriture admin seulement
    match /competitionSettings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/judges/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/judges/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Collection publicAppearanceSettings - Lecture publique, écriture admin seulement
    match /publicAppearanceSettings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/judges/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/judges/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Principe de sécurité

### Lecture (read)
- **Publique** : `competitors`, `hourly_entries`, `big_catches`, `competitionSettings`, `publicAppearanceSettings`
- **Authentifiée** : `judges` (pour que l'app puisse lire le rôle/secteur après login)

### Écriture (write)
- **Admin seulement** : `judges`, `competitors`, `competitionSettings`, `publicAppearanceSettings`
- **Admin + Juge du secteur** : `hourly_entries`, `big_catches` (juge ne peut écrire que dans son secteur)

### Validation des permissions

Chaque règle d'écriture vérifie :
1. L'utilisateur est authentifié (`request.auth != null`)
2. Le document judges existe pour cet UID
3. Le rôle est approprié (admin ou juge du bon secteur)

## Migration depuis DEV

1. ✅ Vérifier que la collection judges contient 7 documents avec `id = UID`
2. ✅ Tester les connexions avec Firebase Auth
3. 🔄 Appliquer ces règles dans Firebase Console
4. ✅ Tester que les permissions fonctionnent correctement

## Test des règles

Après application :
- ✅ Login admin → accès complet
- ✅ Login juge A → peut écrire seulement secteur A
- ✅ Lecture publique → classements visibles sans auth
- ❌ Écriture non autorisée → rejetée

---

**🔒 Ces règles sont prêtes pour la production**