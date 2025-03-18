// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhjenc9WuUtjMiUB8LOvdb259dgasRBaI",
  authDomain: "message-10858.firebaseapp.com",
  projectId: "message-10858",
  storageBucket: "message-10858.firebasestorage.app",
  messagingSenderId: "143601766680",
  appId: "1:143601766680:web:55210d528142494c62ce6d",
  measurementId: "G-7K67DCM8PT",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const adminEmail = "admin@example.com"; // Set admin email
const adminPassword = "Admin123"; // Set admin password

// ----------- SIGNUP FUNCTION -----------
document.getElementById("signupForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  let username = document.getElementById("username").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  let profilePic = document.getElementById("profilePic").files[0];

  auth
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      let user = userCredential.user;

      if (profilePic) {
        let storageRef = storage.ref("profile_pictures/" + user.uid);
        storageRef.put(profilePic).then(() => {
          storageRef.getDownloadURL().then((url) => {
            db.collection("users").doc(user.uid).set({
              username: username,
              email: email,
              profilePic: url,
            });
          });
        });
      } else {
        db.collection("users").doc(user.uid).set({
          username: username,
          email: email,
          profilePic: "default-profile.png",
        });
      }

      alert("Signup Successful! Please login.");
      window.location.href = "login.html";
    })
    .catch((error) => {
      document.getElementById("signupError").innerText = error.message;
    });
});

// ----------- LOGIN FUNCTION -----------
document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  auth
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      let user = userCredential.user;

      if (email === adminEmail && password === adminPassword) {
        localStorage.setItem("isAdmin", true);
      } else {
        localStorage.setItem("isAdmin", false);
      }

      localStorage.setItem("user", user.uid);
      window.location.href = "user.html";
    })
    .catch((error) => {
      document.getElementById("loginError").innerText = error.message;
    });
});

// ----------- LOGOUT FUNCTION -----------
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  auth.signOut().then(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("isAdmin");
    window.location.href = "login.html";
  });
});

// ----------- DISPLAY USER INFO -----------
auth.onAuthStateChanged((user) => {
  if (user) {
    db.collection("users")
      .doc(user.uid)
      .get()
      .then((doc) => {
        if (doc.exists) {
          document.getElementById("usernameDisplay").innerText =
            "Welcome, " + doc.data().username;
          document.getElementById("userProfilePic").src = doc.data().profilePic;
        }
      });
  } else {
    window.location.href = "login.html";
  }
});

// ----------- MESSAGE SUBMISSION -----------
document.getElementById("submitMessage")?.addEventListener("click", () => {
  let userId = localStorage.getItem("user");
  let messageInput = document.getElementById("messageInput").value;

  if (messageInput.trim() === "") {
    alert("Message cannot be empty!");
    return;
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      db.collection("users")
        .doc(user.uid)
        .get()
        .then((doc) => {
          db.collection("messages").add({
            userId: user.uid,
            username: doc.data().username,
            text: messageInput,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          });
        });
    }
  });

  document.getElementById("messageInput").value = "";
});

// ----------- DISPLAY MESSAGES -----------
function loadMessages() {
  db.collection("messages")
    .orderBy("timestamp", "desc")
    .onSnapshot((snapshot) => {
      let messagesList = document.getElementById("messagesList");
      messagesList.innerHTML = "";

      snapshot.forEach((doc) => {
        let message = doc.data();
        let listItem = document.createElement("li");
        listItem.innerHTML = `
              <strong>${message.username}</strong>: ${message.text}
              <button class="copy-btn" onclick="copyText('${
                message.text
              }')"><i class="fas fa-copy"></i></button>
              ${
                localStorage.getItem("isAdmin") === "true"
                  ? `<button class="delete-btn" onclick="deleteMessage('${doc.id}')"><i class="fas fa-trash"></i></button>`
                  : ""
              }
          `;

        messagesList.appendChild(listItem);
      });
    });
}

document.addEventListener("DOMContentLoaded", loadMessages);

// ----------- COPY TEXT FUNCTION -----------
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Text copied to clipboard!");
  });
}

// ----------- DELETE MESSAGE FUNCTION (Admin Only) -----------
function deleteMessage(messageId) {
  if (localStorage.getItem("isAdmin") === "true") {
    db.collection("messages").doc(messageId).delete();
  } else {
    alert("Only Admin can delete messages!");
  }
}
