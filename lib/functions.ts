// kept minimal to provide showAlert utility
import { Alert } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { store } from "@/redux/store";
import { showAlert as showAlertAction } from "@/redux/slices/alertSlice";

const UI_SCALE = 0.82;
export const rs = (n: number) => RFValue((n - 1) * UI_SCALE);

export const showAlert = (title: string, message: string, buttons?: any[]) => {
  const defaultButtons = [{ text: "OK", onPress: () => {} }];
  const btns = buttons && buttons.length ? buttons : defaultButtons;

  try {
    // Prefer dispatching to the global redux alert
    store.dispatch(
      showAlertAction({ heading: title, message: message, type: undefined })
    );
  } catch (_) {
    const nativeBtns = btns.map((b: any) => ({
      text: b.text,
      onPress: b.onPress,
      style: b.style,
    }));
    Alert.alert(title, message, nativeBtns);
  }
};
