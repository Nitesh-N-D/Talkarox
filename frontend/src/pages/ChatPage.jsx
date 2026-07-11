import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Plus, X, UserSearch } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';
import ChatListItem from '../components/chat/ChatListItem';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import ChatContextPanel from '../components/chat/ChatContextPanel';
import WhiteboardModal from '../components/whiteboard/WhiteboardModal';
import EmptyChatIllustration from '../components/illustrations/EmptyChatIllustration';
import PresenceAvatar from '../components/common/PresenceAvatar';
import Button from '../components/common/Button';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { getSocket } from '../services/socket';
import { searchMessages, uploadWhiteboardImage, searchTeachers } from '../services/api';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HOMEWORK_HELP', label: 'Homework' },
];

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const {
    chats, activeChat, contactContext, threadMessages, loading, threadLoading, filter,
    loadChats, setActiveChat, setFilter, sendMessage, receiveMessage,
    setTyping, notifyTyping, typingUsers, filteredChats, updatePresence,
    markAllThreadRead, handleReadReceipt,
  } = useChatStore();

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Socket listener — handles all real-time events including read receipts
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('new_message', (msg) => receiveMessage(msg));
    socket.on('typing_indicator', ({ recipientId, typing }) => setTyping(recipientId, typing));
    socket.on('user_status_changed', ({ userId, status }) => updatePresence(userId, status));

    // Fired on the SENDER when the recipient marks a message as read.
    // Flips the single grey tick → double blue tick on the sender's screen.
    socket.on('message_read_receipt', ({ messageId }) => {
      handleReadReceipt(messageId);
    });

    return () => {
      socket.off('new_message');
      socket.off('typing_indicator');
      socket.off('user_status_changed');
      socket.off('message_read_receipt');
    };
  }, [receiveMessage, setTyping, updatePresence, handleReadReceipt]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [threadMessages]);

  // When thread finishes loading, mark all messages from the other person as read.
  // This fires on the RECIPIENT side — tells the sender their messages were seen.
  useEffect(() => {
    if (!threadLoading && activeChat && threadMessages.length > 0) {
      markAllThreadRead(activeChat.userId);
    }
  }, [threadLoading, activeChat?.userId]);

  // Also mark as read when new messages arrive while the thread is open
  useEffect(() => {
    if (!activeChat || !threadMessages.length) return;
    const latest = threadMessages[threadMessages.length - 1];
    if (latest && latest.senderId === activeChat.userId && !latest.readAt) {
      markAllThreadRead(activeChat.userId);
    }
  }, [threadMessages.length, activeChat?.userId]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await searchMessages(searchQuery);
        setSearchResults(data);
      } catch { setSearchResults([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setShowMobileThread(true);
  };

  const handleSend = async (content, extra) => {
    try { await sendMessage(content, extra); }
    catch { toast.error('Message failed to send'); }
  };

  const handleWhiteboardSave = async (dataUrl) => {
    try {
      const { data } = await uploadWhiteboardImage(dataUrl);
      await handleSend('🎨 Whiteboard sketch', { messageType: 'IMAGE', fileUrl: data.imageUrl });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save sketch');
    }
  };

  const handleStartNewChat = (teacher) => {
    setShowNewChat(false);
    handleSelectChat({
      userId: teacher.id,
      name: teacher.fullName,
      status: teacher.status,
      avatarUrl: teacher.avatarUrl,
      lastMessage: '',
      unreadCount: 0,
    });
  };

  const visibleChats = filteredChats();
  const isWithinOfficeHours = contactContext ? checkOfficeHours(contactContext.officeHours) : true;

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">

      {/* Chat list */}
      <div className={clsx(
        'w-full md:w-80 lg:w-96 border-r border-gray-100 bg-white flex flex-col flex-shrink-0',
        showMobileThread && 'hidden md:flex'
      )}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages…"
                className="w-full rounded-input border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              className="flex-shrink-0 w-9 h-9 rounded-card bg-brand text-white flex items-center justify-center hover:bg-brand-700 transition-colors"
              aria-label="Start new conversation"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={clsx(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                  filter === f.value ? 'bg-brand text-white' : 'bg-paper-flat text-ink-mute hover:bg-gray-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim() ? (
            searchResults.length === 0
              ? <p className="text-sm text-ink-faint text-center py-8">No messages found.</p>
              : searchResults.map((r) => (
                <div key={r.id} className="px-4 py-3 border-b border-gray-50 text-sm">
                  <p className="font-medium text-ink">{r.senderName}</p>
                  <p className="text-ink-faint text-xs truncate">{r.content}</p>
                </div>
              ))
          ) : loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3">
                  <div className="w-10 h-10 rounded-full skeleton-shimmer animate-shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 rounded skeleton-shimmer animate-shimmer" />
                    <div className="h-2.5 w-1/2 rounded skeleton-shimmer animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
              <EmptyChatIllustration className="w-36" />
              <div>
                <p className="font-semibold text-ink text-sm">No conversations yet</p>
                <p className="text-xs text-ink-faint mt-1">
                  Press <span className="font-bold text-brand">+</span> to find a teacher and start chatting.
                </p>
              </div>
              <Button size="sm" icon={UserSearch} onClick={() => setShowNewChat(true)}>
                Find a teacher
              </Button>
            </div>
          ) : (
            visibleChats.map((chat) => (
              <ChatListItem
                key={chat.userId}
                chat={chat}
                active={activeChat?.userId === chat.userId}
                onClick={() => handleSelectChat(chat)}
              />
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className={clsx('flex-1 flex flex-col min-w-0 bg-paper-flat', !showMobileThread && 'hidden md:flex')}>
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center text-center px-8">
            <div>
              <EmptyChatIllustration className="w-44 mx-auto mb-4" />
              <p className="text-ink-mute mb-4">Choose a conversation, or start a new one.</p>
              <Button size="sm" icon={UserSearch} onClick={() => setShowNewChat(true)}>
                Find a teacher
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="h-16 bg-white border-b border-gray-100 flex items-center gap-3 px-4 flex-shrink-0">
              <button onClick={() => setShowMobileThread(false)} className="md:hidden text-ink-mute">
                <ArrowLeft size={20} />
              </button>
              <PresenceAvatar
                name={activeChat.name}
                userId={activeChat.userId}
                status={activeChat.status}
                size="md"
              />
              <div className="min-w-0">
                <p className="font-semibold text-ink text-sm truncate">{activeChat.name}</p>
                <p className="text-xs text-ink-faint">
                  {typingUsers[activeChat.userId]
                    ? <span className="text-brand font-medium">typing…</span>
                    : describePresence(activeChat.status, contactContext?.officeHours)
                  }
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">
              {threadLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={clsx(
                      'h-12 w-2/3 rounded-card skeleton-shimmer animate-shimmer',
                      i % 2 ? 'self-end' : 'self-start'
                    )} />
                  ))
                : (
                  <AnimatePresence initial={false}>
                    {threadMessages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.senderId === user.id || msg.senderId === 'me'}
                        preferredLanguage={user.preferredLanguage}
                      />
                    ))}
                  </AnimatePresence>
                )
              }
            </div>

            <MessageInput
              onSend={handleSend}
              onTyping={(typing) => notifyTyping(activeChat.userId, typing)}
              onOpenWhiteboard={() => setShowWhiteboard(true)}
              disabled={!isWithinOfficeHours}
            />
          </>
        )}
      </div>

      {/* Right context panel */}
      <div className="hidden lg:block w-80 border-l border-gray-100 bg-white flex-shrink-0">
        <ChatContextPanel
          contact={activeChat ? {
            ...activeChat,
            ...contactContext,
            roleLabel: contactContext?.role ? formatRoleLabel(contactContext.role) : undefined,
          } : null}
          role={user?.role}
        />
      </div>

      {/* Teacher directory modal */}
      {showNewChat && (
        <TeacherDirectoryModal
          user={user}
          onSelect={handleStartNewChat}
          onClose={() => setShowNewChat(false)}
        />
      )}

      {showWhiteboard && (
        <WhiteboardModal
          onClose={() => setShowWhiteboard(false)}
          onSave={handleWhiteboardSave}
        />
      )}
    </div>
  );
}

/* ── Teacher Directory Modal ── */
function TeacherDirectoryModal({ user, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTeachers = useCallback(
    debounce(async (q) => {
      setLoading(true);
      try {
        const { data } = await searchTeachers(q || undefined, user?.schoolId);
        setTeachers(data);
      } catch {
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [user?.schoolId]
  );

  useEffect(() => { fetchTeachers(query); }, [query, fetchTeachers]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-ink/40 z-50 flex items-start justify-center pt-16 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-card shadow-lifted w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-display font-bold text-ink">Find a teacher</h3>
            <p className="text-xs text-ink-faint mt-0.5">Select a teacher to start a private conversation</p>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              autoFocus
              className="w-full rounded-input border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="space-y-1 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-full skeleton-shimmer animate-shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 rounded skeleton-shimmer animate-shimmer" />
                    <div className="h-2.5 w-1/3 rounded skeleton-shimmer animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-10 text-sm text-ink-faint px-6">
              {user?.schoolId
                ? 'No teachers found. Try a different search.'
                : 'You need to join a school first. Go to Settings to complete your profile.'}
            </div>
          ) : (
            teachers.map((teacher) => (
              <button
                key={teacher.id}
                onClick={() => onSelect(teacher)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-paper-flat transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <PresenceAvatar
                  name={teacher.fullName}
                  userId={teacher.id}
                  status={teacher.status || 'OFFLINE'}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-sm truncate">{teacher.fullName}</p>
                  <p className="text-xs text-ink-faint truncate">{teacher.bio || 'Teacher'}</p>
                </div>
                {teacher.avgResponseMinutes != null && (
                  <span className="text-[11px] text-grow-700 bg-grow-50 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
                    ~{teacher.avgResponseMinutes}m
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Helpers ── */
function formatRoleLabel(role) {
  return { TEACHER: 'Teacher', PARENT: 'Parent', STUDENT: 'Student', ADMIN: 'School Admin' }[role] || role;
}

function checkOfficeHours(officeHours) {
  if (!officeHours || officeHours.length === 0) return true;
  const now = new Date();
  const day = now.getDay();
  const time = now.getHours() * 60 + now.getMinutes();
  return officeHours.some((slot) => {
    if (slot.dayOfWeek !== day) return false;
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    return time >= sh * 60 + sm && time <= eh * 60 + em;
  });
}

function describePresence(status, officeHours) {
  if (status === 'ONLINE') return 'Online now';
  if (officeHours && officeHours.length > 0) {
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() * 60 + now.getMinutes();
    const activeSlot = officeHours.find((slot) => {
      if (slot.dayOfWeek !== day) return false;
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      return time >= sh * 60 + sm && time <= eh * 60 + em;
    });
    if (activeSlot) {
      const [eh, em] = activeSlot.endTime.split(':').map(Number);
      const label = new Date(0, 0, 0, eh, em).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: em ? '2-digit' : undefined,
      });
      return `Available until ${label}`;
    }
    const nextSlot = officeHours.find((s) => s.dayOfWeek > day) || officeHours[0];
    if (nextSlot) return `Next available ${nextSlot.day || ''} ${nextSlot.startTime}`.trim();
  }
  return status === 'AWAY' ? 'Away' : 'Offline';
}