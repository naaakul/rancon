"use client"

import React, { useRef, useEffect } from 'react';
import { useWebRTC } from '../lib/useWebRTC';
import { ChatStatus } from '../types';

const statusMessages: Record<ChatStatus, string> = {
  idle: 'Click "Start" to begin',
  searching: 'Looking for someone to chat with...',
  connecting: 'Connecting...',
  connected: 'Connected! Say hello!',
  disconnected: 'Disconnected'
};

const VideoChat: React.FC = () => {
  const { status, localStream, remoteStream, startChat, stopChat } = useWebRTC();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleStart = () => {
    startChat();
  };

  const handleStop = () => {
    stopChat();
  };

  const handleNext = () => {
    stopChat();
    startChat();
  };

  return (
    <div className="video-chat">
      <div className="status-bar">
        <div className="status-message">{statusMessages[status]}</div>
        <div className="controls">
          {status === 'idle' || status === 'disconnected' ? (
            <button onClick={handleStart}>Start</button>
          ) : (
            <>
              <button onClick={handleStop}>Stop</button>
              {status === 'connected' && <button onClick={handleNext}>Next</button>}
            </>
          )}
        </div>
      </div>
      
      <div className="video-container">
        <div className="video-wrapper local-video">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline
          />
          <div className="video-label">You</div>
        </div>
        
        <div className="video-wrapper remote-video">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
          />
          <div className="video-label">Stranger</div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;