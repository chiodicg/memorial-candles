import { useState } from 'react';
import StarryBackground from './components/StarryBackground';
import Candle from './components/Candle';

function App() {
  const [candles, setCandles] = useState([]);
  const [nextId, setNextId] = useState(1);

  const addCandle = () => {
    // Generate random position for new candle
    const x = Math.random() * (window.innerWidth - 100) + 50;
    const y = Math.random() * (window.innerHeight - 200) + 100;
    
    const newCandle = {
      id: nextId,
      x,
      y,
      name: '',
    };
    
    setCandles([...candles, newCandle]);
    setNextId(nextId + 1);
  };

  const updateCandleName = (id, name) => {
    setCandles(candles.map(candle => 
      candle.id === id ? { ...candle, name } : candle
    ));
  };

  const removeCandle = (id) => {
    setCandles(candles.filter(candle => candle.id !== id));
  };

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {/* Starry background */}
      <StarryBackground />
      
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
          onRemove={removeCandle}
        />
      ))}

    </div>
  );
}

export default App;
