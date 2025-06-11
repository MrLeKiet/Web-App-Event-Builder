import axios from 'axios';
import { Platform } from 'react-native';

// Function to get the correct API URL based on platform
const getApiUrl = () => {
    // For web, we can use localhost
    if (typeof window !== 'undefined' && window.location) {
        return 'http://localhost:5000/api';
    }

    // For Android emulator, use 10.0.2.2 instead of localhost
    // For iOS simulator, use localhost
    return Platform.OS === 'android'
        ? 'http://10.0.2.2:5000/api'
        : 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const fetchEvents = async () => {
    try {
        const response = await apiClient.get('/events');
        return response.data;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
};

export const fetchEventById = async (id: number) => {
    try {
        const response = await apiClient.get(`/events/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching event ${id}:`, error);
        throw error;
    }
};

export const loginUser = async (username: string, password: string) => {
    try {
        const response = await apiClient.post('/users/login', { username, password });
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

export const registerUser = async (userData: {
    username: string;
    email: string;
    password: string;
    full_name: string;
}) => {
    try {
        const response = await apiClient.post('/users/register', userData);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const registerForEvent = async (userId: number, eventId: number, authHeaders: any) => {
    try {
        const response = await apiClient.post(
            `/registrations/users/${userId}/register`,
            { event_id: eventId },
            { headers: authHeaders }
        );
        return response.data;
    } catch (error) {
        console.error('Error registering for event:', error);
        throw error;
    }
};

export const getUserRegistrations = async (userId: number, authHeaders: any) => {
    try {
        const response = await apiClient.get(
            `/registrations/users/${userId}/events`,
            { headers: authHeaders }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching user registrations:', error);
        throw error;
    }
};

// Get all users (admin only)
export const getAllUsers = async (authHeaders: any) => {
    try {
        const response = await apiClient.get('/users', { headers: authHeaders });
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Update user role (admin only)
export const updateUserRole = async (userId: number, role: 'admin' | 'member', authHeaders: any) => {
    try {
        const response = await apiClient.put(`/users/${userId}/role`, 
            { role }, 
            { headers: authHeaders }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
};

// Create event (admin only)
export const createEvent = async (eventData: any, authHeaders: any) => {
    try {
        const response = await apiClient.post('/events', eventData, { headers: authHeaders });
        return response.data;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
};

// Update event (admin only)
export const updateEvent = async (eventId: number, eventData: any, authHeaders: any) => {
    try {
        const response = await apiClient.put(`/events/${eventId}`, eventData, { headers: authHeaders });
        return response.data;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

// Delete event (admin only)
export const deleteEvent = async (eventId: number, authHeaders: any) => {
    try {
        const response = await apiClient.delete(`/events/${eventId}`, { headers: authHeaders });
        return response.data;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};

// Add this function to your existing apiClient.ts file

export const createEventRole = async (eventId: number, roleData: any, authHeaders: any) => {
    try {
        const response = await apiClient.post(
            `/roles/events/${eventId}/roles`, 
            roleData, 
            { headers: authHeaders }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating event role:', error);
        throw error;
    }
};

export const cancelEventRegistration = async (userId: number, eventId: number, authHeaders: any) => {
  try {
    console.log('Canceling registration for user:', userId, 'event:', eventId);
    // The correct URL should include /registrations prefix to match your route
    const response = await apiClient.delete(
      `/registrations/users/${userId}/events/${eventId}`,
      { headers: authHeaders }
    );
    console.log('Cancellation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error canceling registration:', error);
    throw error;
  }
};

//User Availability
export const submitAvailability = async (
  userId: number, 
  eventId: number,
  availabilitySlots: Array<{
    availability_date: string;
    start_time: string;
    end_time: string;
  }>,
  authHeaders: any
) => {
  try {
    // Log the data being sent for debugging
    console.log('Submitting availability data:', {
      userId,
      eventId,
      slots: availabilitySlots,
      headers: authHeaders
    });
    
    // Don't submit if there are no slots
    if (!availabilitySlots || availabilitySlots.length === 0) {
      console.log('No availability slots to submit');
      return []; // Return empty array instead of throwing error
    }
    
    const response = await apiClient.post(
      `/availability/users/${userId}`,
      {
        event_id: eventId,
        availability_slots: availabilitySlots
      },
      { headers: authHeaders }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting availability:', error);
    // Don't throw the error further, handle it here
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as any).response &&
      (error as any).response.data &&
      (error as any).response.data.error
    ) {
      console.error('Server error message:', (error as any).response.data.error);
    }
    return []; // Return empty array to prevent further errors
  }
};

export const getUserAvailability = async (userId: number, eventId: number, authHeaders: any) => {
  try {
    // Make sure authHeaders contains the necessary authentication info
    if (!authHeaders || !authHeaders.username || !authHeaders.password) {
      throw new Error('Authentication headers missing');
    }
    
    const response = await apiClient.get(
      `/availability/users/${userId}/events/${eventId}`,
      { headers: authHeaders }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user availability:', error);
    throw error;
  }
};
export default apiClient;