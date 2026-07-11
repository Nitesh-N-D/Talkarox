import { create } from 'zustand';
import { getChats, getMessageThread, getContactContext, sendMessage as sendMessageApi, markMessageRead } from '../services/api';
import { emitSendMessage, emitMessageRead, emitTyping } from '../services/socket';

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  contactContext: null,
  contactContextLoading: false,
  threadMessages: [],
  typingUsers: {},
  presenceMap: {},
  filter: 'ALL',
  loading: false,
  threadLoading: false,

  loadChats: async () => {
    set({ loading: true });
    try {
      const { data } = await getChats();
      set({ chats: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setActiveChat: async (chat, studentId = null) => {
    set({ activeChat: chat, threadLoading: true, threadMessages: [], contactContext: null, contactContextLoading: true });

    getContactContext(chat.userId)
      .then(({ data }) => set({ contactContext: data, contactContextLoading: false }))
      .catch(() => set({ contactContextLoading: false }));

    try {
      const { data } = await getMessageThread(chat.userId, studentId);
      set({ threadMessages: data, threadLoading: false });
    } catch {
      set({ threadLoading: false });
    }
  },

  setFilter: (filter) => set({ filter }),

  sendMessage: async (content, extra = {}) => {
    const { activeChat } = get();
    if (!activeChat) return;
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      senderId: 'me',
      recipientId: activeChat.userId,
      content,
      createdAt: new Date().toISOString(),
      pending: true,
      ...extra,
    };
    set((state) => ({ threadMessages: [...state.threadMessages, optimisticMessage] }));

    try {
      const { data } = await sendMessageApi({
        recipientId: activeChat.userId,
        content,
        ...extra,
      });
      emitSendMessage(data);
      set((state) => ({
        threadMessages: state.threadMessages.map((m) =>
          m.id === optimisticMessage.id ? data : m
        ),
      }));
      return data;
    } catch (err) {
      set((state) => ({
        threadMessages: state.threadMessages.map((m) =>
          m.id === optimisticMessage.id ? { ...m, pending: false, failed: true } : m
        ),
      }));
      throw err;
    }
  },

  receiveMessage: (message) => {
    set((state) => {
      const inActiveThread =
        state.activeChat &&
        (message.senderId === state.activeChat.userId ||
          message.recipientId === state.activeChat.userId);

      return {
        threadMessages: inActiveThread
          ? [...state.threadMessages, message]
          : state.threadMessages,
        chats: state.chats.map((c) =>
          c.userId === message.senderId || c.userId === message.recipientId
            ? {
                ...c,
                lastMessage: message.content,
                lastMessageTime: message.createdAt,
                unreadCount:
                  c.userId === message.senderId
                    ? (c.unreadCount || 0) + 1
                    : c.unreadCount,
              }
            : c
        ),
      };
    });
  },

  // Called when the RECIPIENT opens a thread — marks all unread messages
  // in that thread as read and emits socket events so the SENDER's
  // bubbles flip from single-tick to double-tick in real time.
  markAllThreadRead: (senderId) => {
    const { threadMessages } = get();
    const unread = threadMessages.filter(
      (m) => m.senderId === senderId && !m.readAt
    );
    if (unread.length === 0) return;

    const now = new Date().toISOString();

    // Mark locally immediately so the UI clears the unread badge at once
    set((state) => ({
      threadMessages: state.threadMessages.map((m) =>
        m.senderId === senderId && !m.readAt ? { ...m, readAt: now } : m
      ),
      chats: state.chats.map((c) =>
        c.userId === senderId ? { ...c, unreadCount: 0 } : c
      ),
    }));

    // Tell backend + emit socket so the sender's screen updates
    unread.forEach((m) => {
      markMessageRead(m.id).catch(() => {});
      emitMessageRead(m.id, senderId);
    });
  },

  // Called on the SENDER side when the socket fires message_read_receipt —
  // flips that message's readAt so the tick turns blue immediately.
  handleReadReceipt: (messageId) => {
    const now = new Date().toISOString();
    set((state) => ({
      threadMessages: state.threadMessages.map((m) =>
        m.id === messageId ? { ...m, readAt: now } : m
      ),
    }));
  },

  setTyping: (userId, typing) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: typing },
    }));
  },

  notifyTyping: (recipientId, typing) => emitTyping(recipientId, typing),

  updatePresence: (userId, status) => {
    set((state) => ({ presenceMap: { ...state.presenceMap, [userId]: status } }));
  },

  filteredChats: () => {
    const { chats, filter } = get();
    if (filter === 'ALL') return chats;
    if (filter === 'UNREAD') return chats.filter((c) => (c.unreadCount || 0) > 0);
    return chats.filter((c) => c.lastCategory === filter);
  },
}));