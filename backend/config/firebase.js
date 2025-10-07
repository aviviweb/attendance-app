// קובץ הגדרות Firebase Admin
const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

let firebaseApp = null;

const initializeFirebase = () => {
  try {
    if (firebaseApp) {
      return firebaseApp;
    }

    // בדיקה אם יש קובץ service account
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json';
    
    let serviceAccount;
    try {
      serviceAccount = require(serviceAccountPath);
    } catch (error) {
      logger.error('לא ניתן לטעון קובץ service account:', error.message);
      throw new Error('קובץ Firebase service account לא נמצא');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    logger.info('Firebase Admin אותחל בהצלחה');
    return firebaseApp;
  } catch (error) {
    logger.error('שגיאה באתחול Firebase:', error);
    throw error;
  }
};

const getFirestore = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
};

const getAuth = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
};

const getStorage = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.storage();
};

// פונקציות עזר לאימות
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('שגיאה באימות token:', error);
    throw new Error('Token לא תקין');
  }
};

const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    logger.error('שגיאה ביצירת custom token:', error);
    throw new Error('לא ניתן ליצור token');
  }
};

// פונקציות עזר ל-Firestore
const addDocument = async (collection, data) => {
  try {
    const db = getFirestore();
    const docRef = await db.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    logger.error('שגיאה בהוספת מסמך:', error);
    throw error;
  }
};

const updateDocument = async (collection, docId, data) => {
  try {
    const db = getFirestore();
    await db.collection(collection).doc(docId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    logger.error('שגיאה בעדכון מסמך:', error);
    throw error;
  }
};

const getDocument = async (collection, docId) => {
  try {
    const db = getFirestore();
    const doc = await db.collection(collection).doc(docId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logger.error('שגיאה בקבלת מסמך:', error);
    throw error;
  }
};

const getCollection = async (collection, whereClauses = []) => {
  try {
    const db = getFirestore();
    let query = db.collection(collection);
    
    // הוספת תנאי where
    whereClauses.forEach(clause => {
      query = query.where(clause.field, clause.operator, clause.value);
    });
    
    const snapshot = await query.get();
    const documents = [];
    
    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    return documents;
  } catch (error) {
    logger.error('שגיאה בקבלת אוסף:', error);
    throw error;
  }
};

const deleteDocument = async (collection, docId) => {
  try {
    const db = getFirestore();
    await db.collection(collection).doc(docId).delete();
  } catch (error) {
    logger.error('שגיאה במחיקת מסמך:', error);
    throw error;
  }
};

// פונקציות עזר לניהול משתמשים
const createUser = async (userData) => {
  try {
    const auth = getAuth();
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      disabled: false
    });

    // הוספת נתונים נוספים ל-Firestore
    await addDocument('users', {
      uid: userRecord.uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role || 'employee',
      department: userData.department,
      firstName: userData.firstName,
      lastName: userData.lastName,
      idNumber: userData.idNumber,
      birthDate: userData.birthDate,
      phone: userData.phone,
      address: userData.address,
      emergencyPhone: userData.emergencyPhone,
      position: userData.position,
      startDate: userData.startDate,
      employeeType: userData.employeeType,
      workPermitExpiry: userData.workPermitExpiry,
      workPermitNumber: userData.workPermitNumber,
      visaExpiry: userData.visaExpiry,
      visaNumber: userData.visaNumber,
      photo: userData.photo,
      documents: userData.documents || [],
      registrationToken: userData.registrationToken,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return userRecord;
  } catch (error) {
    logger.error('שגיאה ביצירת משתמש:', error);
    throw error;
  }
};

const updateUser = async (uid, userData) => {
  try {
    const auth = getAuth();
    await auth.updateUser(uid, userData);
    
    // עדכון נתונים ב-Firestore
    await updateDocument('users', uid, userData);
  } catch (error) {
    logger.error('שגיאה בעדכון משתמש:', error);
    throw error;
  }
};

const deleteUser = async (uid) => {
  try {
    const auth = getAuth();
    await auth.deleteUser(uid);
    
    // מחיקת נתונים מ-Firestore
    await deleteDocument('users', uid);
  } catch (error) {
    logger.error('שגיאה במחיקת משתמש:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  getStorage,
  verifyIdToken,
  createCustomToken,
  addDocument,
  updateDocument,
  getDocument,
  getCollection,
  deleteDocument,
  createUser,
  updateUser,
  deleteUser
};
