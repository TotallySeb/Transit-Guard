import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const categories = ['Cleanliness', 'Safety', 'Performance', 'Accessibility', 'Other'];
const threatLevels = ['Low', 'Medium', 'High'];

type MediaItem = {
  uri: string;
  type: string;
};

export default function ReportScreen() {
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [threatLevel, setThreatLevel] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);

  // FUN FACTS AND STATE
  const funFacts = [
    // LA Metro Facts
"Did you know? LA Metro began service in 1990 with the Blue Line (now the A Line).",
  "Fun fact: The A Line is the busiest light rail line in the U.S.",
  "Did you know? The B Line was LA Metro's first subway line.",
  "Fun fact: Union Station is the largest railroad terminal in the western U.S.",
  "Did you know? The E Line runs from East LA to Santa Monica.",
  "Fun fact: LA Metro has over 90 stations.",
  "Did you know? The D Line serves Koreatown and Wilshire.",
  "Fun fact: Tap cards are valid on all LA County trains and buses.",
  "Did you know? LA Metro is expanding with the Purple Line Extension.",
  "Fun fact: Some LA Metro stations feature public art.",
  "Did you know? The K Line connects Crenshaw and Inglewood.",
  "Fun fact: The C Line connects Norwalk to Redondo Beach.",

  // Safety Tips
  "Safety tip: Always stay behind the yellow line.",
  "Safety tip: Report suspicious activity to Metro staff or call 888-950-SAFE.",
  "Safety tip: Use the Transit Watch app to report anonymously.",
  "Safety tip: Keep your valuables out of sight.",
  "Safety tip: Let passengers exit before boarding.",
  "Safety tip: Notify Metro personnel if you encounter aggressive individuals.",
  "Safety tip: Stand clear of the platform edge.",
  "Safety tip: Use designated crossings.",
  "Safety tip: Travel in well-lit train cars.",
  "Safety tip: Familiarize yourself with emergency buttons.",
  "Safety tip: Keep headphone volume low to stay aware.",
  ];

  const [funFactIndex, setFunFactIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need media library permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets?.length) {
      const newMedia: MediaItem[] = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image',
      }));
      setMedia(prev => [...prev, ...newMedia]);
    }
  };

  // --- NEW FUNCTION: TAKE PHOTO ---
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to take a photo!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled && result.assets?.length) {
      const newMedia: MediaItem[] = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image',
      }));
      setMedia(prev => [...prev, ...newMedia]);
    }
  };

  const removeMediaItem = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!category || !details.trim() || !threatLevel) {
      Alert.alert('Error', 'Please fill in all fields before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('category', category);
    formData.append('content', details);
    formData.append('threatLevel', threatLevel);

    if (location) {
      formData.append('location', JSON.stringify(location));
    }

    media.forEach((item, index) => {
      const fileName = item.uri.split('/').pop() || `image${index}.jpg`;
      formData.append('media', {
        uri: item.uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
    });

    setLoading(true);

    try {
      const response = await fetch('https://3247cf4a8c59.ngrok-free.app/reports', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit report: ${errorText}`);
      }

      setSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewReport = async () => {
    setCategory('');
    setDetails('');
    setThreatLevel('');
    setSubmitted(false);
    setErrorMsg('');
    setMedia([]);

    // Pick a new random fun fact index different from current
    setFunFactIndex((prevIndex) => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * funFacts.length);
      } while (nextIndex === prevIndex && funFacts.length > 1);
      return nextIndex;
    });

    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      setLocation(null);
    }
  };

 // THANK YOU / SUBMITTED SCREEN
if (submitted) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Report Page</Text>
            </View>
            <View style={styles.submittedContainer}>
                {/* 1. New text link above pop up and fun fact */}
                <TouchableOpacity
                    onPress={() =>
                        Linking.openURL('https://docs.google.com/forms/d/e/1FAIpQLSdnwEOG7jDuXagKkz1la1S2qUbBOdrZ_Sqnamm3u0y5GHctQQ/viewform')
                    }
                    accessible
                    accessibilityRole="link"
                    style={styles.surveyLinkContainer}
                >
                    <Text style={styles.surveyLinkText}>
                      Want to contribute to our App?
                    </Text>
                      <Text style={styles.surveyLinkText}> 
                        Tap here!
                      </Text>
                </TouchableOpacity>

                {/* 2. The pop up itself */}
                <View style={styles.submittedBackground}>
                    <Text style={styles.submittedText}>Thank you! Your report was submitted.</Text>
                    <Text style={styles.submittedText}>✅</Text>
                    <TouchableOpacity style={styles.submitButton} onPress={handleNewReport}>
                        <Text style={styles.submitButtonText}>Submit Another Report</Text>
                    </TouchableOpacity>
                </View>

                {/* 3. The fun fact below the pop up */}
                <Text style={styles.funFactText}>{funFacts[funFactIndex]}</Text>
            </View>
        </SafeAreaView>
    );
}

  // MAIN FORM SCREEN
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Report Page</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <View style={styles.textBackground}>
              <Text style={styles.sectionTitle}>Issue Category</Text>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(prev => (prev === cat ? '' : cat))}
                  style={[styles.optionButton, category === cat && styles.optionButtonSelected]}
                >
                  <Text style={styles.optionText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.textBackground}>
              <Text style={styles.sectionTitle}>Attach Images (optional)</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                <TouchableOpacity style={styles.submitButton} onPress={pickMedia}>
                  <Text style={styles.submitButtonText}>Pick Images</Text>
                </TouchableOpacity>
                {/* NEW BUTTON FOR TAKING PHOTO */}
                <TouchableOpacity style={styles.submitButton} onPress={takePhoto}>
                  <Text style={styles.submitButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
              {media.length > 0 && (
                <FlatList
                  data={media}
                  horizontal
                  keyExtractor={(_, idx) => idx.toString()}
                  style={styles.mediaList}
                  renderItem={({ item, index }) => (
                    <View style={styles.mediaItemWrapper}>
                      <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                      <TouchableOpacity
                        onPress={() => removeMediaItem(index)}
                        style={styles.removeMediaButton}
                      >
                        <Text style={styles.removeMediaText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}
            </View>

            <View style={styles.textBackground}>
              <Text style={styles.inputLabel}>Describe the issue in detail</Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Describe the issue in detail..."
                multiline
                placeholderTextColor="#ffffff"
                style={styles.detailsInput}
              />
            </View>

            <View style={styles.textBackground}>
              <Text style={styles.inputLabel}>Threat Level</Text>
              {threatLevels.map(level => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setThreatLevel(prev => (prev === level ? '' : level))}
                  style={[styles.optionButton, threatLevel === level && styles.threatLevelSelected]}
                >
                  <Text style={styles.optionText}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#32B568',
  },
  header: {
    padding: 14,
    backgroundColor: '#32B568',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#272727ff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 15,
    paddingTop: 1,
    justifyContent: 'space-between',
    paddingBottom: 70,
  },
  formContainer: {
    marginTop: 20,
  },
  textBackground: {
    backgroundColor: '#41816cff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#fff',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  optionButton: {
    padding: 12,
    borderWidth: 3,
    borderColor: '#398159ff',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#32B568',
  },
  optionButtonSelected: {
    backgroundColor: '#2AA588',
    borderColor: '#1c6063ff',
    borderWidth: 3,
    padding: 12,
  },
  optionText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  attachSection: {
    marginVertical: 16,
  },
  mediaList: {
    marginTop: 10,
  },
  mediaItemWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  mediaImage: {
    width: 200,
    height: 355,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff0000ff',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeMediaText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 14,
    marginTop: 14,
    color: '#fff',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  detailsInput: {
    borderWidth: 4,
    borderColor: '#5ea0beff',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#6BB7D9',
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  threatLevelSelected: {
    backgroundColor: '#4B6F44',
    borderColor: '#631c1cff',
    padding: 12,
    borderWidth: 3,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  submittedContainer: {
    flex: 1,
    backgroundColor: '#96D9B2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  submittedBackground: {
    backgroundColor: '#41816cff',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: '-15%',
    borderColor: '#ffffffff',
    borderWidth: 3,
  },
  submittedText: {
    fontSize: 40,
    marginBottom: 25,
    color: '#fff',
    textAlign: 'center',
  },
  submitButton: {
    width: '50%',
    padding: 16,
    borderWidth: 3,
    borderColor: '#5ea0beff',
    borderRadius: 8,
    backgroundColor: '#6BB7D9',
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  funFactText: {
    marginTop: 5,
    fontSize: 18,
    color: '#fff',
    fontStyle: 'italic',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  surveyLinkContainer: {
    backgroundColor: '#32B568',
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffffff',
    marginTop: -50,
    marginBottom: 70,
    alignSelf: 'center',
  },
  surveyLinkText: {
    color: '#ffffffff',
    textDecorationLine: 'underline',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
