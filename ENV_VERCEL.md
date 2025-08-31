# Variables d'environnement Vercel

## Variables Firebase (obligatoires)

Ces variables doivent être configurées dans Vercel → Settings → Environment Variables :

### Frontend (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_FB_API_KEY=your_api_key_here
NEXT_PUBLIC_FB_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FB_PROJECT_ID=your_project_id
NEXT_PUBLIC_FB_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FB_MSG_SENDER_ID=123456789
NEXT_PUBLIC_FB_APP_ID=1:123456789:web:abcdef123456
```

### Backend (optionnel pour Admin SDK)
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
ADMIN_SEED_SECRET=your_secret_for_admin_endpoints
```

## Où trouver ces valeurs

### Firebase Console → Project Settings → General

1. **API Key** : Web API Key
2. **Auth Domain** : `your_project.firebaseapp.com`
3. **Project ID** : Project ID
4. **Storage Bucket** : `your_project.appspot.com`
5. **Messaging Sender ID** : Sender ID
6. **App ID** : App ID (dans la section "Your apps")

### Firebase Console → Project Settings → Service Accounts

Pour les variables Admin SDK (si nécessaire) :
1. **Project ID** : Même que ci-dessus
2. **Client Email** : Email du service account
3. **Private Key** : Clé privée (attention aux \n)

## Configuration Vercel

1. Aller dans Vercel Dashboard → Votre projet → Settings → Environment Variables
2. Ajouter chaque variable une par une
3. Sélectionner les environnements : Production, Preview, Development
4. Redéployer après ajout des variables

## Vérification

Après configuration, vérifiez que :
- ✅ `process.env.NEXT_PUBLIC_FB_PROJECT_ID` est défini
- ✅ Firebase Auth fonctionne
- ✅ Firestore se connecte correctement
- ✅ Les règles de sécurité sont appliquées

## Sécurité

- ⚠️ Les variables `NEXT_PUBLIC_*` sont visibles côté client
- 🔒 Les variables sans `NEXT_PUBLIC_` restent côté serveur
- 🔑 Utilisez les règles Firestore pour la sécurité, pas l'obscurité des clés

---

**📝 Note**: Les variables Admin SDK ne sont nécessaires que si vous implémentez des endpoints serveur pour la gestion des utilisateurs.