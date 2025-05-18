import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, Chip, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EventCardProps {
    event: {
        id: number;
        name: string;
        host: string;
        category: string;
        description: string;
        start_date: string;
        end_date: string;
    };
    onPress: () => void;
}

const getCategoryIcon = (category: string) => {
    // Map categories to appropriate icons
    switch (category.toLowerCase()) {
        case 'blood donation':
            return { name: 'blood-bag', color: '#e53935', backgroundColor: '#ffcdd2' };
        case 'food donation':
            return { name: 'food', color: '#43a047', backgroundColor: '#c8e6c9' };
        case 'clothing donation':
            return { name: 'hanger', color: '#1e88e5', backgroundColor: '#bbdefb' };
        case 'education':
            return { name: 'school', color: '#f9a825', backgroundColor: '#fff9c4' };
        case 'environmental':
            return { name: 'tree', color: '#2e7d32', backgroundColor: '#c8e6c9' };
        case 'animal welfare':
            return { name: 'paw', color: '#6d4c41', backgroundColor: '#d7ccc8' };
        case 'health':
            return { name: 'hospital-box', color: '#0277bd', backgroundColor: '#b3e5fc' };
        case 'disaster relief':
            return { name: 'home-flood', color: '#6a1b9a', backgroundColor: '#e1bee7' };
        default:
            return { name: 'handshake', color: '#546e7a', backgroundColor: '#cfd8dc' };
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
    const categoryStyle = getCategoryIcon(event.category);
    
    return (
        <TouchableOpacity onPress={onPress}>
            <Card style={styles.card}>
                <View style={[styles.categoryBanner, { backgroundColor: categoryStyle.backgroundColor }]}>
                    <MaterialCommunityIcons name={categoryStyle.name as any} size={20} color={categoryStyle.color} />
                    <Text style={[styles.categoryText, { color: categoryStyle.color }]}>{event.category}</Text>
                </View>
                
                <Card.Content style={styles.cardContent}>
                    <Title numberOfLines={2} style={styles.title}>{event.name}</Title>
                    
                    <View style={styles.hostContainer}>
                        <Avatar.Icon 
                            size={24} 
                            icon="account" 
                            color="#fff" 
                            style={styles.hostIcon} 
                        />
                        <Text style={styles.host}>{event.host}</Text>
                    </View>
                    
                    <Paragraph numberOfLines={2} style={styles.description}>
                        {event.description}
                    </Paragraph>
                    
                    <View style={styles.dateContainer}>
                        <View style={styles.dateItem}>
                            <MaterialCommunityIcons name="calendar-start" size={16} color="#555" />
                            <Text style={styles.dateText}>
                                {formatDate(event.start_date)}
                            </Text>
                        </View>
                        <View style={styles.dateItem}>
                            <MaterialCommunityIcons name="calendar-end" size={16} color="#555" />
                            <Text style={styles.dateText}>
                                {formatDate(event.end_date)}
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginVertical: 8,
        marginHorizontal: 16,
        elevation: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardContent: {
        paddingTop: 12,
    },
    categoryBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    categoryText: {
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 14,
    },
    title: {
        fontSize: 18,
        marginBottom: 8,
    },
    hostContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    hostIcon: {
        backgroundColor: '#0066cc',
    },
    host: {
        fontSize: 14,
        color: '#555',
        marginLeft: 8,
    },
    description: {
        marginVertical: 8,
        color: '#333',
        lineHeight: 20,
    },
    dateContainer: {
        marginTop: 8,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
});

export default EventCard;