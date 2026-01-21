// Mock for firebase/auth
export const getAuth = jest.fn(() => ({}));
export const signInWithPhoneNumber = jest.fn();
export const RecaptchaVerifier = jest.fn().mockImplementation(() => ({}));
export const signInWithEmailAndPassword = jest.fn();
export const createUserWithEmailAndPassword = jest.fn();
export const signOut = jest.fn();
export const onAuthStateChanged = jest.fn();
