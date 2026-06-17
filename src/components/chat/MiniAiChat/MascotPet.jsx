import React from 'react';
import viniIdle from '../../../assets/vini-mascot-idle.png';
import viniThinking from '../../../assets/vini-mascot-thinking.png';
import './MascotPet.css';

const ACTIVE_POSES = new Set(['thinking', 'typing']);

/**
 * Vini — V-Connect AI mascot.
 * @param {'idle'|'hover'|'thinking'|'typing'|'happy'|'open'} mood
 * @param {'fab'|'header'|'bubble'|'hero'} size
 */
const MascotPet = ({ mood = 'idle', size = 'fab', className = '' }) => {
  const imageSrc = ACTIVE_POSES.has(mood) ? viniThinking : viniIdle;

  return (
    <span
      className={[
        'mascot-pet',
        `mascot-pet--${size}`,
        `mascot-pet--${mood}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      <img className="mascot-pet__image" src={imageSrc} alt="" draggable="false" />
    </span>
  );
};

export default MascotPet;
