import Toast from 'react-native-toast-message';

export function showSuccessMessage(message: string, description?: string) {
  Toast.show({
    type: 'success',
    text1: message,
    text2: description,
  });
}

export function showFailedMessage(message: string, description?: string) {
  Toast.show({
    type: 'error',
    text1: message,
    text1Style: { fontWeight: 'bold' },
    text2: description,
    text2Style: { flexWrap: 'wrap', flexDirection: 'row' },
  });
}

export function showInfoMessage(message: string, description?: string) {
  Toast.show({
    type: 'info',
    text1: message,
    text2: description,
  });
}

export function showWarningMessage(message: string, description?: string) {
  Toast.show({
    type: 'info',
    text1: message,
    text2: description,
  });
}

