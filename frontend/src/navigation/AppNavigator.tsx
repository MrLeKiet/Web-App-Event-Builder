import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

// Import screens
import { useAuth } from '../context/AuthContext';
import EventDetailScreen from '../screens/EventDetailScreen';
import EventsScreen from '../screens/EventsScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
// Import types from the types file
import { BottomTabParamList, RootStackParamList } from './types';

// Create navigators with proper typing
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const EventsStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: {
                backgroundColor: '#0066cc',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        }}
    >
        <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Volunteer Events' }} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
        <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create New Event' }} />
    </Stack.Navigator>
);

const AppTabs = () => {
    const { user } = useAuth();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#0066cc',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                },
            }}
        >
            <Tab.Screen
                name="EventsTab"
                component={EventsStack}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Events',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="event" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    title: user ? 'My Profile' : 'Login',
                    tabBarLabel: user ? 'Profile' : 'Login',
                    headerStyle: {
                        backgroundColor: '#0066cc',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons
                            name={user ? "person" : "login"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return null; // Or a loading screen
    }

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Main">
                <Stack.Screen
                    name="Main"
                    component={AppTabs}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{
                        title: 'Login',
                        headerStyle: {
                            backgroundColor: '#0066cc',
                        },
                        headerTintColor: '#fff',
                    }}
                />
                <Stack.Screen
                    name="Register"
                    component={RegisterScreen}
                    options={{
                        title: 'Create Account',
                        headerStyle: {
                            backgroundColor: '#0066cc',
                        },
                        headerTintColor: '#fff',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;