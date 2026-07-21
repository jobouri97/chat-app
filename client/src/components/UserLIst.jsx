import Button from "./Button";

function UserList({
  users,
  typingUserIds,
  onlineUserIds,
  onUserClick,
}) {
  return (
    <div className="contact-list">
      {users.map((user) => {
        const userId = Number(user.id);
        const isTyping = typingUserIds.has(userId);
        const isOnline = onlineUserIds.has(userId);

        return (
          <div key={user.id} className="contact-row">
            <Button
              onClick={() => onUserClick(user.id)}
              className="contact-button"
            >
              <span className="contact-avatar" aria-hidden="true">
                {user.username.charAt(0).toUpperCase()}
                <span
                  className={`presence-dot ${isOnline ? "online" : "offline"}`}
                />
              </span>

              <span className="contact-copy">
                <span className="contact-name">{user.username}</span>
                <span className={isTyping ? "typing-label" : "contact-status"}>
                  {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
                </span>
              </span>

              {user.unreadCount > 0 && (
                <span className="unread-badge">{user.unreadCount}</span>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export default UserList;
