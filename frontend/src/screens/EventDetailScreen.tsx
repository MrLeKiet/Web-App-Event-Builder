import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions, Platform } from 'react-native';
import { Button, Card, Title, Paragraph, Text, Divider, Chip, Banner, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { fetchEventById } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { cloneDeep } from 'lodash';

// Define the type for the event
interface Event {
    id: number;
    name: string;
    host: string;
    category: string;
    description: string;
    start_date: string;
    end_date: string;
    roles?: EventRole[];
}

interface EventRole {
    id: number;
    name: string;
    description: string;
    capacity: number;
    filled_spots: number;
    available_spots: number;
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
                image: require('../../assets/blood-donation.jpg')
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

// Function to get API URL
const getApiUrl = () => {
    if (typeof window !== 'undefined' && window.location) {
        return 'http://localhost:5000/api';
    }
    return Platform.OS === 'android'
        ? 'http://10.0.2.2:5000/api'
        : 'http://localhost:5000/api';
};

const EventDetailScreen = () => {
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [error, setError] = useState('');
    const [bannerVisible, setBannerVisible] = useState(true);
    const [refreshCounter, setRefreshCounter] = useState(0);
    
    // Dialog states
    const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
    const [registerDialogVisible, setRegisterDialogVisible] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [userRoleId, setUserRoleId] = useState<number | null>(null);

    const route = useRoute<RouteProp<Record<string, EventDetailParams>, string>>();
    const navigation = useNavigation();
    const { user, authHeaders } = useAuth();
    const windowWidth = Dimensions.get('window').width;

    const { eventId } = route.params;

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

    const getUserRegistrations = async (userId: number, authHeaders: any) => {
        try {
            const response = await axios.get(
                `${getApiUrl()}/registrations/users/${userId}/events`,
                { headers: authHeaders || {} }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching user registrations:', error);
            throw error;
        }
    };

    const getUserRoleForEvent = async (userId: number, eventId: number, authHeaders: any) => {
        try {
            const response = await axios.get(
                `${getApiUrl()}/role-registrations/users/${userId}/events/${eventId}`,
                { headers: authHeaders || {} }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching user role for event:', error);
            return null;
        }
    };

//Check if user is registered for the event and fetch role if applicable
    const checkRegistrationStatus = async () => {
        if (!user) {
            return;
        }
        try {
            console.log('Checking registration status for user:', user.id, 'event:', eventId);
            const userRegistrations = await getUserRegistrations(user.id, authHeaders);
            console.log('User registrations:', userRegistrations);
            
            // The backend returns event objects, so we need to check event.id
            const registered = userRegistrations.some((event: any) => event.id === Number(eventId));
            console.log('Is registered:', registered);
            setIsRegistered(registered);
            
            // If registered, check for role
            if (registered) {
                const roleInfo = await getUserRoleForEvent(user.id, Number(eventId), authHeaders);
                if (roleInfo && roleInfo.role_id) {
                    setUserRoleId(roleInfo.role_id);
                    console.log('User has role:', roleInfo.role_id);
                }
            }
        } catch (error) {
            console.error('Error checking registration status:', error);
        }
    };
// Handle registration button click
    const handleRegisterButtonClick = () => {
        if (!user) {
            navigation.navigate('Login' as never);
            return;
        }
        
        // If the event has roles, show the role selection dialog
        if (event?.roles && event.roles.length > 0) {
            setSelectedRole(null);
            setRegisterDialogVisible(true);
        } else {
            // Otherwise directly register without role selection
            handleRegisterConfirm(null);
        }
    };
// Handle registration confirmation with selected role
    const handleRegisterConfirm = async (roleId: string | null) => {
    if (!user) {
        showErrorDialog('Registration Failed', 'You must be logged in to register for this event.');
        return;
    }
    try {
        setRegistering(true);
        
        // Check if user is already registered for this event
        let isAlreadyRegistered = false;
        try {
            const userRegistrations = await getUserRegistrations(user.id, authHeaders);
            isAlreadyRegistered = userRegistrations.some((event: any) => event.id === Number(eventId));
        } catch (err) {
            console.error('Error checking registration status:', err);
        }
        
        let response;
        let endpoint;
        let payload;
        
        if (isAlreadyRegistered) {
            // If already registered, update role instead of creating a new registration
            if (roleId) {
                // Handle role change
                endpoint = `${getApiUrl()}/role-registrations/users/${user.id}/update-role`;
                payload = { event_id: eventId, role_id: roleId };
                
                console.log('Updating role for existing registration');
                response = await axios.put(
                    endpoint,
                    payload,
                    { headers: authHeaders || {} }
                );
            } else {
                // User chose to attend as general participant - remove role if exists
                if (userRoleId) {
                    endpoint = `${getApiUrl()}/role-registrations/users/${user.id}/events/${eventId}/roles/${userRoleId}`;
                    console.log('Removing role from existing registration');
                    response = await axios.delete(
                        endpoint,
                        { headers: authHeaders || {} }
                    );
                } else {
                    // Already registered with no role, nothing to do
                    showSuccessDialog('You are already registered for this event');
                    setRegistering(false);
                    return;
                }
            }
        } else {
            // New registration
            endpoint = `${getApiUrl()}/registrations/users/${user.id}/register`;
            payload = roleId ? { event_id: eventId, role_id: roleId } : { event_id: eventId };
            
            console.log('Creating new registration');
            response = await axios.post(
                endpoint,
                payload,
                { headers: authHeaders || {} }
            );
        }
        
        console.log('Registration/update response:', response.data);
        
        // Update local state to reflect the registration
        setIsRegistered(true);
        
        // Store role ID if applicable or clear it if no role
        setUserRoleId(roleId ? Number(roleId) : null);
        
        // If a role was selected, update its available slots in the UI
        if (event?.roles) {
            const updatedEvent = cloneDeep(event);
            
            // First reset previous role counts if changing roles
            if (
                userRoleId &&
                userRoleId !== (roleId ? Number(roleId) : null) &&
                updatedEvent.roles
            ) {
                const oldRoleIndex = updatedEvent.roles.findIndex(r => r.id === userRoleId);
                if (oldRoleIndex !== undefined && oldRoleIndex !== -1) {
                    updatedEvent.roles[oldRoleIndex].filled_spots = Math.max(0, updatedEvent.roles[oldRoleIndex].filled_spots - 1);
                    updatedEvent.roles[oldRoleIndex].available_spots += 1;
                }
            }
            
            // Then update new role counts
            if (roleId && updatedEvent.roles) {
                const roleIndex = updatedEvent.roles.findIndex(r => r.id === Number(roleId));
                if (roleIndex !== undefined && roleIndex !== -1) {
                    updatedEvent.roles[roleIndex].filled_spots += 1;
                    updatedEvent.roles[roleIndex].available_spots -= 1;
                }
            }
            
            setEvent(updatedEvent);
        }
        
        setRegisterDialogVisible(false);
        
        // Show success dialog
        showSuccessDialog(isAlreadyRegistered 
            ? 'Your role has been updated successfully!' 
            : 'You have successfully registered for this event!');
        
        // Force a refresh of the event data
        setRefreshCounter(prev => prev + 1);
    } catch (err: any) {
        console.error('Failed to register for event:', err);

        let errorMessage = 'Failed to register for this event. Please try again.';
        if (err.response && err.response.data && err.response.data.error) {
            errorMessage = err.response.data.error;
        }

        showErrorDialog('Registration Failed', errorMessage);
    } finally {
        setRegistering(false);
    }
};

    const handleCancelButtonClick = () => {
        if (!user) {
            navigation.navigate('Login' as never);
            return;
        }
        
        setCancelDialogVisible(true);
    };

    const handleCancelConfirm = async () => {
    try {
        console.log('Starting cancellation process');
        setRegistering(true);

        if (!user) {
            showErrorDialog('Cancellation Failed', 'You must be logged in to cancel your registration.');
            setRegistering(false);
            return;
        }
        
        console.log(`Calling API: DELETE ${getApiUrl()}/registrations/users/${user.id}/events/${eventId}`);
        
        const response = await axios.delete(
            `${getApiUrl()}/registrations/users/${user.id}/events/${eventId}`,
            { headers: authHeaders || {} }
        );
        
        console.log('Cancellation response:', response.data);
        
        // If the user had a role, update that role's capacity in the UI
        if (userRoleId && event?.roles) {
            const updatedEvent = cloneDeep(event);
            const roleIndex = updatedEvent.roles?.findIndex(r => r.id === userRoleId);
            
            if (roleIndex !== undefined && roleIndex !== -1) {
                if (updatedEvent.roles) {
                    updatedEvent.roles[roleIndex].filled_spots = Math.max(0, updatedEvent.roles[roleIndex].filled_spots - 1);
                    updatedEvent.roles[roleIndex].available_spots += 1;
                }
                setEvent(updatedEvent);
            }
            
            // Reset user role
            setUserRoleId(null);
        }
        
        // Force state update
        setIsRegistered(false);
        setCancelDialogVisible(false);
        
        // Show success dialog
        showSuccessDialog('Your registration has been canceled.');
        
        // Force a refresh of the event data
        setRefreshCounter(prev => prev + 1);
    } catch (err: any) {
        console.error('Failed to cancel registration:', err);
        
        if (err.response) {
            console.error('Error response:', {
                data: err.response.data,
                status: err.response.status
            });
        }
        
        let errorMessage = 'Failed to cancel registration. Please try again.';
        if (err.response && err.response.data && err.response.data.error) {
            errorMessage = err.response.data.error;
        }
        
        showErrorDialog('Cancellation Failed', errorMessage);
    } finally {
        setRegistering(false);
    }
};


    // Simple success dialog
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    const showSuccessDialog = (message: string) => {
        setSuccessMessage(message);
        setSuccessDialogVisible(true);
    };

    // Simple error dialog
    const [errorDialogVisible, setErrorDialogVisible] = useState(false);
    const [errorTitle, setErrorTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    const showErrorDialog = (title: string, message: string) => {
        setErrorTitle(title);
        setErrorMessage(message);
        setErrorDialogVisible(true);
    };

    // Debug useEffect to log auth state
    useEffect(() => {
        console.log('Auth headers:', authHeaders);
        console.log('User state:', user);
    }, []);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                setLoading(true);
                const eventData = await fetchEventById(eventId);
                setEvent(eventData);
                
                if (user?.id) {
                    await checkRegistrationStatus();
                }
            } catch (err: any) {
                setError('Failed to load event details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId, user?.id, refreshCounter]);

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
        <>
            <ScrollView style={styles.container}>
                <Banner
                    visible={bannerVisible}
                    actions={[
                        {
                            label: 'Got it',
                            onPress: () => setBannerVisible(false),
                        },
                    ]}
                    icon={({ size }) =>
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

                        {event.roles && event.roles.length > 0 && (
                            <>
                                <Divider style={styles.divider} />
                                <View style={styles.rolesSection}>
                                    <Text style={styles.sectionTitle}>Volunteer Roles</Text>
                                    {event.roles.map(role => (
                                        <Card key={role.id} style={styles.roleCard}>
                                            <Card.Content>
                                                <View style={styles.roleTitleRow}>
                                                    <Text style={styles.roleName}>{role.name}</Text>
                                                    <Chip 
                                                        mode="outlined" 
                                                        style={[
                                                            styles.availabilityChip,
                                                            role.available_spots <= 0 ? { backgroundColor: '#ffcdd2' } : null
                                                        ]}
                                                    >
                                                        {role.available_spots > 0 
                                                            ? `${role.available_spots} spots left` 
                                                            : 'Full'}
                                                    </Chip>
                                                </View>
                                                <Text style={styles.roleDescription}>{role.description}</Text>
                                                <View style={styles.capacityIndicator}>
                                                    <View 
                                                        style={[
                                                            styles.capacityBar,
                                                            { width: `${(role.filled_spots / role.capacity) * 100}%` }
                                                        ]} 
                                                    />
                                                    <Text style={styles.capacityText}>
                                                        {role.filled_spots}/{role.capacity} filled
                                                    </Text>
                                                </View>
                                            </Card.Content>
                                        </Card>
                                    ))}
                                </View>
                            </>
                        )}

                        <View style={styles.impactSection}>
                            <Text style={styles.sectionTitle}>Your Impact</Text>
                            <Paragraph style={styles.impactText}>
                                By participating in this {event.category.toLowerCase()} event, you'll be making a real difference in your community.
                                Join us and be part of the positive change!
                            </Paragraph>
                        </View>

                        {/* Debug info to display registration status */}
                        <Text style={{color: 'gray', marginBottom: 8}}>
                            Registration status: {isRegistered ? 'Registered' : 'Not registered'}
                            {isRegistered && userRoleId ? ` (Role ID: ${userRoleId})` : ''}
                        </Text>

                        {user && (
                            isRegistered ? (
                                <Button
                                    mode="contained"
                                    onPress={handleCancelButtonClick}
                                    loading={registering}
                                    disabled={registering}
                                    style={[styles.registerButton, { backgroundColor: '#e74c3c' }]}
                                    icon="close-circle"
                                >
                                    Cancel Registration
                                </Button>
                            ) : (
                                <Button
                                    mode="contained"
                                    onPress={handleRegisterButtonClick}
                                    loading={registering}
                                    disabled={registering}
                                    style={styles.registerButton}
                                    icon="check-circle"
                                >
                                    Register for this Event
                                </Button>
                            )
                        )}

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

            {/* Confirmation Dialog for Cancellation */}
            <Portal>
                <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
                    <Dialog.Title>Cancel Registration</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>Are you sure you want to cancel your registration for this event?</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setCancelDialogVisible(false)}>No</Button>
                        <Button onPress={handleCancelConfirm} loading={registering}>Yes</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Role Selection Dialog for Registration */}
            <Portal>
                <Dialog visible={registerDialogVisible} onDismiss={() => setRegisterDialogVisible(false)}>
                    <Dialog.Title>Choose Your Role</Dialog.Title>
                    <Dialog.Content>
                        <RadioButton.Group onValueChange={value => setSelectedRole(value)} value={selectedRole || ''}>
                            <View style={styles.roleOption}>
                                <RadioButton value="" />
                                <Text>Attend as general participant</Text>
                            </View>
                            {event?.roles?.map(role => (
                                <View key={role.id} style={styles.roleOption}>
                                    <RadioButton 
                                        value={String(role.id)} 
                                        disabled={role.available_spots <= 0}
                                    />
                                    <View style={styles.roleOptionContent}>
                                        <Text style={[
                                            styles.roleOptionTitle,
                                            role.available_spots <= 0 ? {color: '#aaa'} : null
                                        ]}>
                                            {role.name} {role.available_spots <= 0 ? '(Full)' : ''}
                                        </Text>
                                        <Text style={styles.roleOptionDescription}>
                                            {role.description} ({role.filled_spots}/{role.capacity} filled)
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </RadioButton.Group>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setRegisterDialogVisible(false)}>Cancel</Button>
                        <Button 
                            onPress={() => handleRegisterConfirm(selectedRole)} 
                            disabled={registering}
                            loading={registering}
                        >
                            Register
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Success Dialog */}
            <Portal>
                <Dialog visible={successDialogVisible} onDismiss={() => setSuccessDialogVisible(false)}>
                    <Dialog.Title>Success</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>{successMessage}</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setSuccessDialogVisible(false)}>OK</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Error Dialog */}
            <Portal>
                <Dialog visible={errorDialogVisible} onDismiss={() => setErrorDialogVisible(false)}>
                    <Dialog.Title>{errorTitle}</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>{errorMessage}</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setErrorDialogVisible(false)}>OK</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </>
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
    rolesSection: {
        marginBottom: 24,
    },
    roleCard: {
        marginBottom: 12,
        backgroundColor: '#f9f9f9',
    },
    roleTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    availabilityChip: {
        backgroundColor: 'transparent',
    },
    roleDescription: {
        color: '#555',
    },
    capacityIndicator: {
        marginTop: 8,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        position: 'relative',
    },
    capacityBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#4caf50',
        borderRadius: 10,
    },
    capacityText: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: '#333',
        fontSize: 12,
        fontWeight: 'bold',
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
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    roleOptionContent: {
        flex: 1,
        marginLeft: 8,
    },
    roleOptionTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    roleOptionDescription: {
        color: '#666',
        fontSize: 14,
    },
});

export default EventDetailScreen;