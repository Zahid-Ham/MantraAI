import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAssessment } from "../../context/AssessmentContext";
import { usePreferences } from "../../context/PreferencesContext";
import { COLORS, SPACING } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import ProgressBar from "../../components/ProgressBar";
import QuestionCard from "../../components/QuestionCard";
import OptionCard from "../../components/OptionCard";
import WhyThisMatters from "../../components/WhyThisMatters";
import PrimaryButton from "../../components/PrimaryButton";
import { assessmentSchema } from "../../data/assessmentSchema";

export default function AssessmentSection() {
  const { section, editQuestionId, returnTo } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, colors, isDarkMode } = usePreferences();
  const styles = createStyles(colors, isDarkMode);
  const { 
    answers, 
    currentQuestionIndex, 
    saveAnswer, 
    updateQuestionIndex,
    activeAssessmentId,
    loading
  } = useAssessment();

  const { questions, blocks } = assessmentSchema;

  // Dynamic Phase Transitions states
  const [showPhaseIntro, setShowPhaseIntro] = useState(false);
  const [shownBlocks, setShownBlocks] = useState(new Set());
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Safeguard: if session not initialized, go back to assessment entry
  useEffect(() => {
    if (!activeAssessmentId && !loading) {
      router.replace("/(tabs)/assessment");
    }
  }, [activeAssessmentId, loading]);

  const currentQuestion = questions[currentQuestionIndex];

  const [sliderDisplayVal, setSliderDisplayVal] = useState(null);

  // Sync local slider display value when question changes to ensure instant renders
  useEffect(() => {
    if (currentQuestion) {
      const val = answers[currentQuestion.id];
      if (currentQuestion.type === "slider") {
        const minVal = parseInt(currentQuestion.options[0].value, 10) || 0;
        const maxVal = parseInt(currentQuestion.options[currentQuestion.options.length - 1].value, 10) || 50;
        const defaultVal = typeof val === "number" ? val : Math.round((minVal + maxVal) / 2);
        setSliderDisplayVal(defaultVal);
      }
    }
  }, [currentQuestion?.id, answers]);

  // If in edit-question mode, jump straight to the target question
  useEffect(() => {
    if (editQuestionId && questions.length > 0) {
      const targetIdx = questions.findIndex(q => q.id === editQuestionId);
      if (targetIdx !== -1 && targetIdx !== currentQuestionIndex) {
        updateQuestionIndex(targetIdx);
      }
    }
  }, [editQuestionId, questions]);
  
  // Intercept block entry to show Phase Intro screen (disabled in editQuestion mode)
  useEffect(() => {
    if (currentQuestion && !editQuestionId) {
      const blockId = currentQuestion.block;
      if (!shownBlocks.has(blockId)) {
        setShowPhaseIntro(true);
        setShownBlocks(prev => {
          const next = new Set(prev);
          next.add(blockId);
          return next;
        });
      }
    }
  }, [currentQuestion?.block, editQuestionId]);

  // Phase transition animations
  useEffect(() => {
    if (showPhaseIntro) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
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
    }
  }, [showPhaseIntro]);

  // Sync the section route parameter with the active block of currentQuestion
  useEffect(() => {
    if (currentQuestion) {
      const activeBlockId = currentQuestion.block.toString();
      if (activeBlockId !== section) {
        router.setParams({ section: activeBlockId });
      }
    }
  }, [currentQuestionIndex]);

  // Safe initialization of slider defaults after component mount to prevent render side-effects
  useEffect(() => {
    if (currentQuestion && currentQuestion.type === "slider") {
      const { id, minVal } = currentQuestion;
      if (answers[id] === undefined) {
        const defaultValue = minVal !== undefined ? Number(minVal) : 0;
        saveAnswer(id, defaultValue);
      }
    }
  }, [currentQuestion?.id]);

  if (!currentQuestion) {
    return null;
  }

  const activeBlock = blocks.find(b => b.id === currentQuestion.block);
  const sectionName = activeBlock?.name?.[language] || "Wellness Assessment";
  
  const currentAnswer = answers[currentQuestion.id];
  
  // Calculate block-specific progress metrics
  const currentBlockQuestions = questions.filter(q => q.block === currentQuestion.block);
  const totalBlockSteps = currentBlockQuestions.length;
  const currentBlockStep = currentBlockQuestions.findIndex(q => q.id === currentQuestion.id) + 1;
  const progressPercent = totalBlockSteps > 0 ? (currentBlockStep - 1) / totalBlockSteps : 0;
  const totalQuestionsCount = questions.length;

  const getBlockIcon = (blockId) => {
    switch (blockId) {
      case 1: return "user";
      case 2: return "activity";
      case 3: return "thermometer";
      case 4: return "clipboard";
      case 5: return "heart";
      default: return "book-open";
    }
  };

  if (showPhaseIntro && activeBlock) {
    return (
      <SafeAreaView style={styles.introSafeContainer}>
        <Animated.View 
          style={[
            styles.introContent, 
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <View style={styles.introHeader}>
            <Text style={styles.introSubtitle}>
              PHASE {activeBlock.id} OF {blocks.length}
            </Text>
          </View>
          
          <View style={styles.introCenter}>
            <View style={styles.introIconContainer}>
              <Feather name={getBlockIcon(activeBlock.id)} size={38} color={COLORS.marigold} />
            </View>
            <Text style={styles.introTitle}>{activeBlock.name[language]}</Text>
            <Text style={styles.introDescription}>{activeBlock.description[language]}</Text>
          </View>

          <View style={styles.introFooter}>
            <View style={styles.introMetaRow}>
              <Feather name="clock" size={14} color={COLORS.textTertiary} />
              <Text style={styles.introMetaText}>Takes 1-2 mins</Text>
              <Text style={styles.introMetaDivider}>•</Text>
              <Feather name="list" size={14} color={COLORS.textTertiary} />
              <Text style={styles.introMetaText}>{totalBlockSteps} questions</Text>
            </View>
            <PrimaryButton
              title="START SECTION"
              variant="orange"
              onPress={() => setShowPhaseIntro(false)}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Handle navigating backwards
  const handleBack = async () => {
    if (returnTo === "review") {
      router.back();
    } else if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      await updateQuestionIndex(prevIndex);
    } else {
      router.replace("/(tabs)/assessment");
    }
  };

  // Handle navigating forwards
  const handleNext = async () => {
    if (returnTo === "review") {
      router.back();
    } else if (currentQuestionIndex === totalQuestionsCount - 1) {
      router.push("/assessment/review");
    } else {
      const nextIndex = currentQuestionIndex + 1;
      await updateQuestionIndex(nextIndex);
    }
  };

  const isRequired = currentQuestion.required;
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== "";
  const canAdvance = !isRequired || hasAnswer;

  // Rendering options based on question type
  const renderInputOptions = () => {
    const { type, options, id } = currentQuestion;

    const handleSingleSelect = (value) => {
      saveAnswer(id, value);
      // Small 300ms delay to allow selection color transition to render before auto-advancing
      setTimeout(() => {
        handleNext();
      }, 300);
    };

    if (type === "radio" || type === "dropdown") {
      // Both dropdowns and radios are rendered as clean option cards on mobile
      return (
        <View style={styles.optionsContainer}>
          {options.map((opt, idx) => {
            const isSelected = currentAnswer === opt.value;
            const label = opt.label[language];
            return (
              <OptionCard
                key={idx}
                text={label}
                selected={isSelected}
                onSelect={() => handleSingleSelect(opt.value)}
              />
            );
          })}
        </View>
      );
    }

    if (type === "checkbox") {
      const activeAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
      
      const handleToggleCheckbox = (value) => {
        let updated;
        if (activeAnswers.includes(value)) {
          updated = activeAnswers.filter(v => v !== value);
        } else {
          updated = [...activeAnswers, value];
        }
        saveAnswer(id, updated);
      };

      return (
        <View style={styles.optionsContainer}>
          {options.map((opt, idx) => {
            const isSelected = activeAnswers.includes(opt.value);
            const label = opt.label[language];
            return (
              <OptionCard
                key={idx}
                text={label}
                selected={isSelected}
                onSelect={() => handleToggleCheckbox(opt.value)}
              />
            );
          })}
        </View>
      );
    }

    if (type === "segmented") {
      // Check if we should render segmented layout horizontally (only for short options, <= 3 items, e.g. Yes/No)
      const isShortSegmented = 
        options.length <= 3 && 
        options.every(opt => opt.label[language].length <= 6);

      if (isShortSegmented) {
        return (
          <View style={styles.segmentedRow}>
            {options.map((opt, idx) => {
              const isSelected = currentAnswer === opt.value;
              const label = opt.label[language];
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => handleSingleSelect(opt.value)}
                  style={[
                    styles.segmentBtn,
                    isSelected ? styles.selectedSegmentBtn : styles.unselectedSegmentBtn
                  ]}
                >
                  <Text style={[styles.segmentText, isSelected ? styles.selectedSegmentText : styles.unselectedSegmentText]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }

      // Otherwise fall back to beautiful vertical OptionCards!
      return (
        <View style={styles.optionsContainer}>
          {options.map((opt, idx) => {
            const isSelected = currentAnswer === opt.value;
            const label = opt.label[language];
            return (
              <OptionCard
                key={idx}
                text={label}
                selected={isSelected}
                onSelect={() => handleSingleSelect(opt.value)}
              />
            );
          })}
        </View>
      );
    }

    if (type === "slider") {
      const minVal = parseInt(options[0].value, 10) || 0;
      const maxVal = parseInt(options[options.length - 1].value, 10) || 50;
      const numericVal = typeof currentAnswer === "number" ? currentAnswer : Math.round((minVal + maxVal) / 2);
      const displayVal = sliderDisplayVal !== null ? sliderDisplayVal : numericVal;

      const getSliderUnit = (questionId) => {
        if (questionId === "age_years") return "YEARS";
        if (questionId.endsWith("_score") || questionId.includes("score") || questionId.includes("pss10")) return "SCORE";
        return "";
      };

      return (
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderSubtext}>SLIDE TO ADJUST</Text>
          
          <View style={styles.sliderValueBox}>
            <Text style={styles.sliderValue}>{displayVal}</Text>
            <Text style={styles.sliderUnit}>{getSliderUnit(id)}</Text>
          </View>

          <Slider
            style={styles.sliderInput}
            minimumValue={minVal}
            maximumValue={maxVal}
            step={1}
            value={numericVal}
            onValueChange={(val) => setSliderDisplayVal(val)}
            onSlidingComplete={(val) => {
              saveAnswer(id, val);
              setSliderDisplayVal(val);
            }}
            minimumTrackTintColor={colors.marigold}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.marigold}
          />

          <View style={styles.sliderBounds}>
            <Text style={styles.boundsText}>MIN: {minVal}</Text>
            <Text style={styles.boundsText}>MAX: {maxVal}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <BrandHeader />
        <ProgressBar progress={progressPercent} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <QuestionCard
          sectionName={sectionName}
          questionText={currentQuestion.question[language]}
          currentStep={currentBlockStep}
          totalSteps={totalBlockSteps}
        />

        {renderInputOptions()}

        <WhyThisMatters text={currentQuestion.whyWeAsk[language]} />
      </ScrollView>

      {/* Persistent Navigation Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <PrimaryButton
          title={returnTo === "review" ? "CANCEL" : "BACK"}
          variant="secondary"
          onPress={handleBack}
          style={styles.navBtn}
        />
        <PrimaryButton
          title={returnTo === "review" ? "SAVE" : "NEXT"}
          variant="primary"
          onPress={handleNext}
          disabled={!canAdvance}
          style={styles.navBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 80, // space for footer
  },
  optionsContainer: {
    marginTop: SPACING.md,
  },
  segmentedRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedSegmentBtn: {
    backgroundColor: "rgba(217, 119, 6, 0.06)",
    borderColor: colors.marigold,
  },
  unselectedSegmentBtn: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  segmentText: {
    fontFamily: "System",
    fontSize: 15,
    fontWeight: "600",
    backgroundColor: "transparent",
  },
  selectedSegmentText: {
    color: colors.marigold,
    fontWeight: "700",
    backgroundColor: "transparent",
  },
  unselectedSegmentText: {
    color: colors.textSecondary,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  sliderContainer: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: SPACING.xl,
    marginTop: SPACING.md,
    alignItems: "center",
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  sliderSubtext: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1.8,
    marginBottom: SPACING.md,
  },
  sliderValueBox: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  sliderValue: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 48,
    color: colors.marigold,
    lineHeight: 52,
  },
  sliderUnit: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginTop: 2,
    backgroundColor: "transparent",
  },
  sliderInput: {
    width: "100%",
    height: 40,
  },
  sliderBounds: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.md,
  },
  boundsText: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  navBtn: {
    flex: 1,
  },
  introSafeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  introContent: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    justifyContent: "space-between",
  },
  introHeader: {
    alignItems: "center",
    marginTop: SPACING.xl,
  },
  introSubtitle: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 2,
  },
  introCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  introIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#fffdf9",
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  introTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 36,
    color: colors.nightBlue,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  introDescription: {
    fontFamily: "System",
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  introFooter: {
    width: "100%",
    marginBottom: SPACING.xl,
  },
  introMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  introMetaText: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "600",
    color: colors.textTertiary,
    backgroundColor: "transparent",
  },
  introMetaDivider: {
    color: colors.textTertiary,
    marginHorizontal: SPACING.xs,
    backgroundColor: "transparent",
  },
});
