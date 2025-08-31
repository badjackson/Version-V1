Copy these exact rules to Firebase Console (without any markdown formatting):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /hourly_entries/{document} {
      allow read, write: if true;
    }
    
    match /big_catches/{document} {
      allow read, write: if true;
    }
    
    match /competitors/{document} {
      allow read, write: if true;
    }
    
    match /judges/{document} {
      allow read, write: if true;
    }
    
    match /users/{document} {
      allow read, write: if true;
    }
    
    match /competitionSettings/{document} {
      allow read, write: if true;
    }
  }
}