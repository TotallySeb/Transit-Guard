import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

type Station = {
  name: string;
  line: string;
  lat: number;
  lng: number;
  id: string; // add id type
};

type Reply = {
  user: string;
  content: string;
  createdAt?: string;
};

type Report = {
  _id: string;
  category?: string;
  content: string;
  stationName: string;
  createdAt?: string;
  threatLevel?: string;
  media?: {
    filename?: string;
    path?: string;
    mimetype?: string;
  }[];
  replies?: Reply[];
};

const categoryColors: { [key: string]: string } = {
  Cleanliness: '#9dff0052',
  Safety: '#ff0015a8',
  Performance: '#7600add3',
  Accessibility: '#12c7e76c',
  Other: '#0343c488',
};

const threatLevelColors: { [key: string]: string } = {
  High: '#FF4136',
  Medium: '#FF851B',
  Low: '#FFDC00',
};

const lineColors: { [line: string]: string } = {
  A: '#0072BC',
  B: '#E53935',
  C: '#43A047',
  D: '#8E24AA',
  E: '#F9A825',
};

const metroLinesOrder = ['A', 'B', 'C', 'D', 'E'];

const BACKEND_BASE_URL = 'https://transit-guard-backend.onrender.com';

export default function HomeScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [loadingStations, setLoadingStations] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [search, setSearch] = useState('');
  const [replyTexts, setReplyTexts] = useState<{ [reportId: string]: string }>({});
  const [recentOnly, setRecentOnly] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_BASE_URL}/stations`)
      .then(res => res.json())
      .then(data => {
        setStations(data || []);
      })
      .catch(err => {
        console.error('Error fetching stations:', err);
        setStations([]);
      })
      .finally(() => setLoadingStations(false));
  }, []);

  const fetchReports = () => {
    setLoadingReports(true);
    const url = recentOnly
      ? `${BACKEND_BASE_URL}/reports?recentOnly=true`
      : `${BACKEND_BASE_URL}/reports`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setReports(data || []);
      })
      .catch(err => {
        console.error('Error fetching reports:', err);
        setReports([]);
      })
      .finally(() => setLoadingReports(false));
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchReports();
    }, [recentOnly])
  );

  const toggleExpandLine = (line: string) => {
    setExpandedLine(prev => (prev === line ? null : line));
  };

  const lowerSearch = search.trim().toLowerCase();

  const filteredReports = reports.filter(report => {
    const category = report.category ?? '';
    const threatLevel = report.threatLevel ?? '';
    const stationName = report.stationName ?? '';
    const content = report.content ?? '';
    return (
      category.toLowerCase().includes(lowerSearch) ||
      threatLevel.toLowerCase().includes(lowerSearch) ||
      stationName.toLowerCase().includes(lowerSearch) ||
      content.toLowerCase().includes(lowerSearch)
    );
  });

  const filteredStations = stations.filter(station => {
    const stationNameMatch = station.name.toLowerCase().includes(lowerSearch);
    const lineMatch = station.line.toLowerCase().includes(lowerSearch);

    const hasMatchingReport = filteredReports.some(
      report => report.stationName === station.name
    );

    return stationNameMatch || lineMatch || hasMatchingReport || lowerSearch === '';
  });

  const stationsByLine: { [line: string]: Station[] } = {};
  filteredStations.forEach(station => {
    const lineKey = station.line[0];
    if (!stationsByLine[lineKey]) stationsByLine[lineKey] = [];
    stationsByLine[lineKey].push(station);
  });

  const handlePostReply = async (reportId: string) => {
    const replyContent = replyTexts[reportId]?.trim();
    if (!replyContent) return;

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/reports/${reportId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to post reply:', errorData);
      } else {
        setReplyTexts(prev => ({ ...prev, [reportId]: '' }));
        setReports(prevReports =>
          prevReports.map(report => {
            if (report._id === reportId) {
              const newReply = { user: 'Anonymous', content: replyContent, createdAt: new Date().toISOString() };
              return {
                ...report,
                replies: report.replies ? [...report.replies, newReply] : [newReply],
              };
            }
            return report;
          })
        );
      }
    } catch (err) {
      console.error('Error posting reply:', err);
    }
  };

  if (loadingStations || loadingReports) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: 'white' }}>Loading Metro data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header - now acts as the positioning context */}
      <View style={styles.header}>
        {/* Line Letters Row - positioned absolutely within the header */}
        <View style={styles.lineLettersRowAbsolute}>
          {metroLinesOrder.map(line => (
            <TouchableOpacity
              key={line}
              onPress={() => toggleExpandLine(line)}
              style={[
                styles.lineLetterContainer,
                {
                  backgroundColor: lineColors[line],
                  borderColor: expandedLine === line ? '#FFF' : 'transparent',
                  borderWidth: expandedLine === line ? 2 : 0,
                },
              ]}
            >
              <Text style={styles.lineLetter}>{line}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content Wrapper with separate background */}
      <View style={styles.contentWrapper}>
        {/* Search Bar remains visible always */}
        <TextInput
          placeholder="Search by station, line, category, threat level, or co..."
          placeholderTextColor="#fff"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        {!expandedLine && (
            // New View wrapper with background styling
            <View
              style={{
                backgroundColor: '#32B568',
                borderWidth: 4,
                borderColor: '#298f53ff',
                padding: 26,
                borderRadius: 10,
                marginHorizontal: 16,
                paddingVertical: 80,
                marginTop: 50,
              }}
            >
              <Text style={styles.instructionText1}>Welcome!</Text>
              <Text style={styles.instructionText}>
                Please select a Metro line above to view its stations and recent reports.
              </Text>
              <Text style={styles.instructionText3}>
                Feel safe,
              </Text>
              <Text style={styles.instructionText2}>
                Travel Smart,
              </Text>
              <Text style={styles.instructionText1}>
                With Transit Guard!
              </Text>
            </View>
)}
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {expandedLine && (
              <View key={expandedLine} style={{ marginBottom: 20 }}>
                {/* MODIFIED: Wrapped the Text component in a View for the background */}
                <View style={{
                  backgroundColor: '#32B568', // Light gray background
                  borderWidth: 4,
                  borderColor: '#ffffff',
                  padding: 10,
                  borderRadius: 8,
                  marginHorizontal: 80,
                  marginBottom: 8,
                  alignItems: 'center', // Center the text horizontally
                }}>
                  <Text
                    style={{
                      color: lineColors[expandedLine],
                      fontSize: 28,
                      fontWeight: 'bold',
                    }}
                  >
                    {expandedLine} Line
                  </Text>
                </View>

                {/* SHOW ONLY HERE */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', marginRight: 8, fontSize: 18 }}>Show only recent reports</Text>
                  <Switch
                    value={recentOnly}
                    onValueChange={setRecentOnly}
                    thumbColor={recentOnly ? '#ffffffff' : '#fff'}
                  />
                </View>

                {stationsByLine[expandedLine]?.length > 0 ? (
                  stationsByLine[expandedLine].map((station, index) => (
                    <View
                      key={`${station.id ?? station.name}-${expandedLine}-${index}`}
                      style={{
                        backgroundColor: '#278d52ff',
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    >
                      {/* THIS IS THE LINE THAT WAS MODIFIED */}
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 24 }}>
                        {station.name}
                      </Text>
                      {filteredReports
                        .filter(report => report.stationName?.trim().toLowerCase() === station.name.trim().toLowerCase())
                        .map(report => (
                          <View
                            key={report._id}
                            style={{
                              backgroundColor: categoryColors[report.category || 'Other'] || '#444',
                              marginTop: 6,
                              padding: 8,
                              borderRadius: 6,
                              position: 'relative',
                            }}
                          >
                            {report.createdAt && (
                              <View
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  alignItems: 'flex-end',
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: 'white',
                                    fontWeight: 'bold',
                                    marginBottom: 2,
                                  }}
                                >
                                  {new Date(report.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: 'white',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {new Date(report.createdAt).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              </View>
                            )}

                            <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#fff' }}>
                              {report.category}
                            </Text>

                            {report.media && report.media.length > 0 && report.media[0].filename && (
                              <Image
                                source={{ uri: `${BACKEND_BASE_URL}/uploads/${report.media[0].filename}` }}
                                style={{
                                  width: '100%',
                                  height: 200,
                                  borderRadius: 8,
                                  marginVertical: 10,
                                  resizeMode: 'contain',
                                }}
                              />
                            )}

                            <Text style={{ fontSize: 15, marginTop: 4 , color: '#fff' }}>
                              {report.content}
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                              <View
                                style={{
                                  width: 19,
                                  height: 19,
                                  borderRadius: 12,
                                  backgroundColor: threatLevelColors[report.threatLevel || 'Low'] || '#FFDC00',
                                  marginRight: 8,
                                }}
                              />
                              <Text style={{ fontWeight: 'bold', color: '#FFF' }}>
                                Threat level: {report.threatLevel || 'Low'}
                              </Text>
                            </View>

                            {report.replies && report.replies.length > 0 && (
                              <View style={{ marginTop: 6 }}>
                                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Replies:</Text>
                                {report.replies.map((reply, idx) => (
                                  <View
                                    key={idx}
                                    style={{
                                      backgroundColor: '#32B568',
                                      padding: 6,
                                      borderRadius: 4,
                                      marginTop: 4,
                                    }}
                                  >
                                    <Text style={{ color: '#fff' }}>
                                      <Text style={{ fontWeight: 'bold' }}>{reply.user}: </Text>
                                      {reply.content}
                                    </Text>
                                    {reply.createdAt && (
                                      <Text style={{ fontSize: 10, color: '#ccc' }}>
                                        {new Date(reply.createdAt).toLocaleString(undefined, {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </Text>
                                    )}
                                  </View>
                                ))}
                              </View>
                            )}

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                              <TextInput
                                placeholder="Write a reply..."
                                placeholderTextColor="#919191ff"
                                value={replyTexts[report._id] || ''}
                                onChangeText={text =>
                                  setReplyTexts(prev => ({ ...prev, [report._id]: text }))
                                }
                                style={{
                                  flex: 1,
                                  backgroundColor: '#ffffff',
                                  color: '#919191ff',
                                  padding: 8,
                                  borderRadius: 4
                                }}
                              />
                              <TouchableOpacity
                                onPress={() => handlePostReply(report._id)}
                                style={{
                                  backgroundColor: '#6BB7D9',
                                  paddingVertical: 8,
                                  paddingHorizontal: 12,
                                  borderRadius: 4,
                                  marginLeft: 6,
                                }}
                              >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Post</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#999' }}>No stations found for this line.</Text>
                )}
              </View>
            )}
          </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#32B568', // Changed from #32B568 to lighter green for main background
  },
  header: {
    padding: 26,
    backgroundColor: '#32B568', // Keep header green
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // Crucial: makes this the positioning context for absolute children
    paddingBottom: 40, // Increased padding to make space for the overlapping buttons
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10, // Add some space between text and buttons
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#272727ff', // background for rest of screen, different from header
  },
  lineLettersRowAbsolute: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    alignItems: 'center',
    position: 'absolute', // Key: take it out of normal flow
    width: '100%', // Make it span the width of its parent (the header)
    bottom: 15, // Adjust this value to control how much it overlaps the header.
  },
  lineLetterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  lineLetter: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#6BB7D9',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1d6485ff',
    margin: 16,
  },
  instructionText: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText1: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    marginHorizontal: 10,
    fontSize: 30,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontStyle: 'italic',
  },
    instructionText2: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    marginHorizontal: 10,
    fontSize: 25,
    fontWeight: 'bold',
  },
    instructionText3: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    marginHorizontal: 10,
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
