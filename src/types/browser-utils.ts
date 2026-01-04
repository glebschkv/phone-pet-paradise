// Browser Utility Types
// Consolidated type definitions for browser-specific utilities

/**
 * Extended Window interface with webkit AudioContext support
 * Used for cross-browser audio compatibility
 */
export interface WebkitWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Audio nodes used for sound synthesis
 */
export interface AudioNodes {
  source?: AudioBufferSourceNode | OscillatorNode;
  gain?: GainNode;
  filter?: BiquadFilterNode;
  oscillator2?: OscillatorNode;
  gain2?: GainNode;
}
