import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatStatus, SignalingMessage } from '../types';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = () => {
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize media and connection
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, audio: true 
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  // Start the peer connection
  const startConnection = useCallback(async () => {
    // Make sure we have local media
    const stream = localStream || await initializeMedia();
    
    // Create and setup WebSocket connection
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/signaling`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      setStatus('searching');
      ws.send(JSON.stringify({ type: 'ready' }));
    };
    
    ws.onmessage = async (event) => {
      const message: SignalingMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'offer':
          await handleOffer(message.offer);
          break;
        case 'answer':
          await handleAnswer(message.answer);
          break;
        case 'candidate':
          await handleCandidate(message.candidate);
          break;
        case 'leave':
          handleLeave();
          break;
      }
    };
    
    ws.onclose = () => {
      handleLeave();
    };
    
    // Create peer connection
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;
    
    // Add local stream tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setStatus('connected');
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'candidate',
          candidate: event.candidate
        }));
      }
    };
    
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleLeave();
      }
    };
    
    return pc;
  }, [localStream, initializeMedia]);
  
  // Handle an incoming offer
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnectionRef.current || await startConnection();
      setStatus('connecting');
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'answer',
          answer
        }));
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      handleLeave();
    }
  };
  
  // Handle an incoming answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      handleLeave();
    }
  };
  
  // Handle an incoming ICE candidate
  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };
  
  // Create an offer to start a connection
  const createOffer = async () => {
    try {
      const pc = peerConnectionRef.current || await startConnection();
      setStatus('connecting');
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          offer
        }));
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      handleLeave();
    }
  };
  
  // Handle leaving/stopping the connection
  const handleLeave = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setStatus('disconnected');
    setRemoteStream(null);
  };
  
  // Start a new chat
  const startChat = useCallback(async () => {
    try {
      await startConnection();
    } catch (error) {
      console.error('Failed to start chat:', error);
      setStatus('disconnected');
    }
  }, [startConnection]);
  
  // Stop the current chat
  const stopChat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave' }));
    }
    handleLeave();
    setStatus('idle');
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      stopChat();
    };
  }, [localStream, stopChat]);
  
  return {
    status,
    localStream,
    remoteStream,
    startChat,
    stopChat,
    createOffer
  };
};