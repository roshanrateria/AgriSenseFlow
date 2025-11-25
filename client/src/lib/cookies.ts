import Cookies from "js-cookie";
import type { DetectionResult, ChatMessage, UserPreferences } from "@shared/schema";

const DETECTION_HISTORY_KEY = "agrivision_detection_history";
const CHAT_HISTORY_KEY = "agrivision_chat_history";
const USER_PREFERENCES_KEY = "agrivision_preferences";

export const cookieStorage = {
  // Detection History
  getDetectionHistory(): DetectionResult[] {
    const data = Cookies.get(DETECTION_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveDetection(result: DetectionResult) {
    const history = this.getDetectionHistory();
    history.unshift(result);
    const limited = history.slice(0, 50);
    Cookies.set(DETECTION_HISTORY_KEY, JSON.stringify(limited), { expires: 365 });
  },

  clearDetectionHistory() {
    Cookies.remove(DETECTION_HISTORY_KEY);
  },

  // Chat History
  getChatHistory(): ChatMessage[] {
    const data = Cookies.get(CHAT_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveChatMessage(message: ChatMessage) {
    const history = this.getChatHistory();
    history.push(message);
    const limited = history.slice(-100);
    Cookies.set(CHAT_HISTORY_KEY, JSON.stringify(limited), { expires: 30 });
  },

  clearChatHistory() {
    Cookies.remove(CHAT_HISTORY_KEY);
  },

  // User Preferences
  getPreferences(): UserPreferences {
    const data = Cookies.get(USER_PREFERENCES_KEY);
    return data ? JSON.parse(data) : { language: "en", theme: "light" };
  },

  savePreferences(preferences: UserPreferences) {
    Cookies.set(USER_PREFERENCES_KEY, JSON.stringify(preferences), { expires: 365 });
  },
};
