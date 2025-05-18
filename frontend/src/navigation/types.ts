import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
    Main: undefined;
    Auth: undefined;
    Login: undefined;
    Register: undefined;
    Events: undefined;
    EventDetail: { eventId: number };
    CreateEvent: undefined; // Add this line
};

export type BottomTabParamList = {
    EventsTab: undefined;
    ProfileTab: undefined;
    TestLogoutTab: undefined;
};

// Navigation prop types for each screen
export type EventsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Events'>;
export type EventDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EventDetail'>;
export type EventDetailScreenRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
export type CreateEventScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateEvent'>; // Add this line

// Extend the NavigationProp type from React Navigation
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}