import { useState, useRef, useEffect } from 'react';
import { CircleX  } from 'lucide-react';

const Candle = ({ id, initialX, initialY, name, onNameChange, onPositionChange, onRemove }) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name || '');
  const dragRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      
      // Keep candle within viewport bounds
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 120;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Notify parent of position change for persistence
      if (onPositionChange) {
        onPositionChange(id, position.x, position.y);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, position.x, position.y, onPositionChange, id]);

  const handleMouseDown = (e) => {
    if (isEditing) return;
    
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTouchStart = (e) => {
    if (isEditing) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;
    
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 120;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Notify parent of position change for persistence
    if (onPositionChange) {
      onPositionChange(id, position.x, position.y);
    }
  };

  const handleNameClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempName(name || '');
  };

  const handleNameSubmit = () => {
    onNameChange(id, tempName);
    setIsEditing(false);
  };

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempName(name || '');
    }
  };

  return (
    <div
      ref={dragRef}
      className={`absolute select-none cursor-move ${isDragging ? 'z-50' : 'z-10'} flex flex-col`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.1s ease',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Candle flame */}
      <div className="flame w-3 h-6 mx-auto mb-0.5 bg-gradient-to-t from-orange-400 via-yellow-400 to-yellow-200 rounded-full animate-pulse" 
           style={{
             background: 'radial-gradient(circle, #ffeb3b 0%, #ff9800 40%, #f44336 70%)',
             borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
             animation: 'flicker 1.5s infinite alternate'
           }} />
      
      {/* Candle body */}
      <div className="candle-body w-12 h-6 rounded-t-sm border border-yellow-400 shadow-lg relative" />
      
      {/* Candle base */}
      <div className="bg-gradient-to-b from-gray-300 to-gray-500 w-15 h-3 rounded-full mx-auto -mt-1 shadow-md" />
      
      {/* Name label */}
      <div className="mt-1 text-center">
        {isEditing ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyPress}
            className="font-semibold text-gray-400 text-s px-2 py-1 rounded border-none outline-none text-center w-20"
            autoFocus
            maxLength={15}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            onClick={handleNameClick}
            onMouseDown={(e) => e.stopPropagation()}
            className={`${name ? "font-semibold text-s" : "font-thin text-xs"} text-gray-400 px-2 py-1 rounded cursor-pointer transition-all min-h-6 flex items-center justify-center max-w-20 mx-auto`}
          >
            {name || 'Click to name'}
          </div>
        )}
      </div>
      
      {/* Remove button (appears on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="remove-candle"
          title="Remove candle"
          >
          <CircleX 
            className="text-gray-400 h-4"/>
      </button>
    </div>
  );
};

export default Candle;