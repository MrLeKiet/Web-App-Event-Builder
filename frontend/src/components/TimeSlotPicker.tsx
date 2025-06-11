import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Text, Card, Title, Button, Divider, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import WebDateTimePicker from './WebDateTimePicker';

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface TimeSlotPickerProps {
  eventStartDate: Date;
  eventEndDate: Date;
  selectedSlots: TimeSlot[];
  onSlotsChange: (slots: TimeSlot[]) => void;
}

// Utility functions
function formatDateForDisplay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeForDisplay(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDateForBackend(date: Date): string {
  return formatDateForDisplay(date);
}

function formatTimeForBackend(date: Date): string {
  return formatTimeForDisplay(date);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  eventStartDate,
  eventEndDate,
  selectedSlots,
  onSlotsChange
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(eventStartDate));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempStartTime, setTempStartTime] = useState<Date>(new Date(eventStartDate));
  const [tempEndTime, setTempEndTime] = useState<Date>(new Date(eventStartDate.getTime() + 60 * 60 * 1000));

  // For web: text inputs
  const [dateText, setDateText] = useState(formatDateForDisplay(new Date(eventStartDate)));
  const [startTimeText, setStartTimeText] = useState(formatTimeForDisplay(new Date(eventStartDate)));
  const [endTimeText, setEndTimeText] = useState(formatTimeForDisplay(new Date(eventStartDate.getTime() + 60 * 60 * 1000)));

  // Debug display for event dates
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web') {
      const info = `Event period: ${eventStartDate.toLocaleDateString()} ${eventStartDate.toLocaleTimeString()} to ${eventEndDate.toLocaleDateString()} ${eventEndDate.toLocaleTimeString()}`;
      setDebugInfo(info);
    }
  }, [eventStartDate, eventEndDate]);

  // Web input handlers
  const handleWebDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDateText(value);
    try {
      const newDate = new Date(value);
      if (!isNaN(newDate.getTime())) {
        newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
        setCurrentDate(newDate);
      }
    } catch (err) {
      console.error("Error parsing date:", err);
    }
  };

  const handleWebStartTimeChange = (value: string) => {
    setStartTimeText(value);
    if (value && value.includes(':')) {
      try {
        const [hours, minutes] = value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const newTime = new Date(currentDate);
          newTime.setHours(hours, minutes);
          setTempStartTime(newTime);
        }
      } catch (err) {
        console.error("Error parsing start time:", err);
      }
    }
  };

  const handleWebEndTimeChange = (value: string) => {
    setEndTimeText(value);
    if (value && value.includes(':')) {
      try {
        const [hours, minutes] = value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const newTime = new Date(currentDate);
          newTime.setHours(hours, minutes);
          setTempEndTime(newTime);
        }
      } catch (err) {
        console.error("Error parsing end time:", err);
      }
    }
  };

  // Add time slot
  const addTimeSlot = () => {
    let newSlot: TimeSlot;

    if (Platform.OS === 'web') {
      // Parse date and times from text
      try {
        const selectedDate = new Date(dateText);
        if (isNaN(selectedDate.getTime())) {
          alert('Please enter a valid date in YYYY-MM-DD format');
          return;
        }

        if (!isDateInRange(selectedDate, eventStartDate, eventEndDate)) {
          alert(`Please select a date between ${eventStartDate.toLocaleDateString()} and ${eventEndDate.toLocaleDateString()}`);
          return;
        }

        const startTime = new Date(`${dateText}T${startTimeText}`);
        const endTime = new Date(`${dateText}T${endTimeText}`);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          alert('Please enter valid times in HH:MM format');
          return;
        }

        if (startTime >= endTime) {
          alert('End time must be after start time');
          return;
        }

        // For same day as event start, check start time is after event start time
        if (isSameDay(selectedDate, eventStartDate)) {
          const eventStartTimeOnly = new Date(eventStartDate);
          const selectedStartTimeOnly = new Date(startTime);
          selectedStartTimeOnly.setFullYear(2000, 0, 1);
          eventStartTimeOnly.setFullYear(2000, 0, 1);

          if (selectedStartTimeOnly < eventStartTimeOnly) {
            alert(`On the first day, time must be after ${eventStartDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
            return;
          }
        }

        // For same day as event end, check end time is before event end time
        if (isSameDay(selectedDate, eventEndDate)) {
          const eventEndTimeOnly = new Date(eventEndDate);
          const selectedEndTimeOnly = new Date(endTime);
          selectedEndTimeOnly.setFullYear(2000, 0, 1);
          eventEndTimeOnly.setFullYear(2000, 0, 1);

          if (selectedEndTimeOnly > eventEndTimeOnly) {
            alert(`On the last day, time must be before ${eventEndDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
            return;
          }
        }

        newSlot = {
          date: formatDateForBackend(selectedDate),
          startTime: formatTimeForBackend(startTime),
          endTime: formatTimeForBackend(endTime)
        };
      } catch (err) {
        console.error("Error validating inputs:", err);
        alert('Please check your date and time inputs');
        return;
      }
    } else {
      // For mobile, use the date objects
      newSlot = {
        date: formatDateForBackend(currentDate),
        startTime: formatTimeForBackend(tempStartTime),
        endTime: formatTimeForBackend(tempEndTime)
      };

      // Validate date is within range
      if (!isDateInRange(currentDate, eventStartDate, eventEndDate)) {
        alert('Please select a date within the event timeframe');
        return;
      }

      // Validate times
      if (tempStartTime >= tempEndTime) {
        alert('End time must be after start time');
        return;
      }

      // Additional validations for event boundaries
      if (isSameDay(currentDate, eventStartDate) && tempStartTime < eventStartDate) {
        alert(`On the first day, time must be after ${eventStartDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
        return;
      }

      if (isSameDay(currentDate, eventEndDate) && tempEndTime > eventEndDate) {
        alert(`On the last day, time must be before ${eventEndDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
        return;
      }
    }

    onSlotsChange([...selectedSlots, newSlot]);
  };

  const removeTimeSlot = (index: number) => {
    const updatedSlots = [...selectedSlots];
    updatedSlots.splice(index, 1);
    onSlotsChange(updatedSlots);
  };

  // Render the date and time pickers based on platform
  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <WebDateTimePicker
          value={dateText}
          onChange={handleWebDateChange}
          min={formatDateForDisplay(eventStartDate)}
          max={formatDateForDisplay(eventEndDate)}
        />
      );
    } else {
      return (
        <>
          <Button 
            mode="outlined" 
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            {currentDate.toLocaleDateString()}
          </Button>
          
          {showDatePicker && (
            <DateTimePicker
              value={currentDate}
              mode="date"
              display="default"
              minimumDate={eventStartDate}
              maximumDate={eventEndDate}
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  // Preserve the time component when changing date
                  const newDate = new Date(selectedDate);
                  newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
                  setCurrentDate(newDate);

                  // Reset times to event start time for this day
                  const startTimeForSelectedDay = new Date(newDate);
                  startTimeForSelectedDay.setHours(eventStartDate.getHours(), eventStartDate.getMinutes());
                  setTempStartTime(startTimeForSelectedDay);

                  const endTimeForSelectedDay = new Date(newDate);
                  endTimeForSelectedDay.setHours(eventStartDate.getHours() + 1, eventStartDate.getMinutes());
                  setTempEndTime(endTimeForSelectedDay);
                }
              }}
            />
          )}
        </>
      );
    }
  };

  const renderStartTimePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <TextInput
          label="Start Time (HH:MM)"
          value={startTimeText}
          onChangeText={handleWebStartTimeChange}
          style={styles.webInput}
          placeholder="HH:MM"
          keyboardType="default"
          mode="outlined"
          right={<TextInput.Icon icon="clock-outline" />}
        />
      );
    } else {
      return (
        <>
          <Button 
            mode="outlined" 
            onPress={() => setShowStartTimePicker(true)}
            style={styles.timeButton}
          >
            {tempStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Button>
          
          {showStartTimePicker && (
            <DateTimePicker
              value={tempStartTime}
              mode="time"
              display="default"
              onChange={(_, selectedTime) => {
                setShowStartTimePicker(false);
                if (selectedTime) {
                  const newTime = new Date(selectedTime);
                  const newStartTime = new Date(currentDate);
                  newStartTime.setHours(newTime.getHours(), newTime.getMinutes());
                  setTempStartTime(newStartTime);
                }
              }}
            />
          )}
        </>
      );
    }
  };

  const renderEndTimePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <TextInput
          label="End Time (HH:MM)"
          value={endTimeText}
          onChangeText={handleWebEndTimeChange}
          style={styles.webInput}
          placeholder="HH:MM"
          keyboardType="default"
          mode="outlined"
          right={<TextInput.Icon icon="clock-outline" />}
        />
      );
    } else {
      return (
        <>
          <Button 
            mode="outlined" 
            onPress={() => setShowEndTimePicker(true)}
            style={styles.timeButton}
          >
            {tempEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Button>
          
          {showEndTimePicker && (
            <DateTimePicker
              value={tempEndTime}
              mode="time"
              display="default"
              onChange={(_, selectedTime) => {
                setShowEndTimePicker(false);
                if (selectedTime) {
                  const newTime = new Date(selectedTime);
                  const newEndTime = new Date(currentDate);
                  newEndTime.setHours(newTime.getHours(), newTime.getMinutes());
                  setTempEndTime(newEndTime);
                }
              }}
            />
          )}
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Select Your Availability</Title>
      
      {Platform.OS === 'web' && debugInfo ? (
        <Text style={styles.debugInfo}>{debugInfo}</Text>
      ) : null}
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.label}>Select Date:</Text>
          {renderDatePicker()}
          
          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.label}>Start Time:</Text>
              {renderStartTimePicker()}
            </View>
            
            <View style={styles.timeColumn}>
              <Text style={styles.label}>End Time:</Text>
              {renderEndTimePicker()}
            </View>
          </View>
          
          <Button 
            mode="contained" 
            onPress={addTimeSlot}
            style={styles.addButton}
            icon="plus"
          >
            Add Time Slot
          </Button>
        </Card.Content>
      </Card>

      <Text style={styles.selectedTitle}>Selected Time Slots</Text>
      <ScrollView style={styles.selectedSlotsContainer}>
        {selectedSlots.length === 0 ? (
          <Text style={styles.noSlotsText}>No time slots added yet.</Text>
        ) : (
          selectedSlots.map((slot, index) => {
            const date = new Date(slot.date);
            const startTime = new Date(`${slot.date}T${slot.startTime}`);
            const endTime = new Date(`${slot.date}T${slot.endTime}`);
            return (
              <Card key={index} style={styles.slotCard}>
                <Card.Content style={styles.slotContent}>
                  <View style={styles.slotInfo}>
                    <Text style={styles.slotDate}>
                      {date.toLocaleDateString()} 
                    </Text>
                    <Text style={styles.slotTime}>
                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeTimeSlot(index)}>
                    <MaterialCommunityIcons name="delete" size={24} color="#e74c3c" />
                  </TouchableOpacity>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  dateButton: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeColumn: {
    flex: 1,
    marginRight: 8,
  },
  timeButton: {
    marginBottom: 8,
  },
  addButton: {
    marginTop: 8,
  },
  selectedTitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  selectedSlotsContainer: {
    maxHeight: 200,
  },
  noSlotsText: {
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  slotCard: {
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotInfo: {
    flex: 1,
  },
  slotDate: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  slotTime: {
    fontSize: 13,
    color: '#555',
  },
  webInput: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  debugInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  }
});

export default TimeSlotPicker;