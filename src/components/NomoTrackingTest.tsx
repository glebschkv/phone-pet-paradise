import { useEffect, useState } from 'react';
import { NomoTracking } from '@/plugins/nomo-tracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const NomoTrackingTest = () => {
  const [stats, setStats] = useState<any>(null);
  const [streak, setStreak] = useState<number>(0);
  const [error, setError] = useState<string>('');

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

  useEffect(() => {
    testPlugin();
  }, []);

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Nomo Tracking Plugin Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testPlugin}>Test Plugin</Button>
        
        {error && (
          <div className="text-red-500 p-2 bg-red-50 rounded">
            Error: {error}
          </div>
        )}
        
        {stats && (
          <div className="space-y-2">
            <h3 className="font-semibold">Today's Stats:</h3>
            <p>Total Time: {Math.round(stats.totalTime / 60)} minutes</p>
            <p>Session Count: {stats.sessionCount}</p>
            <p>Longest Session: {Math.round(stats.longestSession / 60)} minutes</p>
          </div>
        )}
        
        <div>
          <h3 className="font-semibold">Current Streak: {streak} days</h3>
        </div>
      </CardContent>
    </Card>
  );
};