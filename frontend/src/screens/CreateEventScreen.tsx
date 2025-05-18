import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, RadioButton, Text, TextInput, Title } from 'react-native-paper';
import { createEvent } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const CreateEventScreen = () => {
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

    const navigation = useNavigation();
    const { authHeaders, isAdmin } = useAuth();

    // Show date-time pickers
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

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

        return true;
    };

    const handleCreateEvent = async () => {
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

            await createEvent(eventData, authHeaders);
            Alert.alert(
                'Success',
                'Event created successfully',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            let errorMessage = 'Failed to create event. Please try again.';
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
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
                        // Remove is24Hour prop
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
                        // Remove is24Hour prop
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
                        <RadioButton value="teaching" />
                        <Text>Teaching/Workshop</Text>
                    </View>
                    <View style={styles.radioOption}>
                        <RadioButton value="mixed" />
                        <Text>Mixed (Donation + Volunteer)</Text>
                    </View>
                </RadioButton.Group>
            </View>

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
});

export default CreateEventScreen;