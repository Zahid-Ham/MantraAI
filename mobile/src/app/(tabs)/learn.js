import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, FlatList, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import TopicCard from "../../components/TopicCard";
import EmptyState from "../../components/EmptyState";
import { topics } from "../../data/awareness/topics";
import { categories } from "../../data/awareness/categories";

export default function Learn() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { colors, t } = usePreferences();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const styles = createStyles(colors);

  // Animate when changing search queries or categories
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, [selectedCategory, searchQuery]);

  const handleReadTopic = (slug) => {
    router.push(`/awareness/${slug}`);
  };

  // Filter topics based on search query and category
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = 
      topic.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.shortDescription.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = 
      selectedCategory === "all" || 
      topic.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedCategory(item.id)}
        activeOpacity={0.7}
        style={[
          styles.categoryPill,
          isSelected ? styles.selectedCategoryPill : styles.unselectedCategoryPill
        ]}
      >
        <Text style={[styles.categoryText, isSelected ? styles.selectedCategoryText : styles.unselectedCategoryText]}>
          {item.name.en.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <BrandHeader subtitle="educational catalog" />
        
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={COLORS.textTertiary} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search reproductive health topics..."
            placeholderTextColor={COLORS.textTertiary}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories horizontal list */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={[{ id: "all", name: { en: "All Topics" } }, ...categories]}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Topics list */}
      <ScrollView contentContainerStyle={styles.topicsScroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {filteredTopics.length > 0 ? (
            filteredTopics.map(topic => (
              <TopicCard
                key={topic.id}
                category={topic.category}
                title={topic.title.en}
                readTime={topic.readTime}
                description={topic.shortDescription.en}
                onPress={() => handleReadTopic(topic.slug)}
              />
            ))
          ) : (
            <EmptyState
              icon="search"
              title="No topics match your filter"
              description="Try adjusting your keywords or switching to another category tab."
              actionTitle="View all topics"
              onActionPress={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            />
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 24,
    height: 46,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: "System",
    fontSize: 14,
    color: colors.nightBlue,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: SPACING.sm,
  },
  categoriesList: {
    paddingHorizontal: SPACING.lg,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.2,
    marginRight: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCategoryPill: {
    backgroundColor: colors.nightBlue,
    borderColor: colors.nightBlue,
  },
  unselectedCategoryPill: {
    backgroundColor: "transparent",
    borderColor: colors.border,
  },
  categoryText: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  selectedCategoryText: {
    color: colors.cream,
  },
  unselectedCategoryText: {
    color: colors.textSecondary,
  },
  topicsScroll: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
});
