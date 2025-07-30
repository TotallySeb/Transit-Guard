// ChatbotScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Markdown from 'react-native-markdown-display';


// IMPORTANT: Replace this with your actual backend URL.
// Ensure your ngrok tunnel is running and updated if the URL changes!
const BACKEND_BASE_URL = 'https://3d258ea8e584.ngrok-free.app'; // <--- VERIFY THIS URL AND UPDATE IF NGROK CHANGES!

// TypeScript types for chat messages
type ChatMessage = {
  role: 'user' | 'model' | 'system'; // 'system' for app messages like errors
  parts: { text: string }[];
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Get the height of the bottom tab bar
  const tabBarHeight = useBottomTabBarHeight();

  // Initial greeting from the AI when the screen loads
  useEffect(() => {
    // This message is for UI display only. It is NOT sent to Gemini as part of history initially.
    setMessages([{ role: 'model', parts: [{ text: "Hello! I'm your Metro Transit Guard AI. How can I assist you today?" }] }]);
  }, []);

  const sendMessage = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    // 1. Add user's message to local state immediately for instant display
    const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: trimmedInput }] };
    // Temporarily update messages to show user's input immediately
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputText(''); // Clear input field

    setLoading(true); // Show loading indicator

    try {
      // 2. Prepare the history to send to the backend for Gemini.
      // The Gemini API requires the first content in history to be from 'user'.
      // If our `messages` state currently starts with the initial 'model' greeting,
      // we exclude it from the history sent to Gemini.
      let historyToSend: ChatMessage[] = [];

      // If there's an existing conversation, use it.
      // Filter out any 'system' messages as Gemini doesn't understand them in history.
      const conversationHistory = messages.filter(msg => msg.role !== 'system');

      // Check if the very first message in the *conversation history* is our initial AI greeting.
      // If so, we slice the array to start from the actual user's first input.
      if (conversationHistory.length > 0 &&
        conversationHistory[0].role === 'model' &&
        conversationHistory[0].parts[0].text.includes("Hello! I'm your Metro Transit Guard AI.")) {

        // This is the initial AI greeting from the UI. Exclude it from Gemini's history.
        // The actual user message (newUserMessage) will now be the first entry in historyToSend.
        historyToSend = [...conversationHistory.slice(1), newUserMessage];
      } else {
        // If the conversation already started with a user message, or the greeting isn't present,
        // send the full conversation history including the new user message.
        historyToSend = [...conversationHistory, newUserMessage];
      }

      // 3. Prepare the payload for the backend
      const payload = {
        message: trimmedInput,
        history: historyToSend, // Use the prepared historyToSend
      };

      // 4. Make the API call to your Express backend's chatbot endpoint
      // FIX APPLIED HERE: Changed '/chatbot/chat' to '/chatbot/' to match backend route
      const response = await fetch(`${BACKEND_BASE_URL}/chatbot/`, { // Corrected URL to match backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          console.error('Backend error (JSON):', errorData);
          throw new Error(errorData.error || 'Failed to get response from backend');
        } catch (parseError) {
          console.error('Backend error (Non-JSON response):', errorText);
          throw new Error(`Failed to get response from backend. Server returned: ${errorText.substring(0, 100)}...`);
        }
      }

      const data = await response.json();
      const aiReplyText = data.reply;
      // const returnedHistory = data.history; // Removed: No longer needed to replace the entire history

      // FIX APPLIED HERE: Only append the AI's response to the existing messages
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'model', parts: [{ text: aiReplyText }] }
      ]);

    } catch (error: any) {
      console.error('Error sending message to AI:', error);
      const displayErrorMessage = error instanceof Error ? error.message : String(error || 'Unknown error.');
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'system', parts: [{ text: `Oops! Something went wrong. ${displayErrorMessage}` }] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Metro AI Chatbot</Text>
      </View>

      <View style={[styles.contentWrapper, { paddingBottom: tabBarHeight }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight + 10 : tabBarHeight + 30}
        >
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContentContainer}
            ref={scrollView => {
              if (scrollView) scrollView.scrollToEnd({ animated: true });
            }}
          >
            {messages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                  msg.role === 'system' && styles.systemBubble, // Style for error messages
                ]}
              >
                <Markdown style={{
                  text: { color: '#fff', fontSize: 16 },
                  bullet_list_icon: {
                    width: 12,           // Make the dot wider
                    height: 12,          // Make the dot taller
                    borderRadius: 6,     // Make it round
                    backgroundColor: '#fff', // Make the dot white
                    marginRight: 8,      // Space between dot and text
                  },
                  list_item: { marginBottom: 4 }, // Space between list items
                }}>
                  {msg.parts[0].text}
                </Markdown>
              </View>
            ))}
            {loading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.loadingText}>AI is typing...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#fff"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={loading || inputText.trim() === ''}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#32B568',
  },
  header: {
    padding: 14,
    backgroundColor: '#32B568',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#2A9958',
  },
  keyboardAvoidingView: {
    flex: 1,
    flexDirection: 'column',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: '#96D9B2',
  },
  messagesContentContainer: {
    paddingVertical: 10,
  },
  messageBubble: {
    padding: 9,
    borderRadius: 15,
    marginVertical: 5,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6BB7D9',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#32B568',
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: '#050503ff',
    paddingHorizontal: 5,
  },
  messageText: {
    color: '#fff',
    fontSize: 17,
  },
  systemText: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#32B568',
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15, // A little more horizontal padding
    paddingVertical: 10,
    // The goal image has a dark background behind the input,
    // which matches your current `safeArea` background.
    backgroundColor: '#2A9958',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#32B568',
    color: '#fff',
    padding: 15,
    borderRadius: 20,
    marginBottom: -15, // Adjusted to match the goal image
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#6BB7D9',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: -15, // Adjusted to match the goal image
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});