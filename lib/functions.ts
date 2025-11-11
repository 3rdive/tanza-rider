// kept minimal to provide showAlert utility
import { Alert, Platform, Linking } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { store } from "@/redux/store";
import { showAlert as showAlertAction } from "@/redux/slices/alertSlice";

const UI_SCALE = 0.82;
export const rs = (n: number) => RFValue((n - 1) * UI_SCALE);

/**
 * Opens the appropriate settings page based on platform and permission type
 * @param permissionType - The type of permission (camera, photos, location, etc.)
 */
export const openPermissionSettings = async (permissionType?: string) => {
  try {
    if (Platform.OS === 'ios') {
      // iOS - app-settings: opens directly to your app's settings page
      await Linking.openURL('app-settings:');
    } else {
      // Android - try to open specific permission page, fallback to app info
      if (permissionType === 'camera') {
        // Try to open camera permission specifically
        try {
          await Linking.sendIntent('android.settings.action.APPLICATION_DETAILS_SETTINGS');
        } catch {
          await Linking.openSettings();
        }
      } else if (permissionType === 'photos' || permissionType === 'storage') {
        // For photos/storage permissions
        try {
          await Linking.sendIntent('android.settings.action.APPLICATION_DETAILS_SETTINGS');
        } catch {
          await Linking.openSettings();
        }
      } else {
        // General app settings
        await Linking.openSettings();
      }
    }
  } catch (error) {
    console.error('Failed to open settings:', error);
    // Final fallback to general settings
    try {
      await Linking.openSettings();
    } catch (fallbackError) {
      console.error('Failed to open fallback settings:', fallbackError);
      // If all else fails, show a manual instruction
      Alert.alert(
        'Settings Not Available',
        'Please go to Settings > Apps > Your App Name > Permissions to enable the required permission.',
        [{ text: 'OK' }]
      );
    }
  }
};

/**
 * Shows a permission denied alert with option to open settings
 * @param title - Alert title
 * @param message - Alert message
 * @param permissionType - The type of permission for better settings targeting
 */
export const showPermissionAlert = (
  title: string,
  message: string,
  permissionType?: string
) => {
  showAlert(title, message, [
    {
      text: "Open Settings",
      style: "warn",
      onclick: () => openPermissionSettings(permissionType)
    },
    {
      text: "Cancel",
      style: "cancel",
      onclick: () => {
        // User cancelled
      }
    }
  ]);
};

export const showAlert = (title: string, message: string, buttons?: any[]) => {
  try {
    // Convert buttons to the expected format for GlobalAlert
    const alertButtons = buttons?.map((btn) => ({
      text: btn.text || "OK",
      style: btn.style || "default",
      onclick: btn.onclick || btn.onPress,
    }));

    // Prefer dispatching to the global redux alert
    store.dispatch(
      showAlertAction({
        heading: title,
        message: message,
        type: undefined,
        buttons: alertButtons
      })
    );
  } catch {
    const defaultButtons = [{ text: "OK", onPress: () => { } }];
    const btns = buttons && buttons.length ? buttons : defaultButtons;
    const nativeBtns = btns.map((b: any) => ({
      text: b.text,
      onPress: b.onPress,
      style: b.style,
    }));
    Alert.alert(title, message, nativeBtns);
  }
};
