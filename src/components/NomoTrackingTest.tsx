import { useEffect, useState } from 'react';
import { NomoTracking } from '@/plugins/nomo-tracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const NomoTrackingTest = () => {
  const [stats, setStats] = useState<any>(null);
  const [streak, setStreak] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [simulationData, setSimulationData] = useState<any>(null);

  const testPlugin = async () => {
    try {
      setError('');
      
      // Test permissions
      const { granted } = await NomoTracking.requestPermissions();
      console.log('Permissions granted:', granted);
      
      // Test getting stats
      const todayStats = await NomoTracking.getTodayStats();
      setStats(todayStats);
      console.log('Today stats:', todayStats);
      
      // Test getting streak
      const { streak: currentStreak } = await NomoTracking.getCurrentStreak();
      setStreak(currentStreak);
      console.log('Current streak:', currentStreak);
      
    } catch (err: any) {
      setError(err.message || 'Plugin test failed');
      console.error('Plugin test error:', err);
    }
  };

  const simulate1Hour = () => {
    const oneHourData = {
      totalTime: 3600, // 1 hour in seconds
      sessionCount: 3,
      longestSession: 1800, // 30 minutes
      petsEarned: Math.floor(60 / 30), // 2 pets (1 every 30 minutes)
      points: 360 // 6 points per minute
    };
    setSimulationData({ ...oneHourData, type: '1 Hour Simulation' });
    console.log('1 Hour simulation:', oneHourData);
  };

  const simulate10Hours = () => {
    const tenHourData = {
      totalTime: 36000, // 10 hours in seconds
      sessionCount: 8,
      longestSession: 7200, // 2 hours
      petsEarned: Math.floor(600 / 30), // 20 pets
      points: 3600 // 6 points per minute
    };
    setSimulationData({ ...tenHourData, type: '10 Hour Simulation' });
    console.log('10 Hour simulation:', tenHourData);
  };

  const clearSimulation = () => {
    setSimulationData(null);
  };

  useEffect(() => {
    testPlugin();
  }, []);

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Nomo Tracking Plugin Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testPlugin}>Test Plugin</Button>
          <Button onClick={simulate1Hour} variant="outline">Simulate 1 Hour</Button>
          <Button onClick={simulate10Hours} variant="outline">Simulate 10 Hours</Button>
          {simulationData && <Button onClick={clearSimulation} variant="ghost">Clear</Button>}
        </div>
        
        {error && (
          <div className="text-red-500 p-2 bg-red-50 rounded">
            Error: {error}
          </div>
        )}
        
        {stats && (
          <div className="space-y-2 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold">Today's Actual Stats:</h3>
            <p>Total Time: {Math.round(stats.totalTime / 60)} minutes</p>
            <p>Session Count: {stats.sessionCount}</p>
            <p>Longest Session: {Math.round(stats.longestSession / 60)} minutes</p>
          </div>
        )}
        
        {simulationData && (
          <div className="space-y-2 p-4 bg-green-50 rounded border-2 border-green-200">
            <h3 className="font-semibold text-green-800">{simulationData.type}</h3>
            <p>Total Time: {Math.round(simulationData.totalTime / 60)} minutes</p>
            <p>Session Count: {simulationData.sessionCount}</p>
            <p>Longest Session: {Math.round(simulationData.longestSession / 60)} minutes</p>
            <p className="text-green-700 font-medium">Pets Earned: {simulationData.petsEarned}</p>
            <p className="text-green-700 font-medium">Points: {simulationData.points}</p>
            <div className="text-xs text-green-600 mt-2">
              <p>• 1 pet earned every 30 minutes</p>
              <p>• 6 points earned per minute of usage</p>
            </div>
          </div>
        )}
        
        <div>
          <h3 className="font-semibold">Current Streak: {streak} days</h3>
        </div>
      </CardContent>
    </Card>
  );
};