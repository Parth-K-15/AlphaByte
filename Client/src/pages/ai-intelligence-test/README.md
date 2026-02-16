# AI Participation Intelligence - Test Implementation

## 📋 Overview

This directory contains a complete frontend implementation of the **AI Participation Intelligence** feature. It demonstrates predictive analytics for event participation using a weighted AI model with dummy data.

## 🎯 Features Implemented

### 1. **Monthly Participation Trends** (`ParticipationChart.jsx`)
- Bar chart showing registrations, attendance, and certifications over 5 months
- Summary statistics cards
- Interactive tooltips with detailed metrics

### 2. **Event Type Performance Analysis** (`AttendanceRateChart.jsx`)
- Comparative bar chart for different event types (Workshop, Seminar, Hackathon, etc.)
- Color-coded bars for visual distinction
- Individual event type cards with statistics

### 3. **Top Contributors Leaderboard** (`TopContributors.jsx`)
- Ranked list of students by certification count
- Engagement level indicators (color-coded)
- Medal emojis for top 3 performers
- Summary statistics

### 4. **AI Drop-off Predictor** (`DropoffPredictor.jsx`)
- Interactive event selector for upcoming events
- Real-time prediction calculation
- Risk level assessment (LOW/MEDIUM/HIGH)
- Detailed breakdown of AI model components
- Individual student predictions
- AI-generated recommendations

## 🧠 AI Prediction Model

The drop-off predictor uses a **weighted multi-factor model**:

```
no_show_probability = 
  (1 - student_avg_attendance_rate) × 0.4 +
  (event_type_no_show_rate) × 0.3 +
  min(days_before_event / 30, 1) × 0.2 +
  (student_recent_no_shows / 5) × 0.1
```

### Weight Distribution:
- **40%** - Student's historical attendance pattern
- **30%** - Event type no-show statistics
- **20%** - Registration timing (early vs late)
- **10%** - Recent behavior trends (last 5 events)

## 📁 File Structure

```
ai-intelligence-test/
├── AIParticipationTest.jsx          # Main page component
├── dummyData.js                     # Dummy participation data
├── README.md                        # This file
└── components/
    ├── ParticipationChart.jsx       # Monthly trends chart
    ├── AttendanceRateChart.jsx      # Event type performance
    ├── TopContributors.jsx          # Leaderboard component
    └── DropoffPredictor.jsx         # AI prediction interface
```

## 🔧 Tech Stack

- **React 19** - Component framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Router v7** - Routing

## 🚀 Usage

### Accessing the Page

Navigate to: `/admin/ai-test`

The route is protected and only accessible to users with the `ADMIN` role.

### Testing Predictions

1. Select an upcoming event from the dropdown
2. Click "Run AI Prediction" button
3. View the predicted no-show rate and risk level
4. Expand "Individual Student Predictions" to see per-student analysis
5. Review AI-generated recommendations

## 📊 Dummy Data

The implementation uses comprehensive dummy data:

- **8 students** with detailed participation history
- **29 past events** across 6 event types
- **5 months** of historical data (Sep 2025 - Jan 2026)
- **4 upcoming events** for prediction testing
- Event type no-show rates based on realistic patterns

## 🔄 Backend Integration (Future)

To connect to real backend:

### Step 1: Create API Endpoints

```javascript
// Server/routes/ai-intelligence.js
router.get('/api/ai/participation-stats', getParticipationStats);
router.get('/api/ai/attendance-by-event-type', getAttendanceByEventType);
router.get('/api/ai/top-contributors', getTopContributors);
router.post('/api/ai/predict-dropoff', predictDropoff);
```

### Step 2: Replace Dummy Data Imports

```javascript
// Before (dummy data)
import { monthlyStats, students } from './dummyData';

// After (API calls)
const { data: monthlyStats } = useQuery('monthlyStats', fetchMonthlyStats);
const { data: students } = useQuery('students', fetchStudents);
```

### Step 3: Add Database Models

Create a `Participation` model in `Server/models/` to track:
- Student registrations
- Attendance records
- Certification status
- Timestamps

## 🎨 Customization

### Modifying Prediction Weights

Edit `Client/src/utils/aiPrediction.js`:

```javascript
const studentAttendanceComponent = (1 - student.avgAttendanceRate) * 0.4;  // Adjust weight
const eventTypeComponent = eventTypeNoShowRate * 0.3;                      // Adjust weight
const timingComponent = Math.min(daysBeforeEvent / 30, 1) * 0.2;          // Adjust weight
const recentBehaviorComponent = (recentNoShows / 5) * 0.1;                // Adjust weight
```

### Adding New Event Types

Update `dummyData.js`:

```javascript
export const eventTypes = {
  WORKSHOP: 'Workshop',
  SEMINAR: 'Seminar',
  // Add new type here
  BOOTCAMP: 'Bootcamp'
};

export const eventTypeNoShowRates = {
  // Add corresponding no-show rate
  [eventTypes.BOOTCAMP]: 0.12
};
```

## 📈 Performance Considerations

- Charts use `ResponsiveContainer` for mobile-friendly rendering
- Student predictions are limited to top 10 by default (expandable)
- Dummy data is loaded once on component mount
- Memoization recommended for production (React.memo, useMemo)

## 🧪 Testing Checklist

- [x] Charts render correctly on desktop
- [x] Charts render correctly on mobile
- [x] Predictions calculate accurately
- [x] Risk levels display with correct colors
- [x] Individual student predictions expand/collapse
- [x] Recommendations generate based on risk level
- [x] No console errors or warnings
- [x] No linting errors

## 🔮 Future Enhancements

1. **Machine Learning Integration**
   - Python microservice with TensorFlow/scikit-learn
   - Model training on historical data
   - Real-time model updates

2. **Advanced Analytics**
   - Demographic-based predictions
   - Time-of-day impact analysis
   - Weather/events correlation

3. **Automated Actions**
   - Email reminders to high-risk students
   - SMS notifications
   - Calendar invites

4. **A/B Testing**
   - Test intervention strategies
   - Measure impact on attendance
   - Optimize recommendation algorithms

5. **Real-time Dashboard**
   - WebSocket integration
   - Live attendance tracking
   - Instant notification system

## 📝 Notes

- This is an MVP implementation for demonstration purposes
- All data is currently frontend-only (no API calls)
- Prediction accuracy will improve with real historical data
- Weights in the AI model may need tuning based on actual patterns

## 🤝 Contributing

When adding features or making changes:

1. Maintain the dummy data structure to match future API responses
2. Keep components modular and reusable
3. Document any new prediction factors
4. Update this README with changes

## 📧 Support

For questions or issues, contact the development team or create an issue in the project repository.

---

**Status**: ✅ MVP Complete - Ready for Testing
**Last Updated**: February 15, 2026
**Version**: 1.0.0
