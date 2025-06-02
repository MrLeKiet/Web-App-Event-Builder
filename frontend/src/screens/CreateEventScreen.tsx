import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Checkbox, Divider, IconButton, List, RadioButton, Text, TextInput, Title } from 'react-native-paper';
// Removed slider import since we're using TextInput instead
import { createEvent, createEventRole } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

// Define interface for type safety
interface EventRole {
    name: string;
    description: string;
    capacity: number;
    enabled: boolean;
}

const CreateEventScreen = () => {
    // Existing state variables
    const [name, setName] = useState('');
    const [host, setHost] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000)); // Default to 1 hour later
    const [eventType, setEventType] = useState('volunteer');
    const [donationGoal, setDonationGoal] = useState('');
    const [donationDescription, setDonationDescription] = useState('');
    const [loading, setLoading] = useState(false);

    // New state variables for roles
    const [roles, setRoles] = useState<EventRole[]>([
        { name: 'Crew Member', description: 'Help manage and coordinate the event', capacity: 0, enabled: true },
        { name: 'Volunteer', description: 'General volunteer duties', capacity: 0, enabled: true }
    ]);

    const navigation = useNavigation();
    const { authHeaders, isAdmin } = useAuth();
    // console.log('User admin status:', isAdmin);
    // console.log('Auth headers:', authHeaders);
    // Add this near the top of your component
    // console.log('Auth context state:', { authHeaders, isAdmin });



    // Show date-time pickers
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Updated function to handle text input for capacity
    const handleRoleCapacityChange = (index: number, text: string) => {
        const updatedRoles = [...roles];

        // If input is empty, set capacity to 0
        if (text === '') {
            updatedRoles[index].capacity = 0;
            setRoles(updatedRoles);
            return;
        }

        // Try to parse as number
        const numValue = parseInt(text, 10);

        // Update if it's a valid non-negative number
        if (!isNaN(numValue) && numValue >= 0) {
            updatedRoles[index].capacity = numValue;
            setRoles(updatedRoles);
        }
    };

    // Function to handle role toggle
    const handleRoleToggle = (index: number) => {
        const updatedRoles = [...roles];
        updatedRoles[index].enabled = !updatedRoles[index].enabled;
        setRoles(updatedRoles);
    };

    // Function to handle role description change
    const handleRoleDescriptionChange = (index: number, text: string) => {
        const updatedRoles = [...roles];
        updatedRoles[index].description = text;
        setRoles(updatedRoles);
    };

    // Function to add a custom role
    const addCustomRole = () => {
        setRoles([...roles, {
            name: `Custom Role ${roles.length + 1}`,
            description: '',
            capacity: 5,
            enabled: true
        }]);
    };

    // Function to remove a role
    const removeRole = (index: number) => {
        const updatedRoles = [...roles];
        updatedRoles.splice(index, 1);
        setRoles(updatedRoles);
    };

    // Function to change role name
    const handleRoleNameChange = (index: number, text: string) => {
        const updatedRoles = [...roles];
        updatedRoles[index].name = text;
        setRoles(updatedRoles);
    };

    // Validate form
    const validateForm = () => {
        if (!name || !host || !category || !description) {
            Alert.alert('Error', 'Please fill in all required fields');
            return false;
        }

        if (startDate >= endDate) {
            Alert.alert('Error', 'End date must be after start date');
            return false;
        }

        if ((eventType === 'donation' || eventType === 'mixed') && (!donationGoal || isNaN(Number(donationGoal)))) {
            Alert.alert('Error', 'Please enter a valid donation goal amount');
            return false;
        }

        // Check if at least one role is enabled for volunteer/mixed events
        if ((eventType === 'volunteer' || eventType === 'mixed')) {
            if (!roles.some(role => role.enabled)) {
                Alert.alert('Error', 'At least one role must be enabled for volunteer events');
                return false;
            }

            // Validate that all enabled roles have valid capacities
            for (const role of roles.filter(r => r.enabled)) {
                if (isNaN(role.capacity) || role.capacity <= 0) {
                    Alert.alert('Error', `Please enter a valid capacity for role "${role.name}"`);
                    return false;
                }
            }
        }

        return true;
    };

    const handleCreateEvent = async () => {
        console.log('Creating event with auth:', authHeaders);
        if (!isAdmin) {
            Alert.alert('Error', 'Only admins can create events');
            return;
        }

        if (!validateForm()) return;

        try {
            setLoading(true);
            const eventData = {
                name,
                host,
                category,
                description,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                event_type: eventType,
                donation_goal: donationGoal ? Number(donationGoal) : null,
                donation_goal_description: donationDescription || null,
                is_active: true
            };

            // Create the event first
            const newEvent = await createEvent(eventData, authHeaders);

            // Then create roles for the event if it's volunteer or mixed type
            if ((eventType === 'volunteer' || eventType === 'mixed') && newEvent.id) {
                const enabledRoles = roles.filter(role => role.enabled);

                // Create each enabled role
                for (const role of enabledRoles) {
                    await createEventRole(
                        newEvent.id,
                        {
                            name: role.name,
                            description: role.description,
                            capacity: role.capacity,
                            skills_required: ''
                        },
                        authHeaders
                    );
                }
            }

            Alert.alert(
                'Success',
                'Event created successfully',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: unknown) {
            let errorMessage = 'Failed to create event. Please try again.';
            if (error && typeof error === 'object' && 'response' in error) {
                const errorObj = error as {
                    response?: {
                        data?: {
                            error?: string
                        }
                    }
                };
                if (errorObj.response?.data?.error) {
                    errorMessage = errorObj.response.data.error;
                }
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Render the roles section with TextInput instead of Slider
    const renderRolesSection = () => {
        if (eventType !== 'volunteer' && eventType !== 'mixed') {
            return null;
        }

        return (
            <View style={styles.rolesSection}>
                <Text style={styles.sectionLabel}>Volunteer Roles</Text>
                <Text style={styles.sectionDescription}>
                    Define the roles needed for your event and set capacity limits.
                </Text>

                {roles.map((role, index) => (
                    <Card key={index} style={styles.roleCard}>
                        <Card.Content>
                            <View style={styles.roleHeader}>
                                <Checkbox
                                    status={role.enabled ? 'checked' : 'unchecked'}
                                    onPress={() => handleRoleToggle(index)}
                                />
                                <TextInput
                                    label="Role Name"
                                    value={role.name}
                                    onChangeText={(text) => handleRoleNameChange(index, text)}
                                    style={styles.roleNameInput}
                                    disabled={!role.enabled}
                                />
                                <IconButton
                                    icon="delete"
                                    size={20}
                                    onPress={() => removeRole(index)}
                                    disabled={roles.length <= 1}
                                />
                            </View>

                            <TextInput
                                label="Description"
                                value={role.description}
                                onChangeText={(text) => handleRoleDescriptionChange(index, text)}
                                style={styles.roleDescriptionInput}
                                disabled={!role.enabled}
                                multiline
                            />

                            <View style={styles.capacityContainer}>
                                {/* Replaced Slider with TextInput */}
                                <TextInput
                                    label="Capacity (number of people)"
                                    value={role.capacity.toString()}
                                    onChangeText={(text) => handleRoleCapacityChange(index, text)}
                                    keyboardType="numeric"
                                    style={styles.capacityInput}
                                    disabled={!role.enabled}
                                />
                            </View>
                        </Card.Content>
                    </Card>
                ))}

                <Button
                    mode="outlined"
                    onPress={addCustomRole}
                    icon="plus"
                    style={styles.addRoleButton}
                >
                    Add Custom Role
                </Button>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Title style={styles.title}>Create New Event</Title>

            <TextInput
                label="Event Name *"
                value={name}
                onChangeText={setName}
                style={styles.input}
            />

            <TextInput
                label="Host Organization *"
                value={host}
                onChangeText={setHost}
                style={styles.input}
            />

            <TextInput
                label="Category *"
                value={category}
                onChangeText={setCategory}
                style={styles.input}
                placeholder="e.g., Blood Donation, Education, Environmental"
            />

            <TextInput
                label="Description *"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={styles.input}
            />

            <View style={styles.dateSection}>
                <Text style={styles.sectionLabel}>Event Dates</Text>

                <Button
                    mode="outlined"
                    onPress={() => setShowStartPicker(true)}
                    style={styles.dateButton}
                >
                    Start: {startDate.toLocaleString()}
                </Button>

                {showStartPicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="datetime"
                        onChange={(event, selectedDate) => {
                            setShowStartPicker(false);
                            if (selectedDate) setStartDate(selectedDate);
                        }}
                    />
                )}

                <Button
                    mode="outlined"
                    onPress={() => setShowEndPicker(true)}
                    style={styles.dateButton}
                >
                    End: {endDate.toLocaleString()}
                </Button>

                {showEndPicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="datetime"
                        onChange={(event, selectedDate) => {
                            setShowEndPicker(false);
                            if (selectedDate) setEndDate(selectedDate);
                        }}
                    />
                )}
            </View>

            <View style={styles.radioSection}>
                <Text style={styles.sectionLabel}>Event Type</Text>
                <RadioButton.Group onValueChange={value => setEventType(value)} value={eventType}>
                    <View style={styles.radioOption}>
                        <RadioButton value="volunteer" />
                        <Text>Volunteer Event</Text>
                    </View>
                    <View style={styles.radioOption}>
                        <RadioButton value="donation" />
                        <Text>Donation Drive</Text>
                    </View>
                    <View style={styles.radioOption}>
                        <RadioButton value="mixed" />
                        <Text>Mixed (Donation + Volunteer)</Text>
                    </View>
                </RadioButton.Group>
            </View>

            {/* Render roles section for volunteer and mixed events */}
            {renderRolesSection()}

            {(eventType === 'donation' || eventType === 'mixed') && (
                <View style={styles.donationSection}>
                    <Text style={styles.sectionLabel}>Donation Details</Text>

                    <TextInput
                        label="Donation Goal ($) *"
                        value={donationGoal}
                        onChangeText={setDonationGoal}
                        keyboardType="numeric"
                        style={styles.input}
                    />

                    <TextInput
                        label="Donation Goal Description"
                        value={donationDescription}
                        onChangeText={setDonationDescription}
                        multiline
                        numberOfLines={2}
                        style={styles.input}
                        placeholder="e.g., Help us raise $5000 for school supplies"
                    />
                </View>
            )}

            <Button
                mode="contained"
                onPress={handleCreateEvent}
                loading={loading}
                disabled={loading}
                style={styles.button}
            >
                Create Event
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        marginVertical: 16,
        textAlign: 'center',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    dateSection: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    dateButton: {
        marginBottom: 8,
    },
    radioSection: {
        marginBottom: 16,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    donationSection: {
        marginBottom: 16,
    },
    button: {
        marginVertical: 16,
        paddingVertical: 8,
    },
    rolesSection: {
        marginBottom: 16,
    },
    roleCard: {
        marginBottom: 12,
        elevation: 2,
    },
    roleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    roleNameInput: {
        flex: 1,
        marginHorizontal: 8,
        height: 50,
    },
    roleDescriptionInput: {
        marginBottom: 16,
    },
    capacityContainer: {
        marginBottom: 8,
    },
    capacityInput: {
        backgroundColor: '#fff',
    },
    capacityLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    addRoleButton: {
        marginTop: 8,
    }
});

export default CreateEventScreen;