import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, SHADOWS } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import { topics } from "../../data/awareness/topics";

export default function ArticleReader() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();

  const topic = topics.find(t => t.slug === slug);

  if (!topic) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={32} color={COLORS.textTertiary} />
          <Text style={styles.errorText}>Article not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatCategory = (cat) => {
    return cat
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleRelatedPress = (relatedSlug) => {
    router.push(`/awareness/${relatedSlug}`);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.headerBar}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={20} color={COLORS.nightBlue} />
        </TouchableOpacity>
        <BrandHeader />
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Article Meta */}
        <View style={styles.metaRow}>
          <Text style={styles.category}>{formatCategory(topic.category).toUpperCase()}</Text>
          <View style={styles.metaBadgeRow}>
            <View style={styles.metaBadge}>
              <Feather name="clock" size={10} color={COLORS.textSecondary} style={styles.badgeIcon} />
              <Text style={styles.badgeText}>{topic.readTime}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Feather name="activity" size={10} color={COLORS.textSecondary} style={styles.badgeIcon} />
              <Text style={styles.badgeText}>{topic.difficulty}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{topic.title.en}</Text>
        <Text style={styles.description}>{topic.shortDescription.en}</Text>

        {/* Why it Matters Callout */}
        <View style={styles.whyMattersBox}>
          <View style={styles.whyMattersTitleRow}>
            <Feather name="info" size={12} color={COLORS.marigold} style={styles.whyMattersIcon} />
            <Text style={styles.whyMattersTitle}>WHY THIS MATTERS</Text>
          </View>
          <Text style={styles.whyMattersContent}>{topic.whyItMatters.en}</Text>
        </View>

        {/* Sections */}
        {topic.sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading.en}</Text>
            <Text style={styles.sectionBody}>{section.content.en}</Text>
          </View>
        ))}

        {/* Key Takeaways */}
        {topic.keyTakeaways && topic.keyTakeaways.length > 0 && (
          <View style={styles.takeawaysBox}>
            <Text style={styles.takeawaysTitle}>KEY TAKEAWAYS</Text>
            {topic.keyTakeaways.map((takeaway, idx) => (
              <View key={idx} style={styles.takeawayItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.takeawayText}>{takeaway.en}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Related Topics */}
        {topic.relatedTopics && topic.relatedTopics.length > 0 && (
          <View style={styles.relatedBox}>
            <Text style={styles.relatedTitle}>RELATED TOPICS</Text>
            <View style={styles.relatedLinks}>
              {topic.relatedTopics.map((relSlug, idx) => {
                const relTopic = topics.find(t => t.slug === relSlug);
                if (!relTopic) return null;
                
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => handleRelatedPress(relSlug)}
                    style={styles.relatedLinkBtn}
                  >
                    <Text style={styles.relatedLinkText}>{relTopic.title.en}</Text>
                    <Feather name="chevron-right" size={14} color={COLORS.marigold} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Sources */}
        {topic.sources && topic.sources.length > 0 && (
          <View style={styles.sourcesBox}>
            <Text style={styles.sourcesTitle}>SOURCES & REFERENCES</Text>
            {topic.sources.map((source, idx) => (
              <Text key={idx} style={styles.sourceText}>
                {idx + 1}. {source.title} ({source.year})
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  category: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.marigold,
    letterSpacing: 1,
  },
  metaBadgeRow: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.creamDark,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  title: {
    fontFamily: "System",
    fontSize: 22,
    fontWeight: "300",
    color: COLORS.nightBlue,
    lineHeight: 28,
    marginBottom: SPACING.sm,
  },
  description: {
    fontFamily: "System",
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  whyMattersBox: {
    backgroundColor: "rgba(217, 119, 6, 0.04)",
    borderColor: "rgba(217, 119, 6, 0.15)",
    borderWidth: 1,
    borderRadius: 4,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  whyMattersTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  whyMattersIcon: {
    marginRight: 6,
  },
  whyMattersTitle: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.marigold,
    letterSpacing: 1.5,
  },
  whyMattersContent: {
    fontFamily: "System",
    fontSize: 12,
    color: COLORS.nightBlue,
    lineHeight: 18,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontFamily: "System",
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.nightBlue,
    marginBottom: SPACING.xs,
  },
  sectionBody: {
    fontFamily: "System",
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  takeawaysBox: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 4,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.subtle,
  },
  takeawaysTitle: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.nightBlue,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(8, 12, 22, 0.04)",
    paddingBottom: 4,
  },
  takeawayItem: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
  },
  bullet: {
    fontFamily: "System",
    fontSize: 12,
    color: COLORS.marigold,
    marginRight: SPACING.sm,
  },
  takeawayText: {
    fontFamily: "System",
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  relatedBox: {
    marginBottom: SPACING.xl,
  },
  relatedTitle: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  relatedLinks: {
    gap: SPACING.sm,
  },
  relatedLinkBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    borderRadius: 4,
  },
  relatedLinkText: {
    fontFamily: "System",
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.nightBlue,
  },
  sourcesBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
    marginTop: SPACING.md,
  },
  sourcesTitle: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  sourceText: {
    fontFamily: "System",
    fontSize: 11,
    color: COLORS.textTertiary,
    lineHeight: 16,
    marginBottom: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  errorText: {
    fontFamily: "System",
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  backLink: {
    fontFamily: "System",
    fontSize: 14,
    color: COLORS.marigold,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
