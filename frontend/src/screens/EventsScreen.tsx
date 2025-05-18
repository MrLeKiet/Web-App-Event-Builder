import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { Searchbar, Text, Chip, Title, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import EventCard from '../components/EventCard';
import { fetchEvents } from '../api/apiClient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EventsScreenNavigationProp } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

// Define proper types
interface Event {
    id: number;
    name: string;
    host: string;
    category: string;
    description: string;
    start_date: string;
    end_date: string;
}

const categoryFilters = [
    { name: 'All', icon: 'apps', color: '#546e7a' },
    { name: 'Blood Donation', icon: 'blood-bag', color: '#e53935' },
    { name: 'Food Donation', icon: 'food', color: '#43a047' },
    { name: 'Clothing Donation', icon: 'hanger', color: '#1e88e5' },
    { name: 'Education', icon: 'school', color: '#f9a825' },
    { name: 'Environmental', icon: 'tree', color: '#2e7d32' },
    { name: 'Animal Welfare', icon: 'paw', color: '#6d4c41' },
    { name: 'Health', icon: 'hospital-box', color: '#0277bd' },
    { name: 'Disaster Relief', icon: 'home-flood', color: '#6a1b9a' },
];

const EventsScreen = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Add auth context to check if user is admin
    const { isAdmin } = useAuth();

    // Use proper navigation typing
    const navigation = useNavigation<EventsScreenNavigationProp>();

    useEffect(() => {
        const loadEvents = async () => {
            try {
                setLoading(true);
                const data = await fetchEvents();
                setEvents(data);
                setFilteredEvents(data);
            } catch (err) {
                console.error('Failed to fetch events:', err);
                setError('Failed to load events. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, []);

    useEffect(() => {
        // Filter by search query AND category
        let result = events;
        
        // First filter by category if it's not "All"
        if (selectedCategory !== 'All') {
            result = result.filter(event => 
                event.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }
        
        // Then filter by search query if it exists
        if (searchQuery.trim() !== '') {
            const lowercaseQuery = searchQuery.toLowerCase();
            result = result.filter(
                (event) =>
                    event.name.toLowerCase().includes(lowercaseQuery) ||
                    event.host.toLowerCase().includes(lowercaseQuery) ||
                    event.description.toLowerCase().includes(lowercaseQuery)
            );
        }
        
        setFilteredEvents(result);
    }, [searchQuery, selectedCategory, events]);

    const handleEventPress = (eventId: number) => {
        navigation.navigate('EventDetail', { eventId });
    };

    const renderItem = ({ item }: { item: Event }) => (
        <EventCard event={item} onPress={() => handleEventPress(item.id)} />
    );

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Search events..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            <View style={styles.filtersContainer}>
                <Title style={styles.filterTitle}>Event Categories</Title>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    {categoryFilters.map((category) => (
                        <Chip
                            key={category.name}
                            mode={selectedCategory === category.name ? 'flat' : 'outlined'}
                            selected={selectedCategory === category.name}
                            onPress={() => setSelectedCategory(category.name)}
                            style={styles.filterChip}
                            icon={() => (
                                <MaterialCommunityIcons 
                                    name={category.icon as any} 
                                    size={18} 
                                    color={selectedCategory === category.name ? '#fff' : category.color} 
                                />
                            )}
                            selectedColor={selectedCategory === category.name ? '#fff' : undefined}
                            textStyle={{ 
                                color: selectedCategory === category.name ? '#fff' : '#333',
                                fontWeight: selectedCategory === category.name ? 'bold' : 'normal'
                            }}
                        >
                            {category.name}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {filteredEvents.length === 0 ? (
                <View style={styles.noEventsContainer}>
                    <MaterialCommunityIcons name="calendar-remove" size={64} color="#ccc" />
                    <Text style={styles.noEventsText}>No events found</Text>
                    <Text style={styles.noEventsSubText}>
                        Try changing your search or filter settings
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredEvents}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
            
            {/* Admin-only Create Event FAB */}
            {isAdmin && (
                <FAB
                    style={styles.fab}
                    icon="plus"
                    label="Create Event"
                    onPress={() => navigation.navigate('CreateEvent' as any)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    searchBar: {
        margin: 16,
        elevation: 4,
        borderRadius: 8,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    filterTitle: {
        fontSize: 16,
        marginBottom: 8,
    },
    filterScrollContent: {
        paddingBottom: 8,
    },
    filterChip: {
        marginRight: 8,
        marginBottom: 4,
    },
    listContainer: {
        paddingBottom: 16,
    },
    noEventsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noEventsText: {
        fontSize: 18,
        color: '#666',
        marginTop: 16,
    },
    noEventsSubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
    },
    // Add FAB style
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#0066cc',
    },
});

export default EventsScreen;