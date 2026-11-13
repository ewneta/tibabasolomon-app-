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
      showMessage("Login error: " + error.code);
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
    user.uid === "YplGuZ4wQxO1otM0wuJjf8gBy9a2";

  if (adminPanel) {
    adminPanel.hidden = !isAdminUser;
  }

  if (user) {
   loadLessons(); showMessage("በመለያዎ ገብተዋል።");
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
// Admin: Add lessons to Firestore
const lessonForm = document.getElementById("lessonForm");
const adminMessage = document.getElementById("adminMessage");
const adminLessons = document.getElementById("adminLessons");

if (lessonForm) {
  lessonForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      await addDoc(collection(db, "lessons"), {
        titleAm: document.getElementById("lessonTitleAm").value.trim(),
        titleEn: document.getElementById("lessonTitleEn").value.trim(),
        descriptionAm: document.getElementById("lessonDescriptionAm").value.trim(),
        descriptionEn: document.getElementById("lessonDescriptionEn").value.trim(),
        isPremium: document.getElementById("lessonPremium").checked
      });

      adminMessage.textContent = "ትምህርቱ በተሳካ ሁኔታ ተጨምሯል!";
      lessonForm.reset();

    } catch (error) {
      console.error(error);
      adminMessage.textContent = "ስህተት ተፈጥሯል። ፈቃድን እና ግንኙነቱን ያረጋግጡ።";
    }
  });
}
// Display lessons from Firestore
async function loadLessons() {
  const lessonList = document.getElementById("lessonList");

  if (!lessonList) return;

  lessonList.innerHTML = "<p>ትምህርቶችን በመጫን ላይ...</p>";

  try {
    const snapshot = await getDocs(
      collection(db, "lessons")
    );

    lessonList.innerHTML = "";

    snapshot.forEach((lessonDoc) => {
      const lesson = lessonDoc.data();

      const card = document.createElement("article");
      card.className = "lesson-card";

      const title = document.createElement("h3");
      title.textContent = lang === "am"
        ? lesson.titleAm
        : lesson.titleEn;

      const description = document.createElement("p");
      description.textContent = lang === "am"
        ? lesson.descriptionAm
        : lesson.descriptionEn;

      card.appendChild(title);
      card.appendChild(description);

     const deleteBtn = document.createElement("button");
deleteBtn.textContent = "Delete";
deleteBtn.type = "button";
deleteBtn.style.display = "block";
deleteBtn.style.visibility = "visible";
deleteBtn.style.marginTop = "12px";
deleteBtn.style.padding = "10px 20px";
deleteBtn.onclick = async () => {
  if (confirm("ይህን ትምህርት መሰረዝ ይፈልጋሉ?")) {
    try {
      await deleteDoc(doc(db, "lessons", lessonDoc.id));
      loadLessons();
    } catch (error) {
      console.error(error);
      alert("መሰረዝ አልተሳካም።");
    }
  }
};
card.appendChild(deleteBtn);
      const editBtn = document.createElement("button");
editBtn.textContent = "Edit";
editBtn.type = "button";

editBtn.onclick = async () => {
  const newTitleAm = prompt("አዲሱን የአማርኛ ርዕስ አስገባ:", lesson.titleAm);
  if (newTitleAm === null) return;

  const newTitleEn = prompt("Enter the new English title:", lesson.titleEn);
  if (newTitleEn === null) return;

  const newDescriptionAm = prompt("አዲሱን የአማርኛ መግለጫ አስገባ:", lesson.descriptionAm);
  if (newDescriptionAm === null) return;

  const newDescriptionEn = prompt("Enter the new English description:", lesson.descriptionEn);
  if (newDescriptionEn === null) return;

  try {
    await updateDoc(doc(db, "lessons", lessonDoc.id), {
      titleAm: newTitleAm,
      titleEn: newTitleEn,
      descriptionAm: newDescriptionAm,
      descriptionEn: newDescriptionEn
    });

    alert("ትምህርቱ ተስተካክሏል!");
    loadLessons();
  } catch (error) {
    console.error(error);
    alert("ማስተካከል አልተሳካም።");
  }
};

card.appendChild(editBtn);
      lessonList.appendChild(card);
    });

  } catch (error) {
    console.error(error);
    lessonList.textContent = "ትምህርቶችን ማምጣት አልተቻለም።";
  }
}

loadLessons();
