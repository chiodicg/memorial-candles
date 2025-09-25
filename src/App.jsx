import { useState, useEffect, useCallback, useRef } from 'react';
import StarryBackground from './components/StarryBackground';
import Candle from './components/Candle';
import gistService from './services/gistService';

function App() {
  const [candles, setCandles] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('disconnected'); // 'connected', 'syncing', 'disconnected', 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const isUpdatingRef = useRef(false); // Prevent conflicts during local updates

  // Smart merge function to handle remote updates
  const mergeRemoteCandles = useCallback((remoteCandles, timestamp) => {
    if (isUpdatingRef.current) {
      // Skip merge if we're currently updating to avoid conflicts
      return;
    }

    setCandles(currentCandles => {
      // Simple merge strategy: use remote data but preserve any local changes
      // In a more sophisticated app, you might want to implement conflict resolution
      const merged = [...remoteCandles];
      
      // Update nextId to be higher than any existing ID
      if (merged.length > 0) {
        const maxId = Math.max(...merged.map(candle => candle.id));
        setNextId(maxId + 1);
      }
      
      return merged;
    });

    setLastSyncTime(new Date(timestamp));
    setSyncStatus('connected');
  }, []);

  // Handle polling updates
  const handlePollingUpdate = useCallback((remoteCandles, timestamp) => {
    setSyncStatus('syncing');
    setTimeout(() => {
      mergeRemoteCandles(remoteCandles, timestamp);
    }, 100); // Small delay to show syncing status
  }, [mergeRemoteCandles]);

  // Load candles from Gist on app initialization and start polling
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSyncStatus('syncing');
        
        const savedCandles = await gistService.loadCandles();
        
        if (savedCandles.length > 0) {
          setCandles(savedCandles);
          // Set nextId to be higher than any existing ID
          const maxId = Math.max(...savedCandles.map(candle => candle.id));
          setNextId(maxId + 1);
        }

        // Start polling for real-time updates
        gistService.startPolling(handlePollingUpdate, 3000);
        setSyncStatus('connected');
        setLastSyncTime(new Date());
        
      } catch (err) {
        console.error('Failed to load candles:', err);
        setError('Failed to load saved candles. Starting fresh.');
        setSyncStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // Cleanup polling on unmount
    return () => {
      gistService.stopPolling(handlePollingUpdate);
    };
  }, [handlePollingUpdate]);

  const addCandle = async () => {
    // Set updating flag to prevent conflicts
    isUpdatingRef.current = true;
    setSyncStatus('syncing');

    // Generate random position for new candle
    const x = Math.random() * (window.innerWidth - 100) + 50;
    const y = Math.random() * (window.innerHeight - 200) + 100;
    
    const newCandle = {
      id: nextId,
      x,
      y,
      name: '',
    };
    
    // Update local state immediately for better UX
    const updatedCandles = [...candles, newCandle];
    setCandles(updatedCandles);
    setNextId(nextId + 1);

    // Persist to Gist
    try {
      await gistService.addCandle(candles, newCandle);
      setSyncStatus('connected');
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to save new candle:', err);
      setError('Failed to save candle. Changes may not persist.');
      setSyncStatus('error');
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const updateCandleName = async (id, name) => {
    isUpdatingRef.current = true;
    setSyncStatus('syncing');

    // Update local state immediately
    const updatedCandles = candles.map(candle => 
      candle.id === id ? { ...candle, name } : candle
    );
    setCandles(updatedCandles);

    // Persist to Gist
    try {
      await gistService.updateCandle(candles, id, { name });
      setSyncStatus('connected');
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to update candle name:', err);
      setError('Failed to save name change. Changes may not persist.');
      setSyncStatus('error');
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const updateCandlePosition = async (id, x, y) => {
    isUpdatingRef.current = true;

    // Update local state immediately
    const updatedCandles = candles.map(candle => 
      candle.id === id ? { ...candle, x, y } : candle
    );
    setCandles(updatedCandles);

    // Persist to Gist (debounced to avoid too many API calls)
    try {
      await gistService.updateCandle(candles, id, { x, y });
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to update candle position:', err);
      // Don't show error for position updates as they're frequent
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const removeCandle = async (id) => {
    isUpdatingRef.current = true;
    setSyncStatus('syncing');

    // Update local state immediately
    const updatedCandles = candles.filter(candle => candle.id !== id);
    setCandles(updatedCandles);

    // Persist to Gist
    try {
      await gistService.removeCandle(candles, id);
      setSyncStatus('connected');
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to remove candle:', err);
      setError('Failed to remove candle. Changes may not persist.');
      setSyncStatus('error');
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const dismissError = () => {
    setError(null);
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'connected': return 'text-green-400';
      case 'syncing': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'connected': return 'Connected';
      case 'syncing': return 'Syncing...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen overflow-hidden relative flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading memorial candles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {/* Starry background */}
      <StarryBackground />
      
      {/* Sync status indicator */}
      <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-xs">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-green-400' : syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className={getSyncStatusColor()}>{getSyncStatusText()}</span>
        </div>
        {lastSyncTime && (
          <div className="text-gray-400 text-xs mt-1">
            Last sync: {lastSyncTime.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {/* Error notification */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button 
              onClick={dismissError}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="relative z-20 text-center pt-8 px-4">
        <h1 className="text-white text-2xl md:text-4xl font-bold mb-2 drop-shadow-lg">
          Memorial Candles
        </h1>
        <p className="text-white text-sm md:text-lg opacity-90 mb-6 drop-shadow-md">
          Light a candle in memory of precious little ones.
        </p>
      </div>

      {/* Add candle button */}
      <div className="relative z-20 text-center mb-8">
        <button
          onClick={addCandle}
          className="bg-gradient-to-r from-pink-400 to-blue-500 hover:from-pink-500 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 text-sm md:text-base"
        >
          Light a Candle
        </button>
      </div>

      {/* Instructions */}
      {candles.length === 0 && (
        <div className="relative z-20 text-center px-4">
          <p className="text-white text-white text-xs md:text-sm opacity-75 drop-shadow-md">
            Click the button above to light your first candle
          </p>
        </div>
      )}

      {candles.length > 0 && (
        <div className="relative z-20 text-center px-4 mb-4">
          <p className="body-text text-white text-xs opacity-75 drop-shadow-md">
            Drag candles to move them • Click names to edit • Real-time sync enabled
          </p>
        </div>
      )}

      {/* Candles */}
      {candles.map((candle) => (
        <Candle
          key={candle.id}
          id={candle.id}
          initialX={candle.x}
          initialY={candle.y}
          name={candle.name}
          onNameChange={updateCandleName}
          onPositionChange={updateCandlePosition}
          onRemove={removeCandle}
        />
      ))}

    </div>
  );
}

export default App;
