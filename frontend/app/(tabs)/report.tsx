import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const categories = ['Cleanliness', 'Safety', 'Performance', 'Accessibility', 'Other'];
const threatLevels = ['Low', 'Medium', 'High'];

type MediaItem = {
  uri: string;
  type: string; // image type string
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
      const response = await fetch('https://979baad4ac97.ngrok-free.app/reports', {
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

    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      setLocation(null);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Empty green header */}
        <View style={styles.header} />

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 20, color: 'white', textAlign: 'center' }}>
            ✅ Thank you! Your report was submitted.
          </Text>
          <Button title="Submit Another Report" onPress={handleNewReport} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Empty green header */}
      <View style={styles.header} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingTop: 0,
            justifyContent: 'space-between',
            paddingBottom: 100,
          }}
        >
          <View style={{ marginTop: 60 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'white', textAlign: 'center' }}>
              Issue Category
            </Text>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  setCategory(prev => (prev === cat ? '' : cat));
                }}
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: category === cat ? '#007AFF' : '#ccc',
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: category === cat ? '#E0F0FF' : 'white',
                }}
              >
                <Text style={{ textAlign: 'center' }}>{cat}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ marginVertical: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 8, textAlign: 'center' }}>
                Attach Images (optional)
              </Text>
              <Button title="Pick Images" onPress={pickMedia} />

              {media.length > 0 && (
                <FlatList
                  data={media}
                  horizontal
                  keyExtractor={(_, idx) => idx.toString()}
                  style={{ marginTop: 10 }}
                  renderItem={({ item, index }) => (
                    <View style={{ marginRight: 12, position: 'relative' }}>
                      <Image
                        source={{ uri: item.uri }}
                        style={{ width: 120, height: 90, borderRadius: 8 }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => removeMediaItem(index)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          borderRadius: 12,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>X</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}
            </View>

            <Text style={{ fontSize: 16, marginTop: 16, marginBottom: 6, color: 'white', textAlign: 'center' }}>
              Describe the issue in detail
            </Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Describe the issue in detail..."
              multiline
              placeholderTextColor="#999"
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 12,
                minHeight: 100,
                textAlignVertical: 'top',
                backgroundColor: 'white',
                textAlign: 'center',
              }}
            />

            <Text style={{ fontSize: 16, marginTop: 16, marginBottom: 6, color: 'white', textAlign: 'center' }}>
              Threat Level
            </Text>
            {threatLevels.map(level => (
              <TouchableOpacity
                key={level}
                onPress={() => {
                  setThreatLevel(prev => (prev === level ? '' : level));
                }}
                style={{
                  padding: 10,
                  borderWidth: 1,
                  borderColor: threatLevel === level ? '#FF3B30' : '#ccc',
                  borderRadius: 8,
                  marginBottom: 6,
                  backgroundColor: threatLevel === level ? '#FFECEC' : 'white',
                }}
              >
                <Text style={{ textAlign: 'center' }}>{level}</Text>
              </TouchableOpacity>
            ))}

            {errorMsg ? <Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{errorMsg}</Text> : null}
          </View>

          <Button
            title={loading ? 'Submitting...' : 'Submit Report'}
            onPress={handleSubmit}
            disabled={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#54C571',
    height: 60,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
  },
});
