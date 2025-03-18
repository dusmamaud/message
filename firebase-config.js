// Your Firebase config (Get this from Firebase Console)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// DOM Elements
const authSection = document.getElementById("authSection");
const mainContent = document.getElementById("mainContent");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const messageForm = document.getElementById("messageForm");
const logoutBtn = document.getElementById("logoutBtn");
const showLoginLink = document.getElementById("showLogin");
const showRegisterLink = document.getElementById("showRegister");

// Toggle between login and register forms
showLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.style.display = "none";
  loginForm.style.display = "block";
});

showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.style.display = "none";
  registerForm.style.display = "block";
});

// Register new user
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const profilePic = document.getElementById("profilePic").files[0];

  try {
    // Create user
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    // Upload profile picture if selected
    if (profilePic) {
      const storageRef = storage.ref(`profiles/${user.uid}`);
      await storageRef.put(profilePic);
      const photoURL = await storageRef.getDownloadURL();
      await user.updateProfile({ photoURL });
    }

    alert("Registration successful!");
  } catch (error) {
    alert("Registration error: " + error.message);
  }
});

// Login user
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    alert("Login successful!");
  } catch (error) {
    alert("Login error: " + error.message);
  }
});

// Logout user
logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// Send message
messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const messageText = document.getElementById("messageText").value;
  const user = auth.currentUser;

  try {
    await db.collection("messages").add({
      text: messageText,
      userId: user.uid,
      userEmail: user.email,
      userPhoto: user.photoURL || "default-avatar.png",
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    messageForm.reset();
    alert("Message sent!");
  } catch (error) {
    alert("Error sending message: " + error.message);
  }
});

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is logged in
    authSection.style.display = "none";
    mainContent.style.display = "block";
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("userProfilePic").src =
      user.photoURL || "default-avatar.png";
    loadMessages();
  } else {
    // User is logged out
    authSection.style.display = "block";
    mainContent.style.display = "none";
  }
});

// Load messages
function loadMessages() {
  db.collection("messages")
    .orderBy("timestamp", "desc")
    .onSnapshot((snapshot) => {
      const messagesContainer = document.getElementById("messagesContainer");
      messagesContainer.innerHTML = "";

      snapshot.forEach((doc) => {
        const message = doc.data();
        const messageElement = createMessageElement(doc.id, message);
        messagesContainer.appendChild(messageElement);
      });
    });
}

// Create message element
function createMessageElement(id, message) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerHTML = `
      <div class="message-header">
          <img src="${
            message.userPhoto
          }" alt="Profile" class="message-profile-pic">
          <span class="message-user">${message.userEmail}</span>
          <span class="message-time">${
            message.timestamp
              ? new Date(message.timestamp.toDate()).toLocaleString()
              : "Just now"
          }</span>
      </div>
      <div class="message-text">${message.text}</div>
      <div class="message-actions">
          <button onclick="copyMessage('${
            message.text
          }')" class="btn btn-small">Copy</button>
          ${
            auth.currentUser.uid === message.userId
              ? `<button onclick="deleteMessage('${id}')" class="btn btn-small btn-danger">Delete</button>`
              : ""
          }
      </div>
  `;
  return div;
}

// Copy message
function copyMessage(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => alert("Message copied!"))
    .catch((err) => alert("Failed to copy message"));
}

// Delete message
async function deleteMessage(id) {
  try {
    await db.collection("messages").doc(id).delete();
    alert("Message deleted!");
  } catch (error) {
    alert("Error deleting message: " + error.message);
  }
}
