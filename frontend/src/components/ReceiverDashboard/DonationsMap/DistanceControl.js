import React from 'react';
import { Maximize2 } from 'lucide-react';
import './DistanceControl.css';

/**
 * Distance radius control component.
 * Allows user to adjust the search radius with predefined options.
 *
 * @param {Object} props
 * @param {number} props.distance - Current distance in km
 * @param {Function} props.onChange - Callback when distance changes
 * @param {number} props.min - Minimum distance (default: 1)
 * @param {number} props.max - Maximum distance (default: 50)
 */
const DistanceControl = ({ distance = 10, onChange, min = 1, max = 50 }) => {
  const presets = [2, 5, 10, 25, 50];

  const handleSliderChange = e => {
    onChange(parseInt(e.target.value));
  };

  const handlePresetClick = preset => {
    onChange(preset);
  };

  return (
    <div className="distance-control">
      <div className="distance-control-header">
        <Maximize2 size={16} />
        <span className="distance-label">Distance Radius</span>
        <span className="distance-value">{distance}km</span>
      </div>

      {/* Slider */}
      <div className="distance-slider-container">
        <input
          type="range"
          className="distance-slider"
          min={min}
          max={max}
          value={distance}
          onChange={handleSliderChange}
          style={{
            background: `linear-gradient(to right, #1B4965 0%, #1B4965 ${
              ((distance - min) / (max - min)) * 100
            }%, #e9ecef ${((distance - min) / (max - min)) * 100}%, #e9ecef 100%)`,
          }}
        />
        <div className="slider-labels">
          <span>{min}km</span>
          <span>{max}km</span>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="distance-presets">
        {presets.map(preset => (
          <button
            key={preset}
            className={`preset-btn ${distance === preset ? 'active' : ''}`}
            onClick={() => handlePresetClick(preset)}
          >
            {preset}km
          </button>
        ))}
      </div>
    </div>
  );
};

export default DistanceControl;
