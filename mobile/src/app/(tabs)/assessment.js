import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAssessment } from "../../context/AssessmentContext";
import { usePreferences } from "../../context/PreferencesContext";
import { COLORS, SPACING } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import PrimaryButton from "../../components/PrimaryButton";
import IndianBackground from "../../components/IndianBackground";

export default function Assessment() {
  const router = useRouter();
  const { recoverySession, startNewSession, resumeSession, activeAssessmentId } = useAssessment();
  const { colors, language, t } = usePreferences();

  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const styles = createStyles(colors);

  const handleStartNew = () => {
    setShowSafetyModal(true);
  };

  const proceedWithNewSession = async () => {
    setShowSafetyModal(false);
    await startNewSession();
    router.push("/assessment/index");
  };

  const triggerEmergencyInterruption = () => {
    setShowSafetyModal(false);
    setShowEmergencyModal(true);
  };

  const handleResume = async () => {
    const sessionId = recoverySession?.id || activeAssessmentId;
    if (sessionId) {
      await resumeSession(sessionId);
      router.push("/assessment/index");
    } else {
      handleStartNew();
    }
  };

  const hasIncompleteSession = !!recoverySession || !!activeAssessmentId;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <IndianBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <BrandHeader />

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="activity" size={28} color={colors.marigold} />
          </View>
          
          <Text style={styles.title}>
            {language === "hi" ? "नैदानिक कल्याण आकलन" : "Clinical Wellness Screening"}
          </Text>
          <Text style={styles.subtitle}>
            {language === "hi" 
              ? "व्यक्तिगत साक्ष्य-आधारित रिपोर्ट तैयार करने के लिए जीवनशैली, तापमान जोखिम, मानसिक तनाव और पर्यावरणीय जोखिमों का विश्लेषण करें।"
              : "Analyze lifestyle, scrotal temperature, mental strain, and environmental exposures to generate a personalized evidence-aware report."}
          </Text>

          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Feather name="shield" size={14} color={colors.ashokaGreen} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {language === "hi" ? "प्रमाणीकृत और सुरक्षित डेटा पृथक्करण" : "Authenticated & Secure Data Isolation"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Feather name="clock" size={14} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {language === "hi" ? "पूरा करने में लगभग 8-10 मिनट का समय लगता है" : "Takes approximately 8–10 minutes to complete"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Feather name="cpu" size={14} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {language === "hi" ? "Groq इंजन के माध्यम से एआई-सहायता नैदानिक फीडबैक" : "AI-assisted clinical feedback via Groq Engine"}
              </Text>
            </View>
          </View>

          {hasIncompleteSession ? (
            <View style={styles.resumeContainer}>
              <Text style={styles.resumePrompt}>
                {language === "hi" ? "आपके पास एक प्रगतिरत आकलन है।" : "You have an in-progress assessment."}
              </Text>
              <PrimaryButton
                title={language === "hi" ? "आकलन जारी रखें" : "CONTINUE ASSESSMENT"}
                variant="orange"
                onPress={handleResume}
                style={styles.actionBtn}
              />
              <PrimaryButton
                title={language === "hi" ? "नया शुरू करें" : "START NEW"}
                variant="secondary"
                onPress={handleStartNew}
                style={styles.secondaryBtn}
              />
            </View>
          ) : (
            <PrimaryButton
              title={language === "hi" ? "आकलन शुरू करें" : "START ASSESSMENT"}
              variant="primary"
              onPress={handleStartNew}
              style={styles.actionBtn}
            />
          )}
          </View>
        </ScrollView>

        {/* Modal 1: Pre-Assessment Clinical Safety Screener */}
        <Modal
          visible={showSafetyModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSafetyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalSafetyBadge}>
                  <Feather name="alert-triangle" size={14} color="#DC2626" />
                  <Text style={styles.modalSafetyBadgeText}>
                    {language === "hi" ? "नैदानिक सुरक्षा जांच" : "Clinical Safety Checkpoint"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowSafetyModal(false)}>
                  <Feather name="x" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>
                  {language === "hi" 
                    ? "क्या आप इनमें से किसी भी तीव्र आपातकालीन लक्षण का अनुभव कर रहे हैं?" 
                    : "Are you currently experiencing any urgent symptoms?"}
                </Text>
                <Text style={styles.modalDescription}>
                  {language === "hi"
                    ? "MantraAI एक शैक्षिक वेलनेस स्क्रीनिंग प्लेटफॉर्म है और आपातकालीन चिकित्सा सेवा नहीं है। यदि आप इनमें से किसी भी लक्षण का सामना कर रहे हैं, तो प्रश्नावली भरने के बजाय तत्काल अस्पताल जाना आवश्यक है:"
                    : "MantraAI is an educational wellness screening platform and is NOT an emergency medical service. If you are experiencing any of the following acute symptoms right now, you require immediate emergency care rather than completing a questionnaire:"}
                </Text>

                <View style={styles.flagList}>
                  <View style={styles.flagItem}>
                    <Text style={styles.flagBullet}>!</Text>
                    <View style={styles.flagTextCol}>
                      <Text style={styles.flagItemTitle}>
                        {language === "hi"
                          ? "अचानक या गंभीर अंडकोश का दर्द (घंटों के भीतर शुरू हुआ)"
                          : "Sudden, severe, or agonizing testicular/scrotal pain (onset within hours)"}
                      </Text>
                      <Text style={styles.flagItemSub}>
                        {language === "hi"
                          ? "आपातकालीन स्थिति — तुरंत आपातकालीन चिकित्सा मूल्यांकन प्राप्त करें। प्रश्नावली पूरी करने या दर्द कम होने की प्रतीक्षा न करें।"
                          : "Time-critical emergency — seek emergency assessment immediately. Do not wait for symptoms to improve or delay for questionnaires."}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.flagItem}>
                    <Text style={styles.flagBullet}>!</Text>
                    <View style={styles.flagTextCol}>
                      <Text style={styles.flagItemTitle}>
                        {language === "hi"
                          ? "अंडकोश में तेज सूजन के साथ तेज बुखार या ठंड लगना"
                          : "Rapid scrotal swelling with high fever, severe chills, or nausea"}
                      </Text>
                      <Text style={styles.flagItemSub}>
                        {language === "hi"
                          ? "संभावित तीव्र गंभीर संक्रमण — तत्काल चिकित्सकीय मूल्यांकन की आवश्यकता।"
                          : "Suspected acute severe epididymo-orchitis or systemic infection."}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.flagItem}>
                    <Text style={styles.flagBullet}>!</Text>
                    <View style={styles.flagTextCol}>
                      <Text style={styles.flagItemTitle}>
                        {language === "hi"
                          ? "कमर या अंडकोश में हाल ही में गंभीर चोट जिसके बाद भारी सूजन"
                          : "Recent acute injury or trauma to the groin/testicles with swelling/bruising"}
                      </Text>
                      <Text style={styles.flagItemSub}>
                        {language === "hi"
                          ? "संभावित टेस्टिकुलर फ्रैक्चर या हेमेटोमा — तत्काल शारीरिक परीक्षण की आवश्यकता।"
                          : "Suspected testicular rupture or hematoma requiring clinical physical examination."}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.flagItem}>
                    <Text style={styles.flagBullet}>!</Text>
                    <View style={styles.flagTextCol}>
                      <Text style={styles.flagItemTitle}>
                        {language === "hi"
                          ? "पेशाब में भारी खून आना या पेशाब करने में असमर्थता"
                          : "Gross blood in urine or semen, or inability to urinate"}
                      </Text>
                      <Text style={styles.flagItemSub}>
                        {language === "hi"
                          ? "तीव्र मूत्र अवरोध या ग्रॉस हेमट्यूरिया — आपातकालीन मूल्यांकन आवश्यक।"
                          : "Acute urinary retention or gross hematuria requiring immediate clinical evaluation."}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.flagItem}>
                    <Text style={styles.flagBullet}>!</Text>
                    <View style={styles.flagTextCol}>
                      <Text style={styles.flagItemTitle}>
                        {language === "hi"
                          ? "स्वयं को नुकसान पहुंचाने के विचार या अत्यधिक मानसिक संकट"
                          : "Thoughts of self-harm, suicide, or overwhelming psychological crisis"}
                      </Text>
                      <Text style={styles.flagItemSub}>
                        {language === "hi"
                          ? "तत्काल 24/7 सहायता उपलब्ध है — टेली-मानस (14416) या 112 पर संपर्क करें।"
                          : "Immediate 24/7 crisis support available via Tele-MANAS (14416) or 112."}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActionCol}>
                <TouchableOpacity
                  style={styles.emergencyBtn}
                  onPress={triggerEmergencyInterruption}
                >
                  <Feather name="alert-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emergencyBtnText}>
                    {language === "hi" ? "हाँ, मुझे इनमें से लक्षण हैं" : "I HAVE THESE SYMPTOMS"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.proceedSafeBtn}
                  onPress={proceedWithNewSession}
                >
                  <Text style={styles.proceedSafeBtnText}>
                    {language === "hi" ? "नहीं, मुझे कोई गंभीर लक्षण नहीं है — आगे बढ़ें" : "NO, I DO NOT HAVE THESE SYMPTOMS"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal 2: Urgent Clinical Safety Interruption */}
        <Modal
          visible={showEmergencyModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEmergencyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { borderColor: "#DC2626", borderWidth: 2 }]}>
              <View style={styles.emergencyBannerHeader}>
                <View style={styles.emergencyIconBox}>
                  <Feather name="alert-triangle" size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emergencyBannerBadge}>
                    {language === "hi" ? "आपातकालीन नैदानिक इंटरप्शन" : "URGENT SAFETY INTERRUPT"}
                  </Text>
                  <Text style={styles.emergencyBannerTitle}>
                    {language === "hi" ? "तत्काल अस्पताल मूल्यांकन आवश्यक" : "Immediate In-Person Medical Attention Required"}
                  </Text>
                </View>
              </View>

              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.emergencyBodyText}>
                  {language === "hi"
                    ? "आपके लक्षण एक संभावित तीव्र स्थिति (जैसे टेस्टिकुलर टॉरशन, गंभीर आघात या तीव्र संक्रमण) की ओर संकेत करते हैं जिसके लिए आपातकालीन विभाग (ER) जाने की आवश्यकता है।"
                    : "Your reported symptoms indicate an acute medical concern (such as potential testicular torsion, trauma, or severe infection) that warrants immediate emergency department evaluation."}
                </Text>

                <Text style={styles.emergencySectionHeader}>
                  {language === "hi" ? "तत्काल देखभाल निर्देश:" : "Immediate Care Instructions:"}
                </Text>
                <View style={styles.instructionCard}>
                  <Text style={styles.instructionText}>
                    • <Text style={{ fontWeight: "700" }}>{language === "hi" ? "तुरंत आपातकालीन मूल्यांकन प्राप्त करें:" : "Seek Emergency Care Now:"}</Text>{" "}
                    {language === "hi" ? "निकटतम आपातकालीन कक्ष (ER) जाएं या 112 / 108 पर कॉल करें। लक्षणों के ठीक होने या प्रश्नावली पूरी करने का इंतजार न करें।" : "Proceed immediately to the nearest Emergency Room or call 112 / 108. Do not wait for symptoms to improve or delay for questionnaires."}
                  </Text>
                  <Text style={styles.instructionText}>
                    • <Text style={{ fontWeight: "700" }}>{language === "hi" ? "आपातकालीन कर्मियों के निर्देशों का पालन करें:" : "Follow Clinician Directions:"}</Text>{" "}
                    {language === "hi" ? "यदि तत्काल शल्य चिकित्सा मूल्यांकन की संभावना हो, तो उपस्थित चिकित्सकों के निर्देश मिलने तक खाने-पीने से बचें।" : "Follow directions from attending emergency clinicians. Avoid eating or drinking unless advised by attending staff if urgent surgical evaluation is required."}
                  </Text>
                  <Text style={styles.instructionText}>
                    • <Text style={{ fontWeight: "700" }}>{language === "hi" ? "घरेलू उपचार से बचें:" : "Avoid Home Remedies:"}</Text>{" "}
                    {language === "hi" ? "अंडकोश पर गर्म सिकाई या हीटिंग पैड न लगाएं और किसी घरेलू उपचार में देरी न करें।" : "Avoid hot compresses or heating pads; do not let secondary advice or preparation delay immediate emergency care."}
                  </Text>
                </View>

                <Text style={styles.emergencySectionHeader}>
                  {language === "hi" ? "सत्यापित आपातकालीन नंबर (भारत):" : "Verified Emergency Numbers (India):"}
                </Text>
                <View style={styles.contactList}>
                  <TouchableOpacity
                    style={styles.contactCard}
                    onPress={() => Linking.openURL("tel:112")}
                  >
                    <View>
                      <Text style={styles.contactName}>{language === "hi" ? "राष्ट्रीय आपातकालीन सेवा (ERSS)" : "National Emergency Helpline"}</Text>
                      <Text style={styles.contactNumber}>112</Text>
                    </View>
                    <Feather name="phone-call" size={18} color="#DC2626" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.contactCard}
                    onPress={() => Linking.openURL("tel:108")}
                  >
                    <View>
                      <Text style={styles.contactName}>{language === "hi" ? "एम्बुलेंस सेवा" : "National Ambulance Service"}</Text>
                      <Text style={styles.contactNumber}>108</Text>
                    </View>
                    <Feather name="phone-call" size={18} color="#DC2626" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.contactCard}
                    onPress={() => Linking.openURL("tel:14416")}
                  >
                    <View>
                      <Text style={styles.contactName}>Tele-MANAS (Mental Health 24/7)</Text>
                      <Text style={styles.contactNumber}>14416 / 1800-891-4416</Text>
                    </View>
                    <Feather name="phone-call" size={18} color="#2563EB" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.contactCard}
                    onPress={() => Linking.openURL("tel:18005990019")}
                  >
                    <View>
                      <Text style={styles.contactName}>KIRAN Helpline (Govt of India)</Text>
                      <Text style={styles.contactNumber}>1800-599-0019</Text>
                    </View>
                    <Feather name="phone-call" size={18} color="#2563EB" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.contactCard}
                    onPress={() => Linking.openURL("tel:+919999666555")}
                  >
                    <View>
                      <Text style={styles.contactName}>Vandrevala Foundation (24/7 Support)</Text>
                      <Text style={styles.contactNumber}>+91 9999 666 555</Text>
                    </View>
                    <Feather name="phone-call" size={18} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.dismissEmergencyBtn}
                onPress={() => setShowEmergencyModal(false)}
              >
                <Text style={styles.dismissEmergencyBtnText}>
                  {language === "hi" ? "समझ गया — आपातकालीन सहायता लें" : "I Understand — Seek Emergency Help"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </IndianBackground>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: "center",
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.creamDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: "System",
    fontSize: 20,
    fontWeight: "700",
    color: colors.nightBlue,
    marginBottom: SPACING.xs,
    textAlign: "center",
    backgroundColor: "transparent",
  },
  subtitle: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: SPACING.xl,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  infoList: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1.2,
    borderColor: colors.border,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  infoIcon: {
    marginRight: SPACING.sm,
  },
  infoText: {
    fontFamily: "System",
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    backgroundColor: "transparent",
  },
  resumeContainer: {
    width: "100%",
    alignItems: "center",
  },
  resumePrompt: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "700",
    color: colors.marigold,
    marginBottom: SPACING.sm,
    textAlign: "center",
    backgroundColor: "transparent",
  },
  actionBtn: {
    width: "100%",
    marginBottom: SPACING.sm,
  },
  secondaryBtn: {
    width: "100%",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
  },
  modalCard: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: SPACING.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  modalSafetyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalSafetyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
    marginLeft: 6,
    textTransform: "uppercase",
  },
  modalScrollBody: {
    marginVertical: SPACING.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1C1917",
    marginBottom: 6,
    lineHeight: 24,
  },
  modalDescription: {
    fontSize: 12,
    color: "#57534E",
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  flagList: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  flagItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF8F8",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    borderRadius: 12,
    padding: 10,
  },
  flagBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
    marginRight: 10,
    marginTop: 2,
  },
  flagTextCol: {
    flex: 1,
  },
  flagItemTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 2,
  },
  flagItemSub: {
    fontSize: 11,
    color: "#7F1D1D",
    lineHeight: 15,
  },
  modalActionCol: {
    marginTop: SPACING.sm,
    gap: 8,
  },
  emergencyBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  proceedSafeBtn: {
    backgroundColor: colors.creamDark,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  proceedSafeBtnText: {
    color: colors.nightBlue,
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  // Emergency Modal Details
  emergencyBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: 12,
  },
  emergencyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyBannerBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  emergencyBannerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#991B1B",
    lineHeight: 20,
  },
  emergencyBodyText: {
    fontSize: 12,
    color: "#7F1D1D",
    lineHeight: 18,
    marginBottom: SPACING.md,
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  emergencySectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#991B1B",
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 4,
  },
  instructionCard: {
    backgroundColor: "#FFF8F8",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    borderRadius: 10,
    padding: 10,
    marginBottom: SPACING.md,
    gap: 6,
  },
  instructionText: {
    fontSize: 11,
    color: "#7F1D1D",
    lineHeight: 16,
  },
  contactList: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  contactCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    padding: 10,
  },
  contactName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#57534E",
  },
  contactNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1C1917",
    marginTop: 2,
  },
  dismissEmergencyBtn: {
    backgroundColor: "#1C1917",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xs,
  },
  dismissEmergencyBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
});

