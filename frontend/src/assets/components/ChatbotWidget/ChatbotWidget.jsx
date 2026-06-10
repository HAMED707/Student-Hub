import { useState, useEffect, useRef } from "react";

const botAvatar =
  "data:image/svg+xml,%3Csvg width='128' height='128' viewBox='0 0 128 128' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='64' cy='64' r='60' fill='%23F8FBFF' stroke='%234285F4' stroke-width='8'/%3E%3Cpath d='M35 44C44 26 83 26 93 44' stroke='%23FF735C' stroke-width='8' stroke-linecap='round'/%3E%3Cpath d='M30 63C30 53 38 45 48 45H80C90 45 98 53 98 63V80C98 91 89 100 78 100H50C39 100 30 91 30 80V63Z' fill='%23FFFFFF' stroke='%2320447A' stroke-width='6'/%3E%3Cpath d='M48 45V33M80 45V33' stroke='%2320447A' stroke-width='6' stroke-linecap='round'/%3E%3Ccircle cx='52' cy='72' r='6' fill='%23FF735C'/%3E%3Ccircle cx='76' cy='72' r='6' fill='%23FF735C'/%3E%3Cpath d='M55 88H73' stroke='%2320447A' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M25 62C16 62 13 70 13 78C13 86 17 94 27 94V62Z' fill='%2320447A'/%3E%3Cpath d='M103 62C112 62 115 70 115 78C115 86 111 94 101 94V62Z' fill='%2320447A'/%3E%3Cpath d='M18 52V42M110 52V42' stroke='%23FF735C' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M20 42L12 48M108 42L116 48' stroke='%23FF735C' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E";

// --- المكونات المساعدة للأيقونات ---
function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg className="h-[18px] w-[18px] text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" /><path d="M8 22h8" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="h-5 w-5 -rotate-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4 text-gray-500 hover:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function Sparkle() {
  return <span className="mt-0.5 shrink-0 select-none text-sm text-[#4D90FF]">{"\u2726"}</span>;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  // داتا المحادثة التفاعلية
  const [messages, setMessages] = useState([
    { id: 1, sender: "bot", type: "text", text: "Hi, you can ask me anything about student accommodation." },
    { id: 2, sender: "bot", type: "suggestions", text: "Here are some things I can help you with." },
    { id: 3, sender: "user", text: "Hello there!" },
    { id: 4, sender: "bot", type: "text", text: "Hello there! How may I assist you today?", showCopy: true },
    { id: 5, sender: "user", text: "I'm looking for a room near my university." }
  ]);

  const suggestionChips = [
    "Find a room",
    "Near university",
    "Roommate help",
    "Booking steps",
    "Price range",
    "List property",
  ];

  const messagesEndRef = useRef(null);
  const nextMessageIdRef = useRef(6);

  const getNextMessageId = () => {
    const nextId = nextMessageIdRef.current;
    nextMessageIdRef.current += 1;
    return nextId;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    
    const userMsgId = getNextMessageId();
    setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: text }]);
    setInputValue("");

    // رد الـ AI التفاعلي المحاكي
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { 
          id: getNextMessageId(), 
          sender: "bot", 
          type: "text", 
          text: `Sure. I can help with "${text}" and suggest suitable accommodation options, prices, and next steps.`,
          showCopy: true 
        }
      ]);
    }, 800);
  };

  return (
    <>
      {/* 1. فقاعة الشات المنبثقة (ثابتة ومتجاوبة في الركن) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-5 right-5 z-[100] flex items-center justify-end sm:bottom-8 sm:right-8"
        >
          <span className="absolute right-12 whitespace-nowrap rounded-l-full bg-[#6B9CFF] py-2 pl-5 pr-8 text-xs font-medium text-white shadow-md transition-all duration-300 ease-in-out opacity-0 translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 pointer-events-none hidden sm:inline-block">
            Let's Chat
          </span>
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl ring-2 ring-[#4285F4]/10 transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16">
            <img src={botAvatar} alt="Chatbot avatar" className="h-11 w-11 rounded-full object-cover sm:h-12 sm:w-12" />
          </span>
        </button>
      )}

      {/* 2. نافذة المحادثة (مقاس مثالي ومحكم ومتجاوب) */}
      {isOpen && (
        <section 
          className="fixed z-[100] flex flex-col overflow-hidden bg-[#E9ECEF] shadow-2xl transition-all duration-300
            bottom-0 right-0 h-full w-full rounded-none 
            sm:bottom-8 sm:right-8 sm:h-[640px] sm:w-[430px] sm:rounded-2xl sm:border sm:border-gray-300/40
            lg:w-[460px]"
        >
          {/* الهيدر الأنيق */}
          <header className="flex h-[72px] shrink-0 items-center gap-3 bg-[#4285F4] px-5 text-white">
            <div className="h-10 w-10 rounded-full bg-white p-0.5 shadow-sm">
              <img src={botAvatar} alt="Chatbot avatar" className="h-full w-full rounded-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold tracking-wide">Chatbot AI</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus:outline-none"
            >
              <CloseIcon />
            </button>
          </header>

          {/*منطقة عرض الرسائل وبداخلها الـ Suggestions المنسقة */}
          <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-6">
            {messages.map((msg) => (
              <div key={msg.id} className="w-full">
                {msg.sender === "bot" ? (
                  <div className="flex w-full items-start gap-2">
                    <div className="relative flex max-w-[88%] gap-2 rounded-[20px] rounded-tl-none bg-[#1A1C1E] px-4 py-3.5 text-sm leading-relaxed text-gray-200 shadow-sm sm:max-w-[84%]">
                      <Sparkle />
                      <div className="flex-1">
                        {msg.type === "suggestions" ? (
                          <>
                            <p className="mb-3 text-gray-300">{msg.text}</p>
                            {/* تنسيق الـ Chips لتبدو منظمة تماماً */}
                            <div className="flex flex-wrap gap-2.5 pt-1">
                              {suggestionChips.map((chip, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSendMessage(chip)}
                                  className="inline-flex items-center rounded-full border border-[#4285F4]/70 bg-transparent px-3.5 py-1.5 text-xs font-medium text-gray-300 transition hover:border-[#4285F4] hover:bg-gray-800 hover:text-white active:scale-95"
                                  >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p>{msg.text}</p>
                        )}
                      </div>
                    </div>
                    {msg.showCopy && (
                      <button 
                        type="button" 
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                        }}
                        className="mt-2.5 rounded-md p-1 transition hover:bg-black/5 shrink-0"
                        title="Copy text"
                      >
                        <CopyIcon />
                      </button>
                    )}
                  </div>
                ) : (
                  /* رسائل المستخدم الجانبية */
                  <div className="flex w-full justify-end">
                    <div className="ml-auto max-w-[82%] rounded-[20px] rounded-tr-none bg-[#4285F4] px-4 py-3.5 text-sm leading-relaxed text-white shadow-sm sm:max-w-[76%]">
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* منطقة الإدخال السفلية (Footer) */}
          <footer className="shrink-0 bg-[#E9ECEF] px-5 pb-5 pt-2">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
              className="flex items-center gap-3"
            >
              <div className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-gray-800/20 bg-[#131517] px-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about rooms, prices, or booking..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none"
                />
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10"
                >
                  <MicrophoneIcon />
                </button>
              </div>
              <button
                type="submit"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4285F4] shadow-md transition hover:bg-[#3370D4] focus:outline-none active:scale-95"
              >
                <SendIcon />
              </button>
            </form>
          </footer>
        </section>
      )}
    </>
  );
}
