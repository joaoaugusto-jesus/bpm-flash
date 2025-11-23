
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Audio } from "expo-av";

export default function Index() {
  const [bpm, setBpm] = useState<number>(120);
  const [color, setColor] = useState<string>("#FF0000");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lastTaps, setLastTaps] = useState<number[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load sound
  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/click.wav")
      );
      soundRef.current = sound;
    };
    loadSound();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const playClick = async () => {
    try {
      await soundRef.current?.replayAsync();
    } catch (e) {
      console.log(e);
    }
  };

  const flash = () => {
    playClick();
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 80, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000;
      flash();
      intervalRef.current = setInterval(flash, interval);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, bpm]);

  const handleTap = () => {
    const now = Date.now();
    const newTaps = [...lastTaps, now].slice(-4);
    setLastTaps(newTaps);

    if (newTaps.length >= 2) {
      const intervals = newTaps.slice(1).map((t, i) => t - newTaps[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.round(60000 / avg));
    }

    flash();
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: color, opacity: fadeAnim },
        ]}
      />

      <Text style={styles.title}>🎵 BPM Flash</Text>

      <Text style={styles.label}>BPM:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(bpm)}
        onChangeText={(v) => setBpm(Number(v))}
      />

      <Text style={styles.label}>Color (hex):</Text>
      <TextInput
        style={styles.input}
        value={color}
        onChangeText={setColor}
      />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isPlaying ? "#444" : "#1E90FF" }]}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Text style={styles.buttonText}>{isPlaying ? "Stop" : "Start"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#32CD32" }]}
          onPress={handleTap}
        >
          <Text style={styles.buttonText}>Tap Tempo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  title: { fontSize: 26, color: "#fff", marginBottom: 30 },
  label: { color: "#ccc", fontSize: 18, marginTop: 10 },
  input: { backgroundColor: "#222", color: "#fff", padding: 10, borderRadius: 8, width: 120, textAlign: "center", marginTop: 5 },
  buttons: { flexDirection: "row", marginTop: 30, gap: 15 },
  button: { paddingVertical: 14, paddingHorizontal: 25, borderRadius: 10 },
  buttonText: { color: "#fff", fontSize: 16 },
});
