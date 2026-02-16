import React, { useState } from 'react';
import { 
  predictEventNoShowRate, 
  getRiskColorClass, 
  getRiskIcon,
  generateRecommendations 
} from '../../../utils/aiPrediction';
import { students, upcomingEvents } from '../dummyData';

/**
 * DropoffPredictor Component
 * Interactive predictor for event no-show rate using AI model
 */
const DropoffPredictor = () => {
  const [selectedEvent, setSelectedEvent] = useState(upcomingEvents[0]);
  const [prediction, setPrediction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Handle prediction calculation
  const handlePredict = () => {
    // For demo, randomly select some students as "registered"
    const numRegistered = selectedEvent.registered;
    const registeredStudents = students.slice(0, Math.min(numRegistered, students.length));
    
    const result = predictEventNoShowRate(
      registeredStudents,
      selectedEvent.type,
      selectedEvent.daysUntilEvent
    );
    
    setPrediction(result);
  };
  
  // Run prediction on component mount
  React.useEffect(() => {
    handlePredict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);
  
  const riskColors = prediction ? getRiskColorClass(prediction.riskLevel) : null;
  const riskIcon = prediction ? getRiskIcon(prediction.riskLevel) : '';
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        🤖 AI Drop-off Predictor
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Predict student no-show rate using machine learning model
      </p>
      
      {/* Event selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Upcoming Event:
        </label>
        <select
          value={upcomingEvents.indexOf(selectedEvent)}
          onChange={(e) => setSelectedEvent(upcomingEvents[e.target.value])}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {upcomingEvents.map((event, index) => (
            <option key={event.id} value={index}>
              {event.name} • {event.type} • {event.daysUntilEvent} days away
            </option>
          ))}
        </select>
      </div>
      
      {/* Event details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Event Type</div>
            <div className="font-semibold">{selectedEvent.type}</div>
          </div>
          <div>
            <div className="text-gray-500">Date</div>
            <div className="font-semibold">{selectedEvent.date}</div>
          </div>
          <div>
            <div className="text-gray-500">Days Until</div>
            <div className="font-semibold">{selectedEvent.daysUntilEvent} days</div>
          </div>
          <div>
            <div className="text-gray-500">Registered</div>
            <div className="font-semibold">{selectedEvent.registered} students</div>
          </div>
        </div>
      </div>
      
      {/* Prediction button */}
      <button
        onClick={handlePredict}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-4"
      >
        🔮 Run AI Prediction
      </button>
      
      {/* Prediction results */}
      {prediction && (
        <div className={`${riskColors.bg} ${riskColors.border} border-2 rounded-lg p-6 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl mb-2">{riskIcon}</div>
              <div className={`text-sm font-medium ${riskColors.text}`}>
                Risk Level: {prediction.riskLevel}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${riskColors.text}`}>
                {(prediction.avgNoShowProbability * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Predicted No-Show Rate</div>
            </div>
          </div>
          
          {/* Statistics grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white bg-opacity-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {prediction.totalRegistered}
              </div>
              <div className="text-xs text-gray-600">Registered</div>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {prediction.predictedNoShows}
              </div>
              <div className="text-xs text-gray-600">Predicted No-Shows</div>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {prediction.predictedAttendance}
              </div>
              <div className="text-xs text-gray-600">Expected Attendance</div>
            </div>
          </div>
          
          {/* AI Model explanation */}
          <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              📊 AI Model Breakdown:
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>• 40% weight: Student historical attendance patterns</div>
              <div>• 30% weight: Event type no-show statistics</div>
              <div>• 20% weight: Registration timing (early vs late)</div>
              <div>• 10% weight: Recent behavior trends (last 5 events)</div>
            </div>
          </div>
          
          {/* Recommendations */}
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              💡 AI Recommendations:
            </div>
            <ul className="space-y-1 text-xs text-gray-600">
              {generateRecommendations(prediction).map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Toggle detailed student predictions */}
      {prediction && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
          >
            {showDetails ? '▲ Hide' : '▼ Show'} Individual Student Predictions
          </button>
          
          {showDetails && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {prediction.studentPredictions.slice(0, 10).map((student) => (
                <div 
                  key={student.studentId}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex-1">
                    <div className="font-medium">{student.studentName}</div>
                    <div className="text-xs text-gray-500">
                      Historical: {(student.avgAttendanceRate * 100).toFixed(0)}% attendance
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      student.noShowProbability > 0.4 ? 'text-red-600' :
                      student.noShowProbability > 0.25 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {(student.noShowProbability * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">no-show risk</div>
                  </div>
                </div>
              ))}
              {prediction.studentPredictions.length > 10 && (
                <div className="text-xs text-gray-500 text-center py-2">
                  Showing top 10 of {prediction.studentPredictions.length} students
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DropoffPredictor;
