import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  setDoc,
  Timestamp,
  writeBatch,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
console.log("Firestore updateDoc:", updateDoc);
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

async function checkPremiumAccess(user) {
  if (!user) return false;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return false;

    const userData = userSnap.data();

    return userData.premiumUntil &&
      userData.premiumUntil.toDate() > new Date();

  } catch (error) {
    console.error("Premium check error:", error);
    return false;
  }
}

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
let unsubscribePremiumStatus = null;
let unsubscribePaymentStatus = null;
onAuthStateChanged(auth, async (user) => {
  if (unsubscribePremiumStatus) {
  unsubscribePremiumStatus();
  unsubscribePremiumStatus = null;
}
  if (logoutBtn) logoutBtn.hidden = !user;
  if (registerForm) registerForm.hidden = !!user;
  if (loginForm) loginForm.hidden = !!user;

  const adminPanel = document.getElementById("adminPanel");
  const premiumStatus = document.getElementById("premiumStatus");
  const premiumStatusMessage = document.getElementById("premiumStatusMessage");

  const isAdminUser = user &&
    user.uid === "YplGuZ4wQxO1otM0wuJjf8gBy9a2";
  

  if (adminPanel) {
    adminPanel.hidden = !isAdminUser;
  }
console.log("Current UID:", user?.uid);
console.log("Is Admin:", isAdminUser);
  if (premiumStatus) {
    premiumStatus.hidden = !user;
  }

  if (user) {
    loadLessons(); 
    if (!isAdminUser) {
  const statusElement = document.getElementById(
    "myPaymentRequestStatus"
  );

  if (statusElement) {
    const myRequestsQuery = query(
      collection(db, "paymentRequests"),
      where("uid", "==", user.uid)
    );

    unsubscribePaymentStatus = onSnapshot(
      myRequestsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          statusElement.textContent =
            "እስካሁን የክፍያ ጥያቄ አልላኩም።";
          return;
        }

        const requests = snapshot.docs.map((item) => item.data());

        requests.sort((a, b) =>
          b.createdAt.toMillis() - a.createdAt.toMillis()
        );

        const latestRequest = requests.find(
  (request) => request.status === "approved"
) || requests[0];

        if (latestRequest.status === "pending") {
          statusElement.textContent =
            "የክፍያ ጥያቄዎ በመጠባበቅ ላይ ነው።";
        } else if (latestRequest.status === "approved") {
          statusElement.textContent =
            "የክፍያ ጥያቄዎ ጸድቋል። Premium አባልነትዎ ተነቅቷል።";
        } else {
          statusElement.textContent =
            "የክፍያ ጥያቄዎ ሁኔታ፦ " + latestRequest.status;
        }
      },
      (error) => {
        console.error(error);
        statusElement.textContent =
          "የክፍያ ሁኔታን ማምጣት አልተቻለም።";
      }
    );
  }
}
    showMessage("በመለያዎ ገብተዋል።");

    if (isAdminUser) {
  premiumStatusMessage.textContent =
    "አስተዳዳሪ ነዎት። ሁሉንም ትምህርቶች ማየት ይችላሉ.";
} else {
  const userRef = doc(db, "users", user.uid);

  unsubscribePremiumStatus = onSnapshot(
    userRef,
    (userSnap) => {
      if (userSnap.exists()) {
        const userData = userSnap.data();

        const expiry = userData.premiumUntil
          ? userData.premiumUntil.toDate()
          : null;

        if (expiry && expiry > new Date()) {
  const dateText = expiry.toLocaleDateString(
    lang === "am" ? "am-ET" : "en-US"
  );

  const remainingTime = expiry.getTime() - Date.now();
  const remainingDays = Math.ceil(
    remainingTime / (1000 * 60 * 60 * 24)
  );

  if (remainingDays <= 3) {
    premiumStatusMessage.textContent =
      "⚠️ ማስጠንቀቂያ! Premium አባልነትዎ በ" +
      remainingDays + " ቀን ውስጥ ያበቃል። የማለቂያ ቀን፦ " +
      dateText;
  } else {
    premiumStatusMessage.textContent =
      "Premium አባልነትዎ ንቁ ነው። የሚያበቃበት ቀን፦ " + dateText;
  }
} else {
        premiumStatusMessage.textContent =
          "አሁን Premium አባል አይደሉም።";
      }
    },
    (error) => {
      console.error(error);
      premiumStatusMessage.textContent =
        "የአባልነት ሁኔታን ማምጣት አልተቻለም።";
    }
  );
}
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
const activatePremiumBtn = document.getElementById("activatePremiumBtn");

const premiumPaymentForm = document.getElementById("premiumPaymentForm");
console.log("Premium payment form:", premiumPaymentForm);
if (premiumPaymentForm) {
  premiumPaymentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = auth.currentUser;
    const message = document.getElementById("paymentRequestMessage");

    if (!user) {
      message.textContent = "እባክዎ መጀመሪያ Login ያድርጉ።";
      return;
    }

    const payerName = document.getElementById("payerName").value.trim();
    const transactionRef = document.getElementById("transactionRef").value.trim();

    if (!payerName || !transactionRef) {
      message.textContent = "ሁሉንም ቦታ ይሙሉ።";
      return;
    }

    try {   
      const pendingQuery = query(
        collection(db, "paymentRequests"),
        where("uid", "==", user.uid),
        where("status", "==", "pending")
      );

      const pendingSnapshot = await getDocs(pendingQuery);

      if (!pendingSnapshot.empty) {
        message.textContent =
          "የቀድሞው የክፍያ ጥያቄዎ ገና አልተፈታም። እባክዎ ውሳኔውን ይጠብቁ።";
        return;
      }
      await addDoc(collection(db, "paymentRequests"), {
        uid: user.uid,
        email: user.email,
        payerName: payerName,
        transactionRef: transactionRef,
        amount: 500,
        status: "pending",
        createdAt: Timestamp.now()
      });

      message.textContent =
        "የክፍያ ጥያቄዎ ተልኳል። ማረጋገጫ ይጠብቁ።";

      premiumPaymentForm.reset();

    } catch (error) {
      console.error(error);
      message.textContent =
        "ጥያቄውን መላክ አልተሳካም። እንደገና ይሞክሩ።";
    }
  });
}

const loadPaymentRequestsBtn =
  document.getElementById("loadPaymentRequestsBtn");

if (loadPaymentRequestsBtn) {
  loadPaymentRequestsBtn.addEventListener("click", async () => {
    const list = document.getElementById("paymentRequestsList");

    if (!auth.currentUser) {
      list.textContent = "እባክዎ Admin መለያ ይጠቀሙ።";
      return;
    }

    list.textContent = "እየጫነ ነው...";

    try {
      const requestsQuery = query(
        collection(db, "paymentRequests"),
        where("status", "==", "pending")
      );

      const snapshot = await getDocs(requestsQuery);

      list.innerHTML = "";

      if (snapshot.empty) {
        list.textContent = "አዲስ የክፍያ ጥያቄ የለም።";
        return;
      }

      
snapshot.forEach((requestDoc) => {
  const data = requestDoc.data();

  const card = document.createElement("div");
  card.className = "payment-request-card";

  const details = document.createElement("p");
  details.textContent =
    `ስም: ${data.payerName} | Email: ${data.email} | ` +
    `መጠን: ${data.amount} ብር | ` +
    `የግብይት ቁጥር: ${data.transactionRef}`;
if (data.status !== "pending") {
  return;
}
  const approveBtn = document.createElement("button");
  approveBtn.textContent = "Approve Premium (30 Days)";

  approveBtn.addEventListener("click", async () => {
    if ( 
      data.amount !== 500 ||
  !data.uid ||
  typeof data.payerName !== "string" ||
  !data.payerName.trim() ||
  typeof data.transactionRef !== "string" ||
  !data.transactionRef.trim()
) {
  alert("የክፍያ መረጃው ሙሉ ወይም ትክክል አይደለም።");
  return;
}

    if (!confirm("የCBE ክፍያውን በእውነት አረጋግጠዋል?")) {
      return;
    }

    approveBtn.disabled = true;

    try {
      const userRef = doc(db, "users", data.uid);
      const userSnap = await getDoc(userRef);

      let startDate = new Date();

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (
          userData.premiumUntil &&
          userData.premiumUntil.toDate() > startDate
        ) {
          startDate = userData.premiumUntil.toDate();
        }
      }

      const expiryDate = new Date(
        startDate.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      const batch = writeBatch(db);

      batch.set(
        userRef,
        {
          premiumUntil: Timestamp.fromDate(expiryDate)
        },
        { merge: true }
      );

      batch.update(
        requestDoc.ref,
        {
          status: "approved",
          approvedAt: Timestamp.now()
        }
      );

      await batch.commit();

      card.textContent =
        "Premium በ30 ቀናት ተነቅቷል።";

    } catch (error) {
      console.error(error);
      alert("ማጽደቅ አልተሳካም። የAdmin ፈቃድን ያረጋግጡ።");
      approveBtn.disabled = false;
    }
  });

  card.appendChild(details);
  card.appendChild(approveBtn);
  const rejectBtn = document.createElement("button");
rejectBtn.textContent = "Reject Request";
console.log("REJECT BUTTON CREATED");
rejectBtn.addEventListener("click", async () => {
    if (data.status !== "pending") {
    return;
  }
  if (!confirm("ይህን የክፍያ ጥያቄ ውድቅ ማድረግ ይፈልጋሉ?")) {
    return;
  }

  rejectBtn.disabled = true;

  try {
    await updateDoc(requestDoc.ref, {
      status: "rejected",
      rejectedAt: Timestamp.now()
    });

    card.textContent = "የክፍያ ጥያቄው ውድቅ ተደርጓል።";

  } catch (error) {
    console.error(error);
    alert("ጥያቄውን ውድቅ ማድረግ አልተሳካም።");
    rejectBtn.disabled = false;
  }
});

card.appendChild(rejectBtn);
list.appendChild(card);
});
  

    } catch (error) {
      console.error(error);
      list.textContent =
        "ጥያቄዎቹን ማምጣት አልተቻለም።";
    }
  });
}

if (activatePremiumBtn) {
  activatePremiumBtn.addEventListener("click", async () => {
    const uid = document.getElementById("premiumUserUid").value.trim();
    const message = document.getElementById("premiumAdminMessage");

    if (!uid) {
      message.textContent = "Firebase UID ያስገቡ።";
      return;
    }

    if (!auth.currentUser) {
      message.textContent = "እባክዎ በAdmin መለያ ይግቡ።";
      return;
    }

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      let startDate = new Date();

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (
          userData.premiumUntil &&
          userData.premiumUntil.toDate() > startDate
        ) {
          startDate = userData.premiumUntil.toDate();
        }
      }

      const expiryDate = new Date(
        startDate.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      await setDoc(
        userRef,
        {
          premiumUntil: Timestamp.fromDate(expiryDate)
        },
        { merge: true }
      );

      message.textContent = "Premium ለ30 ቀናት ተነቅቷል!";

    } catch (error) {
      console.error(error);
      message.textContent = "ማንቃት አልተሳካም። የAdmin ፈቃድን ያረጋግጡ።";
    }
  });
}
// Display lessons from Firestore
async function loadLessons() {
  const lessonList = document.getElementById("lessonList");

  if (!lessonList) return;

  lessonList.innerHTML = "<p>ትምህርቶችን በመጫን ላይ...</p>";

  try {
    const user = auth.currentUser;

const isAdmin = user &&
  user.uid === "YplGuZ4wQxO1otM0wuJjf8gBy9a2";

const hasPremium = isAdmin ||
  await checkPremiumAccess(user);

const lessonsRef = collection(db, "lessons");

const lessonsQuery = hasPremium
  ? lessonsRef
  : query(lessonsRef, where("isPremium", "==", false));

const snapshot = await getDocs(lessonsQuery);

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
if (isAdmin) {
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
    alert(error.code + " - " + error.message);
  }
};

card.appendChild(editBtn);
}
      lessonList.appendChild(card);
    });

  } catch (error) {
    console.error(error);
    lessonList.textContent = "ትምህርቶችን ማምጣት አልተቻለም።";
  }
}

