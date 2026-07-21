
// Import React hooks.
//
// useState:
// Stores values that can change and update the page.
//
// useEffect:
// Runs code after the component is displayed.
//
// useMemo:
// Saves a calculated value until its dependencies change.
//
// useCallback:
// Saves a function until its dependencies change.
//
// useRef:
// Stores a value without causing the component to re-render.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Import functions that communicate with the user API.
import {
  getCurrentUser,
  getUsers,
} from "../APIs/userAPI.js";

// Import functions that communicate with the message API.
import {
  getMessages,
  markMessagesAsRead,
} from "../APIs/messageAPI.js";

// Import functions that communicate with the conversation API.
import {
  getMyConversations,
  startConversationAPI,
} from "../APIs/conversationAPI.js";

// Import the component that displays the users list.
import UserList from "../components/UserLIst.jsx";

// Import the form used to write and send messages.
import MessageForm from "../components/MessageForm.jsx";

// Import socket connection functions.
import {
  connectSocket,
  disconnectSocket,
  offSocketConnected,
  onSocketConnected,
} from "../utils/sockets/connectionSocket.js";

// Import socket functions used for messages.
import {
  offNewMessage,
  onNewMessage,
  sendMessage as sendSocketMessage,
} from "../utils/sockets/messageSocket.js";

// Import socket functions used for joining
// and leaving conversation rooms.
import {
  joinConversation,
  leaveConversation,
} from "../utils/sockets/conversationSocket.js";

// Import socket functions used to track
// which users are online or offline.
import {
  onOnlineUsers,
  offOnlineUsers,
  onUserOnline,
  offUserOnline,
  onUserOffline,
  offUserOffline,
} from "../utils/sockets/presenceSocket.js";

// Import socket functions used for typing indicators.
import {
  startTyping,
  stopTyping,
  onUserStartedTyping,
  offUserStartedTyping,
  onUserStoppedTyping,
  offUserStoppedTyping,
} from "../utils/sockets/typingSocket.js";

// Create a simple date value from a timestamp.
//
// For example:
//
// "2026-07-21T10:30:00"
// becomes something like:
// "2026-6-21"
//
// This value is used to compare message dates.
function getMessageDateKey(timestamp) {
  // Convert the timestamp into a JavaScript Date object.
  const date = new Date(timestamp);

  // Check whether the timestamp was invalid.
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // Return the year, month, and day as one string.
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Convert a message timestamp into a readable date.
//
// It returns:
// "Today"
// "Yesterday"
// or a full date such as:
// "Tuesday, July 21, 2026"
function formatMessageDate(timestamp) {
  // Convert the timestamp into a Date object.
  const date = new Date(timestamp);

  // Return an empty string if the timestamp is invalid.
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // Get today's date.
  const today = new Date();

  // Create another Date object for yesterday.
  const yesterday = new Date(today);

  // Move the date back by one day.
  yesterday.setDate(today.getDate() - 1);

  // Create a simple date value for the message.
  const messageDateKey = getMessageDateKey(timestamp);

  // Check whether the message was sent today.
  if (messageDateKey === getMessageDateKey(today)) {
    return "Today";
  }

  // Check whether the message was sent yesterday.
  if (messageDateKey === getMessageDateKey(yesterday)) {
    return "Yesterday";
  }

  // Return a full readable date for older messages.
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Convert a timestamp into a readable time.
//
// For example:
// "3:45 PM"
function formatMessageTime(timestamp) {
  // Convert the timestamp into a Date object.
  const date = new Date(timestamp);

  // Return an empty string if the timestamp is invalid.
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // Return only the hour and minute.
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// The main chat page component.
//
// setAuthenticatedUser comes from the parent component.
// It is used when the user logs out.
function ChatPage({ setAuthenticatedUser }) {
  // Store the currently opened conversation.
  const [conversation, setConversation] = useState(null);

  // Store the messages of the opened conversation.
  const [messages, setMessages] = useState([]);

  // Store all users returned by the server.
  const [allUsers, setAllUsers] = useState([]);

  // Store the ID of the user selected from the contact list.
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Store information about the logged-in user.
  const [currentUser, setCurrentUser] = useState(null);

  // True while a conversation and its messages are loading.
  const [isLoadingConversation, setIsLoadingConversation] =
    useState(false);

  // Store an error message that can be shown on the page.
  const [error, setError] = useState("");

  // Store the IDs of users who are currently online.
  //
  // Set is used because it does not allow duplicate values.
  const [onlineUserIds, setOnlineUserIds] = useState(
    () => new Set(),
  );

  // Store the IDs of users who are currently typing.
  const [typingUserIds, setTypingUserIds] = useState(
    () => new Set(),
  );

  // Store short information about each conversation.
  //
  // This may include:
  // - conversation ID
  // - other user's ID
  // - unread message count
  // - last message date
  const [conversationSummaries, setConversationSummaries] = useState([]);

  // Store what the user types in the contact search box.
  const [userSearch, setUserSearch] = useState("");

  // Control whether the contacts list is visible on mobile.
  const [showMobileContacts, setShowMobileContacts,] = useState(false);

  // Store a number for the latest user-selection request.
  //
  // This helps prevent an older request from replacing
  // the result of a newer request.
  const selectionRequestId = useRef(0);

  // Store the currently opened conversation ID.
  //
  // useRef is useful here because socket functions
  // can always read its latest value.
  const activeConversationIdRef = useRef(null);

  // Store the logged-in user's ID.
  const currentUserIdRef = useRef(null);

  // Get the current conversation ID.
  //
  // If there is no conversation, use null.
  const activeConversationId = conversation?.id ?? null;

  // Update activeConversationIdRef whenever
  // the opened conversation changes.
  useEffect(() => {
    activeConversationIdRef.current =
      activeConversationId;
  }, [activeConversationId]);

  // Update currentUserIdRef whenever
  // the logged-in user changes.
  useEffect(() => {
    currentUserIdRef.current =
      currentUser?.id ?? null;
  }, [currentUser]);

  // Prepare the list of users that can be selected.
  //
  // useMemo saves the calculated list.
  // It recalculates only when one of its dependencies changes.
  const selectableUsers = useMemo(
    () =>
      allUsers
        // Remove the logged-in user from the contact list.
        .filter(
          (user) =>
            Number(user.id) !==
            Number(currentUser?.id),
        )

        // Add conversation information to each user.
        .map((user) => {
          // Find the conversation connected to this user.
          const summary = conversationSummaries.find(
            (item) =>
              Number(item.other_user_id) ===
              Number(user.id),
          );

          // Return the original user information
          // together with conversation information.
          return {
            ...user,

            // Use the conversation ID if one exists.
            conversationId: summary?.id ?? null,

            // Convert the unread count into a number.
            unreadCount: Number(
              summary?.unread_count ?? 0,
            ),

            // Use the last message date.
            //
            // If there is no last message,
            // use the conversation creation date.
            lastMessageAt:
              summary?.last_message_at ??
              summary?.created_at ??
              null,
          };
        })

        // Sort users by the date of their latest message.
        .sort((firstUser, secondUser) => {
          // Convert the first user's last-message date
          // into milliseconds.
          const firstTime = firstUser.lastMessageAt
            ? new Date(
              firstUser.lastMessageAt,
            ).getTime()
            : 0;

          // Convert the second user's last-message date
          // into milliseconds.
          const secondTime = secondUser.lastMessageAt
            ? new Date(
              secondUser.lastMessageAt,
            ).getTime()
            : 0;

          // Put the user with the newest message first.
          //
          // If the dates are the same,
          // sort users alphabetically by username.
          return (
            secondTime - firstTime ||
            firstUser.username.localeCompare(
              secondUser.username,
            )
          );
        }),

    // Recalculate when any of these values change.
    [
      allUsers,
      conversationSummaries,
      currentUser,
    ],
  );

  // Find the full information of the selected user.
  const selectedUser = useMemo(
    () =>
      allUsers.find(
        (user) =>
          Number(user.id) ===
          Number(selectedUserId),
      ),
    [allUsers, selectedUserId],
  );

  // Filter the contact list using the search text.
  const searchedUsers = useMemo(() => {
    // Remove spaces from the beginning and end.
    //
    // Convert the text to lowercase so the search
    // is not affected by uppercase letters.
    const searchText = userSearch
      .trim()
      .toLocaleLowerCase();

    // If the search box is empty,
    // return every selectable user.
    if (!searchText) {
      return selectableUsers;
    }

    // Return only users whose usernames
    // include the search text.
    return selectableUsers.filter((user) =>
      user.username
        .toLocaleLowerCase()
        .includes(searchText),
    );
  }, [selectableUsers, userSearch]);

  // This effect runs once when ChatPage first appears.
  //
  // It:
  // - reads the saved token
  // - adds socket event listeners
  // - connects to Socket.IO
  // - loads users and conversations
  useEffect(() => {
    // Get the login token from localStorage.
    const token = localStorage.getItem("token");

    // Stop if there is no token.
    if (!token) {
      return undefined;
    }

    // Run when the server sends the full list
    // of currently online users.
    function handleOnlineUsers({ userIds }) {
      // Convert every user ID into a number.
      //
      // Store them inside a new Set.
      setOnlineUserIds(
        new Set(
          userIds.map((id) => Number(id)),
        ),
      );
    }

    // Run when one user comes online.
    function handleUserOnline({ userId }) {
      setOnlineUserIds((current) => {
        // Create a copy of the current Set.
        //
        // React state should not be changed directly.
        const updated = new Set(current);

        // Add the online user's ID.
        updated.add(Number(userId));

        // Save the updated Set.
        return updated;
      });
    }

    // Run when one user goes offline.
    function handleUserOffline({ userId }) {
      setOnlineUserIds((current) => {
        // Create a copy of the current Set.
        const updated = new Set(current);

        // Remove the offline user's ID.
        updated.delete(Number(userId));

        // Save the updated Set.
        return updated;
      });
    }

    // Run when a user starts typing.
    function handleStartedTyping({ userId }) {
      setTypingUserIds((current) => {
        // Create a copy of the current Set.
        const updated = new Set(current);

        // Add the typing user's ID.
        updated.add(Number(userId));

        return updated;
      });
    }

    // Run when a user stops typing.
    function handleStoppedTyping({ userId }) {
      setTypingUserIds((current) => {
        // Create a copy of the current Set.
        const updated = new Set(current);

        // Remove the user's ID.
        updated.delete(Number(userId));

        return updated;
      });
    }

    // Run whenever any new message is received.
    //
    // This function updates the conversation list,
    // including the last-message time and unread count.
    function handleConversationMessage(message) {
      // Get the conversation ID from the message.
      //
      // The server may use either naming style.
      const conversationId = Number(
        message.conversation_id ??
        message.conversationId,
      );

      // Get the sender's ID from the message.
      const senderId = Number(
        message.sender_id ?? message.senderId,
      );

      // Update the conversation summaries.
      setConversationSummaries((current) => {
        // Check whether this conversation
        // already exists in the summaries.
        const existing = current.find(
          (item) =>
            Number(item.id) === conversationId,
        );

        // Increase the unread count only when:
        //
        // 1. The message was sent by another user.
        // 2. The message does not belong to the
        //    conversation currently being viewed.
        const shouldIncrement =
          senderId !==
          Number(currentUserIdRef.current) &&
          conversationId !==
          Number(
            activeConversationIdRef.current,
          );

        // If the conversation summary does not exist,
        // add a new one.
        if (!existing) {
          return [
            ...current,
            {
              id: conversationId,
              other_user_id: senderId,
              last_message_at:
                message.created_at,
              unread_count: shouldIncrement
                ? 1
                : 0,
            },
          ];
        }

        // If the conversation already exists,
        // update its last-message time and unread count.
        return current.map((item) =>
          Number(item.id) === conversationId
            ? {
              ...item,

              // Save the time of the new message.
              last_message_at:
                message.created_at,

              // Keep the current unread count
              // and add one when needed.
              unread_count:
                Number(
                  item.unread_count ?? 0,
                ) +
                (shouldIncrement ? 1 : 0),
            }
            : item,
        );
      });
    }

    // Listen for the complete list of online users.
    onOnlineUsers(handleOnlineUsers);

    // Listen for users coming online.
    onUserOnline(handleUserOnline);

    // Listen for users going offline.
    onUserOffline(handleUserOffline);

    // Listen for users starting to type.
    onUserStartedTyping(
      handleStartedTyping,
    );

    // Listen for users stopping typing.
    onUserStoppedTyping(
      handleStoppedTyping,
    );

    // Listen for new messages.
    onNewMessage(handleConversationMessage);

    // Connect to the Socket.IO server using the token.
    connectSocket(token);

    // Load the first information needed by the page.
    async function loadInitialData() {
      try {
        // Run all three API requests at the same time.
        //
        // Promise.all waits until all requests finish.
        const [
          usersData,
          currentUserData,
          conversationsData,
        ] = await Promise.all([
          // Load all users.
          getUsers(token),

          // Load the logged-in user.
          getCurrentUser(token),

          // Load the logged-in user's conversations.
          getMyConversations(token),
        ]);

        // Save all users.
        setAllUsers(usersData.users);

        // Save the logged-in user's information.
        setCurrentUser(currentUserData.user);

        // Save the conversation summaries.
        setConversationSummaries(
          conversationsData.conversations,
        );
      } catch (loadError) {
        // Show the error if one of the requests fails.
        setError(loadError.message);
      }
    }

    // Run the function that loads the initial information.
    loadInitialData();

    // This cleanup function runs when ChatPage
    // is removed from the screen.
    return () => {
      // Remove the online-users listener.
      offOnlineUsers(handleOnlineUsers);

      // Remove the user-online listener.
      offUserOnline(handleUserOnline);

      // Remove the user-offline listener.
      offUserOffline(handleUserOffline);

      // Remove the typing-started listener.
      offUserStartedTyping(
        handleStartedTyping,
      );

      // Remove the typing-stopped listener.
      offUserStoppedTyping(
        handleStoppedTyping,
      );

      // Remove the new-message listener.
      offNewMessage(
        handleConversationMessage,
      );

      // Disconnect from the Socket.IO server.
      disconnectSocket();
    };
  }, []);

  // This effect runs whenever the selected
  // conversation changes.
  //
  // It joins the conversation's Socket.IO room
  // and listens for messages belonging to that conversation.
  useEffect(() => {
    // Stop if there is no opened conversation.
    if (!conversation?.id) {
      return undefined;
    }

    // Save the conversation ID in a normal variable.
    const conversationId = conversation.id;

    // Run when the server responds to the request
    // to join the conversation room.
    function handleJoinResult(result) {
      // Show an error if joining failed.
      if (!result?.success) {
        setError(
          result?.message ||
          "Could not join the conversation.",
        );
      }
    }

    // Join the current conversation's socket room.
    function joinActiveConversation() {
      joinConversation(
        conversationId,
        handleJoinResult,
      );
    }

    // Run when a new socket message is received.
    function handleNewMessage(message) {
      // Get the message's conversation ID.
      const messageConversationId =
        message.conversation_id ??
        message.conversationId;

      // Ignore messages that belong
      // to another conversation.
      if (
        Number(messageConversationId) !==
        Number(conversationId)
      ) {
        return;
      }

      // Add the message to the current message list.
      setMessages((currentMessages) => {
        // Check whether this message is already displayed.
        const alreadyExists =
          currentMessages.some(
            (currentMessage) =>
              Number(currentMessage.id) ===
              Number(message.id),
          );

        // Do not add the same message twice.
        //
        // Otherwise, add it to the end of the array.
        return alreadyExists
          ? currentMessages
          : [...currentMessages, message];
      });
    }

    // Join the conversation room immediately.
    joinActiveConversation();

    // Join the room again if the socket reconnects.
    onSocketConnected(
      joinActiveConversation,
    );

    // Listen for messages in this conversation.
    onNewMessage(handleNewMessage);

    // Cleanup runs when the conversation changes
    // or the component is removed.
    return () => {
      // Stop listening for socket reconnection.
      offSocketConnected(
        joinActiveConversation,
      );

      // Stop listening for conversation messages.
      offNewMessage(handleNewMessage);

      // Leave the old conversation room.
      leaveConversation(conversationId);
    };
  }, [conversation?.id, selectedUserId]);

  // Run when the user clicks a contact.
  async function handleStartConversation(userId) {
    // Get the login token.
    const token = localStorage.getItem("token");

    // Stop if the user is not logged in.
    if (!token) {
      setError("You must be logged in.");
      return;
    }

    // Increase the request number.
    //
    // This lets us identify the newest request.
    const requestId =
      selectionRequestId.current + 1;

    // Save this request as the newest request.
    selectionRequestId.current = requestId;

    // Save the clicked user's ID.
    setSelectedUserId(userId);

    // Hide the contacts list on mobile.
    setShowMobileContacts(false);

    // Clear the old conversation.
    setConversation(null);

    // Clear the old messages.
    setMessages([]);

    // Clear any previous error.
    setError("");

    // Show the loading state.
    setIsLoadingConversation(true);

    try {
      // Ask the server to create or find
      // a conversation with the selected user.
      const conversationData =
        await startConversationAPI(
          userId,
          token,
        );

      // Get the returned conversation.
      const selectedConversation =
        conversationData.conversation;

      // Load the messages of this conversation.
      const messagesData = await getMessages(
        selectedConversation.id,
        token,
      );

      // Stop if the user clicked another contact
      // while this request was loading.
      if (
        requestId !==
        selectionRequestId.current
      ) {
        return;
      }

      // Save the selected conversation.
      setConversation(selectedConversation);

      // Display the conversation's messages.
      setMessages(messagesData.messages);

      // Tell the server that the messages
      // in this conversation have been read.
      await markMessagesAsRead(
        selectedConversation.id,
        token,
      );

      // Update the conversation summaries.
      setConversationSummaries((current) => {
        // Check whether this conversation
        // already exists in the summaries.
        const existing = current.find(
          (item) =>
            Number(item.id) ===
            Number(
              selectedConversation.id,
            ),
        );

        // If it does not exist, add it.
        if (!existing) {
          return [
            ...current,
            {
              // Add the conversation information.
              ...selectedConversation,

              // Save the selected user's ID.
              other_user_id: Number(userId),

              // The conversation was opened,
              // so unread messages become zero.
              unread_count: 0,

              // Get the date of the last message.
              //
              // Array.at(-1) returns the final item.
              last_message_at:
                messagesData.messages.at(-1)
                  ?.created_at ?? null,
            },
          ];
        }

        // If the conversation already exists,
        // only reset its unread count.
        return current.map((item) =>
          Number(item.id) ===
            Number(selectedConversation.id)
            ? {
              ...item,
              unread_count: 0,
            }
            : item,
        );
      });
    } catch (conversationError) {
      // Show the error only if this is still
      // the newest contact-selection request.
      if (
        requestId ===
        selectionRequestId.current
      ) {
        setError(
          conversationError.message,
        );
      }
    } finally {
      // Stop loading only if this is still
      // the newest request.
      if (
        requestId ===
        selectionRequestId.current
      ) {
        setIsLoadingConversation(false);
      }
    }
  }

  // Run when MessageForm sends a message.
  function handleSendMessage(messageText) {
    // Clear any previous error.
    setError("");

    // The user must choose a conversation first.
    if (!conversation?.id) {
      setError(
        "Select a conversation first.",
      );
      return;
    }

    // Send the message through Socket.IO.
    sendSocketMessage(
      // Send the current conversation ID.
      conversation.id,

      // Send the message text.
      messageText,

      // This callback runs when the server responds.
      (result) => {
        // Show an error if sending failed.
        if (!result?.success) {
          setError(
            result?.message ||
            "Could not send the message.",
          );
        }
      },
    );
  }

  // Run when the current user begins typing.
  //
  // useCallback saves the function until
  // activeConversationId changes.
  const handleStartTyping = useCallback(() => {
    // Send the typing event only when
    // a conversation is open.
    if (activeConversationId) {
      startTyping(activeConversationId);
    }
  }, [activeConversationId]);

  // Run when the current user stops typing.
  const handleStopTyping = useCallback(() => {
    // Send the stop-typing event only when
    // a conversation is open.
    if (activeConversationId) {
      stopTyping(activeConversationId);
    }
  }, [activeConversationId]);

  // Log the current user out.
  function handleLogout() {
    // Remove the token from the browser.
    localStorage.removeItem("token");

    // Tell the parent component
    // that there is no authenticated user.
    setAuthenticatedUser(null);
  }

  // Return the page interface.
  return (
    // Main page container.
    <main className="chat-page">
      {/* Main chat layout. */}
      <section
        className={`chat-shell ${showMobileContacts
          ? "show-contacts"
          : "show-conversation"
          }`}
      >
        {/* Left side containing contacts. */}
        <aside className="chat-sidebar">
          {/* Top section of the contacts sidebar. */}
          <header className="sidebar-header">
            {/* Application name and logo. */}
            <div className="brand-lockup">
              {/* Decorative letter used as the logo. */}
              <span
                className="brand-mark small"
                aria-hidden="true"
              >
                C
              </span>

              <div>
                <span className="eyebrow">
                  Messages
                </span>

                <h1>Chatter</h1>
              </div>
            </div>

            {/* Logged-in user and account buttons. */}
            <div className="account-actions">
              {/* Show the username after currentUser loads. */}
              {currentUser && (
                <div
                  className="header-identity"
                  title={`Logged in as ${currentUser.username}`}
                >
                  <span className="profile-label">
                    Signed in as
                  </span>

                  <strong>
                    {currentUser.username}
                  </strong>
                </div>
              )}

              {/* Logout button. */}
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
              >
                {/* Logout icon. */}
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2.75v8.5" />
                  <path d="M7.4 5.7a8 8 0 1 0 9.2 0" />
                </svg>
              </button>

              {/* On mobile, switch from contacts
                  to the conversation panel. */}
              <button
                type="button"
                className="mobile-view-button"
                onClick={() =>
                  setShowMobileContacts(false)
                }
                aria-label="Show conversation"
                title="Show conversation"
              >
                →
              </button>
            </div>
          </header>

          {/* Contact search area. */}
          <div className="contact-search">
            {/* Decorative search symbol. */}
            <span aria-hidden="true">
              ⌕
            </span>

            {/* Hidden label for screen readers. */}
            <label
              className="sr-only"
              htmlFor="user-search"
            >
              Search contacts
            </label>

            {/* Contact search input. */}
            <input
              id="user-search"
              type="search"

              // Display the current search text.
              value={userSearch}

              // Update userSearch whenever
              // the input value changes.
              onChange={(event) =>
                setUserSearch(
                  event.target.value,
                )
              }
              placeholder="Search conversations"
            />
          </div>

          {/* Contacts title and number of results. */}
          <div className="contacts-heading">
            <span>Contacts</span>

            {/* Display how many users match the search. */}
            <span>{searchedUsers.length}</span>
          </div>

          {/* Display the contact list. */}
          <UserList
            // Users that match the search.
            users={searchedUsers}

            // IDs of users who are typing.
            typingUserIds={typingUserIds}

            // Function called when a user is clicked.
            onUserClick={
              handleStartConversation
            }

            // IDs of users who are online.
            onlineUserIds={onlineUserIds}
          />
        </aside>

        {/* Right side containing the current conversation. */}
        <section className="conversation-panel">
          {/* Display an error message when one exists. */}
          {error && (
            <p className="chat-alert">
              {error}
            </p>
          )}

          {/* If a user is selected, display the conversation. */}
          {selectedUser ? (
            <>
              {/* Conversation header. */}
              <header className="conversation-header">
                {/* On mobile, show the contacts sidebar. */}
                <button
                  type="button"
                  className="mobile-view-button"
                  onClick={() =>
                    setShowMobileContacts(true)
                  }
                  aria-label="Show contacts"
                  title="Show contacts"
                >
                  ☰
                </button>

                {/* Display the first letter
                    of the selected user's name. */}
                <span
                  className="conversation-avatar"
                  aria-hidden="true"
                >
                  {selectedUser.username
                    .charAt(0)
                    .toUpperCase()}
                </span>

                {/* Selected user information. */}
                <div>
                  <h2>
                    {selectedUser.username}
                  </h2>

                  {/* Display whether the user is:
                      - typing
                      - online
                      - offline */}
                  <p
                    className={
                      typingUserIds.has(
                        Number(selectedUser.id),
                      )
                        ? "typing-label"
                        : "conversation-status"
                    }
                  >
                    {typingUserIds.has(
                      Number(selectedUser.id),
                    )
                      ? "typing..."
                      : onlineUserIds.has(
                        Number(
                          selectedUser.id,
                        ),
                      )
                        ? "Online now"
                        : "Offline"}
                  </p>
                </div>
              </header>

              {/* Area that displays all messages. */}
              <div className="message-feed">
                {/* Show a loading message while
                    the conversation is loading. */}
                {isLoadingConversation && (
                  <p className="empty-message">
                    Loading messages...
                  </p>
                )}

                {/* Show an empty message when loading finished
                    and no messages exist. */}
                {!isLoadingConversation &&
                  messages.length === 0 && (
                    <div className="empty-message">
                      <span>👋</span>

                      <p>
                        No messages yet. Say hello!
                      </p>
                    </div>
                  )}

                {/* Go through every message
                    and display it on the page. */}
                {messages.map(
                  (message, index) => {
                    // Check whether the logged-in user
                    // sent this message.
                    const isCurrentUser =
                      Number(
                        message.sender_id,
                      ) ===
                      Number(currentUser?.id);

                    // Get the message before this one.
                    const previousMessage =
                      messages[index - 1];

                    // Check whether this message starts
                    // a new date section.
                    const startsNewDate =
                      !previousMessage ||
                      getMessageDateKey(
                        previousMessage.created_at,
                      ) !==
                      getMessageDateKey(
                        message.created_at,
                      );

                    return (
                      // Use the message ID as React's key.
                      <div
                        key={message.id}
                        className="message-entry"
                      >
                        {/* Display a date separator
                            before the first message of each day. */}
                        {startsNewDate && (
                          <div className="date-separator">
                            <span>
                              {formatMessageDate(
                                message.created_at,
                              )}
                            </span>
                          </div>
                        )}

                        {/* Use a different class depending
                            on who sent the message. */}
                        <div
                          className={`message-line ${isCurrentUser
                            ? "outgoing"
                            : "incoming"
                            }`}
                        >
                          {/* Message bubble. */}
                          <div className="message-bubble">
                            {/* Message text. */}
                            <p>
                              {message.content}
                            </p>

                            {/* Message time. */}
                            <time
                              dateTime={
                                message.created_at
                              }
                            >
                              {formatMessageTime(
                                message.created_at,
                              )}
                            </time>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* Form used to write and send messages. */}
              <MessageForm
                // Function used to send the message.
                onSendMessage={
                  handleSendMessage
                }

                // Function called when typing begins.
                onStartTyping={
                  handleStartTyping
                }

                // Function called when typing stops.
                onStopTyping={
                  handleStopTyping
                }

                // Disable the form when:
                //
                // - there is no active conversation
                // - the conversation is still loading
                disabled={
                  !conversation ||
                  isLoadingConversation
                }
              />
            </>
          ) : (
            // Display this section when
            // no user is selected.
            <div className="conversation-empty">
              {/* Decorative icon. */}
              <div
                className="empty-icon"
                aria-hidden="true"
              >
                ✦
              </div>

              <h2>Your conversations</h2>

              <p>
                Choose a contact to start
                messaging.
              </p>

              {/* On mobile, open the contacts list. */}
              <button
                type="button"
                className="mobile-contacts-button"
                onClick={() =>
                  setShowMobileContacts(true)
                }
              >
                Show contacts
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

// Export ChatPage so it can be imported
// and displayed by another file.
export default ChatPage;
