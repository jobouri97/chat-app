import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import { getCurrentUser } from "./APIs/userAPI.js";

function App() {
  // null means nobody is authenticated. checkingSession prevents the login page
  // from flashing briefly while an existing token is being checked.
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      // localStorage survives a page refresh, unlike ordinary React state.
      const token = localStorage.getItem("token");

      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        // A token is accepted only after the server verifies its signature and
        // confirms that the matching user still exists.
        const data = await getCurrentUser(token);
        setCurrentUser(data.user);
      } catch {
        // Expired, invalid, or deleted-user tokens should not remain stored.
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
