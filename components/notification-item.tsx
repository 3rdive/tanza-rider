import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { tzColors } from "../theme/color";
import { poppinsFonts } from "../theme/fonts";

type Props = {
  title: string;
  body?: string;
  time?: string;
  highlighted?: boolean;
};

const NotificationItem: React.FC<Props> = ({
  title,
  body,
  time,
  highlighted,
}) => {
  return (
    <View
      style={[styles.container, highlighted && styles.highlightedContainer]}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 18,
  },
  highlightedContainer: {
    backgroundColor: "#E8F6EF",
    borderRadius: 8,
    padding: 16,
  },
  title: {
    fontFamily: poppinsFonts.semiBold,
    fontSize: 18,
    color: "#111",
    marginBottom: 8,
  },
  highlightedTitle: {
    color: "#0B4A34",
  },
  body: {
    fontFamily: poppinsFonts.regular,
    fontSize: 14,
    color: "#6B6B6B",
    marginBottom: 8,
    lineHeight: 20,
  },
  highlightedBody: {
    color: "#4F6B5B",
  },
  time: {
    fontFamily: poppinsFonts.regular,
    fontSize: 12,
    color: "#9B9B9B",
  },
  highlightedTime: {
    color: "#6B8F77",
  },
});

export default NotificationItem;
