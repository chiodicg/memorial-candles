import { useState, useEffect, useRef } from 'react';
import StarryBackground from './components/StarryBackground';
import Candle from './components/Candle';
import gistService from './services/gistService';

function App() {
  const [candles, setCandles] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  
  // Simple flag to prevent polling conflicts during user actions
  const skipNextPoll = useRef(false);
  const pollingInterval = useRef(null);

  // Simple polling function - just load and update
  const pollForUpdates = async () => {
    // Skip this poll if we just made a change
    if (skipNextPoll.current) {
      skipNextPoll.current = false;
      return;
    }

    try {
      const remoteCandles = await gistService.loadCandles();
      
      // Only update if we actually have data and it's different
      if (remoteCandles && remoteCandles.length >= 0) {
        setCandles(currentCandles => {
          // Quick check if data is different
          if (JSON.stringify(currentCandles) !== JSON.stringify(remoteCandles)) {
            // Update nextId based on remote data
            if (remoteCandles.length > 0) {
              const maxId = Math.max(...remoteCandles.map(candle => candle.id));
              setNextId(maxId + 1);
            }
            setLastSync(new Date());
            return remoteCandles;
          }
          return currentCandles;
        });
      }
    } catch (err) {
      console.error('Polling failed:', err);
      // Don't show errors for polling failures to avoid spam
    }
  };

  // Start polling every second
  useEffect(() => {
    // Load initial data
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const savedCandles = await gistService.loadCandles();
        
        if (savedCandles && savedCandles.length > 0) {
          setCandles(savedCandles);
          const maxId = Math.max(...savedCandles.map(candle => candle.id));
          setNextId(maxId + 1);
        }
        setLastSync(new Date());
      } catch (err) {
        console.error('Failed to load initial candles:', err);
        setError('Failed to load saved candles. Starting fresh.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // Start simple polling every 1 second
    pollingInterval.current = setInterval(pollForUpdates, 1000);

    // Cleanup
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []); // Empty dependency array - only run once

  const addCandle = async () => {
    // Skip next poll since we're making a change
    skipNextPoll.current = true;

    const x = Math.random() * (window.innerWidth - 100) + 50;
    const y = Math.random() * (window.innerHeight - 200) + 100;

    const newCandle = {
      id: nextId,
      x,
      y,
      name: '',
    };

    // Update local state immediately
    const updatedCandles = [...candles, newCandle];
    setCandles(updatedCandles);
    setNextId(nextId + 1);

    // Save to gist
    try {
      // Get latest data first, then add our candle
      const latestCandles = await gistService.loadCandles();
      const mergedCandles = [...latestCandles, newCandle];
      await gistService.saveCandles(mergedCandles);
      
      // Update our local state with the merged result
      setCandles(mergedCandles);
      const maxId = Math.max(...mergedCandles.map(c => c.id));
      setNextId(maxId + 1);
    } catch (err) {
      console.error('Failed to save new candle:', err);
      setError('Failed to save candle. Please try again.');
      // Reload from server to get back in sync
      try {
        const serverCandles = await gistService.loadCandles();
        setCandles(serverCandles);
      } catch (reloadErr) {
        console.error('Failed to reload candles after error:', reloadErr);
      }
    }
  };

  const updateCandleName = async (id, name) => {
    skipNextPoll.current = true;

    // Update locally first
    const updatedCandles = candles.map(candle =>
      candle.id === id ? { ...candle, name } : candle
    );
    setCandles(updatedCandles);

    // Save to gist
    try {
      const latestCandles = await gistService.loadCandles();
      const mergedCandles = latestCandles.map(candle =>
        candle.id === id ? { ...candle, name } : candle
      );
      await gistService.saveCandles(mergedCandles);
      setCandles(mergedCandles);
    } catch (err) {
      console.error('Failed to update candle name:', err);
      setError('Failed to save name change. Please try again.');
      // Reload from server
      try {
        const serverCandles = await gistService.loadCandles();
        setCandles(serverCandles);
      } catch (reloadErr) {
        console.error('Failed to reload after name update error:', reloadErr);
      }
    }
  };

  const updateCandlePosition = async (id, x, y) => {
    skipNextPoll.current = true;

    // Update locally first
    const updatedCandles = candles.map(candle =>
      candle.id === id ? { ...candle, x, y } : candle
    );
    setCandles(updatedCandles);

    // Save to gist (don't show errors for position updates as they're frequent)
    try {
      const latestCandles = await gistService.loadCandles();
      const mergedCandles = latestCandles.map(candle =>
        candle.id === id ? { ...candle, x, y } : candle
      );
      await gistService.saveCandles(mergedCandles);
      setCandles(mergedCandles);
    } catch (err) {
      console.error('Failed to update candle position:', err);
      // Silently reload from server for position updates
      try {
        const serverCandles = await gistService.loadCandles();
        setCandles(serverCandles);
      } catch (reloadErr) {
        console.error('Failed to reload after position update error:', reloadErr);
      }
    }
  };

  const removeCandle = async (id) => {
    skipNextPoll.current = true;

    // Update locally first
    const updatedCandles = candles.filter(candle => candle.id !== id);
    setCandles(updatedCandles);

    // Save to gist
    try {
      const latestCandles = await gistService.loadCandles();
      const mergedCandles = latestCandles.filter(candle => candle.id !== id);
      await gistService.saveCandles(mergedCandles);
      setCandles(mergedCandles);
    } catch (err) {
      console.error('Failed to remove candle:', err);
      setError('Failed to remove candle. Please try again.');
      // Reload from server
      try {
        const serverCandles = await gistService.loadCandles();
        setCandles(serverCandles);
      } catch (reloadErr) {
        console.error('Failed to reload after remove error:', reloadErr);
      }
    }
  };

  const dismissError = () => {
    setError(null);
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

      {/* Connection status indicator */}
      {lastSync && (
        <div className="fixed top-4 right-4 z-40 text-white text-xs opacity-70">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Last sync: {lastSync.toLocaleTimeString()}</span>
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
          <p className="text-white text-xs md:text-sm opacity-75 drop-shadow-md">
            Click the button above to light your first candle
          </p>
        </div>
      )}

      {candles.length > 0 && (
        <div className="relative z-20 text-center px-4 mb-4">
          <p className="text-white text-xs opacity-75 drop-shadow-md">
            Drag candles to move them • Click names to edit
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