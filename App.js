import "react-native-gesture-handler";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { Audio } from "expo-av";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DraggableFlatList, {
  ScaleDecorator
} from "react-native-draggable-flatlist";

const { width } = Dimensions.get("window");

const palette = {
  cream: "#f7eadf",
  beige: "#edd5bc",
  latte: "#c08e6f",
  cocoa: "#6a4a3d",
  chocolate: "#3f2a24",
  blush: "#d9988c",
  rose: "#c96861",
  apricot: "#f3b07a",
  amber: "#e9a146"
};

const starterTracks = [
  {
    id: "1",
    title: "Velvet Evenings",
    artist: "Juniper Blue",
    previewUrl: ""
  },
  {
    id: "2",
    title: "Afterglow Motel",
    artist: "Cedar Avenue",
    previewUrl: ""
  }
];

const starterMixtape = {
  title: "Midnight Window",
  note:
    "For the nights that feel too soft to end. Press play, breathe slowly, stay warm.",
  format: "cassette",
  tracks: starterTracks
};

function encodeMixtape(mixtape) {
  return encodeURIComponent(JSON.stringify(mixtape));
}

function decodeMixtape(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(value));
  } catch (error) {
    return null;
  }
}

function buildShareUrl(mixtape) {
  return Linking.createURL("/mixtape", {
    queryParams: { data: encodeMixtape(mixtape) }
  });
}

function BackgroundGlow() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#fff6f0", "#f3dfcb", "#d8ae94"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />
      <View style={styles.grainOverlay} />
    </View>
  );
}

function HomeVisual({ format, playing, onPress }) {
  const bob = useRef(new Animated.Value(0)).current;
  const open = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();
  }, [bob]);

  useEffect(() => {
    Animated.spring(open, {
      toValue: format === "cassette" ? 1 : 0,
      friction: 8,
      tension: 90,
      useNativeDriver: true
    }).start();
  }, [format, open]);

  useEffect(() => {
    if (!playing) {
      spin.stopAnimation();
      return;
    }

    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );
    loop.start();

    return () => loop.stop();
  }, [playing, spin]);

  const translateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12]
  });

  const lidTilt = open.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-18deg"]
  });

  const spinAngle = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });

  return (
    <Pressable onPress={onPress} style={styles.homeVisualButton}>
      <Animated.View
        style={[
          styles.homeVisualWrap,
          {
            transform: [{ translateY }]
          }
        ]}
      >
        {format === "cassette" ? (
          <View style={styles.cassetteShell}>
            <Animated.View
              style={[
                styles.cassetteLid,
                {
                  transform: [{ perspective: 600 }, { rotateX: lidTilt }]
                }
              ]}
            />
            <View style={styles.cassetteBody}>
              <View style={styles.cassetteLabel}>
                <Text style={styles.cassetteLabelText}>DIGITAL MIXTAPE</Text>
              </View>
              <View style={styles.reelRow}>
                <Animated.View
                  style={[
                    styles.reel,
                    playing && { transform: [{ rotate: spinAngle }] }
                  ]}
                >
                  <View style={styles.reelInner} />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.reel,
                    playing && { transform: [{ rotate: spinAngle }] }
                  ]}
                >
                  <View style={styles.reelInner} />
                </Animated.View>
              </View>
              <View style={styles.cassetteTapeWindow} />
            </View>
          </View>
        ) : (
          <View style={styles.vinylWrap}>
            <Animated.View
              style={[
                styles.vinylDisc,
                {
                  transform: [{ rotate: spinAngle }]
                }
              ]}
            >
              <View style={styles.vinylRing} />
              <View style={styles.vinylCenter} />
            </Animated.View>
            <View style={styles.vinylSleeve} />
          </View>
        )}
      </Animated.View>
      <Text style={styles.homeVisualHint}>
        Tap to {format === "cassette" ? "pop the cassette" : "spin the vinyl"}
      </Text>
    </Pressable>
  );
}

function TrackEditor({ item, drag, isActive, onChange, onRemove }) {
  return (
    <ScaleDecorator>
      <Pressable
        onLongPress={drag}
        disabled={isActive}
        style={[styles.trackCard, isActive && styles.trackCardActive]}
      >
        <View style={styles.trackCardHeader}>
          <View style={styles.trackGrip}>
            <Ionicons name="reorder-three" size={18} color={palette.cocoa} />
            <Text style={styles.trackGripText}>Hold to reorder</Text>
          </View>
          <Pressable onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={palette.rose} />
          </Pressable>
        </View>
        <TextInput
          placeholder="Song name"
          placeholderTextColor="#9f7e72"
          style={styles.input}
          value={item.title}
          onChangeText={(value) => onChange("title", value)}
        />
        <TextInput
          placeholder="Artist name"
          placeholderTextColor="#9f7e72"
          style={styles.input}
          value={item.artist}
          onChangeText={(value) => onChange("artist", value)}
        />
        <TextInput
          placeholder="Preview URL (optional)"
          placeholderTextColor="#9f7e72"
          style={styles.input}
          value={item.previewUrl}
          onChangeText={(value) => onChange("previewUrl", value)}
          autoCapitalize="none"
        />
      </Pressable>
    </ScaleDecorator>
  );
}

function Waveform({ progress, playing }) {
  const bars = new Array(24).fill(0);
  return (
    <View style={styles.waveRow}>
      {bars.map((_, index) => {
        const active = progress * bars.length > index;
        const height = 10 + ((index * 7) % 24);
        return (
          <View
            key={index}
            style={[
              styles.waveBar,
              {
                height,
                backgroundColor: active
                  ? playing
                    ? palette.rose
                    : palette.latte
                  : "rgba(63,42,36,0.12)"
              }
            ]}
          />
        );
      })}
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [mixtape, setMixtape] = useState(starterMixtape);
  const [isVinyl, setIsVinyl] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const soundRef = useRef(null);
  const progressTimerRef = useRef(null);

  useEffect(() => {
    setMixtape((current) => ({
      ...current,
      format: isVinyl ? "vinyl" : "cassette"
    }));
  }, [isVinyl]);

  useEffect(() => {
    const handleUrl = ({ url }) => {
      const parsed = Linking.parse(url);
      const parsedMixtape = decodeMixtape(parsed.queryParams?.data);

      if (parsedMixtape?.tracks?.length) {
        setMixtape({
          ...parsedMixtape,
          format: parsedMixtape.format === "vinyl" ? "vinyl" : "cassette"
        });
        setIsVinyl(parsedMixtape.format === "vinyl");
        setCurrentTrackIndex(0);
        setProgress(0);
        setScreen("player");
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl({ url });
      }
    });

    const subscription = Linking.addEventListener("url", handleUrl);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(progressTimerRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const currentTrack = mixtape.tracks[currentTrackIndex] ?? mixtape.tracks[0];
  const shareUrl = useMemo(() => buildShareUrl(mixtape), [mixtape]);

  const syncPlaybackTicker = (active) => {
    clearInterval(progressTimerRef.current);
    if (!active) {
      return;
    }

    progressTimerRef.current = setInterval(() => {
      setProgress((value) => {
        const next = value + 0.02;
        return next > 1 ? 0 : next;
      });
    }, 300);
  };

  const stopAudio = async () => {
    clearInterval(progressTimerRef.current);
    setIsPlaying(false);
    setProgress(0);
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => null);
      await soundRef.current.unloadAsync().catch(() => null);
      soundRef.current = null;
    }
  };

  const togglePlayback = async () => {
    if (!currentTrack) {
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      syncPlaybackTicker(false);
      if (soundRef.current) {
        await soundRef.current.pauseAsync().catch(() => null);
      }
      return;
    }

    setIsPlaying(true);
    syncPlaybackTicker(true);

    if (!currentTrack.previewUrl) {
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: currentTrack.previewUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          return;
        }

        if (typeof status.positionMillis === "number" && status.durationMillis) {
          setProgress(status.positionMillis / status.durationMillis);
        }

        if (status.didJustFinish) {
          setIsPlaying(false);
          syncPlaybackTicker(false);
        }
      });
    } catch (error) {
      Alert.alert(
        "Preview unavailable",
        "The animation still works, but this preview URL could not be played."
      );
    }
  };

  const addTrack = () => {
    setMixtape((current) => ({
      ...current,
      tracks: [
        ...current.tracks,
        {
          id: `${Date.now()}`,
          title: "",
          artist: "",
          previewUrl: ""
        }
      ]
    }));
  };

  const updateTrack = (id, field, value) => {
    setMixtape((current) => ({
      ...current,
      tracks: current.tracks.map((track) =>
        track.id === id ? { ...track, [field]: value } : track
      )
    }));
  };

  const removeTrack = (id) => {
    if (mixtape.tracks.length === 1) {
      setMixtape((current) => ({
        ...current,
        tracks: [{ ...current.tracks[0], title: "", artist: "", previewUrl: "" }]
      }));
      return;
    }

    setMixtape((current) => ({
      ...current,
      tracks: current.tracks.filter((track) => track.id !== id)
    }));
  };

  const shareMixtape = async () => {
    await Share.share({
      message: `I made you a ${mixtape.format} mixtape: ${mixtape.title}\n${shareUrl}`,
      url: shareUrl
    });
  };

  const openPlayer = async () => {
    await stopAudio();
    setScreen("player");
  };

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Late-night listening object</Text>
        <Text style={styles.heroTitle}>Digital Cassette</Text>
        <Text style={styles.heroSubtitle}>
          Build tiny love letters in music. Warm notes, re-orderable tracks, a
          tactile player, and links ready to share.
        </Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Cassette</Text>
          <Switch
            value={isVinyl}
            onValueChange={setIsVinyl}
            thumbColor={palette.cream}
            trackColor={{ false: palette.blush, true: palette.apricot }}
          />
          <Text style={styles.toggleLabel}>Vinyl</Text>
        </View>
      </View>

      <HomeVisual
        format={mixtape.format}
        playing={isPlaying}
        onPress={() => setIsPlaying((value) => !value)}
      />

      <View style={styles.actionsRow}>
        <Pressable style={styles.primaryButton} onPress={() => setScreen("create")}>
          <Ionicons name="create-outline" size={18} color={palette.cream} />
          <Text style={styles.primaryButtonText}>Create Mixtape</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={openPlayer}>
          <Ionicons name="play-circle-outline" size={18} color={palette.cocoa} />
          <Text style={styles.secondaryButtonText}>Open Player</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderCreate = () => (
    <View style={styles.screenWrap}>
      <View style={styles.sectionHeader}>
        <Pressable onPress={() => setScreen("home")}>
          <Ionicons name="chevron-back" size={26} color={palette.cocoa} />
        </Pressable>
        <Text style={styles.sectionTitle}>Build Your Mixtape</Text>
        <View style={{ width: 26 }} />
      </View>

      <DraggableFlatList
        data={mixtape.tracks}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) =>
          setMixtape((current) => ({
            ...current,
            tracks: data
          }))
        }
        ListHeaderComponent={
          <View>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Details</Text>
              <TextInput
                placeholder="Mixtape title"
                placeholderTextColor="#9f7e72"
                style={styles.input}
                value={mixtape.title}
                onChangeText={(value) =>
                  setMixtape((current) => ({ ...current, title: value }))
                }
              />
              <TextInput
                placeholder="Write a soft note..."
                placeholderTextColor="#9f7e72"
                style={[styles.input, styles.notesInput]}
                multiline
                value={mixtape.note}
                onChangeText={(value) =>
                  setMixtape((current) => ({ ...current, note: value }))
                }
              />
            </View>

            <View style={styles.panel}>
              <View style={styles.panelRow}>
                <View>
                  <Text style={styles.panelTitle}>Track Stack</Text>
                  <Text style={styles.panelCaption}>
                    Hold and drag for that snap-and-glow reorder feel.
                  </Text>
                </View>
                <Pressable style={styles.addChip} onPress={addTrack}>
                  <Ionicons name="add" size={18} color={palette.cream} />
                  <Text style={styles.addChipText}>Track</Text>
                </Pressable>
              </View>
            </View>
          </View>
        }
        contentContainerStyle={styles.createListContent}
        renderItem={({ item, drag, isActive }) => (
          <TrackEditor
            item={item}
            drag={drag}
            isActive={isActive}
            onRemove={() => removeTrack(item.id)}
            onChange={(field, value) => updateTrack(item.id, field, value)}
          />
        )}
        ListFooterComponent={
          <View style={styles.footerActions}>
            <Pressable style={styles.primaryButton} onPress={openPlayer}>
              <Ionicons name="disc-outline" size={18} color={palette.cream} />
              <Text style={styles.primaryButtonText}>Preview Player</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={shareMixtape}>
              <Ionicons name="share-social-outline" size={18} color={palette.cocoa} />
              <Text style={styles.secondaryButtonText}>Share Link</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );

  const renderPlayer = () => (
    <ScrollView contentContainerStyle={styles.playerContent}>
      <View style={styles.sectionHeader}>
        <Pressable
          onPress={async () => {
            await stopAudio();
            setScreen("home");
          }}
        >
          <Ionicons name="chevron-back" size={26} color={palette.cocoa} />
        </Pressable>
        <Text style={styles.sectionTitle}>Mixtape Player</Text>
        <Pressable onPress={shareMixtape}>
          <Ionicons name="share-social-outline" size={24} color={palette.cocoa} />
        </Pressable>
      </View>

      <View style={styles.playerCard}>
        <HomeVisual
          format={mixtape.format}
          playing={isPlaying}
          onPress={togglePlayback}
        />
        <Text style={styles.playerTitle}>{mixtape.title || "Untitled Mixtape"}</Text>
        <Text style={styles.playerTrack}>
          {currentTrack?.title || "Add a song"}{" "}
          <Text style={styles.playerArtist}>
            {currentTrack?.artist ? `• ${currentTrack.artist}` : ""}
          </Text>
        </Text>
        <Waveform progress={progress} playing={isPlaying} />
        <View style={styles.transportRow}>
          <Pressable
            onPress={async () => {
              if (!mixtape.tracks.length) {
                return;
              }
              await stopAudio();
              setCurrentTrackIndex((value) =>
                value === 0 ? mixtape.tracks.length - 1 : value - 1
              );
            }}
            style={styles.transportButton}
          >
            <Ionicons name="play-skip-back" size={22} color={palette.cocoa} />
          </Pressable>
          <Pressable onPress={togglePlayback} style={styles.transportPlay}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={28}
              color={palette.cream}
            />
          </Pressable>
          <Pressable
            onPress={async () => {
              if (!mixtape.tracks.length) {
                return;
              }
              await stopAudio();
              setCurrentTrackIndex((value) => (value + 1) % mixtape.tracks.length);
            }}
            style={styles.transportButton}
          >
            <Ionicons name="play-skip-forward" size={22} color={palette.cocoa} />
          </Pressable>
        </View>
      </View>

      <View style={styles.noteCard}>
        <MaterialCommunityIcons
          name="music-note-eighth"
          size={20}
          color={palette.rose}
        />
        <Text style={styles.noteText}>{mixtape.note}</Text>
      </View>

      <View style={styles.trackListPanel}>
        <Text style={styles.panelTitle}>Tracklist</Text>
        {mixtape.tracks.map((track, index) => (
          <Pressable
            key={track.id}
            style={[
              styles.trackListRow,
              index === currentTrackIndex && styles.trackListRowActive
            ]}
            onPress={async () => {
              await stopAudio();
              setCurrentTrackIndex(index);
            }}
          >
            <View>
              <Text style={styles.trackListTitle}>
                {index + 1}. {track.title || "Untitled track"}
              </Text>
              <Text style={styles.trackListArtist}>
                {track.artist || "Unknown artist"}
              </Text>
            </View>
            {track.previewUrl ? (
              <Ionicons name="radio-outline" size={18} color={palette.rose} />
            ) : (
              <Ionicons name="moon-outline" size={18} color={palette.latte} />
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.linkCard}>
        <Text style={styles.panelTitle}>Shareable Link</Text>
        <Text style={styles.linkText}>{shareUrl}</Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <BackgroundGlow />
      {screen === "home" && renderHome()}
      {screen === "create" && renderCreate()}
      {screen === "player" && renderPlayer()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 48,
    paddingTop: 12
  },
  screenWrap: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8
  },
  heroCard: {
    backgroundColor: "rgba(255, 249, 242, 0.72)",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(106, 74, 61, 0.08)",
    shadowColor: "#a5654b",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }
  },
  eyebrow: {
    color: palette.rose,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 38,
    color: palette.chocolate,
    fontWeight: "700"
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(63,42,36,0.8)",
    marginTop: 12
  },
  toggleRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  toggleLabel: {
    color: palette.cocoa,
    fontSize: 14,
    fontWeight: "600"
  },
  homeVisualButton: {
    alignItems: "center",
    marginTop: 28
  },
  homeVisualWrap: {
    width: width - 72,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280
  },
  homeVisualHint: {
    marginTop: 12,
    color: "rgba(63,42,36,0.72)",
    fontSize: 13
  },
  cassetteShell: {
    width: width - 92,
    height: 220,
    alignItems: "center"
  },
  cassetteLid: {
    width: "100%",
    height: 36,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#f0c8a7",
    borderWidth: 1,
    borderColor: "rgba(63,42,36,0.08)",
    shadowColor: "#d38a66",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }
  },
  cassetteBody: {
    width: "100%",
    height: 184,
    backgroundColor: "rgba(255,245,235,0.92)",
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "rgba(63,42,36,0.12)",
    padding: 20,
    marginTop: -8
  },
  cassetteLabel: {
    backgroundColor: "#fce9d7",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: "flex-start"
  },
  cassetteLabelText: {
    color: palette.cocoa,
    fontWeight: "700",
    letterSpacing: 1
  },
  reelRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-around"
  },
  reel: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4b332c",
    alignItems: "center",
    justifyContent: "center"
  },
  reelInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#f3dfcb"
  },
  cassetteTapeWindow: {
    position: "absolute",
    bottom: 18,
    left: 20,
    right: 20,
    height: 18,
    borderRadius: 10,
    backgroundColor: "rgba(63,42,36,0.08)"
  },
  vinylWrap: {
    width: width - 98,
    height: width - 98,
    alignItems: "center",
    justifyContent: "center"
  },
  vinylDisc: {
    width: "84%",
    height: "84%",
    borderRadius: 999,
    backgroundColor: "#2f201b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#341d17",
    shadowOpacity: 0.26,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 }
  },
  vinylRing: {
    width: "74%",
    height: "74%",
    borderRadius: 999,
    borderWidth: 14,
    borderColor: "rgba(255,255,255,0.06)"
  },
  vinylCenter: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: palette.apricot,
    borderWidth: 8,
    borderColor: palette.blush
  },
  vinylSleeve: {
    position: "absolute",
    width: "92%",
    height: "92%",
    borderRadius: 28,
    backgroundColor: "rgba(201, 104, 97, 0.12)",
    zIndex: -1
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.cocoa,
    paddingVertical: 16,
    borderRadius: 18
  },
  primaryButtonText: {
    color: palette.cream,
    fontWeight: "700"
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,249,242,0.82)",
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(63,42,36,0.08)"
  },
  secondaryButtonText: {
    color: palette.cocoa,
    fontWeight: "700"
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingBottom: 12
  },
  sectionTitle: {
    fontSize: 20,
    color: palette.chocolate,
    fontWeight: "700"
  },
  panel: {
    backgroundColor: "rgba(255,249,242,0.78)",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14
  },
  panelTitle: {
    color: palette.chocolate,
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 10
  },
  panelCaption: {
    color: "rgba(63,42,36,0.62)",
    maxWidth: 210
  },
  panelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  input: {
    backgroundColor: "#fff6ef",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: palette.chocolate,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(63,42,36,0.08)"
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: "top"
  },
  trackCard: {
    backgroundColor: "rgba(255,246,239,0.92)",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(233, 161, 70, 0.18)"
  },
  trackCardActive: {
    shadowColor: palette.apricot,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    transform: [{ scale: 1.02 }]
  },
  trackCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  trackGrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  trackGripText: {
    color: "rgba(63,42,36,0.68)"
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.rose,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16
  },
  addChipText: {
    color: palette.cream,
    fontWeight: "700"
  },
  createListContent: {
    paddingBottom: 140
  },
  footerActions: {
    gap: 12,
    marginTop: 10,
    paddingBottom: 40
  },
  playerContent: {
    paddingHorizontal: 18,
    paddingBottom: 42,
    paddingTop: 8
  },
  playerCard: {
    backgroundColor: "rgba(255,249,242,0.8)",
    borderRadius: 28,
    padding: 18,
    alignItems: "center"
  },
  playerTitle: {
    marginTop: 8,
    fontSize: 26,
    color: palette.chocolate,
    fontWeight: "700",
    textAlign: "center"
  },
  playerTrack: {
    fontSize: 15,
    color: palette.cocoa,
    marginTop: 8
  },
  playerArtist: {
    color: "rgba(63,42,36,0.7)"
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 18,
    height: 40
  },
  waveBar: {
    width: 6,
    borderRadius: 999
  },
  transportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 18
  },
  transportButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,239,225,0.96)"
  },
  transportPlay: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.rose
  },
  noteCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(255,246,239,0.88)",
    borderRadius: 24,
    padding: 18,
    marginTop: 16
  },
  noteText: {
    flex: 1,
    color: palette.cocoa,
    lineHeight: 22
  },
  trackListPanel: {
    backgroundColor: "rgba(255,249,242,0.82)",
    borderRadius: 24,
    padding: 18,
    marginTop: 16
  },
  trackListRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(63,42,36,0.06)"
  },
  trackListRowActive: {
    backgroundColor: "rgba(233, 161, 70, 0.08)",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 16
  },
  trackListTitle: {
    color: palette.chocolate,
    fontWeight: "600"
  },
  trackListArtist: {
    color: "rgba(63,42,36,0.64)",
    marginTop: 4
  },
  linkCard: {
    backgroundColor: "rgba(255,246,239,0.9)",
    borderRadius: 24,
    padding: 18,
    marginTop: 16
  },
  linkText: {
    color: palette.cocoa,
    lineHeight: 22
  },
  topGlow: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(233,161,70,0.22)"
  },
  bottomGlow: {
    position: "absolute",
    left: -40,
    bottom: 100,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(201,104,97,0.16)"
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: "#ffffff"
  }
});
