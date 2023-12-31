import { useEffect, useRef, useState } from "react";
import "./App.css";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { CiLogout } from "react-icons/ci";
import { IoIosSend } from "react-icons/io";

const apiKey = process.env.REACT_APP_API_KEY;
const authDomain = process.env.REACT_APP_AUTH_DOMAIN;
const projectId = process.env.REACT_APP_PROJECT_ID;
const storageBucket = process.env.REACT_APP_STORAGE_BUCKET;
const messagingSenderId = process.env.REACT_APP_MESSAGING_SENDER_ID;
const appId = process.env.REACT_APP_APP_ID;
const measurementId = process.env.REACT_APP_MEASUREMENT_ID;

firebase.initializeApp({
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId,
});

const firestore = firebase.firestore();
const auth = firebase.auth();

const googleImgURL = "https://logowik.com/content/uploads/images/985_google_g_icon.jpg";

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="app-container">
      <header className="app-header">
        <section className="app-content">{user ? <ChatRoom /> : <SignIn />}</section>
      </header>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <div className="sign-in-container">
      <h1 className="welcome-message">Welcome to the Chat Room</h1>
      <button className="sign-in-button" onClick={signInWithGoogle}>
        <img src={googleImgURL} alt="Sign in with Google" />
        Sign in with Google
      </button>
    </div>
  );
}

function SignOut() {
  return (
    auth.currentUser && (
      <div className="sign-out-button-container">
        <button onClick={() => auth.signOut()} className="sign-out-button">
          <CiLogout
            style={{
              color: "white",
              fontSize: "1rem",
            }}
          />
        </button>
      </div>
    )
  );
}

function ChatRoom() {
  const dummy = useRef();
  const messageRef = firestore.collection("messages");
  const query = messageRef.orderBy("createdAt").limit(25);
  const [messages] = useCollectionData(query, { idField: "id" });
  const [formValue, setFormValue] = useState("");

  const scrollToBottom = () => {
    dummy.current.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    scrollToBottom();
    const { uid, photoURL } = auth.currentUser;
    await messageRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });
    setFormValue("");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="sign-out-container">
        <SignOut />
      </div>
      <div className="chat-messages-container">
        <div className="chat-messages">
          {messages && messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        </div>
        <div ref={dummy} className="scroll-anchor"></div>
      </div>
      <div className="form-container">
        <form className="chat-form" onSubmit={sendMessage}>
          <input
            className="chat-input"
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit" className="chat-send-button">
            <div className="send-icon">
              <IoIosSend
                style={{
                  color: "white",
                  fontSize: "1rem",
                }}
              />
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  const breakTextIntoLines = (text) => {
    const maxLineLength = 80;
    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length <= maxLineLength) {
        currentLine += word + " ";
      } else {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      }
    });

    if (currentLine.trim() !== "") {
      lines.push(currentLine.trim());
    }

    return lines;
  };

  return (
    <div className={`message ${messageClass}`}>
      <img className={`message-photo ${messageClass}`} src={photoURL} alt="profile" />
      <div className="message-name">
        <div className={`message-content ${messageClass}`}>
          {breakTextIntoLines(text).map((line, index) => (
            <p key={index} className="message-text">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
