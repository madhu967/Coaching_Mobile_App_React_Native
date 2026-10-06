import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Text,
  Image,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../constant/Colors";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { UserDetailContext } from "../context/UserDetailContext";
import { auth } from "../config/firebaseConfig";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ONBOARDING_SLIDES = [
  {
    id: "slide_1",
    tag: "AI NEEDS-BASED ENGINE",
    badge: "✨ Personalized Course Generator",
    title: "Learning Designed\nAround Your Needs",
    subtitle:
      "Select your goal, target date, and daily study hours. Our AI crafts an individualized syllabus tailored specifically to your learning curve.",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649595.png",
    glowColor: Colors.LIME_LIGHT,
    pills: ["🎯 Goal-Driven", "⚡ Adaptive Pacing", "📅 Custom Milestones"],
  },
  {
    id: "slide_2",
    tag: "LIVE STUDIOS & DOUBTS",
    badge: "🎥 Masterclasses & AI Doubts",
    title: "Interactive Live Classes\n& 24/7 AI Doubt Solver",
    subtitle:
      "Join interactive video studios hosted by top faculty, access class replays, and snap or type any question for step-by-step doubt resolution.",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649635.png",
    glowColor: "#E0F7FE",
    pills: ["🔴 Live Studios", "🤖 Instant AI Tutor", "📝 Faculty Remarks"],
  },
  {
    id: "slide_3",
    tag: "AUTHENTIC EXAM DRILLS",
    badge: "⏱️ Timed Mock Drills",
    title: "Simulated Tests &\nWeak-Topic Radar",
    subtitle:
      "Experience authentic exam conditions with auto-submitting timers, precision accuracy analytics, and targeted drills on your weak topics.",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649626.png",
    glowColor: Colors.LIME_LIGHT,
    pills: ["⏱️ Timed Drills", "📊 Accuracy Radar", "🏆 Verified Standing"],
  },
];

export default function Index() {
  const router = useRouter();
  const { setUserDetail } = useContext(UserDetailContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 2000)
          );
          const result = await Promise.race([
            getDoc(doc(db, "users", user.email)),
            timeoutPromise,
          ]);
          if (result && result.exists()) {
            setUserDetail(result.data());
          } else {
            setUserDetail({
              email: user.email,
              name: user.displayName || user.email.split("@")[0],
            });
          }
        } catch (e) {
          setUserDetail({
            email: user.email,
            name: user.displayName || user.email.split("@")[0],
          });
        }
        router.replace("/Home");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleNextSlide = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      router.push("/auth/SignUp");
    }
  };

  const handleSkip = () => {
    flatListRef.current?.scrollToIndex({
      index: ONBOARDING_SLIDES.length - 1,
      animated: true,
    });
    setActiveIndex(ONBOARDING_SLIDES.length - 1);
  };

  const isLastSlide = activeIndex === ONBOARDING_SLIDES.length - 1;

  const renderSlideItem = ({ item }) => (
    <View style={styles.slideItem}>
      {/* 3D Visual with soft glowing radial aura */}
      <View style={styles.visualContainer}>
        <View style={[styles.ambientGlow, { backgroundColor: item.glowColor }]} />
        <Image
          source={{ uri: item.image }}
          style={styles.slideImage}
          resizeMode="contain"
        />
      </View>

      {/* Typography & Pills Block */}
      <View style={styles.slideContentBlock}>
        {/* Slide Badge Pill with Electric Lime */}
        <View style={styles.badgePill}>
          <Ionicons name="sparkles" size={12} color={Colors.BLACK} />
          <Text style={styles.badgePillText}>{item.badge}</Text>
        </View>

        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

        {/* Highlight Value Chips */}
        <View style={styles.pillsRow}>
          {item.pills.map((pill, idx) => (
            <View key={idx} style={styles.featurePill}>
              <Text style={styles.featurePillText}>{pill}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconBox}>
            <Ionicons name="school" size={17} color={Colors.BLACK} />
          </View>
          <Text style={styles.brandTitle}>Coaching Guru</Text>
        </View>

        {!isLastSlide ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Skip</Text>
            <Ionicons name="chevron-forward" size={13} color={Colors.MUTED} />
          </TouchableOpacity>
        ) : (
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>3 of 3</Text>
          </View>
        )}
      </View>

      {/* Full-Screen Horizontal Walkthrough FlatList */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setActiveIndex(newIndex);
        }}
        renderItem={renderSlideItem}
        style={styles.fullScreenSlider}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      {/* Bottom Controls & Navigation */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {ONBOARDING_SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Action Buttons in Pitch Black */}
        {isLastSlide ? (
          <>
            <TouchableOpacity
              style={styles.getStartedBtn}
              onPress={() => router.push("/auth/SignUp")}
              activeOpacity={0.88}
            >
              <Text style={styles.getStartedBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.WHITE} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => router.push("/auth/Signin")}
              activeOpacity={0.8}
            >
              <Text style={styles.signInBtnText}>
                Already have an account? <Text style={styles.signInBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handleNextSlide}
              activeOpacity={0.88}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.WHITE} />
            </TouchableOpacity>
          </View>
        )}

        {/* Authorized Faculty & Admin Links */}
        <View style={styles.staffFooter}>
          <TouchableOpacity
            onPress={() => router.push("/teacher")}
            style={styles.staffItem}
            activeOpacity={0.7}
          >
            <Ionicons name="school-outline" size={13} color={Colors.BLACK} />
            <Text style={styles.staffText}>Teacher Portal</Text>
          </TouchableOpacity>

          <View style={styles.staffDot} />

          <TouchableOpacity
            onPress={() => router.push("/admin")}
            style={styles.staffItem}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark-outline" size={13} color={Colors.BLACK} />
            <Text style={styles.staffText}>Admin Console</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_LIGHT, // Full screen clean off-white
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 46,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.LIME,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.BLACK,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  skipBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.MUTED,
  },
  stepBadge: {
    backgroundColor: Colors.LIME_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stepBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.BLACK,
  },

  /* Full Screen Slider */
  fullScreenSlider: {
    flex: 1,
  },
  slideItem: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  visualContainer: {
    width: SCREEN_WIDTH - 60,
    height: SCREEN_HEIGHT * 0.28,
    maxHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.85,
  },
  slideImage: {
    width: 160,
    height: 160,
  },
  slideContentBlock: {
    alignItems: "center",
    width: "100%",
    paddingBottom: 8,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.LIME,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
    marginBottom: 12,
  },
  badgePillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.BLACK,
  },
  slideTitle: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    color: Colors.BLACK,
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  slideSubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  featurePill: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  featurePillText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.BLACK,
  },

  /* Bottom Controls */
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 8,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.BORDER,
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.BLACK,
    borderRadius: 4,
  },
  navRow: {
    width: "100%",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BLACK, // Signature pitch black
    height: 52,
    borderRadius: 18,
    gap: 8,
    elevation: 3,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  continueBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.WHITE,
  },
  getStartedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BLACK,
    height: 54,
    borderRadius: 18,
    gap: 8,
    elevation: 4,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  getStartedBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.WHITE,
    letterSpacing: 0.2,
  },
  signInBtn: {
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  signInBtnText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
  },
  signInBold: {
    fontFamily: "outfit-bold",
    color: Colors.BLACK,
  },
  staffFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  staffItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  staffText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.BLACK,
  },
  staffDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.BORDER,
  },
});
