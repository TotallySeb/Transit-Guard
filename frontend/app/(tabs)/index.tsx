import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
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
  Cleanliness: '#D0F0C0',
  Safety: '#F8D7DA',
  Performance: '#FFF3CD',
  Accessibility: '#D1ECF1',
  Other: '#E2E3E5',
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

const BACKEND_BASE_URL = 'https://9c32a20176d7.ngrok-free.app';

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

  // Filter reports by category, threatLevel, stationName, or content
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

  // Filter stations by name or line or if any report on station matches search
  const filteredStations = stations.filter(station => {
    const stationNameMatch = station.name.toLowerCase().includes(lowerSearch);
    const lineMatch = station.line.toLowerCase().includes(lowerSearch);

    const hasMatchingReport = filteredReports.some(
      report => report.stationName === station.name
    );

    // Show station if name/line matches OR if any matching report belongs here OR if search empty
    return stationNameMatch || lineMatch || hasMatchingReport || lowerSearch === '';
  });

  // Group stations by line for display
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
      <View style={{ height: 20, backgroundColor: '#54C571' }} />
      <View style={styles.lineLettersRow}>
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

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 10 }}>
        <Text style={{ color: 'white', marginRight: 8 }}>Show only recent reports</Text>
        <Switch
          value={recentOnly}
          onValueChange={setRecentOnly}
          thumbColor={recentOnly ? '#007AFF' : '#999'}
        />
      </View>

      <TextInput
        placeholder="Search by station, line, category, threat level, or content..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      {!expandedLine && (
        <Text style={styles.instructionText}>Select a Metro line above to view stations.</Text>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {expandedLine && (
            <View key={expandedLine} style={{ marginBottom: 20 }}>
              <Text style={{ color: lineColors[expandedLine], fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                {expandedLine} Line
              </Text>
              {stationsByLine[expandedLine]?.length > 0 ? (
                stationsByLine[expandedLine].map((station, index) => (
                  <View
                    key={`${station.id ?? station.name}-${expandedLine}-${index}`}
                    style={{
                      backgroundColor: '#222',
                      padding: 10,
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{station.name}</Text>
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
                          {/* Time in top right in black */}
                          {report.createdAt && (
                            <Text
                              style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                fontSize: 12,
                                color: 'black',
                                fontWeight: 'bold',
                              }}
                            >
                              {new Date(report.createdAt).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          )}

                          <Text style={{ fontWeight: 'bold', fontSize: 20 }}>
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

                          <Text style={{ fontSize: 15, marginTop: 4 }}>
                            {report.content}
                          </Text>

                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            <View
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                backgroundColor: threatLevelColors[report.threatLevel || 'Low'] || '#FFDC00',
                                marginRight: 8,
                              }}
                            />
                            <Text style={{ fontWeight: 'bold', color: '#333' }}>
                              Threat level: {report.threatLevel || 'Low'}
                            </Text>
                          </View>

                          {report.createdAt && (
                            <Text style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>
                              {new Date(report.createdAt).toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Text>
                          )}

                          {report.replies && report.replies.length > 0 && (
                            <View style={{ marginTop: 6 }}>
                              <Text style={{ fontWeight: 'bold' }}>Replies:</Text>
                              {report.replies.map((reply, idx) => (
                                <View
                                  key={idx}
                                  style={{
                                    backgroundColor: '#333',
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
                              placeholderTextColor="#999"
                              value={replyTexts[report._id] || ''}
                              onChangeText={text =>
                                setReplyTexts(prev => ({ ...prev, [report._id]: text }))
                              }
                              style={{
                                flex: 1,
                                backgroundColor: '#111',
                                color: '#fff',
                                padding: 8,
                                borderRadius: 4,
                              }}
                            />
                            <TouchableOpacity
                              onPress={() => handlePostReply(report._id)}
                              style={{
                                backgroundColor: '#007AFF',
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  lineLettersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  lineLetterContainer: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  lineLetter: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    margin: 16,
  },
  instructionText: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
