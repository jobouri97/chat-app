import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import { getCurrentUser } from "./APIs/userAPI.js";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("token");

      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const data = await getCurrentUser(token);
        setCurrentUser(data.user);
      } catch {
        localStorage.removeItem("token");
        setCurrentUser(null);
      } finally {
        setCheckingSession(false);
      }
    }//EOF

    restoreSession();
  }, []);

  if (checkingSession) {
    return <p>Loading...</p>;
  }

  return currentUser
    ? <ChatPage setAuthenticatedUser={setCurrentUser} />
    : <LoginPage setCurrentUser={setCurrentUser} />;
}

export default App;
