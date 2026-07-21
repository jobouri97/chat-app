import { useEffect, useRef, useState } from "react";
import Button from "./Button";

function MessageForm({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled = false,
}) {
  const [messageText, setMessageText] = useState("");
  const typingTimeoutRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = messageText.trim();

    if (!trimmedMessage) {
      return;
    }

    clearTimeout(typingTimeoutRef.current);
    onSendMessage(trimmedMessage);
    onStopTyping();
    setMessageText("");
  }

  function handleTextChange(event) {
    const value = event.target.value;
    setMessageText(value);

    clearTimeout(typingTimeoutRef.current);

    if (!value.trim()) {
      onStopTyping();
      return;
    }

    onStartTyping();

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1500);
  }

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      onStopTyping();
    };
  }, [onStopTyping]);

  return (
    <form className="message-form" onSubmit={handleSubmit}>
      <textarea
        value={messageText}
        onChange={handleTextChange}
        onBlur={() => {
          clearTimeout(typingTimeoutRef.current);
          onStopTyping();
        }}
        placeholder="Write a message..."
        disabled={disabled}
        aria-label="Message"
      />

      <Button
        type="submit"
        disabled={disabled || !messageText.trim()}
        className="send-button"
      >
        Send
      </Button>
    </form>
  );
}

export default MessageForm;
