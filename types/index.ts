export type SignalingMessage = 
  | { type: 'offer'; offer: RTCSessionDescriptionInit; }
  | { type: 'answer'; answer: RTCSessionDescriptionInit; }
  | { type: 'candidate'; candidate: RTCIceCandidateInit; }
  | { type: 'ready'; }
  | { type: 'leave'; };

export type ChatStatus = 'idle' | 'searching' | 'connecting' | 'connected' | 'disconnected';