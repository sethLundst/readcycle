import axios from "axios";
import { initializeApp } from "firebase/app";
import React, { useContext } from "react";
import { UserContext } from "../contexts/User";
import {
  FieldValue,
  getDoc,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import { getDistance, convertDistance } from "geolib";
const timestamp = require("time-stamp");
import {
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  doc,
  arrayUnion,
  updateDoc,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAmmM3CBTdIeuOY7KEXouW-SFAHeyA_Ums",
  authDomain: "readcycle-642e1.firebaseapp.com",
  databaseURL: "https://readcycle-642e1-default-rtdb.firebaseio.com",
  projectId: "readcycle-642e1",
  storageBucket: "readcycle-642e1.appspot.com",
  messagingSenderId: "465923556747",
  appId: "1:465923556747:web:0238a1c3993ad960935b8e",
};
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const checkEmailIsAvailable = async (email) => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const qsnap = await getDocs(q);

  return qsnap.empty;
};

export const checkEmailIsOnSystem = async (email) => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const qsnap = await getDocs(q);

  return !qsnap.empty;
};

export const checkUsername = async (username) => {
  const q = query(collection(db, "users"), where("username", "==", username));
  const qsnap = await getDocs(q);

  return qsnap.empty;
};

const api = axios.create({
  baseURL: "https://api.postcodes.io",
});

export async function convertPostcode(postcode) {
  try {
    const response = await api.get(`/postcodes/${postcode}/`);
    console.log(response.data.european_electoral_region);
    const result = {
      longitude: response.data.result.longitude,
      latitude: response.data.result.latitude,
      region: response.data.result.european_electoral_region,
    };
    return result;
  } catch (err) {
    console.log(err);
  }
}

export async function getPostcodeDetails(postcode) {
  try {
    const response = await api.get(`/postcodes/${postcode}/`);
    return response;
  } catch (err) {
    console.log(err);
  }
}

export const handleSignUp = async ({
  email,
  password,
  username,
  postcode,
  city,
}) => {
  let newUser = {};

  try {
    await setPersistence(auth, browserLocalPersistence);

    const { longitude, latitude, region } = await convertPostcode(
      postcode
    ).catch();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    newUser = {
      uid: userCredential.user.uid,
      email: email,
      username: username,
      avatar_url:
        "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/271deea8-e28c-41a3-aaf5-2913f5f48be6/de7834s-6515bd40-8b2c-4dc6-a843-5ac1a95a8b55.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzI3MWRlZWE4LWUyOGMtNDFhMy1hYWY1LTI5MTNmNWY0OGJlNlwvZGU3ODM0cy02NTE1YmQ0MC04YjJjLTRkYzYtYTg0My01YWMxYTk1YThiNTUuanBnIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.BopkDn1ptIwbmcKHdAOlYHyAOOACXW0Zfgbs0-6BY-E", //placeholder?
      books: [],
      chats: [],
      lent: 0,
      coordinates: { latitude: latitude, longitude: longitude },
      region: region,
      city: city,
    };

    await setDoc(doc(db, "users", userCredential.user.uid), newUser);
    console.log("done");
    return newUser.uid;
  } catch (err) {
    console.log(err);
  }
};

export const handleLogin = async (password, email) => {
  return signInWithEmailAndPassword(auth, email, password).then(
    (userCredential) => {
      return userCredential.user.uid;
    }
  );
};

export const sendBook = async (bookObject, user) => {
  const docRef = doc(db, "users", user);
  await updateDoc(docRef, {
    books: arrayUnion(bookObject),
  });
};

export const getUsersByLocation = async (region) => {
  const q = query(collection(db, "users"), where("location", "==", region));
};

export const getUserDetails = async (uid) => {
  const docRef = doc(db, "users", `${uid}`);
  const docSnap = await getDoc(docRef);
  return docSnap.data();
};

export const deleteBook = async (book, uid) => {
  const docRef = doc(db, "users", `${uid}`);
  await updateDoc(docRef, { books: arrayRemove(book) });
  console.log("deleted?");
};

export const createChat = async (members, book) => {
  const chatKey = `${members[0]}${members[1]}${book.id}`;
  const q = query(
    collection(db, "users"),
    where("chats", "array-contains", chatKey)
  );
  const qsnap = await getDocs(q);

  if (qsnap.empty) {
    const docRef = doc(db, "users", members[0]);
    await updateDoc(docRef, { chats: arrayUnion(chatKey) });
    await setDoc(doc(db, "chats", chatKey), {
      members: members,
      book: book.title,
      book_id: book.id,
      picture: book.highResImage,
      messages: [],
      id: chatKey,
    });
  }
  return chatKey;
};

export const getAllUsers = async () => {
  let result = [];

  const querySnapshot = await getDocs(collection(db, "users"));
  querySnapshot.forEach((doc) => {
    result.push(doc.data());
  });

  return result;
};

export const uploadProfilePic = async (uri) => {
  try {
    const uploadUri = Platform.OS === "ios" ? uri.replace("file://", "") : uri;
    const storage = getStorage();
    console.log(uploadUri);
    const picRef = ref(storage, "profilepic.jpg");
    const img = await fetch(uploadUri);
    const bytes = await img.blob();

    await uploadBytes(picRef, bytes);

    const profilePicture = await getDownloadURL(picRef);

    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      avatar_url: profilePicture,
    });
  } catch (err) {
    console.log(err);
  }

  return { message: "Successful" };
};

export const getChat = async (chatID) => {
  const docRef = doc(db, "chats", `${chatID}`);
  const docSnap = await getDoc(docRef);
  return docSnap.data();
};

export const addMessage = async (chatID, username, data) => {
  const messageObject = {
    username: username,
    message: data,
    postedAt: timestamp("DD/MM/YYYY:HH:mm:ss:ms"),
  };
  const docRef = doc(db, "chats", `${chatID}`);
  await updateDoc(docRef, {
    messages: arrayUnion(messageObject),
  });
};

export const getChats = async (uid) => {
  const q = query(
    collection(db, "chats"),
    where("members", "array-contains", `${uid}`)
  );
  const qsnap = await getDocs(q);
  const chats = [];
  qsnap.forEach((chat) => chats.push(chat.data()));

  return chats;
};

export const updateLocation = async (uid, location, city) => {
  console.log(uid, location, city);
  try {
    await updateDoc(doc(db, "users", uid), {
      city: city,
      region: location.region,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
    });
  } catch (err) {
    console.log(err, "<<<");
  }
  return { message: "Successful" };
};

// export const getChats = async (uid) => {
// 	const q = query(
//     		collection(db, "chats"),
//     		where("members", "array-contains", `${uid}`)
//     	);
//       let res = []
// 	const unsubscribe = await onSnapshot(q, (querySnapshot) => {
// 		const chats = [];
// 		querySnapshot.forEach((doc) => {
// 			res.push(doc.data());
// 		});

// 	});
//  console.log(res);
//   return res
// };
