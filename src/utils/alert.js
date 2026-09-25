import { Alert as RNAlert, Platform } from 'react-native';

/**
 * Cross-platform alert that works seamlessly on Web and Native.
 * On Web, React Native's Alert.alert is a dummy no-op.
 * This utility uses window.alert and window.confirm with full button callback support.
 */
export function showAlert(title, message = '', buttons = [{ text: 'OK' }]) {
  if (Platform.OS === 'web') {
    const textMessage = `${title}${message ? '\n\n' + message : ''}`;

    // Single button alert
    if (!buttons || buttons.length <= 1) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(textMessage);
      }
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
      return;
    }

    // Two buttons: Confirm / Cancel flow
    if (buttons.length === 2) {
      const cancelBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
      const actionBtn = buttons.find((b) => b !== cancelBtn) || buttons[1];

      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm(textMessage);
        if (confirmed) {
          if (actionBtn && actionBtn.onPress) actionBtn.onPress();
        } else {
          if (cancelBtn && cancelBtn.onPress) cancelBtn.onPress();
        }
        return;
      }
    }

    // 3+ buttons: Prompt or execute primary action
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(textMessage);
      if (confirmed) {
        const actionBtn = buttons.find((b) => b.style !== 'cancel') || buttons[0];
        if (actionBtn && actionBtn.onPress) actionBtn.onPress();
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        if (cancelBtn && cancelBtn.onPress) cancelBtn.onPress();
      }
      return;
    }
  }

  // Native iOS / Android
  RNAlert.alert(title, message, buttons);
}

export default showAlert;
