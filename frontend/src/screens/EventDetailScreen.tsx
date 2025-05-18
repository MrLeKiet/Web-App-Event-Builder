import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
import { Button, Card, Title, Paragraph, Text, Divider, Chip, Banner } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { fetchEventById, registerForEvent } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Define the type for the event
interface Event {
    id: number;
    name: string;
    host: string;
    category: string;
    description: string;
    start_date: string;
    end_date: string;
}

// Define the type for our route params
type EventDetailParams = {
    eventId: number;
};

const getCategoryDetails = (category: string) => {
    // Map categories to appropriate icons and descriptions
    switch (category.toLowerCase()) {
        case 'blood donation':
            return {
                icon: 'blood-bag',
                color: '#e53935',
                backgroundColor: '#ffcdd2',
                description: 'Help save lives by donating blood to those in need.',
                image: require('../../assets/blood-donation.jpg') // Make sure to add these images to your assets folder
            };
        case 'food donation':
            return {
                icon: 'food',
                color: '#43a047',
                backgroundColor: '#c8e6c9',
                description: 'Provide food to vulnerable communities and support those facing hunger.',
                image: require('../../assets/food-donation.jpg')
            };
        case 'clothing donation':
            return {
                icon: 'hanger',
                color: '#1e88e5',
                backgroundColor: '#bbdefb',
                description: 'Donate clothes to help those in need stay warm and comfortable.',
                image: require('../../assets/clothing-donation.jpg')
            };
        case 'education':
            return {
                icon: 'school',
                color: '#f9a825',
                backgroundColor: '#fff9c4',
                description: 'Support educational initiatives and help provide learning opportunities.',
                image: require('../../assets/education.jpg')
            };
        case 'environmental':
            return {
                icon: 'tree',
                color: '#2e7d32',
                backgroundColor: '#c8e6c9',
                description: 'Join efforts to protect and restore our environment for future generations.',
                image: require('../../assets/environmental.jpg')
            };
        case 'animal welfare':
            return {
                icon: 'paw',
                color: '#6d4c41',
                backgroundColor: '#d7ccc8',
                description: 'Help protect and care for animals in need of assistance.',
                image: require('../../assets/animal-welfare.jpg')
            };
        case 'health':
            return {
                icon: 'hospital-box',
                color: '#0277bd',
                backgroundColor: '#b3e5fc',
                description: 'Support health initiatives and medical assistance programs.',
                image: require('../../assets/health.jpg')
            };
        case 'disaster relief':
            return {
                icon: 'home-flood',
                color: '#6a1b9a',
                backgroundColor: '#e1bee7',
                description: 'Help communities recover from natural disasters and emergencies.',
                image: require('../../assets/disaster-relief.jpg')
            };
        default:
            return {
                icon: 'handshake',
                color: '#546e7a',
                backgroundColor: '#cfd8dc',
                description: 'Join this volunteering opportunity to make a positive impact.',
                image: require('../../assets/volunteer-default.jpg')
            };
    }
};

const EventDetailScreen = () => {
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [error, setError] = useState('');
    const [bannerVisible, setBannerVisible] = useState(true);

    const route = useRoute<RouteProp<Record<string, EventDetailParams>, string>>();
    const navigation = useNavigation();
    const { user, authHeaders } = useAuth();
    const windowWidth = Dimensions.get('window').width;

    const { eventId } = route.params;

    useEffect(() => {
        const getEventDetails = async () => {
            try {
                setLoading(true);
                const data = await fetchEventById(eventId);
                setEvent(data);
            } catch (err) {
                console.error('Failed to fetch event details:', err);
                setError('Failed to load event details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        getEventDetails();
    }, [eventId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleRegister = async () => {
        if (!user) {
            Alert.alert(
                'Login Required',
                'You need to log in to register for events',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Login',
                        onPress: () => navigation.navigate('Login' as never)
                    }
                ]
            );
            return;
        }

        try {
            setRegistering(true);
            await registerForEvent(user.id, eventId, authHeaders);
            Alert.alert(
                'Success',
                'You have successfully registered for this event!',
                [{ text: 'OK' }]
            );
        } catch (err: any) {
            console.error('Failed to register for event:', err);

            let errorMessage = 'Failed to register for this event. Please try again.';
            if (err.response && err.response.data && err.response.data.error) {
                errorMessage = err.response.data.error;
            }

            Alert.alert('Registration Failed', errorMessage, [{ text: 'OK' }]);
        } finally {
            setRegistering(false);
        }
    };

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

    if (!event) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>Event not found</Text>
            </View>
        );
    }

    const categoryDetails = getCategoryDetails(event.category);

    return (
        <ScrollView style={styles.container}>
            <Banner
                visible={bannerVisible}
                actions={[
                    {
                        label: 'Got it',
                        onPress: () => setBannerVisible(false),
                    },
                ]}
                icon={({size}) => 
                    <MaterialCommunityIcons name={categoryDetails.icon as any} size={size} color={categoryDetails.color} />
                }
            >
                This is a {event.category} event. {categoryDetails.description}
            </Banner>

            <Image 
                source={categoryDetails.image}
                style={[styles.headerImage, { width: windowWidth }]}
                resizeMode="cover"
            />

            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.titleContainer}>
                        <Chip 
                            icon={categoryDetails.icon as any}
                            style={[styles.categoryChip, { backgroundColor: categoryDetails.backgroundColor }]}
                            textStyle={{ color: categoryDetails.color }}
                        >
                            {event.category}
                        </Chip>
                        <Title style={styles.title}>{event.name}</Title>
                    </View>

                    <View style={styles.hostContainer}>
                        <MaterialCommunityIcons name="account-group" size={24} color="#555" />
                        <Text style={styles.hostText}>Organized by {event.host}</Text>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.timeSection}>
                        <Text style={styles.sectionTitle}>Event Schedule</Text>
                        <View style={styles.timeRow}>
                            <MaterialCommunityIcons name="calendar-start" size={20} color="#0066cc" />
                            <View style={styles.timeDetails}>
                                <Text style={styles.timeLabel}>Starts</Text>
                                <Text style={styles.timeValue}>{formatDate(event.start_date)}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.timeRow}>
                            <MaterialCommunityIcons name="calendar-end" size={20} color="#0066cc" />
                            <View style={styles.timeDetails}>
                                <Text style={styles.timeLabel}>Ends</Text>
                                <Text style={styles.timeValue}>{formatDate(event.end_date)}</Text>
                            </View>
                        </View>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.descriptionSection}>
                        <Text style={styles.sectionTitle}>About This Event</Text>
                        <Paragraph style={styles.description}>{event.description}</Paragraph>
                    </View>

                    <View style={styles.impactSection}>
                        <Text style={styles.sectionTitle}>Your Impact</Text>
                        <Paragraph style={styles.impactText}>
                            By participating in this {event.category.toLowerCase()} event, you'll be making a real difference in your community.
                            Join us and be part of the positive change!
                        </Paragraph>
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        loading={registering}
                        disabled={registering}
                        style={styles.registerButton}
                        icon="check-circle"
                    >
                        Register for this Event
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        icon="arrow-left"
                    >
                        Back to Events
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
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
    headerImage: {
        height: 200,
    },
    card: {
        margin: 16,
        elevation: 4,
        borderRadius: 12,
        marginTop: -30,
    },
    titleContainer: {
        marginTop: 8,
        marginBottom: 16,
    },
    categoryChip: {
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    hostContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    hostText: {
        fontSize: 16,
        marginLeft: 8,
        color: '#555',
    },
    divider: {
        marginVertical: 16,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    timeSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    timeDetails: {
        marginLeft: 12,
        flex: 1,
    },
    timeLabel: {
        fontSize: 14,
        color: '#555',
    },
    timeValue: {
        fontSize: 16,
        color: '#333',
    },
    descriptionSection: {
        marginBottom: 24,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
    impactSection: {
        backgroundColor: '#e8f4fd',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    impactText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#0066cc',
    },
    registerButton: {
        marginBottom: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    backButton: {
        marginBottom: 8,
        paddingVertical: 8,
        borderRadius: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
    },
});

export default EventDetailScreen;