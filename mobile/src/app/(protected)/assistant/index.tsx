import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sparkles,
  Bot,
  Send,
  ArrowLeft,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Plus,
  MessageSquare,
  Clock,
  AlertTriangle,
  RefreshCw,
  Info,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { assistantService } from '../../../services/assistant/assistantService';
import {
  ChatMessage,
  ConversationSummary,
  MessageFeedback,
} from '../../../types/assistant';
import { colors } from '../../../theme/colors';

const DEFAULT_SUGGESTIONS = [
  'How can I improve my health this week?',
  'Explain my latest BMI result and healthy target',
  'Am I drinking enough water daily?',
  'Suggest healthy protein-rich food options',
  'What are practical tips to improve deep sleep?',
  'How many steps should I walk daily to improve stamina?',
];

export default function AIAssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Conversations history drawer modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load initial suggested questions & conversations on mount
  useEffect(() => {
    (async () => {
      try {
        const [questions, convs] = await Promise.all([
          assistantService.getSuggestedQuestions().catch(() => DEFAULT_SUGGESTIONS),
          assistantService.getConversations().catch(() => []),
        ]);
        if (questions && questions.length > 0) {
          setSuggestedQuestions(questions);
        }
        if (convs && convs.length > 0) {
          setConversations(convs);
        }
      } catch {
        // Non-blocking
      }
    })();
  }, []);

  // Auto-scroll when messages update
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, loading]);

  // Load specific conversation thread
  const handleSelectConversation = async (id: string) => {
    setShowHistoryModal(false);
    setLoading(true);
    try {
      const data = await assistantService.getConversationById(id);
      setConversationId(data.conversation.id);
      setMessages(data.messages);
    } catch (err: any) {
      Alert.alert('Notice', 'Unable to load conversation thread.');
    } finally {
      setLoading(false);
    }
  };

  // Start new conversation
  const handleStartNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setInputText('');
    setShowHistoryModal(false);
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText('');

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      sender: 'USER',
      content: text,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await assistantService.sendMessage({
        conversationId: conversationId || undefined,
        message: text,
      });

      setConversationId(res.conversationId);

      // Replace with confirmed messages from backend
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [
          ...filtered,
          {
            id: res.userMessage.id,
            sender: 'USER',
            content: res.userMessage.content,
            createdAt: res.userMessage.createdAt,
          },
          {
            id: res.assistantMessage.id,
            sender: 'ASSISTANT',
            content: res.assistantMessage.content,
            category: res.assistantMessage.category,
            classification: res.assistantMessage.classification,
            disclaimer: res.assistantMessage.disclaimer,
            contextUsed: res.assistantMessage.contextUsed,
            createdAt: res.assistantMessage.createdAt,
          },
        ];
      });

      // Refresh conversations list in background
      assistantService.getConversations().then(setConversations).catch(() => {});
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'ASSISTANT',
        content:
          err?.response?.data?.message ||
          'Unable to reach health assistant service. Please check your network and try again.',
        classification: 'UNCERTAIN',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Copy message
  const handleCopyMessage = (id: string, text: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit message feedback (Thumbs Up / Thumbs Down)
  const handleFeedback = async (messageId: string, feedback: MessageFeedback) => {
    try {
      await assistantService.submitFeedback(messageId, feedback);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
      );
    } catch {
      // Non-blocking
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await assistantService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        handleStartNewConversation();
      }
    } catch {
      Alert.alert('Notice', 'Failed to delete conversation.');
    }
  };

  // Open history modal
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const list = await assistantService.getConversations();
      setConversations(list);
    } catch {
      // Non-blocking
    } finally {
      setLoadingHistory(false);
    }
  };

  // Clear current chat
  const handleClearChat = () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    Alert.alert('Clear Chat', 'Clear all messages in this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await assistantService.clearConversation(conversationId);
            setMessages([]);
          } catch {
            Alert.alert('Notice', 'Failed to clear conversation.');
          }
        },
      },
    ]);
  };

  const topPadding =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight || 28) + 8
      : Math.max(insets.top, 20) + 4;

  return (
    <KeyboardAvoidingView
      style={styles.screenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="dark-content" />

      {/* Top App Header */}
      <View style={[styles.headerContainer, { paddingTop: topPadding }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.assistantTitleWrap}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitleText}>UYIRA Assistant</Text>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Health AI</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitleText}>Personalized Wellness Guidance</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleOpenHistory}
            accessibilityLabel="Chat History"
          >
            <Clock size={19} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerActionButton, styles.newChatBtn]}
            onPress={handleStartNewConversation}
            accessibilityLabel="New Conversation"
          >
            <Plus size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Chat ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScrollView}
        contentContainerStyle={styles.chatScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome State when no messages */}
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <View style={styles.botHeroAvatar}>
              <Sparkles size={36} color={colors.primary} />
            </View>

            <Text style={styles.welcomeTitle}>Hello! I'm UYIRA Health Assistant</Text>
            <Text style={styles.welcomeSubtitle}>
              Ask me anything about your health, nutrition, fitness, sleep, or wellness. I'm here to help you understand your health better.
            </Text>

            {/* Medical Disclaimer Banner */}
            <View style={styles.disclaimerPillCard}>
              <Info size={16} color="#0EA5E9" style={{ marginTop: 2 }} />
              <Text style={styles.disclaimerPillText}>
                Health guidance is grounded in your verified UYIRA records. UYIRA AI is an educational assistant and does not provide clinical diagnosis or medication prescriptions.
              </Text>
            </View>

            {/* Suggested Question Chips */}
            <View style={styles.suggestionsSection}>
              <View style={styles.suggestionsHeaderRow}>
                <Sparkles size={16} color={colors.primary} />
                <Text style={styles.suggestionsHeaderTitle}>Suggested Health Inquiries</Text>
              </View>

              <View style={styles.suggestionsList}>
                {suggestedQuestions.map((question, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionCard}
                    onPress={() => handleSendMessage(question)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.suggestionText}>{question}</Text>
                    <ChevronRight size={16} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Messages List */}
        {messages.map((item) => {
          const isUser = item.sender === 'USER';
          const isEmergency = item.classification === 'EMERGENCY_OR_HIGH_RISK';

          return (
            <View
              key={item.id}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAssistant,
              ]}
            >
              {!isUser && (
                <View style={[styles.avatarCircle, isEmergency && styles.avatarCircleEmergency]}>
                  {isEmergency ? (
                    <AlertTriangle size={16} color="#DC2626" />
                  ) : (
                    <Sparkles size={16} color={colors.primary} />
                  )}
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.bubbleUser : styles.bubbleAssistant,
                  isEmergency && styles.bubbleEmergency,
                ]}
              >
                {/* Emergency Tag */}
                {isEmergency && (
                  <View style={styles.emergencyTagRow}>
                    <AlertTriangle size={15} color="#DC2626" />
                    <Text style={styles.emergencyTagText}>Urgent Clinical Notice</Text>
                  </View>
                )}

                {/* Grounding Context Sources Pill */}
                {!isUser && item.contextUsed && item.contextUsed.length > 0 && (
                  <View style={styles.contextPillRow}>
                    <Info size={11} color="#0EA5E9" />
                    <Text style={styles.contextPillText}>
                      Grounded in: {item.contextUsed.map((s) => s.replace(/_/g, ' ')).join(', ')}
                    </Text>
                  </View>
                )}

                {/* Message Content */}
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.messageTextUser : styles.messageTextAssistant,
                  ]}
                  selectable
                >
                  {item.content}
                </Text>

                {/* Assistant Footer Actions (Copy & Helpful Feedback) */}
                {!isUser && (
                  <View style={styles.assistantFooterRow}>
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() => handleCopyMessage(item.id, item.content)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check size={13} color="#16A34A" />
                          <Text style={[styles.copyBtnText, { color: '#16A34A' }]}>Copied</Text>
                        </>
                      ) : (
                        <>
                          <Copy size={13} color={colors.secondaryText} />
                          <Text style={styles.copyBtnText}>Copy</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <View style={styles.feedbackButtonsRow}>
                      <TouchableOpacity
                        style={[
                          styles.feedbackThumbBtn,
                          item.feedback === 'HELPFUL' && styles.feedbackThumbActive,
                        ]}
                        onPress={() => handleFeedback(item.id, 'HELPFUL')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <ThumbsUp
                          size={13}
                          color={item.feedback === 'HELPFUL' ? '#16A34A' : colors.secondaryText}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.feedbackThumbBtn,
                          item.feedback === 'NOT_HELPFUL' && styles.feedbackThumbActive,
                        ]}
                        onPress={() => handleFeedback(item.id, 'NOT_HELPFUL')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <ThumbsDown
                          size={13}
                          color={item.feedback === 'NOT_HELPFUL' ? '#EF4444' : colors.secondaryText}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Loading / Typing Indicator */}
        {loading && (
          <View style={[styles.messageRow, styles.messageRowAssistant]}>
            <View style={styles.avatarCircle}>
              <Sparkles size={16} color={colors.primary} />
            </View>
            <View style={[styles.messageBubble, styles.bubbleAssistant, styles.typingBubble]}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.typingText}>Analyzing verified health context...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={[styles.inputBarContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputInnerRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask any health, diet or fitness question..."
            placeholderTextColor="#94A3B8"
            multiline
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversation History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingTop: topPadding }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Clock size={20} color={colors.primary} />
                <Text style={styles.modalTitleText}>Chat History</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowHistoryModal(false)}
              >
                <X size={20} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.newChatModalBtn}
              onPress={handleStartNewConversation}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.newChatModalBtnText}>Start New Consultation</Text>
            </TouchableOpacity>

            {loadingHistory ? (
              <View style={styles.historyLoadingWrap}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.historyLoadingText}>Loading past chats...</Text>
              </View>
            ) : conversations.length === 0 ? (
              <View style={styles.historyEmptyWrap}>
                <MessageSquare size={36} color="#94A3B8" />
                <Text style={styles.historyEmptyTitle}>No Past Conversations</Text>
                <Text style={styles.historyEmptySub}>
                  Your health consultations and questions will appear here.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.historyListScroll} showsVerticalScrollIndicator={false}>
                {conversations.map((conv) => (
                  <View key={conv.id} style={styles.historyCardRow}>
                    <TouchableOpacity
                      style={styles.historyCardMain}
                      onPress={() => handleSelectConversation(conv.id)}
                      activeOpacity={0.7}
                    >
                      <MessageSquare size={16} color={colors.primary} style={{ marginTop: 2 }} />
                      <View style={styles.historyCardInfo}>
                        <Text style={styles.historyCardTitle} numberOfLines={1}>
                          {conv.title}
                        </Text>
                        {conv.lastMessage ? (
                          <Text style={styles.historyCardLastMsg} numberOfLines={1}>
                            {conv.lastMessage}
                          </Text>
                        ) : null}
                        <Text style={styles.historyCardDate}>
                          {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.historyDeleteBtn}
                      onPress={() => handleDeleteConversation(conv.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    marginRight: 10,
  },
  assistantTitleWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    marginRight: 8,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.secondary,
  },
  newChatBtn: {
    backgroundColor: colors.primary,
  },
  chatScrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  botHeroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#C6E7D2',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  disclaimerPillCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 24,
  },
  disclaimerPillText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
    marginLeft: 8,
    flex: 1,
  },
  suggestionsSection: {
    width: '100%',
  },
  suggestionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  suggestionsHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
    flex: 1,
    marginRight: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarCircleEmergency: {
    backgroundColor: '#FEE2E2',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleEmergency: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1.5,
  },
  emergencyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  emergencyTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  contextPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  contextPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369A1',
    textTransform: 'capitalize',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextAssistant: {
    color: colors.primaryText,
  },
  assistantFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  feedbackButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackThumbBtn: {
    padding: 4,
    borderRadius: 6,
  },
  feedbackThumbActive: {
    backgroundColor: '#F1F5F9',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  typingText: {
    fontSize: 12,
    color: colors.secondaryText,
    fontStyle: 'italic',
  },
  inputBarContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.primaryText,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryText,
  },
  modalCloseBtn: {
    padding: 4,
  },
  newChatModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginVertical: 14,
  },
  newChatModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyLoadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  historyLoadingText: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 8,
  },
  historyEmptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  historyEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 10,
  },
  historyEmptySub: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  historyListScroll: {
    maxHeight: 350,
  },
  historyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyCardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  historyCardInfo: {
    marginLeft: 10,
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  historyCardLastMsg: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  historyCardDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  historyDeleteBtn: {
    padding: 8,
  },
});
