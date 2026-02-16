import React from 'react';
import ParticipationChart from './components/ParticipationChart';
import AttendanceRateChart from './components/AttendanceRateChart';
import TopContributors from './components/TopContributors';
import DropoffPredictor from './components/DropoffPredictor';
import { 
  monthlyStats, 
  calculateEventTypeStats, 
  getTopContributors 
} from './dummyData';

/**
 * AIParticipationTest Page Component
 * 
 * Demo page for AI Participation Intelligence feature
 * Uses dummy data to showcase predictive analytics capabilities
 * 
 * Features:
 * - Monthly participation trends visualization
 * - Event-type performance comparison
 * - Top contributors leaderboard
 * - AI-powered drop-off prediction model
 */
const AIParticipationTest = () => {
  // Calculate event type statistics
  const eventTypeStats = calculateEventTypeStats();
  
  // Get top 5 contributors
  const topContributors = getTopContributors(5);
  
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            🤖 AI Participation Intelligence Dashboard
          </h1>
          <p className="text-blue-100">
            Advanced analytics and predictive insights for event participation
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              🧪 Test Mode - Using Dummy Data
            </span>
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              📊 Real-time Analytics
            </span>
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              🔮 AI Predictions
            </span>
          </div>
        </div>
      </div>
      
      {/* Main content grid */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Monthly participation chart - Full width */}
        <div className="w-full">
          <ParticipationChart data={monthlyStats} />
        </div>
        
        {/* Two column layout for medium screens and up */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Event type performance */}
          <div>
            <AttendanceRateChart data={eventTypeStats} />
          </div>
          
          {/* Right column: Top contributors */}
          <div>
            <TopContributors contributors={topContributors} />
          </div>
        </div>
        
        {/* AI Predictor - Full width */}
        <div className="w-full">
          <DropoffPredictor />
        </div>
        
        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📚</div>
              <div>
                <div className="text-sm text-gray-500">Data Source</div>
                <div className="font-semibold text-gray-800">Dummy Data</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Currently using simulated data for testing. Backend integration pending.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">🧠</div>
              <div>
                <div className="text-sm text-gray-500">AI Model</div>
                <div className="font-semibold text-gray-800">Weighted Prediction</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Multi-factor model with 40% student history, 30% event type, 20% timing, 10% recent behavior.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">⚡</div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="font-semibold text-gray-800">MVP Ready</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Frontend implementation complete. Ready for backend API integration.
            </p>
          </div>
        </div>
        
        {/* Technical details accordion */}
        <details className="bg-white rounded-lg shadow-md p-6">
          <summary className="cursor-pointer font-semibold text-gray-800 mb-4">
            🔧 Technical Implementation Details
          </summary>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <div className="font-semibold text-gray-700 mb-2">Tech Stack:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>React 19 with Vite</li>
                <li>Tailwind CSS for styling</li>
                <li>Recharts for data visualization</li>
                <li>React Router v7 for navigation</li>
              </ul>
            </div>
            
            <div>
              <div className="font-semibold text-gray-700 mb-2">AI Prediction Formula:</div>
              <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                no_show_rate = <br/>
                &nbsp;&nbsp;(1 - student_attendance_rate) × 0.4 +<br/>
                &nbsp;&nbsp;(event_type_no_show_rate) × 0.3 +<br/>
                &nbsp;&nbsp;min(days_before / 30, 1) × 0.2 +<br/>
                &nbsp;&nbsp;(recent_no_shows / 5) × 0.1
              </div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-700 mb-2">Data Structure:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>8 dummy students with participation history</li>
                <li>29 past events across 6 event types</li>
                <li>5 months of historical data (Sep 2025 - Jan 2026)</li>
                <li>4 upcoming events for prediction testing</li>
              </ul>
            </div>
            
            <div>
              <div className="font-semibold text-gray-700 mb-2">Backend Integration Plan:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Replace dummy data with API calls to Server/routes/</li>
                <li>Add Participation model to Server/models/</li>
                <li>Create AI intelligence controller in Server/controllers/</li>
                <li>Implement caching for performance</li>
                <li>Add real-time WebSocket updates (Phase 2)</li>
              </ul>
            </div>
            
            <div>
              <div className="font-semibold text-gray-700 mb-2">Future Enhancements:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Machine learning model training (Python/TensorFlow)</li>
                <li>Personalized student recommendations</li>
                <li>Automated email alerts for high-risk no-shows</li>
                <li>A/B testing for intervention strategies</li>
                <li>Integration with calendar systems</li>
              </ul>
            </div>
          </div>
        </details>
      </div>
      
      {/* Footer note */}
      <div className="max-w-7xl mx-auto mt-8 text-center text-sm text-gray-500">
        <p>
          💡 This is a demo version using dummy data. 
          All predictions and statistics are for illustration purposes only.
        </p>
      </div>
    </div>
  );
};

export default AIParticipationTest;
