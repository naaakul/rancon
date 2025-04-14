import React from 'react';
import Head from 'next/head';
import VideoChat from '../components/VideoChat';

const Home: React.FC = () => {
  return (
    <div className="container">
      <Head>
        <title>Omegle Clone</title>
        <meta name="description" content="Random video chat app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Random Video Chat</h1>
        <p>Chat with random strangers around the world!</p>
        
        <VideoChat />
      </main>

      <style jsx global>{`
        html, body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          background-color: #f5f5f5;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .container {
          min-height: 100vh;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        main {
          max-width: 1000px;
          width: 100%;
          text-align: center;
        }
        
        h1 {
          margin-bottom: 0.5rem;
        }
        
        .video-chat {
          margin-top: 2rem;
          border-radius: 12px;
          overflow: hidden;
          background-color: #fff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #333;
          color: white;
        }
        
        .controls button {
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 8px 16px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 14px;
          margin: 0 4px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .controls button:hover {
          background-color: #45a049;
        }
        
        .video-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }
        
        .video-wrapper {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 16/9;
          background-color: #000;
        }
        
        .video-wrapper video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .video-label {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default Home;
