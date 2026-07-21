import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser, getUsers } from "../APIs/userAPI.js";
import { getMessages, markMessagesAsRead } from "../APIs/messageAPI.js";
import {
  getMyConversations,
  startConversationAPI,
} from "../APIs/conversationAPI.js";
import UserList from "../components/UserLIst.jsx";
import MessageForm from "../components/MessageForm.jsx";
import {
  connectSocket,
  disconnectSocket,
  offSocketConnected,
  onSocketConnected,
} from "../utils/sockets/connectionSocket.js";
import {
  offNewMessage,
  onNewMessage,
  sendMessage as sendSocketMessage,
} from "../utils/sockets/messageSocket.js";
import {
  joinConversation,
  leaveConversation,
} from "../utils/sockets/conversationSocket.js";
import {
  onOnlineUsers,
  offOnlineUsers,
  onUserOnline,
  offUserOnline,
  onUserOffline,
  offUserOffline,
} from "../utils/sockets/presenceSocket.js";
import {
  startTyping,
  stopTyping,
  onUserStartedTyping,
  offUserStartedTyping,
  onUserStoppedTyping,
  offUserStoppedTyping,
} from "../utils/sockets/typingSocket.js";

function getMessageDateKey(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatMessageDate(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const messageDateKey = getMessageDateKey(timestamp);

  if (messageDateKey === getMessageDateKey(today)) {
    return "Today";
  }

  if (messageDateKey === getMessageDateKey(yesterday)) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatMessageTime(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function ChatPage({ setAuthenticatedUser }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [error, setError] = useState("");
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  const [typingUserIds, setTypingUserIds] =
    useState(() => new Set());
  const [conversationSummaries, setConversationSummaries] =
    useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [showMobileContacts, setShowMobileContacts] = useState(false);
  const selectionRequestId = useRef(0);
  const activeConversationIdRef = useRef(null);
  const currentUserIdRef = useRef(null);

  activeConversationIdRef.current = conversation?.id ?? null;
  currentUserIdRef.current = currentUser?.id ?? null;

  const selectableUsers = useMemo(
    () =>
      allUsers
        .filter(
          (user) => Number(user.id) !== Number(currentUser?.id),
        )
        .map((user) => {
          const summary = conversationSummaries.find(
            (item) =>
              Number(item.other_user_id) === Number(user.id),
          );

          return {
            ...user,
            conversationId: summary?.id ?? null,
            unreadCount: Number(summary?.unread_count ?? 0),
            lastMessageAt:
              summary?.last_message_at ?? summary?.created_at ?? null,
          };
        })
        .sort((firstUser, secondUser) => {
          const firstTime = firstUser.lastMessageAt
            ? new Date(firstUser.lastMessageAt).getTime()
            : 0;
          const secondTime = secondUser.lastMessageAt
            ? new Date(secondUser.lastMessageAt).getTime()
            : 0;

          return (
            secondTime - firstTime ||
            firstUser.username.localeCompare(secondUser.username)
          );
        }),
    [allUsers, conversationSummaries, currentUser],
  );

  const selectedUser = useMemo(
    () =>
      allUsers.find(
        (user) => Number(user.id) === Number(selectedUserId),
      ),
    [allUsers, selectedUserId],
  );

  const searchedUsers = useMemo(() => {
    const searchText = userSearch.trim().toLocaleLowerCase();

    if (!searchText) {
      return selectableUsers;
    }

    return selectableUsers.filter((user) =>
      user.username.toLocaleLowerCase().includes(searchText),
    );
  }, [selectableUsers, userSearch]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return undefined;

    function handleOnlineUsers({ userIds }) {
      setOnlineUserIds(
        new Set(userIds.map((id) => Number(id))),
      );
    }

    function handleUserOnline({ userId }) {
      setOnlineUserIds((current) => {
        const updated = new Set(current);
        updated.add(Number(userId));
        return updated;
      });
    }

    function handleUserOffline({ userId }) {
      setOnlineUserIds((current) => {
        const updated = new Set(current);
        updated.delete(Number(userId));
        return updated;
      });
    }

    function handleStartedTyping({ userId }) {
      setTypingUserIds((current) => {
        const updated = new Set(current);
        updated.add(Number(userId));
        return updated;
      });
    }

    function handleStoppedTyping({ userId }) {
      setTypingUserIds((current) => {
        const updated = new Set(current);
        updated.delete(Number(userId));
        return updated;
      });
    }

    function handleConversationMessage(message) {
      const conversationId = Number(
        message.conversation_id ?? message.conversationId,
      );
      const senderId = Number(
        message.sender_id ?? message.senderId,
      );

      setConversationSummaries((current) => {
        const existing = current.find(
          (item) => Number(item.id) === conversationId,
        );
        const shouldIncrement =
          senderId !== Number(currentUserIdRef.current) &&
          conversationId !== Number(activeConversationIdRef.current);

        if (!existing) {
          return [
            ...current,
            {
              id: conversationId,
              other_user_id: senderId,
              last_message_at: message.created_at,
              unread_count: shouldIncrement ? 1 : 0,
            },
          ];
        }

        return current.map((item) =>
          Number(item.id) === conversationId
            ? {
                ...item,
                last_message_at: message.created_at,
                unread_count:
                  Number(item.unread_count ?? 0) +
                  (shouldIncrement ? 1 : 0),
              }
            : item,
        );
      });
    }

    onOnlineUsers(handleOnlineUsers);
    onUserOnline(handleUserOnline);
    onUserOffline(handleUserOffline);
    onUserStartedTyping(handleStartedTyping);
    onUserStoppedTyping(handleStoppedTyping);
    onNewMessage(handleConversationMessage);

    connectSocket(token);

    async function loadInitialData() {
      try {
        const [usersData, currentUserData, conversationsData] =
          await Promise.all([
            getUsers(token),
            getCurrentUser(token),
            getMyConversations(token),
          ]);

        setAllUsers(usersData.users);
        setCurrentUser(currentUserData.user);
        setConversationSummaries(conversationsData.conversations);
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    loadInitialData();

    return () => {
      offOnlineUsers(handleOnlineUsers);
      offUserOnline(handleUserOnline);
      offUserOffline(handleUserOffline);
      offUserStartedTyping(handleStartedTyping);
      offUserStoppedTyping(handleStoppedTyping);
      offNewMessage(handleConversationMessage);
      disconnectSocket();
    };
  }, []);//end of useEffect

  useEffect(() => {
    if (!conversation?.id) {
      return undefined;
    }

    const conversationId = conversation.id;

    function handleJoinResult(result) {
      if (!result?.success) {
        setError(
          result?.message || "Could not join the conversation.",
        );
      }
    }//

    function joinActiveConversation() {
      joinConversation(conversationId, handleJoinResult);
    }

    function handleNewMessage(message) {
      const messageConversationId = message.conversation_id ?? message.conversationId;

      if (Number(messageConversationId) !== Number(conversationId)) {
        return;
      }

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (currentMessage) =>
            Number(currentMessage.id) === Number(message.id),
        );

        return alreadyExists
          ? currentMessages
          : [...currentMessages, message];
      });
    }


    joinActiveConversation();
    onSocketConnected(joinActiveConversation);
    onNewMessage(handleNewMessage);

    return () => {
      offSocketConnected(joinActiveConversation);
      offNewMessage(handleNewMessage);
      leaveConversation(conversationId);
    };
  }, [conversation?.id, selectedUserId]);

  async function handleStartConversation(userId) {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("You must be logged in.");
      return;
    }

    const requestId = selectionRequestId.current + 1;
    selectionRequestId.current = requestId;

    setSelectedUserId(userId);
    setShowMobileContacts(false);
    setConversation(null);
    setMessages([]);
    setError("");
    setIsLoadingConversation(true);

    try {
      const conversationData = await startConversationAPI(
        userId,
        token,
      );
      const selectedConversation = conversationData.conversation;

      const messagesData = await getMessages(
        selectedConversation.id,
        token,
      );

      if (requestId !== selectionRequestId.current) {
        return;
      }

      setConversation(selectedConversation);
      setMessages(messagesData.messages);

      await markMessagesAsRead(selectedConversation.id, token);

      setConversationSummaries((current) => {
        const existing = current.find(
          (item) =>
            Number(item.id) === Number(selectedConversation.id),
        );

        if (!existing) {
          return [
            ...current,
            {
              ...selectedConversation,
              other_user_id: Number(userId),
              unread_count: 0,
              last_message_at:
                messagesData.messages.at(-1)?.created_at ?? null,
            },
          ];
        }

        return current.map((item) =>
          Number(item.id) === Number(selectedConversation.id)
            ? { ...item, unread_count: 0 }
            : item,
        );
      });
    } catch (conversationError) {
      if (requestId === selectionRequestId.current) {
        setError(conversationError.message);
      }
    } finally {
      if (requestId === selectionRequestId.current) {
        setIsLoadingConversation(false);
      }
    }
  }

  function handleSendMessage(messageText) {
    setError("");

    if (!conversation?.id) {
      setError("Select a conversation first.");
      return;
    }

    sendSocketMessage(
      conversation.id,
      messageText,
      (result) => {
        if (!result?.success) {
          setError(
            result?.message || "Could not send the message.",
          );
        }
      },
    );
  }

  const handleStartTyping = useCallback(() => {
    if (conversation?.id) {
      startTyping(conversation.id);
    }
  }, [conversation?.id]);

  const handleStopTyping = useCallback(() => {
    if (conversation?.id) {
      stopTyping(conversation.id);
    }
  }, [conversation?.id]);

  function handleLogout() {
    localStorage.removeItem("token");
    setAuthenticatedUser(null);
  }

  return (
    <main className="chat-page">
      <section className={`chat-shell ${showMobileContacts ? "show-contacts" : "show-conversation"}`}>
        <aside className="chat-sidebar">
          <header className="sidebar-header">
            <div className="brand-lockup">
              <span className="brand-mark small" aria-hidden="true">C</span>
              <div>
                <span className="eyebrow">Messages</span>
                <h1>Chatter</h1>
              </div>
            </div>
            <div className="account-actions">
              {currentUser && (
                <div className="header-identity" title={`Logged in as ${currentUser.username}`}>
                  <span className="profile-label">Signed in as</span>
                  <strong>{currentUser.username}</strong>
                </div>
              )}
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2.75v8.5" />
                  <path d="M7.4 5.7a8 8 0 1 0 9.2 0" />
                </svg>
              </button>
              <button
                type="button"
                className="mobile-view-button"
                onClick={() => setShowMobileContacts(false)}
                aria-label="Show conversation"
                title="Show conversation"
              >
                →
              </button>
            </div>
          </header>

          <div className="contact-search">
            <span aria-hidden="true">⌕</span>
            <label className="sr-only" htmlFor="user-search">Search contacts</label>
            <input
              id="user-search"
              type="search"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search conversations"
            />
          </div>

          <div className="contacts-heading">
            <span>Contacts</span>
            <span>{searchedUsers.length}</span>
          </div>

          <UserList
            users={searchedUsers}
            typingUserIds={typingUserIds}
            onUserClick={handleStartConversation}
            onlineUserIds={onlineUserIds}
          />
        </aside>

        <section className="conversation-panel">
          {error && <p className="chat-alert">{error}</p>}

          {selectedUser ? (
            <>
              <header className="conversation-header">
                <button
                  type="button"
                  className="mobile-view-button"
                  onClick={() => setShowMobileContacts(true)}
                  aria-label="Show contacts"
                  title="Show contacts"
                >
                  ☰
                </button>
                <span className="conversation-avatar" aria-hidden="true">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h2>{selectedUser.username}</h2>
                  <p className={typingUserIds.has(Number(selectedUser.id)) ? "typing-label" : "conversation-status"}>
                    {typingUserIds.has(Number(selectedUser.id))
                      ? "typing..."
                      : onlineUserIds.has(Number(selectedUser.id))
                        ? "Online now"
                        : "Offline"}
                  </p>
                </div>
              </header>

              <div className="message-feed">
                {isLoadingConversation && (
                  <p className="empty-message">Loading messages...</p>
                )}

                {!isLoadingConversation && messages.length === 0 && (
                  <div className="empty-message">
                    <span>👋</span>
                    <p>No messages yet. Say hello!</p>
                  </div>
                )}

                {messages.map((message, index) => {
                  const isCurrentUser = Number(message.sender_id) === Number(currentUser?.id);
                  const previousMessage = messages[index - 1];
                  const startsNewDate =
                    !previousMessage ||
                    getMessageDateKey(previousMessage.created_at) !==
                      getMessageDateKey(message.created_at);

                  return (
                    <div key={message.id} className="message-entry">
                      {startsNewDate && (
                        <div className="date-separator">
                          <span>{formatMessageDate(message.created_at)}</span>
                        </div>
                      )}

                      <div className={`message-line ${isCurrentUser ? "outgoing" : "incoming"}`}>
                        <div className="message-bubble">
                          <p>{message.content}</p>
                          <time dateTime={message.created_at}>
                            {formatMessageTime(message.created_at)}
                          </time>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <MessageForm
                onSendMessage={handleSendMessage}
                onStartTyping={handleStartTyping}
                onStopTyping={handleStopTyping}
                disabled={!conversation || isLoadingConversation}
              />
            </>
          ) : (
            <div className="conversation-empty">
              <div className="empty-icon" aria-hidden="true">✦</div>
              <h2>Your conversations</h2>
              <p>Choose a contact to start messaging.</p>
              <button
                type="button"
                className="mobile-contacts-button"
                onClick={() => setShowMobileContacts(true)}
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

export default ChatPage;
