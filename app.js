import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtXcwv1HMzzqtrB9q0K4tD-jkruHBTOsU",
  authDomain: "tibabasolomon-3295a.firebaseapp.com",
  projectId: "tibabasolomon-3295a",
  storageBucket: "tibabasolomon-3295a.firebasestorage.app",
  messagingSenderId: "451451563124",
  appId: "1:451451563124:web:d8d3979be9ee6c384bb521",
  measurementId: "G-D9TZFHX6J0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);const db = getFirestore(app);

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");
const authMessage = document.getElementById("authMessage");

function showMessage(message) {
  if (authMessage) {
    authMessage.textContent = message;
  }
}


if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showMessage("ምዝገባው ተሳክቷል። እንኳን ደስ አለዎት!");
      registerForm.reset();
    } catch (error) {
      showMessage("ምዝገባ አልተሳካም። ኢሜይልና የይለፍ ቃል ያረጋግጡ።");
      console.error(error);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("በተሳካ ሁኔታ ገብተዋል።");
      loginForm.reset();
    } catch (error) {
      showMessage("መግባት አልተሳካም። መረጃዎን ያረጋግጡ።");
      console.error(error);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showMessage("ከመለያዎ ወጥተዋል።");
    } catch (error) {
      showMessage("መውጣት አልተሳካም።");
      console.error(error);
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (logoutBtn) logoutBtn.hidden = !user;
  if (registerForm) registerForm.hidden = !!user;
  if (loginForm) loginForm.hidden = !!user;

  const adminPanel = document.getElementById("adminPanel");

  const isAdminUser = user &&
    user.uid === "vMQkrT7FxkNvCFxwr5ZDFhlxN052";

  if (adminPanel) {
    adminPanel.hidden = !isAdminUser;
  }

  if (user) {
    showMessage("በመለያዎ ገብተዋል።");
  }
});

// የቋንቋ መቀየሪያ
const langBtn = document.getElementById("langBtn");
let lang = "am";

if (langBtn) {
  langBtn.addEventListener("click", () => {
    lang = lang === "am" ? "en" : "am";
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-am]").forEach((el) => {
      el.textContent = el.dataset[lang];
    });

    langBtn.textContent = lang === "am" ? "English" : "አማርኛ";
});
}

// PWA Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  });
}
