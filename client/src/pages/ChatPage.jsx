// src/pages/HomePage.jsx

import { useEffect, useState } from "react";

function ChatPage({currentUser}) {
  // =========================
  // States
  // =========================

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");


  // =========================
  // Functions
  // =========================

  function handleClick() {
    // Write your function here
  }

  async function fetchData() {
    try {
      setIsLoading(true);
      setError("");

      // Send API request here

      // setData(response.data);
    } catch (error) {
      setError(error.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }


  // =========================
  // Effects
  // =========================

  useEffect(() => {
    fetchData();
  }, []);


  // =========================
  // Conditional renders
  // =========================

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }


  // =========================
  // Main render
  // =========================

  return (
    <main>
      <h1>Hello {currentUser.username}</h1>

      <button type="button" onClick={handleClick}>
        Click me
      </button>

      <section>
        {data.map((item) => (
          <div key={item.id}>
            {item.name}
          </div>
        ))}
      </section>
    </main>
  );
}

export default ChatPage;