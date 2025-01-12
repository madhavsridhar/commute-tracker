import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, Calendar, ArrowRight, AlertCircle } from 'lucide-react';

const CommuteDashboard = () => {
  const [commuteData, setCommuteData] = useState([]);
  const [weeklyAverages, setWeeklyAverages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replace with your actual addresses
  const SOURCE = "123 Main St, City, State";
  const DESTINATION = "456 Work Ave, City, State";

  // Replace with your backend URL
  const API_BASE_URL = 'http://localhost:3000/api';

  // ... (keep all the fetch functions and useEffect the same)

  // if (isLoading) {
  //   return <div className="flex justify-center items-center h-screen">Loading...</div>;
  // }

  return (
    <div className="p-4 space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center space-x-2 text-lg font-semibold">
        <div className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          {SOURCE}
        </div>
        <ArrowRight className="w-5 h-5" />
        <div>{DESTINATION}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Card */}
        <div className="border rounded-lg shadow bg-white">
          <div className="border-b p-4">
            <div className="flex items-center text-lg font-semibold">
              <Clock className="w-5 h-5 mr-2" />
              Today's Commute Times
            </div>
          </div>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commuteData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="duration" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Card */}
        <div className="border rounded-lg shadow bg-white">
          <div className="border-b p-4">
            <div className="flex items-center text-lg font-semibold">
              <Calendar className="w-5 h-5 mr-2" />
              Weekly Averages
            </div>
          </div>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommuteDashboard;