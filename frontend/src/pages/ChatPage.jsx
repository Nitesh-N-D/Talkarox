import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import ChatListItem from '../components/chat/ChatListItem';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import ChatContextPanel from '../components/chat/ChatContextPanel';
import WhiteboardModal from '../components/whiteboard/WhiteboardModal';
import EmptyChatIllustration from '../components/illustrations/EmptyChatIllustration';
import PresenceAvatar from '../components/common/PresenceAvatar';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { getSocket } from '../services/socket';
import { searchMessages, uploadWhiteboardImage } from '../services/api';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HOMEWORK_HELP', label: 'Homework' },
];

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const {
    chats, activeChat, contactContext, threadMessages, loading, threadLoading, filter,
    loadChats, setActiveChat, setFilter, sendMessage, receiveMessage,
    setTyping, notifyTyping, typingUsers, filteredChats, updatePresence,
  } = useChatStore();

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('new_message', (msg) => receiveMessage(msg));
    socket.on('typing_indicator', ({ recipientId, typing }) => setTyping(recipientId, typing));
    socket.on('user_status_changed', ({ userId, status }) => updatePresence(userId, status));

    return () => {
      socket.off('new_message');
      socket.off('typing_indicator');
      socket.off('user_status_changed');
    };
  }, [receiveMessage, setTyping, updatePresence]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [threadMessages]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await searchMessages(searchQuery);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setShowMobileThread(true);
  };

  const handleSend = async (content, extra) => {
    try {
      await sendMessage(content, extra);
    } catch {
      toast.error('Message failed to send');
    }
  };

  const handleWhiteboardSave = async (dataUrl) => {
    try {
      const { data } = await uploadWhiteboardImage(dataUrl);
      await handleSend('🎨 Whiteboard sketch', { messageType: 'IMAGE', fileUrl: data.imageUrl });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save sketch — file storage may not be configured yet');
    }
  };

  const visibleChats = filteredChats();
  const isWithinOfficeHours = contactContext ? checkOfficeHours(contactContext.officeHours) : true;

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Chat list */}
      <div
        className={clsx(
          'w-full md:w-80 lg:w-96 border-r border-gray-100 bg-white flex flex-col flex-shrink-0',
          showMobileThread && 'hidden md:flex'
        )}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages…"
              className="w-full rounded-input border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
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
            searchResults.length === 0 ? (
              <p className="text-sm text-ink-faint text-center py-8">No messages found.</p>
            ) : (
              searchResults.map((r) => (
                <div key={r.id} className="px-4 py-3 border-b border-gray-50 text-sm">
                  <p className="font-medium text-ink">{r.senderName}</p>
                  <p className="text-ink-faint text-xs truncate">{r.content}</p>
                </div>
              ))
            )
          ) : loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
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
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <EmptyChatIllustration className="w-40 mb-4" />
              <p className="font-semibold text-ink text-sm">Start a conversation with your teacher!</p>
              <p className="text-xs text-ink-faint mt-1">All your conversations will show up here.</p>
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
              <p className="text-ink-mute">Choose a conversation to get started.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-16 bg-white border-b border-gray-100 flex items-center gap-3 px-4 flex-shrink-0">
              <button onClick={() => setShowMobileThread(false)} className="md:hidden text-ink-mute">
                <ArrowLeft size={20} />
              </button>
              <PresenceAvatar name={activeChat.name} userId={activeChat.userId} status={activeChat.status} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-ink text-sm truncate">{activeChat.name}</p>
                <p className="text-xs text-ink-faint">
                  {typingUsers[activeChat.userId] ? (
                    <span className="text-brand font-medium">typing…</span>
                  ) : (
                    describePresence(activeChat.status, contactContext?.officeHours)
                  )}
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">
              {threadLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={clsx('h-12 w-2/3 rounded-card skeleton-shimmer animate-shimmer', i % 2 ? 'self-end' : 'self-start')} />
                ))
              ) : (
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
              )}
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
          contact={
            activeChat
              ? {
                  ...activeChat,
                  ...contactContext,
                  roleLabel: contactContext?.role ? formatRoleLabel(contactContext.role) : undefined,
                }
              : null
          }
          role={user?.role}
        />
      </div>

      {showWhiteboard && (
        <WhiteboardModal
          onClose={() => setShowWhiteboard(false)}
          onSave={handleWhiteboardSave}
        />
      )}
    </div>
  );
}

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
      const label = new Date(0, 0, 0, eh, em).toLocaleTimeString('en-US', { hour: 'numeric', minute: em ? '2-digit' : undefined });
      return `Available until ${label}`;
    }
    const nextSlot = officeHours.find((slot) => slot.dayOfWeek > day) || officeHours[0];
    if (nextSlot) return `Next available ${nextSlot.day || ''} ${nextSlot.startTime}`.trim();
  }

  return status === 'AWAY' ? 'Away' : 'Offline';
}
