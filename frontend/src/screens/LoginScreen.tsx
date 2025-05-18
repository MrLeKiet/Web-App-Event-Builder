import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Title, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { EventsScreenNavigationProp, RegisterScreenNavigationProp } from '../navigation/types';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Use proper navigation typing
    const navigation = useNavigation<EventsScreenNavigationProp & RegisterScreenNavigationProp>();
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter both username and password');
            return;
        }

        try {
            setLoading(true);
            await login(username, password);
            // Fixed navigation call
            navigation.navigate('Events');
        } catch (error: any) {
            let errorMessage = 'Failed to login. Please check your credentials.';
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Welcome Back</Title>
            <Text style={styles.subtitle}>Login to your account</Text>

            <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
            />

            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />

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
                    // Fixed navigation call
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.registerLink}> Register</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
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
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    registerLink: {
        color: '#0066cc',
        fontWeight: 'bold',
    },
});

export default LoginScreen;