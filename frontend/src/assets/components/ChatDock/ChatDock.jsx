import { useGlobalMessaging } from "../../../context/messagingContext.js";
import { ChatWindow } from "./ChatWindow.jsx";

export default function ChatDock() {
  const { openWindows, closeChat, minimizeChat } = useGlobalMessaging();

  return (
    <div className="hidden lg:block">
      {openWindows.map((window, index) => (
        <ChatWindow
          key={window.conversationId}
          conversationId={window.conversationId}
          minimized={window.minimized}
          index={index}
          onMinimize={() => minimizeChat(window.conversationId)}
          onClose={() => closeChat(window.conversationId)}
        />
      ))}
    </div>
  );
}
