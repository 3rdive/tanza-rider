import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

import { poppinsFonts } from "../theme/fonts";
import { useTheme } from "../context/ThemeContext";

type Props = {
  title: string;
  body?: string;
  time?: string;
  highlighted?: boolean;
  onPress?: () => void;
  containerStyle?: ViewStyle;
};

const NotificationItem: React.FC<Props> = ({
  title,
  body,
  time,
  highlighted,
  onPress,
  containerStyle,
}) => {
  const { colors } = useTheme();
  const Container = onPress ? TouchableOpacity : View;

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      marginBottom: 18,
    },
    highlightedContainer: {
      backgroundColor: colors.tabBackground,
      borderRadius: 8,
      padding: 16,
    },
    title: {
      fontFamily: poppinsFonts.semiBold,
      fontSize: 18,
      color: colors.text,
      marginBottom: 8,
    },
    highlightedTitle: {
      color: colors.primary,
    },
    body: {
      fontFamily: poppinsFonts.regular,
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    highlightedBody: {
      color: colors.text,
    },
    time: {
      fontFamily: poppinsFonts.regular,
      fontSize: 12,
      color: colors.textSecondary,
    },
    highlightedTime: {
      color: colors.textSecondary,
    },
  });

  return (
    <Container
      onPress={onPress as any}
      style={[
        styles.container,
        highlighted && styles.highlightedContainer,
        containerStyle,
      ]}
    >
      <Text style={[styles.title, highlighted && styles.highlightedTitle]}>
        {title}
      </Text>
      {body ? (
        <Text style={[styles.body, highlighted && styles.highlightedBody]}>
          {body}
        </Text>
      ) : null}
      {time ? (
        <Text style={[styles.time, highlighted && styles.highlightedTime]}>
          {time}
        </Text>
      ) : null}
    </Container>
  );
};

export default NotificationItem;
