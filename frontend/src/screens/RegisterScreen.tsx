import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Title, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { registerUser } from '../api/apiClient';
import { LoginScreenNavigationProp } from '../navigation/types';

const RegisterScreen = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Use proper navigation typing
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const validateInputs = () => {
        if (!username || !email || !password || !confirmPassword || !fullName) {
            Alert.alert('Error', 'All fields are required');
            return false;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!validateInputs()) return;

        try {
            setLoading(true);
            await registerUser({
                username,
                email,
                password,
                full_name: fullName,
            });

            Alert.alert(
                'Registration Successful',
                'Your account has been created successfully!',
                // Fixed navigation call
                [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            let errorMessage = 'Registration failed. Please try again.';
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Title style={styles.title}>Create Account</Title>
            <Text style={styles.subtitle}>Register to join volunteer events</Text>

            <TextInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
            />

            <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
            />

            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />

            <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
            />

            <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.button}
            >
                Register
            </Button>

            <View style={styles.loginContainer}>
                <Text>Already have an account?</Text>
                <TouchableOpacity 
                    // Fixed navigation call
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginLink}> Login</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        padding: 20,
        paddingVertical: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
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
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginLink: {
        color: '#0066cc',
        fontWeight: 'bold',
    },
});

export default RegisterScreen;