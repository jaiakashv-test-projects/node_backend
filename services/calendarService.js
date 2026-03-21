const axios = require('axios');

/**
 * Live Google Calendar Service
 * Fetches events from Google Calendar for context-aware demand insights.
 */
const getCalendarContext = async (dateString) => {
    try {
        const date = new Date(dateString);
        const day = date.getDay(); // 0 = Sunday, 6 = Saturday
        
        const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
        const calendarId = 'en.indian#holiday@group.v.calendar.google.com'; // Public Indian Holidays
        
        // Define range for the specific day
        const timeMin = new Date(date.setHours(0, 0, 0, 0)).toISOString();
        const timeMax = new Date(date.setHours(23, 59, 59, 999)).toISOString();

        let context = null;

        if (apiKey) {
            const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
            const response = await axios.get(url);
            
            if (response.data.items && response.data.items.length > 0) {
                const event = response.data.items[0];
                context = `Festival: ${event.summary} Rush`;
            }
        }

        // Check for weekends as fallback or additional context
        if (!context && (day === 0 || day === 6)) {
            context = "Weekend Surge";
        }

        return context;
    } catch (err) {
        console.error("Google Calendar API Error:", err.message);
        // Fallback to basic weekend logic if API fails
        const day = new Date(dateString).getDay();
        return (day === 0 || day === 6) ? "Weekend Surge" : null;
    }
};

module.exports = { getCalendarContext };
