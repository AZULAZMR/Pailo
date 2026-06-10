import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Dimensions, TextInput, FlatList, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

const SUGGESTIONS = [
  'Wat kan ik vandaag doen voor meer energie? 💪',
  'Tips voor een betere nachtrust 😴',
  'Gezonde recepten voor mijn cyclus 🥗',
  'Hoe blijf ik gemotiveerd? 🔥',
  'Wat is een goede workout vandaag? 🏃',
];

export function AIScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await api.getChatHistory();
      setMessages(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    Keyboard.dismiss();
    setShowSuggestions(false);

    const userMsg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const data = await api.sendChatMessage(text.trim());
      const botMsg = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      const errMsg = { role: 'assistant', content: `❌ ${e.message}` };
      setMessages(prev => [...prev, errMsg]);
    }
    setSending(false);
  }

  function renderMessage({ item }: { item: any }) {
    const isUser = item.role === 'user';

    if (isUser) {
      return (
        <View style={styles.userBubbleWrap}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{item.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.botRow}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>🌸</Text>
        </View>
        <View style={styles.botBubble}>
          <Text style={styles.botText}>{item.content}</Text>
        </View>
      </View>
    );
  }

  function renderSuggestion(s: string) {
    return (
      <TouchableOpacity
        key={s}
        style={styles.suggestionChip}
        onPress={() => sendMessage(s)}
        activeOpacity={0.7}
      >
        <Text style={styles.suggestionText}>{s}</Text>
      </TouchableOpacity>
    );
  }

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>🌸</Text>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.title}>Lotus Coach</Text>
        <Text style={styles.subtitle}>Jouw persoonlijke AI gezondheidscoach</Text>
      </View>

      {showSuggestions && messages.length === 0 && (
        <View style={styles.suggestionsWrap}>
          <Text style={styles.suggestionsLabel}>Waar wil je over praten?</Text>
          <View style={styles.suggestionsRow}>
            {SUGGESTIONS.slice(0, 2).map(renderSuggestion)}
          </View>
          <View style={styles.suggestionsRow}>
            {SUGGESTIONS.slice(2, 4).map(renderSuggestion)}
          </View>
          {renderSuggestion(SUGGESTIONS[4])}
        </View>
      )}
    </Animated.View>
  );

  const renderFooter = () => (
    <>
      {sending && (
        <View style={styles.botRow}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>🌸</Text>
          </View>
          <View style={styles.typingBubble}>
            <Text style={styles.typingDots}>...</Text>
          </View>
        </View>
      )}
    </>
  );

  if (loading) {
    return (
      <View style={[styles.flex, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, i) => String(i)}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Stel een vraag..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || sending}
          activeOpacity={0.7}
        >
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingBottom: 16, paddingTop: Platform.OS === 'ios' ? 0 : 8 },
  header: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FCE4EC', justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  avatarLargeText: { fontSize: 34 },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#81C784', position: 'absolute', bottom: 2, right: 2, borderWidth: 2, borderColor: '#FFF8F5' },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  suggestionsWrap: { marginBottom: 20 },
  suggestionsLabel: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 10, textAlign: 'center' },
  suggestionsRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  suggestionChip: { backgroundColor: '#FCE4EC', borderRadius: theme.borderRadius.md, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, alignSelf: 'flex-start' },
  suggestionText: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
  userBubbleWrap: { alignItems: 'flex-end', marginBottom: 12 },
  userBubble: { backgroundColor: theme.colors.primary, borderRadius: 18, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 10, maxWidth: width * 0.75 },
  userText: { fontSize: 15, color: '#fff', lineHeight: 20 },
  botRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FCE4EC', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarSmallText: { fontSize: 16 },
  botBubble: { backgroundColor: '#F5F5F5', borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 10, maxWidth: width * 0.7 },
  botText: { fontSize: 15, color: theme.colors.text, lineHeight: 20 },
  typingBubble: { backgroundColor: '#F5F5F5', borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 20, paddingVertical: 12 },
  typingDots: { fontSize: 20, color: theme.colors.textSecondary },
  inputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 24, backgroundColor: '#FFF8F5', borderTopWidth: 1, borderTopColor: '#FCE4EC', gap: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: theme.colors.text, maxHeight: 100, borderWidth: 1.5, borderColor: '#FCE4EC' },
  sendBtn: { backgroundColor: theme.colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
});
