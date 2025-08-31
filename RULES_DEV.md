# Règles Firestore - Développement

**⚠️ ATTENTION: Ces règles sont OUVERTES et ne doivent être utilisées qu'en développement !**

## Règles actuelles (Firebase Console)

Copiez ces règles exactement dans Firebase Console → Firestore Database → Rules :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles ouvertes pour développement - À CHANGER EN PRODUCTION
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Collections concernées

- `judges` - Documents des utilisateurs (admin + juges)
- `hourly_entries` - Données de prises horaires
- `big_catches` - Données de grosse prise
- `competitors` - Compétiteurs
- `competitionSettings` - Paramètres de compétition
- `publicAppearanceSettings` - Apparence publique

## Statut actuel

- ✅ Règles ouvertes pour développement
- ⚠️ **À CHANGER** : Passer aux règles PROD après avoir attaché les UIDs
- 🔧 Utiliser `/admin/tools/seed-judges` pour initialiser la collection judges

## Prochaines étapes

1. Créer les comptes Firebase Auth (7 comptes)
2. Utiliser l'outil de seed pour créer les documents judges
3. Attacher les UIDs Firebase Auth
4. **Passer aux règles PROD** (voir RULES_PROD.md)

---

**🚨 RAPPEL: Ne jamais utiliser ces règles en production !**