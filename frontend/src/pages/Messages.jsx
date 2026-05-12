import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  HiCamera,
  HiChevronLeft,
  HiEmojiHappy,
  HiMicrophone,
  HiOutlineSearch,
  HiPaperAirplane,
  HiPhone,
  HiPhoneMissedCall,
  HiPhoneOutgoing,
  HiPhotograph,
  HiPlus,
  HiThumbUp,
  HiVideoCamera,
} from "react-icons/hi";
import api from "../services/api";

const avatarGradients = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
];

const minutesAgo = (minutes) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

const seedThreads = [
  {
    id: "thread-amine",
    title: "Amine Said",
    unreadCount: 1,
    online: true,
    lastMessagePreview: "alakhatrou troujel",
    lastMessageAt: minutesAgo(12),
  },
  {
    id: "thread-lab",
    title: "Lab Support",
    unreadCount: 0,
    online: false,
    lastMessagePreview: "Your report is ready for review.",
    lastMessageAt: minutesAgo(80),
  },
  {
    id: "thread-reception",
    title: "Reception Desk",
    unreadCount: 2,
    online: true,
    lastMessagePreview: "Can we move your appointment to 4:30 PM?",
    lastMessageAt: minutesAgo(210),
  },
];

const seedMessages = {
  "thread-amine": [
    {
      id: "a1",
      type: "call",
      sender: "me",
      label: "Missed audio call",
      actionLabel: "Call again",
      direction: "outgoing",
      sentAt: minutesAgo(350),
    },
    {
      id: "a2",
      type: "text",
      sender: "me",
      body: "haw khalles",
      sentAt: minutesAgo(320),
      delivery: "delivered",
    },
    {
      id: "a3",
      type: "call",
      sender: "me",
      label: "Missed audio call",
      actionLabel: "Call again",
      direction: "outgoing",
      sentAt: minutesAgo(280),
    },
    {
      id: "a4",
      type: "call",
      sender: "them",
      label: "Missed audio call",
      actionLabel: "Call back",
      direction: "incoming",
      sentAt: minutesAgo(250),
    },
    {
      id: "a5",
      type: "text",
      sender: "me",
      body: "aa amine ken tnajjem ab3eth message de remerciement l jeanfils",
      sentAt: minutesAgo(20),
      delivery: "delivered",
    },
    {
      id: "a6",
      type: "text",
      sender: "me",
      body: "alakhatrou troujel",
      sentAt: minutesAgo(12),
      delivery: "delivered",
    },
  ],
  "thread-lab": [
    {
      id: "l1",
      type: "text",
      sender: "them",
      body: "Hello, we uploaded your latest blood panel.",
      sentAt: minutesAgo(140),
    },
    {
      id: "l2",
      type: "text",
      sender: "me",
      body: "Perfect, I will review it now.",
      sentAt: minutesAgo(133),
      delivery: "delivered",
    },
    {
      id: "l3",
      type: "text",
      sender: "them",
      body: "Your report is ready for review.",
      sentAt: minutesAgo(80),
    },
  ],
  "thread-reception": [
    {
      id: "r1",
      type: "text",
      sender: "them",
      body: "Good afternoon! This is CliniX reception.",
      sentAt: minutesAgo(260),
    },
    {
      id: "r2",
      type: "text",
      sender: "them",
      body: "Can we move your appointment to 4:30 PM?",
      sentAt: minutesAgo(210),
    },
  ],
};

const toTitleInitials = (name = "") =>
  name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2) || "CX";

const gradientFromText = (text = "") => {
  const seed = text
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarGradients[seed % avatarGradients.length];
};

const formatThreadTime = (dateValue) => {
  const date = new Date(dateValue);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (daysDiff < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatMessageDivider = (dateValue) =>
  new Date(dateValue)
    .toLocaleString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();

const Messages = () => {
  const [threads, setThreads] = useState([]);
  const [messagesByThread, setMessagesByThread] = useState({});
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("list");
  const endOfMessagesRef = useRef(null);
  const replyTimersRef = useRef([]);

  const filteredThreads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((thread) =>
      thread.title.toLowerCase().includes(query),
    );
  }, [searchTerm, threads]);

  const activeThread =
    threads.find((thread) => thread.id === selectedThreadId) || null;
  const activeMessages = useMemo(
    () => messagesByThread[selectedThreadId] || [],
    [messagesByThread, selectedThreadId],
  );

  useEffect(() => {
    const loadThreads = async () => {
      try {
        setLoadingThreads(true);
        const response = await api.get("/threads", {
          params: { role: "doctor" },
        });

        const incomingThreads = Array.isArray(response?.data?.threads)
          ? response.data.threads
          : [];

        if (!incomingThreads.length) {
          throw new Error("No chat threads were returned.");
        }

        const mappedThreads = incomingThreads.map((thread, index) => ({
          id: thread.id,
          title: thread.title || `Discussion ${index + 1}`,
          unreadCount: Number(thread.unreadCount) || 0,
          online: index === 0,
          lastMessagePreview: thread.lastMessagePreview || "No messages yet",
          lastMessageAt: thread.lastMessageAt || new Date().toISOString(),
          avatarGradient: avatarGradients[index % avatarGradients.length],
        }));

        setThreads(mappedThreads);
        setSelectedThreadId(mappedThreads[0].id);
      } catch (error) {
        console.error("Failed to load threads:", error);
        setUsingFallback(true);
        setThreads(
          seedThreads.map((thread, index) => ({
            ...thread,
            avatarGradient: avatarGradients[index % avatarGradients.length],
          })),
        );
        setMessagesByThread(seedMessages);
        setSelectedThreadId(seedThreads[0].id);
        toast.error("Using local messaging demo data.");
      } finally {
        setLoadingThreads(false);
      }
    };

    loadThreads();
  }, []);

  useEffect(() => {
    if (!selectedThreadId || usingFallback) return;
    if (messagesByThread[selectedThreadId]) return;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await api.get(`/threads/${selectedThreadId}/messages`);
        const incomingMessages = Array.isArray(response?.data?.messages)
          ? response.data.messages
          : [];

        const mappedMessages = incomingMessages.map((message, index) => ({
          id: message.id || `${selectedThreadId}-message-${index}`,
          type: "text",
          sender: message.senderRole === "doctor" ? "me" : "them",
          body: message.body || "",
          sentAt: message.sentAt || new Date().toISOString(),
          delivery: message.senderRole === "doctor" ? "delivered" : undefined,
        }));

        setMessagesByThread((prev) => ({
          ...prev,
          [selectedThreadId]: mappedMessages,
        }));
      } catch (error) {
        console.error("Failed to load messages:", error);
        toast.error("Could not load this discussion.");
        setMessagesByThread((prev) => ({
          ...prev,
          [selectedThreadId]:
            prev[selectedThreadId] ||
            seedMessages[selectedThreadId] ||
            [],
        }));
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedThreadId, usingFallback, messagesByThread]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, selectedThreadId]);

  useEffect(
    () => () => {
      replyTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    },
    [],
  );

  const updateThreadPreview = (threadId, messageText, sentAt) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              unreadCount: 0,
              lastMessagePreview: messageText,
              lastMessageAt: sentAt,
            }
          : thread,
      ),
    );
  };

  const appendMessage = (threadId, message) => {
    setMessagesByThread((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), message],
    }));
    updateThreadPreview(threadId, message.body || message.label, message.sentAt);
  };

  const markThreadAsRead = (threadId) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId ? { ...thread, unreadCount: 0 } : thread,
      ),
    );
  };

  const handleSelectThread = (threadId) => {
    setSelectedThreadId(threadId);
    setMobilePanel("chat");
    markThreadAsRead(threadId);
  };

  const simulateAutoReply = (threadId) => {
    const timerId = setTimeout(() => {
      const replies = [
        "Received. I will check this now.",
        "Thanks, noted.",
        "Understood. I will get back to you shortly.",
      ];
      const body = replies[Math.floor(Math.random() * replies.length)];
      const reply = {
        id: `local-reply-${Date.now()}`,
        type: "text",
        sender: "them",
        body,
        sentAt: new Date().toISOString(),
      };

      appendMessage(threadId, reply);
    }, 1200);

    replyTimersRef.current.push(timerId);
  };

  const pushMessage = async (body) => {
    const content = body.trim();
    if (!content || !selectedThreadId) return;

    const optimistic = {
      id: `local-${Date.now()}`,
      type: "text",
      sender: "me",
      body: content,
      sentAt: new Date().toISOString(),
      delivery: "delivered",
    };

    appendMessage(selectedThreadId, optimistic);
    setComposerValue("");

    if (usingFallback) {
      simulateAutoReply(selectedThreadId);
      return;
    }

    try {
      const response = await api.post(`/threads/${selectedThreadId}/messages`, {
        body: content,
      });

      const confirmed = response?.data?.message;
      if (!confirmed) return;

      setMessagesByThread((prev) => ({
        ...prev,
        [selectedThreadId]: (prev[selectedThreadId] || []).map((item) =>
          item.id === optimistic.id
            ? {
                ...item,
                id: confirmed.id || item.id,
                sentAt: confirmed.sentAt || item.sentAt,
              }
            : item,
        ),
      }));
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Message sent locally. Server sync failed.");
      setUsingFallback(true);
      simulateAutoReply(selectedThreadId);
    }
  };

  const handleCallAction = () => {
    if (!activeThread) return;
    toast.success(`Calling ${activeThread.title}...`);
  };

  const shouldRenderDivider = (messages, index) => {
    if (index === 0) return true;
    const previous = new Date(messages[index - 1].sentAt).getTime();
    const current = new Date(messages[index].sentAt).getTime();
    return current - previous > 45 * 60 * 1000;
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 p-2 sm:p-4 lg:p-6">
      <div className="mx-auto h-[calc(100vh-9rem)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex h-full">
          <aside
            className={`h-full w-full flex-col border-r border-slate-200 bg-white md:flex md:w-96 ${
              mobilePanel === "chat" ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
              <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
              <p className="mt-1 text-sm text-slate-500">
                Select a discussion to open the conversation.
              </p>
              <div className="relative mt-4">
                <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search discussion"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4">
              {loadingThreads ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Loading discussions...
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No discussion found for this search.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredThreads
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
                    )
                    .map((thread) => {
                      const isSelected = thread.id === selectedThreadId;
                      const threadGradient =
                        thread.avatarGradient || gradientFromText(thread.title);

                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => handleSelectThread(thread.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition-all ${
                            isSelected
                              ? "border-blue-200 bg-blue-50 shadow-sm"
                              : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div
                                className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ${
                                  threadGradient
                                }`}
                              >
                                {toTitleInitials(thread.title)}
                              </div>
                              {thread.online ? (
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {thread.title}
                                </p>
                                <span className="shrink-0 text-xs text-slate-500">
                                  {formatThreadTime(thread.lastMessageAt)}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center justify-between gap-2">
                                <p
                                  className={`truncate text-xs ${
                                    thread.unreadCount
                                      ? "font-medium text-slate-800"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {thread.lastMessagePreview || "No messages yet"}
                                </p>
                                {thread.unreadCount ? (
                                  <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                                    {thread.unreadCount}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </aside>

          <section
            className={`h-full flex-1 flex-col bg-[#f3f4f6] md:flex ${
              mobilePanel === "list" ? "hidden md:flex" : "flex"
            }`}
          >
            {!activeThread ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-slate-500">
                Select a discussion to start messaging.
              </div>
            ) : (
              <>
                <header className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMobilePanel("list")}
                      className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
                      aria-label="Back to discussions"
                    >
                      <HiChevronLeft className="h-5 w-5" />
                    </button>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ${
                        activeThread.avatarGradient || "from-blue-500 to-indigo-600"
                      }`}
                    >
                      {toTitleInitials(activeThread.title)}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {activeThread.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activeThread.online ? "Active now" : "Last seen recently"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCallAction}
                      className="rounded-full p-2.5 text-blue-600 transition hover:bg-blue-50"
                      aria-label="Call"
                    >
                      <HiPhone className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCallAction}
                      className="rounded-full p-2.5 text-blue-600 transition hover:bg-blue-50"
                      aria-label="Video call"
                    >
                      <HiVideoCamera className="h-5 w-5" />
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 px-3 py-4 sm:px-6">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Loading messages...
                    </div>
                  ) : activeMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No messages yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeMessages.map((message, index) => {
                        const isMine = message.sender === "me";
                        const showDivider = shouldRenderDivider(
                          activeMessages,
                          index,
                        );

                        return (
                          <div key={message.id || `${message.sentAt}-${index}`}>
                            {showDivider ? (
                              <p className="mb-2 text-center text-xs font-medium tracking-wide text-slate-500">
                                {formatMessageDivider(message.sentAt)}
                              </p>
                            ) : null}

                            <div
                              className={`flex ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              {message.type === "call" ? (
                                <div className="max-w-[88%] rounded-3xl bg-slate-200 p-3 text-slate-900 shadow-sm sm:max-w-[66%]">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                        message.direction === "incoming"
                                          ? "bg-red-500 text-white"
                                          : "bg-slate-400 text-white"
                                      }`}
                                    >
                                      {message.direction === "incoming" ? (
                                        <HiPhoneMissedCall className="h-5 w-5" />
                                      ) : (
                                        <HiPhoneOutgoing className="h-5 w-5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-lg font-semibold leading-6">
                                        {message.label || "Missed audio call"}
                                      </p>
                                      <p className="text-sm text-slate-600">
                                        {new Date(message.sentAt).toLocaleTimeString(
                                          "en-US",
                                          {
                                            hour: "numeric",
                                            minute: "2-digit",
                                          },
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleCallAction}
                                    className="mt-3 w-full rounded-2xl bg-slate-100 py-2.5 text-center text-xl font-semibold transition hover:bg-slate-50"
                                  >
                                    {message.actionLabel || "Call again"}
                                  </button>
                                </div>
                              ) : (
                                <div className="max-w-[88%] sm:max-w-[70%]">
                                  <div
                                    className={`rounded-[26px] px-4 py-3 text-[18px] leading-tight shadow-sm ${
                                      isMine
                                        ? "rounded-br-lg bg-gradient-to-b from-blue-500 to-blue-700 text-white"
                                        : "rounded-bl-lg bg-slate-200 text-slate-900"
                                    }`}
                                  >
                                    {message.body}
                                  </div>
                                  {isMine && message.delivery ? (
                                    <p className="mt-1 pr-2 text-right text-xs text-slate-500">
                                      {message.delivery}
                                    </p>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div ref={endOfMessagesRef} />
                </div>

                <footer className="border-t border-slate-200 bg-white px-2 py-2 sm:px-4">
                  <div className="flex items-center gap-1 text-blue-700 sm:gap-2">
                    <button
                      type="button"
                      className="rounded-full p-2 transition hover:bg-blue-50"
                      aria-label="More actions"
                    >
                      <HiPlus className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      className="rounded-full p-2 transition hover:bg-blue-50"
                      aria-label="Open camera"
                    >
                      <HiCamera className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      className="rounded-full p-2 transition hover:bg-blue-50"
                      aria-label="Send photo"
                    >
                      <HiPhotograph className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      className="hidden rounded-full p-2 transition hover:bg-blue-50 sm:inline-flex"
                      aria-label="Record voice"
                    >
                      <HiMicrophone className="h-6 w-6" />
                    </button>

                    <form
                      className="mx-1 flex flex-1 items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        pushMessage(composerValue);
                      }}
                    >
                      <input
                        value={composerValue}
                        onChange={(event) => setComposerValue(event.target.value)}
                        placeholder="Aa"
                        className="w-full bg-transparent text-[18px] text-slate-700 outline-none placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        className="rounded-full p-1.5 text-blue-700 transition hover:bg-blue-50"
                        aria-label="Emoji"
                      >
                        <HiEmojiHappy className="h-6 w-6" />
                      </button>
                    </form>

                    {composerValue.trim() ? (
                      <button
                        type="button"
                        onClick={() => pushMessage(composerValue)}
                        className="rounded-full p-2 text-blue-700 transition hover:bg-blue-50"
                        aria-label="Send message"
                      >
                        <HiPaperAirplane className="h-6 w-6" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => pushMessage("Like")}
                        className="rounded-full p-2 text-blue-700 transition hover:bg-blue-50"
                        aria-label="Send like"
                      >
                        <HiThumbUp className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Messages;
