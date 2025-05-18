import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Card, Title, Text, Avatar, Chip, TextInput, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { getUserRegistrations } from '../api/apiClient';
import EventCard from '../components/EventCard';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

// Define Event type
interface Event {
    id: number;
    name: string;
    host: string;
    category: string;
    description: string;
    start_date: string;
    end_date: string;
}

// Login component to show when user is not logged in
const LoginSection = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigation = useNavigation();
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await login(username, password);
            // No need for navigation - the parent component will re-render with profile view
        } catch (error: any) {
            let errorMessage = 'Failed to login. Please check your credentials.';
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.loginContainer}>
            <Title style={styles.loginTitle}>Welcome Back</Title>
            <Text style={styles.loginSubtitle}>Login to your account</Text>

            <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
                error={!!error}
            />

            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                error={!!error}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
            >
                Login
            </Button>

            <View style={styles.registerContainer}>
                <Text>Don't have an account?</Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.registerLink}> Register</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Profile content to show when user is logged in
const ProfileContent = () => {
    const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const { user, logout, authHeaders } = useAuth();
    
    const navigation = useNavigation();

    useEffect(() => {
        if (user) {
            fetchUserEvents();
        }
    }, [user]);

    const fetchUserEvents = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const events = await getUserRegistrations(user.id, authHeaders);
            setRegisteredEvents(events);
        } catch (error) {
            console.error('Failed to fetch registered events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Just perform logout without any navigation
            const success = await logout();
            console.log("Logout successful:", success);
            // The parent component will re-render automatically with the login form
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    if (!user) return null;

    // Render function for events list to avoid nesting ternaries
    const renderEventsList = () => {
        if (loading) {
            return (
                <View style={styles.centeredContent}>
                    <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
                </View>
            );
        } 
        
        if (registeredEvents.length === 0) {
            return (
                <Card style={styles.emptyCard}>
                    <Card.Content style={styles.centeredContent}>
                        <MaterialIcons name="event-busy" size={48} color="#ccc" style={styles.emptyIcon} />
                        <Text style={styles.emptyText}>You haven't registered for any events yet</Text>
                        <Button
                            mode="contained"
                            onPress={() => navigation.navigate('Events')}
                            style={styles.browseButton}
                            icon="calendar-search"
                        >
                            Browse Events
                        </Button>
                    </Card.Content>
                </Card>
            );
        } 
        
        return (
            <FlatList
                data={registeredEvents}
                renderItem={({ item }) => (
                    <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })} />
                )}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.eventsList}
            />
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.profileCard}>
                <Card.Content>
                    <View style={styles.profileHeader}>
                        <Avatar.Text 
                            size={60} 
                            label={user.full_name.split(' ').map(n => n[0]).join('')} 
                            style={styles.avatar}
                        />
                        <View style={styles.profileInfo}>
                            <Title style={styles.nameTitle}>{user.full_name}</Title>
                            <Chip 
                                icon={user.role === 'admin' ? "shield-account" : "account"}
                                style={[
                                    styles.roleChip, 
                                    {backgroundColor: user.role === 'admin' ? '#e8f4fd' : '#e8f5e9'}
                                ]}
                            >
                                {user.role === 'admin' ? 'Administrator' : 'Member'}
                            </Chip>
                        </View>
                    </View>

                    <Divider style={styles.divider} />
                    
                    <View style={styles.detailsSection}>
                        <View style={styles.detailRow}>
                            <MaterialIcons name="person" size={20} color="#555" />
                            <Text style={styles.detailLabel}>Username:</Text>
                            <Text style={styles.detailValue}>{user.username}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <MaterialIcons name="email" size={20} color="#555" />
                            <Text style={styles.detailLabel}>Email:</Text>
                            <Text style={styles.detailValue}>{user.email}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <MaterialIcons name="verified-user" size={20} color="#555" />
                            <Text style={styles.detailLabel}>Role:</Text>
                            <Text style={[
                                styles.detailValue, 
                                {color: user.role === 'admin' ? '#0066cc' : '#43a047'}
                            ]}>
                                {user.role}
                            </Text>
                        </View>
                    </View>

                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate('Events')}
                        style={styles.actionButton}
                        icon="calendar-search"
                    >
                        Browse Events
                    </Button>
                    
                    {user.role === 'admin' && (
                        <Button
                            mode="contained"
                            onPress={() => navigation.navigate('CreateEvent')}
                            style={[styles.actionButton, styles.createButton]}
                            icon="calendar-plus"
                        >
                            Create Event
                        </Button>
                    )}
                    
                    <Button
                        mode="outlined"
                        onPress={handleLogout}
                        style={styles.logoutButton}
                        icon="logout"
                    >
                        Logout
                    </Button>
                </Card.Content>
            </Card>

            <View style={styles.eventsSection}>
                <Title style={styles.eventsTitle}>Your Registered Events</Title>
                {renderEventsList()}
            </View>
        </ScrollView>
    );
};

// Main ProfileScreen component that conditionally renders login or profile
const ProfileScreen = () => {
    const { user } = useAuth();
    
    // Simply check if user exists and render appropriate component
    return user ? <ProfileContent /> : <LoginSection />;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    loginTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    loginSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    profileCard: {
        margin: 16,
        elevation: 4,
        borderRadius: 12,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        backgroundColor: '#0066cc',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    nameTitle: {
        fontSize: 20,
        marginBottom: 4,
    },
    roleChip: {
        alignSelf: 'flex-start',
    },
    divider: {
        marginVertical: 16,
    },
    detailsSection: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
        width: 100,
    },
    detailValue: {
        fontSize: 16,
        flex: 1,
    },
    actionButton: {
        marginBottom: 12,
    },
    createButton: {
        backgroundColor: '#43a047',
    },
    logoutButton: {
        marginTop: 4,
    },
    eventsSection: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    eventsTitle: {
        fontSize: 20,
        marginBottom: 12,
        fontWeight: 'bold',
    },
    eventsList: {
        paddingBottom: 20,
    },
    card: {
        margin: 16,
        borderRadius: 12,
        elevation: 4,
    },
    centeredContent: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    title: {
        marginTop: 16,
        fontSize: 24,
        textAlign: 'center',
    },
    subtitle: {
        marginBottom: 16,
        color: '#666',
        textAlign: 'center',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    button: {
        marginTop: 8,
        paddingVertical: 8,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    registerLink: {
        color: '#0066cc',
        fontWeight: 'bold',
    },
    skipButton: {
        marginTop: 12,
    },
    emptyCard: {
        padding: 8,
        marginTop: 16,
        borderRadius: 12,
    },
    emptyText: {
        textAlign: 'center',
        marginBottom: 16,
        color: '#666',
    },
    browseButton: {
        marginTop: 8,
    },
    loader: {
        marginTop: 20,
    },
    loginIcon: {
        marginBottom: 8,
    },
    emptyIcon: {
        marginBottom: 8,
    },
    errorText: {
        color: '#d32f2f',
        marginBottom: 8,
    },
});

export default ProfileScreen;