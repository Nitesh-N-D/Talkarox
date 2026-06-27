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
  filter: 'ALL', // ALL | UNREAD | ACADEMIC | URGENT | ADMINISTRATIVE | HOMEWORK_HELP | PARENT_CONCERN
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
        (message.senderId === state.activeChat.userId || message.recipientId === state.activeChat.userId);

      return {
        threadMessages: inActiveThread
          ? [...state.threadMessages, message]
          : state.threadMessages,
        chats: state.chats.map((c) =>
          c.userId === message.senderId || c.userId === message.recipientId
            ? { ...c, lastMessage: message.content, lastMessageTime: message.createdAt, unreadCount: c.userId === message.senderId ? (c.unreadCount || 0) + 1 : c.unreadCount }
            : c
        ),
      };
    });
  },

  markAsRead: (messageId, senderId) => {
    emitMessageRead(messageId, senderId);
    markMessageRead(messageId).catch(() => {});
    set((state) => ({
      threadMessages: state.threadMessages.map((m) =>
        m.id === messageId ? { ...m, readAt: new Date().toISOString() } : m
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
