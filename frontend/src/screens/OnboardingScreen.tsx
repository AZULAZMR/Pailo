import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, Dimensions, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useAuth } from "../store/AuthContext";
import { api } from "../services/api";
import { theme } from "../utils/theme";

const { width } = Dimensions.get("window");

const GOAL_TABS = [
  { key: "cyclus", label: "Cyclus", icon: "🩸" },
  { key: "lichaam", label: "Lichaam", icon: "💪" },
  { key: "leven", label: "Life", icon: "✨" },
];

const GOAL_PRESETS = [
  { id: "menstruatie", title: "Menstruatiecyclus reguleren", icon: "🩸", category: "cyclus" },
  { id: "pijn", title: "Pijn bij menstruatie verminderen", icon: "💊", category: "cyclus" },
  { id: "zwanger", title: "Zwanger worden", icon: "🤱", category: "cyclus" },
  { id: "anticonceptie", title: "Anticonceptie", icon: "⚕️", category: "cyclus" },
  { id: "overgang", title: "Overgang/Menopauze beheren", icon: "🌺", category: "cyclus" },
  { id: "hormonen", title: "Hormonale balans herstellen", icon: "⚖️", category: "cyclus" },
  { id: "endometriose", title: "Endometriose beheren", icon: "🫁", category: "cyclus" },
  { id: "pcos", title: "PCOS beheren", icon: "🩺", category: "cyclus" },
  { id: "migraine", title: "Migraine bij menstruatie", icon: "🤕", category: "cyclus" },
  { id: "zwangerschap", title: "Zwangerschap voorbereiden", icon: "👶", category: "cyclus" },
  { id: "postpartum", title: "Postpartum herstel", icon: "🤱", category: "cyclus" },
  { id: "borstvoeding", title: "Borstvoeding", icon: "🍼", category: "cyclus" },
  { id: "bloedarmoede", title: "Bloedarmoede/ijzertekort", icon: "🩸", category: "cyclus" },
  { id: "schildklier", title: "Schildklier gezondheid", icon: "🦋", category: "cyclus" },
  { id: "afvallen", title: "Afvallen", icon: "🏋️", category: "lichaam" },
  { id: "aankomen", title: "Aankomen in gewicht", icon: "💪", category: "lichaam" },
  { id: "spieren", title: "Spieren opbouwen", icon: "💪", category: "lichaam" },
  { id: "gezonder_eten", title: "Gezonder eten", icon: "🥗", category: "lichaam" },
  { id: "meer_bewegen", title: "Meer bewegen", icon: "🏃", category: "lichaam" },
  { id: "huid", title: "Huid verbeteren", icon: "✨", category: "lichaam" },
  { id: "haar", title: "Haaruitval verminderen", icon: "💇", category: "lichaam" },
  { id: "stress_verminderen", title: "Stress verminderen", icon: "🧘", category: "leven" },
  { id: "beter_slapen", title: "Beter slapen", icon: "😴", category: "leven" },
  { id: "meer_energie", title: "Meer energie krijgen", icon: "⚡", category: "leven" },
  { id: "mentale_gezondheid", title: "Mentale gezondheid verbeteren", icon: "🧠", category: "leven" },
  { id: "libido", title: "Libido verbeteren", icon: "❤️", category: "leven" },
  { id: "mindfulness", title: "Mindfulness/meditatie", icon: "🧘", category: "leven" },
  { id: "dagboek", title: "Dagboek bijhouden", icon: "📓", category: "leven" },
  { id: "sociale_connecties", title: "Sociale connecties verbeteren", icon: "👥", category: "leven" },
  { id: "zelfliefde", title: "Zelfliefde en self-care", icon: "🌸", category: "leven" },
  { id: "carriere", title: "Carri\u00e8re doelen", icon: "💼", category: "leven" },
  { id: "financieel", title: "Financi\u00eble gezondheid", icon: "💰", category: "leven" },
  { id: "reizen", title: "Reizen en avontuur", icon: "✈️", category: "leven" },
  { id: "creativiteit", title: "Creativiteit ontwikkelen", icon: "🎨", category: "leven" },
  { id: "koken", title: "Beter leren koken", icon: "🍳", category: "leven" },
  { id: "lezen", title: "Meer lezen", icon: "📚", category: "leven" },
  { id: "hobby", title: "Nieuwe hobby ontdekken", icon: "🎸", category: "leven" },
  { id: "vrijwilliger", title: "Vrijwilligerswerk doen", icon: "🤝", category: "leven" },
  { id: "duurzaam", title: "Duurzamer leven", icon: "🌍", category: "leven" },
  { id: "mindset", title: "Positieve mindset ontwikkelen", icon: "🌞", category: "leven" },
];

const PAIN_CONFIG = [
  { value: 0, label: "\ud83d\ude0a", color: "#81C784" },
  { value: 2, label: "2", color: "#FFD54F" },
  { value: 4, label: "4", color: "#FFD54F" },
  { value: 6, label: "6", color: "#FFAB91" },
  { value: 8, label: "8", color: "#EF9A9A" },
  { value: 10, label: "\ud83d\ude2b", color: "#E57373" },
];

function ConfettiBurst() {
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      color: ["#F06292", "#CE93D8", "#81C784", "#FFD54F", "#4FC3F7"][i % 5],
      startX: Math.random() * width,
      endX: (Math.random() - 0.5) * width * 1.5,
      endY: -200 - Math.random() * 400,
    }))
  ).current;

  useEffect(() => {
    Animated.stagger(
      30,
      particles.map((p) =>
        Animated.parallel([
          Animated.timing(p.x, { toValue: p.endX, duration: 1000, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: p.endY, duration: 1000, useNativeDriver: true }),
          Animated.timing(p.rotate, { toValue: 3, duration: 1000, useNativeDriver: true }),
        ])
      )
    ).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: p.color,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { rotate: p.rotate.interpolate({ inputRange: [0, 3], outputRange: ["0deg", "1080deg"] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function OnboardingScreen({ navigation }: any) {
  const { setOnboardingDone } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [menstruationDays, setMenstruationDays] = useState(5);
  const [painLevel, setPainLevel] = useState(0);
  const [medicationWorks, setMedicationWorks] = useState<boolean | null>(null);
  const [cycleLengthFull, setCycleLengthFull] = useState(28);
  const [contraception, setContraception] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [goalTab, setGoalTab] = useState("cyclus");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const lotusScale = useRef(new Animated.Value(0.3)).current;
  const lotusRotate = useRef(new Animated.Value(0)).current;
  const lotusOpacity = useRef(new Animated.Value(0)).current;
  const welcomeLotusScale = useRef(new Animated.Value(0)).current;
  const welcomeLotusRotate = useRef(new Animated.Value(0)).current;

  const bmi = weight && height ? (parseFloat(weight) / ((parseFloat(height) / 100) * (parseFloat(height) / 100))).toFixed(1) : null;
  const totalSteps = 5;
  const allDone = selectedGoals.length > 0 && weight && height && menstruationDays >= 1 && medicationWorks !== null;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (step === 0) {
      welcomeLotusScale.setValue(0);
      welcomeLotusRotate.setValue(0);
      Animated.parallel([
        Animated.spring(welcomeLotusScale, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(welcomeLotusRotate, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]).start();
    }
  }, [step]);

  function haptic() {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }

  function toggleGoal(id: string) {
    setSelectedGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
    haptic();
  }

  function animateTo(nextStep: number) {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -width, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(width);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }

  function getFilteredGoals() {
    return GOAL_PRESETS.filter((g) => g.category === goalTab);
  }

  async function handleSave() {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!weight || !height || isNaN(w) || isNaN(h)) {
      Alert.alert("Fout", "Vul geldige getallen in voor gewicht en lengte"); return;
    }
    if (w < 20 || w > 300) { Alert.alert("Fout", "Gewicht moet tussen 20 en 300 kg zijn"); return; }
    if (h < 80 || h > 250) { Alert.alert("Fout", "Lengte moet in centimeters zijn (bijv. 170)"); return; }
    if (medicationWorks === null) { Alert.alert("Fout", "Vul alle velden in"); return; }
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1200);
    setTimeout(() => setShowLoading(true), 600);
    Animated.parallel([
      Animated.spring(lotusScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(lotusRotate, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(lotusOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    try {
      await api.saveOnboarding({
        name: name || undefined,
        weight: w, height: h, age: age ? parseInt(age) : undefined,
        cycleLength: menstruationDays, cycleLengthFull, painLevel, medicationWorks,
        contraception, goals: selectedGoals,
      });
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      await new Promise((r) => setTimeout(r, 2000));
      setOnboardingDone(true);
    } catch (e: any) {
      setShowLoading(false);
      Alert.alert("Fout", e.message || "Ongeldige invoer");
    }
  }

  function getBMIColor(b: string): string {
    const v = parseFloat(b);
    if (v < 18.5) return "#FFA726";
    if (v < 25) return "#81C784";
    if (v < 30) return "#FFA726";
    return "#E57373";
  }

  function getBMILabel(b: string): string {
    const v = parseFloat(b);
    if (v < 18.5) return "Ondergewicht";
    if (v < 25) return "Gezond";
    if (v < 30) return "Overgewicht";
    return "Obesitas";
  }

  const renderDot = (s: number) => {
    const isDone = s < step;
    const isCurrent = s === step;
    return (
      <View
        key={s}
        style={[
          styles.dot,
          isDone && styles.dotDone,
          isCurrent && styles.dotCurrent,
        ]}
      />
    );
  };

  function getGoalTitle(id: string): string {
    const p = GOAL_PRESETS.find((g) => g.id === id);
    return p ? p.title : id;
  }

  function getGoalIcon(id: string): string {
    const p = GOAL_PRESETS.find((g) => g.id === id);
    return p ? p.icon : "📌";
  }

  if (showLoading) {
    return (
      <View style={styles.loadingScreen}>
        <Animated.View style={{ opacity: lotusOpacity, transform: [{ scale: lotusScale }, { rotate: lotusRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
          <Text style={styles.lotusBlooming}>🌸</Text>
        </Animated.View>
        <Text style={styles.loadingTitle}>We maken jouw persoonlijke plan...</Text>
        <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showConfetti && <ConfettiBurst />}

      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        {step > 0 && (
          <TouchableOpacity onPress={() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1200); setTimeout(() => setShowLoading(true), 600); handleSave(); }} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>Sla over</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <LinearGradient
            colors={["#F8BBD0", "#F06292"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]}
          >
            <Animated.View
              style={[
                styles.shimmer,
                {
                  opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
                  transform: [{ translateX: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 300] }) }],
                },
              ]}
            />
          </LinearGradient>
        </View>
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }, (_, i) => renderDot(i))}
        </View>
      </View>

      <Animated.View style={[styles.slideContent, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {step === 0 && (
            <View style={styles.welcomeWrap}>
              <Animated.View style={{ opacity: welcomeLotusScale, transform: [{ scale: welcomeLotusScale }, { rotate: welcomeLotusRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
                <Text style={styles.welcomeLotus}>🌸</Text>
              </Animated.View>
              <Text style={styles.bigTitle}>Welkom bij Pailo</Text>
              <Text style={styles.warmSubtitle}>Jouw persoonlijke coach voor{'\n'}een leven in balans 💫</Text>
              <Text style={styles.fieldLabel}>Wat is jouw naam?</Text>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Bijv. Emma..."
                placeholderTextColor="#CCC"
                autoFocus
                maxLength={40}
              />
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={styles.bigEmoji}>🎯</Text>
              <Text style={styles.bigTitle}>Wat zijn jouw doelen?</Text>
              <Text style={styles.warmSubtitle}>Kies alles wat bij jou past</Text>
              <View style={styles.tabRow}>
                {GOAL_TABS.map((tab) => {
                  const active = goalTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.tab, active && styles.tabActive]}
                      onPress={() => { setGoalTab(tab.key); haptic(); }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.tabIcon}>{tab.icon}</Text>
                      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.goalGrid}>
                {getFilteredGoals().map((g) => {
                  const active = selectedGoals.includes(g.id);
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.goalCard, active && styles.goalCardActive]}
                      onPress={() => toggleGoal(g.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.goalIcon}>{g.icon}</Text>
                      <Text style={[styles.goalText, active && styles.goalTextActive]} numberOfLines={2}>{g.title}</Text>
                      {active && (
                        <View style={styles.goalCheckWrap}>
                          <Text style={styles.goalCheckIcon}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.bigEmoji}>👩</Text>
              <Text style={styles.bigTitle}>Jouw lichaam</Text>
              <Text style={styles.warmSubtitle}>We berekenen hiermee je BMI</Text>
              <View style={styles.bodyRow}>
                <View style={styles.bodyInputWrap}>
                  <Text style={styles.inputLabel}>Gewicht (kg)</Text>
                  <TextInput
                    style={[styles.bodyInput, parseFloat(weight) >= 20 && parseFloat(weight) <= 300 && styles.bodyInputValid]}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    placeholder="65"
                    placeholderTextColor="#CCC"
                  />
                </View>
                <View style={styles.bodyInputWrap}>
                  <Text style={styles.inputLabel}>Lengte (cm)</Text>
                  <TextInput
                    style={[styles.bodyInput, parseFloat(height) >= 80 && parseFloat(height) <= 250 && styles.bodyInputValid]}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="decimal-pad"
                    placeholder="170"
                    placeholderTextColor="#CCC"
                  />
                </View>
              </View>
              <View style={styles.ageRow}>
                <View style={styles.bodyInputWrap}>
                  <Text style={styles.inputLabel}>Leeftijd</Text>
                  <TextInput
                    style={styles.bodyInput}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    placeholder="25"
                    placeholderTextColor="#CCC"
                  />
                </View>
              </View>
              {bmi && (
                <View style={[styles.bmiBadgeCard, { borderLeftColor: getBMIColor(bmi), borderLeftWidth: 4 }]}>
                  <Text style={styles.bmiCompactIcon}>✅</Text>
                  <Text style={styles.bmiCompactText}>
                    Jouw BMI: <Text style={[styles.bmiCompactValue, { color: getBMIColor(bmi) }]}>{bmi}</Text> · {getBMILabel(bmi)} {getBMIColor(bmi) === "#81C784" ? "✅" : getBMIColor(bmi) === "#E57373" ? "⚠️" : "💛"}
                  </Text>
                </View>
              )}
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.bigEmoji}>🩸</Text>
              <Text style={styles.bigTitle}>Jouw cyclus</Text>
              <Text style={styles.warmSubtitle}>Vertel ons over je menstruatie</Text>

              <Text style={styles.fieldLabel}>Hoeveel dagen ben je ongesteld?</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => { setMenstruationDays(Math.max(1, menstruationDays - 1)); haptic(); }}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.stepperValue}>
                  <Text style={styles.stepperValueText}>{menstruationDays}</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => { setMenstruationDays(Math.min(14, menstruationDays + 1)); haptic(); }}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.stepperHint}>meestal 2–7 dagen</Text>

              <Text style={styles.fieldLabel}>Hoeveel pijn heb je?</Text>
              <View style={styles.painRow}>
                {PAIN_CONFIG.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.painDot, painLevel === p.value && { borderColor: p.color, backgroundColor: p.color + "22", transform: [{ scale: 1.15 }] }]}
                    onPress={() => { setPainLevel(p.value); haptic(); }}
                  >
                    <Text style={[styles.painDotText, painLevel === p.value && { color: p.color }]}>{p.label}</Text>
                    {painLevel === p.value && <View style={[styles.painRing, { borderColor: p.color }]} />}
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.painBarRow}>
                {PAIN_CONFIG.map((p) => (
                  <View key={p.value} style={[styles.painBarSeg, { backgroundColor: p.color, opacity: painLevel >= p.value ? 1 : 0.3 }]} />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Werkt medicatie?</Text>
              <View style={styles.medRow}>
                <TouchableOpacity
                  style={[styles.medBtn, medicationWorks === true && styles.medBtnYes]}
                  onPress={() => { setMedicationWorks(true); haptic(); }}
                >
                  <Text style={[styles.medBtnText, medicationWorks === true && styles.medBtnTextActive]}>
                    {medicationWorks === true ? "✅ Ja" : "Ja ✅"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.medBtn, medicationWorks === false && styles.medBtnNo]}
                  onPress={() => { setMedicationWorks(false); haptic(); }}
                >
                  <Text style={[styles.medBtnText, medicationWorks === false && styles.medBtnTextActive]}>
                    {medicationWorks === false ? "❌ Nee" : "Nee ❌"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Hoe lang duurt jouw hele cyclus gemiddeld?</Text>
              <View style={styles.sliderRow}>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${((cycleLengthFull - 21) / 14) * 100}%` }]} />
                  <View style={[styles.sliderThumb, { left: `${((cycleLengthFull - 21) / 14) * 100}%` }]}>
                    <Text style={styles.sliderThumbText}>{cycleLengthFull}</Text>
                  </View>
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>21</Text>
                  <Text style={styles.sliderLabel}>35</Text>
                </View>
              </View>
              <View style={styles.sliderButtons}>
                <TouchableOpacity style={styles.sliderBtn} onPress={() => setCycleLengthFull(Math.max(21, cycleLengthFull - 1))}>
                  <Text style={styles.sliderBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.sliderBtnValue}>{cycleLengthFull} dagen</Text>
                <TouchableOpacity style={styles.sliderBtn} onPress={() => setCycleLengthFull(Math.min(35, cycleLengthFull + 1))}>
                  <Text style={styles.sliderBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Gebruik je anticonceptie?</Text>
              <View style={styles.contraRow}>
                {[
                  { value: "geen", label: "Nee" },
                  { value: "pil", label: "Pil" },
                  { value: "spiraal", label: "Spiraal" },
                  { value: "implanon", label: "Implanon" },
                  { value: "ring", label: "Ring" },
                  { value: "pleister", label: "Pleister" },
                  { value: "condoom", label: "Condoom" },
                  { value: "anders", label: "Anders" },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.contraChip, contraception === c.value && styles.contraChipActive]}
                    onPress={() => { setContraception(c.value); haptic(); }}
                  >
                    <Text style={[styles.contraChipText, contraception === c.value && styles.contraChipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.bigEmoji}>✨</Text>
              <Text style={styles.bigTitle}>Samenvatting</Text>
              <Text style={styles.warmSubtitle}>Check of alles klopt</Text>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardIcon}>🩸</Text>
                <View style={styles.summaryCardBody}>
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle}>Doelen</Text>
                    <TouchableOpacity onPress={() => animateTo(1)}>
                      <Text style={styles.summaryEditBtn}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedGoals.length === 0 ? (
                    <Text style={styles.summaryText}>Geen doelen geselecteerd</Text>
                  ) : (
                    selectedGoals.slice(0, 3).map((g) => (
                      <Text key={g} style={styles.summaryText}>{getGoalIcon(g)} {getGoalTitle(g)}</Text>
                    ))
                  )}
                  {selectedGoals.length > 3 && (
                    <Text style={styles.summaryMore}>+{selectedGoals.length - 3} meer</Text>
                  )}
                </View>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardIcon}>📏</Text>
                <View style={styles.summaryCardBody}>
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle}>Lichaam</Text>
                    <TouchableOpacity onPress={() => animateTo(2)}>
                      <Text style={styles.summaryEditBtn}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.summaryText}>{weight} kg · {height} cm{age ? ` · ${age} jaar` : ""}</Text>
                  {bmi && (
                    <Text style={styles.summaryText}>
                      BMI: {bmi} · <Text style={{ color: getBMIColor(bmi) }}>{getBMILabel(bmi)}</Text> {getBMIColor(bmi) === "#81C784" ? "✅" : ""}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardIcon}>🩸</Text>
                <View style={styles.summaryCardBody}>
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle}>Cyclus</Text>
                    <TouchableOpacity onPress={() => animateTo(3)}>
                      <Text style={styles.summaryEditBtn}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.summaryText}>{menstruationDays} dagen · Pijn: {painLevel}/10</Text>
                  <Text style={styles.summaryText}>Medicatie: {medicationWorks ? "Ja" : "Nee"}</Text>
                </View>
              </View>

              <View style={styles.summaryNoteCard}>
                <Text style={styles.summaryNoteIcon}>✨</Text>
                <Text style={styles.summaryNoteText}>
                  Op basis van jouw data maken we een plan voor jou met taken & tips
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <View style={styles.bottomNav}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => animateTo(step - 1)}>
            <Text style={styles.backBtnText}>← Vorige</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {step < totalSteps - 1 ? (
          <TouchableOpacity
            style={[styles.nextBtn, step === 0 ? { marginLeft: 0, flex: 3 } : { marginLeft: 12, flex: 2 }]}
            onPress={() => {
              if (step === 0 && !name.trim()) { Alert.alert("Fout", "Vul je naam in"); return; }
              if (step === 1 && selectedGoals.length === 0) { Alert.alert("Fout", "Kies minimaal 1 doel"); return; }
              animateTo(step + 1);
            }}
            activeOpacity={0.85}
          >
            <LinearGradient colors={["#F8BBD0", "#F06292"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtnGrad}>
              <Text style={styles.nextBtnText}>{step === 0 ? "Laten we beginnen →" : "Volgende →"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, { marginLeft: 12, flex: 2 }]}
            onPress={handleSave}
            disabled={saving || !allDone}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={allDone ? ["#F8BBD0", "#F06292"] : ["#E0E0E0", "#E0E0E0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGrad}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>✨ Mijn plan starten</Text>}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingTop: 50, paddingHorizontal: 20 },
  topBar: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  skipBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  skipBtnText: { fontSize: 14, color: theme.colors.textSecondary, textDecorationLine: "underline" },

  progressWrap: { marginBottom: 16 },
  progressBg: { height: 10, backgroundColor: "#E8E8E8", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5, overflow: "hidden", position: "relative" },
  shimmer: { position: "absolute", top: 0, left: 0, bottom: 0, width: 100, backgroundColor: "rgba(255,255,255,0.5)" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E0E0E0" },
  dotDone: { backgroundColor: "#F06292" },
  dotCurrent: { backgroundColor: "#F06292", width: 10, height: 10, borderRadius: 5 },

  slideContent: { flex: 1 },
  bigEmoji: { fontSize: 80, textAlign: "center", marginBottom: 8, marginTop: 10 },
  bigTitle: { fontSize: 34, fontWeight: "bold", color: theme.colors.text, textAlign: "center", marginBottom: 6 },
  warmSubtitle: { fontSize: 16, color: "#888", textAlign: "center", marginBottom: 24, lineHeight: 22 },

  welcomeWrap: { alignItems: "center", paddingTop: 20 },
  welcomeLotus: { fontSize: 100, marginBottom: 16 },

  nameInput: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    padding: 18, fontSize: 20, borderWidth: 1.5, borderColor: "#FCE4EC",
    color: theme.colors.text, textAlign: "center", marginHorizontal: 20, marginTop: 12, width: "100%",
  },

  tabRow: { flexDirection: "row", marginBottom: 20, gap: 8 },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card, borderWidth: 1.5, borderColor: "#FCE4EC", gap: 6,
  },
  tabActive: { backgroundColor: "#FCE4EC", borderColor: "#F06292" },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 14, fontWeight: "600", color: theme.colors.textSecondary },
  tabLabelActive: { color: "#F06292", fontWeight: "700" },

  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  goalCard: {
    backgroundColor: theme.colors.card, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#FCE4EC", width: "48%", height: 80, position: "relative",
    ...theme.shadow.sm,
  },
  goalCardActive: { borderColor: "#F06292", backgroundColor: "#FCE4EC" },
  goalIcon: { fontSize: 26, marginBottom: 4 },
  goalText: { fontSize: 11, color: theme.colors.text, fontWeight: "600", textAlign: "center", paddingHorizontal: 4 },
  goalTextActive: { color: "#F06292", fontWeight: "700" },
  goalCheckWrap: {
    position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#F06292", justifyContent: "center", alignItems: "center",
  },
  goalCheckIcon: { fontSize: 12, color: "#fff", fontWeight: "bold" },

  bodyRow: { flexDirection: "row", gap: 12 },
  bodyInputWrap: { flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: theme.colors.text, marginBottom: 6 },
  bodyInput: {
    backgroundColor: theme.colors.card, borderRadius: 16, height: 60,
    paddingHorizontal: 20, fontSize: 18, borderWidth: 1, borderColor: "#E8E8E8",
    color: theme.colors.text, textAlign: "center",
  },
  bodyInputValid: { borderColor: "#81C784" },
  ageRow: { marginTop: 12 },
  bmiBadgeCard: {
    marginTop: 20, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    padding: 16, flexDirection: "row", alignItems: "center", gap: 10, ...theme.shadow.sm,
  },
  bmiCompactIcon: { fontSize: 20 },
  bmiCompactText: { fontSize: 15, fontWeight: "500", color: theme.colors.text, flex: 1 },
  bmiCompactValue: { fontWeight: "700" },

  fieldLabel: { fontSize: 15, fontWeight: "600", color: theme.colors.text, marginBottom: 10, marginTop: 24 },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 },
  stepperBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FCE4EC", justifyContent: "center", alignItems: "center", ...theme.shadow.sm },
  stepperBtnText: { fontSize: 28, fontWeight: "bold", color: "#F06292" },
  stepperValue: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.card, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#F06292" },
  stepperValueText: { fontSize: 26, fontWeight: "bold", color: theme.colors.text },
  stepperHint: { textAlign: "center", fontSize: 13, color: "#999", marginTop: 6 },

  painRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8, paddingHorizontal: 4 },
  painDot: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.card, justifyContent: "center", alignItems: "center", borderWidth: 2.5, borderColor: "#E8E8E8", ...theme.shadow.sm },
  painDotText: { fontSize: 20, fontWeight: "700", color: "#999" },
  painRing: { position: "absolute", width: 58, height: 58, borderRadius: 29, borderWidth: 3, top: -6, left: -6 },
  painBarRow: { flexDirection: "row", gap: 4, paddingHorizontal: 4, marginBottom: 8 },
  painBarSeg: { flex: 1, height: 6, borderRadius: 3 },

  medRow: { flexDirection: "row", gap: 12 },
  medBtn: { flex: 1, height: 56, borderRadius: theme.borderRadius.xl, backgroundColor: theme.colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#E8E8E8" },
  medBtnYes: { backgroundColor: "#81C784", borderColor: "#81C784" },
  medBtnNo: { backgroundColor: "#E57373", borderColor: "#E57373" },
  medBtnText: { fontSize: 16, fontWeight: "600", color: theme.colors.textSecondary },
  medBtnTextActive: { color: "#fff" },

  sliderRow: { paddingHorizontal: 8, marginTop: 8 },
  sliderTrack: { height: 6, backgroundColor: "#E8E8E8", borderRadius: 3, position: "relative", marginBottom: 4 },
  sliderFill: { height: "100%", backgroundColor: "#F06292", borderRadius: 3 },
  sliderThumb: { position: "absolute", top: -18, width: 48, marginLeft: -24, alignItems: "center" },
  sliderThumbText: { fontSize: 14, fontWeight: "700", color: "#F06292" },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 },
  sliderLabel: { fontSize: 12, color: "#999" },
  sliderButtons: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 8 },
  sliderBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FCE4EC", justifyContent: "center", alignItems: "center" },
  sliderBtnText: { fontSize: 20, fontWeight: "bold", color: "#F06292" },
  sliderBtnValue: { fontSize: 16, fontWeight: "600", color: theme.colors.text, minWidth: 80, textAlign: "center" },

  contraRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  contraChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: "#E8E8E8",
  },
  contraChipActive: { backgroundColor: "#FCE4EC", borderColor: "#F06292" },
  contraChipText: { fontSize: 14, color: theme.colors.text, fontWeight: "500" },
  contraChipTextActive: { color: "#F06292", fontWeight: "700" },

  summaryCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    marginBottom: 12, flexDirection: "row", padding: 16, gap: 12, ...theme.shadow.sm,
  },
  summaryCardIcon: { fontSize: 24, marginTop: 2 },
  summaryCardBody: { flex: 1 },
  summaryCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  summaryCardTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  summaryEditBtn: { fontSize: 16 },
  summaryText: { fontSize: 14, color: "#555", lineHeight: 20 },
  summaryMore: { fontSize: 13, color: "#999", marginTop: 2 },

  summaryNoteCard: {
    backgroundColor: "#FCE4EC", borderRadius: theme.borderRadius.lg,
    padding: 20, marginTop: 8, alignItems: "center", gap: 8,
  },
  summaryNoteIcon: { fontSize: 28 },
  summaryNoteText: { fontSize: 14, color: "#C2185B", fontWeight: "500", textAlign: "center", lineHeight: 20 },

  bottomNav: { flexDirection: "row", paddingVertical: 16, paddingBottom: 32, gap: 0 },
  backBtn: { flex: 1, padding: 14, borderRadius: theme.borderRadius.xl, backgroundColor: theme.colors.card, alignItems: "center", borderWidth: 1.5, borderColor: "#FCE4EC" },
  backBtnText: { fontSize: 15, fontWeight: "600", color: "#F06292" },
  nextBtn: { borderRadius: theme.borderRadius.xl, overflow: "hidden" },
  nextBtnGrad: { padding: 16, alignItems: "center", justifyContent: "center", minHeight: 52 },
  nextBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  loadingScreen: { flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center", padding: 40 },
  lotusBlooming: { fontSize: 80 },
  loadingTitle: { fontSize: 18, fontWeight: "600", color: theme.colors.text, marginTop: 20, textAlign: "center" },

  confettiPiece: { position: "absolute", width: 10, height: 10, borderRadius: 5 },
});
