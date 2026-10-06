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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ONBOARDING_SLIDES = [
  {
    id: "slide_1",
    tag: "AI CURRICULUM",
    badge: "✨ Adaptive Learning Engine",
    title: "Learning Designed\nAround Your Needs",
    subtitle:
      "Choose your goal, target date, and daily study hours. Our AI crafts an individualized syllabus tailored specifically to your learning curve.",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649595.png",
    accentColor: Colors.PRIMARY,
    glowColor: "#EEF2FF",
    pills: ["🎯 Goal-Driven", "⚡ Dynamic Roadmap", "📅 Daily Pacing"],
  },
  {
    id: "slide_2",
    tag: "LIVE & DOUBTS",
    badge: "🎥 Interactive Masterclasses",
    title: "Expert Live Classes\n& 24/7 AI Doubt Solver",
    subtitle:
      "Join interactive video studios hosted by top faculty, access archived replays, and snap or type any question for step-by-step doubt resolution.",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649635.png",
    accentColor: "#dc2626",
    glowColor: "#FEF2F2",
    pills: ["🔴 Live Studios", "🤖 Instant AI Tutor", "📼 Full Replays"],
  },
  {
    id: "slide_3",
    tag: "EXAM EXCELLENCE",
    badge: "🏆 Proven Performance",
    title: "Timed Mock Drills\n& Weak-Topic Radar",
    subtitle:
      "Simulate authentic exam conditions with auto-submitting timers, precision accuracy analytics, and targeted drills on your weak topics.",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649626.png",
    accentColor: "#16a34a",
    glowColor: "#F0FDF4",
    pills: ["⏱️ Timed Drills", "📊 Accuracy Radar", "✅ Verified Mastery"],
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

      {/* Slide Badge Pill */}
      <View style={styles.badgePill}>
        <Ionicons name="sparkles" size={12} color={Colors.PRIMARY} />
        <Text style={styles.badgePillText}>{item.badge}</Text>
      </View>

      {/* Typography Block */}
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

      {/* 3 Highlight Value Chips */}
      <View style={styles.pillsRow}>
        {item.pills.map((pill, idx) => (
          <View key={idx} style={styles.featurePill}>
            <Text style={styles.featurePillText}>{pill}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header Bar with Brand & Skip Option */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconBox}>
            <Ionicons name="school" size={18} color={Colors.PRIMARY} />
          </View>
          <Text style={styles.brandTitle}>Coaching Guru</Text>
        </View>

        {!isLastSlide ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Skip</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.GRAY} />
          </TouchableOpacity>
        ) : (
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>3 of 3</Text>
          </View>
        )}
      </View>

      {/* Horizontal Paging Walkthrough FlatList */}
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
        style={styles.sliderList}
      />

      {/* Bottom Control & Action Section */}
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

        {/* Action Buttons */}
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
            <Ionicons name="school-outline" size={13} color="#16a34a" />
            <Text style={[styles.staffText, { color: "#16a34a" }]}>Teacher Portal</Text>
          </TouchableOpacity>

          <View style={styles.staffDot} />

          <TouchableOpacity
            onPress={() => router.push("/admin")}
            style={styles.staffItem}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark-outline" size={13} color="#0284c7" />
            <Text style={[styles.staffText, { color: "#0284c7" }]}>Admin Console</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
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
    backgroundColor: Colors.PRIMARY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: Colors.BLACK,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
  },
  skipBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.GRAY,
  },
  stepBadge: {
    backgroundColor: Colors.PRIMARY_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stepBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  sliderList: {
    flexGrow: 0,
  },
  slideItem: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  visualContainer: {
    width: SCREEN_WIDTH - 60,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 6,
  },
  ambientGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.9,
  },
  slideImage: {
    width: 150,
    height: 150,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    marginBottom: 10,
  },
  badgePillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  slideTitle: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: Colors.BLACK,
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  slideSubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  featurePill: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  featurePillText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#475569",
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 10,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e2e8f0",
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 4,
  },
  navRow: {
    width: "100%",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.PRIMARY,
    height: 52,
    borderRadius: 16,
    gap: 8,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
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
    backgroundColor: Colors.PRIMARY,
    height: 54,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  getStartedBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.WHITE,
    letterSpacing: 0.2,
  },
  signInBtn: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  signInBtnText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#64748b",
  },
  signInBold: {
    fontFamily: "outfit-bold",
    color: Colors.PRIMARY,
  },
  staffFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  staffItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  staffText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
  },
  staffDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#cbd5e1",
  },
});
