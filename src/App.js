import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Visualization from './components/Visualization.js';
import './App.css';

function App() {
  const [isFlying, setIsFlying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [fftData, setFftData] = useState(null);
  const [showTimeTravel, setShowTimeTravel] = useState(false); // changed from 'default' to a boolean
  const [leftSunPosition, setLeftSunPosition] = useState('');
  const [rightSunPosition, setRightSunPosition] = useState('');

  const socket = useRef(null);

  // Establish WebSocket connection
  useEffect(() => {
    socket.current = io('http://localhost:5000');
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // Function to fetch FFT data
  const fetchFftData = async () => {
    try {
      const response = await fetch('http://localhost:5000/fft_data');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFftData(data); // Update state with new data
    } catch (error) {
      console.error("Fetching FFT data failed:", error);
    }
  };

  const handleStartRecording = (e) => {
    e.preventDefault();
    setLeftSunPosition('left');
    setRightSunPosition('right');
    setShowTimeTravel(true); // Show the time travel background
    setIsFlying(true); // Sonic begins to fly
    setIsRecording(true); // Start recording
    socket.current.emit('start_recording');
  };
  
  const handleStopRecording = (e) => {
    e.preventDefault();
    setIsRecording(false);
    setIsFlying(false); // Sonic stops flying
    setShowTimeTravel(false); // Hide the time travel background
    setTimeout(() => {
      fetchFftData();
      // setShowVisualization(true); // You would set another state here to show the visualization, if necessary
    }, 2000); // Adjust to match Sonic's flying animation duration
    socket.current.emit('stop_recording');
  };

  useEffect(() => {
    if (!isRecording && !fftData) {
      fetchFftData();
    }
  }, [isRecording, fftData]);

  // Main return for the component
  return (
    <div className="App">
      <header className="App-header">
      {isFlying && <img src={`${process.env.PUBLIC_URL}/sonic_time_travel.gif`} alt="Sonic flying" className="sonic-animation" />}
      <div className={`time-travel-bg ${showTimeTravel ? 'show' : ''}`}></div>
        <div className="content-container">
          <div className={`text ${isRecording ? 'pop-in' : 'pop-out'}`} style={{ right: 0 }}>
            <p style={{ opacity: isRecording ? 1 : 0 }}>Visualizing...</p>
          </div>
          <img src={`${process.env.PUBLIC_URL}/sun.gif`} alt="Rotating sun" className={`sun-icon sun-icon-left ${leftSunPosition}`} />
          <img src={`${process.env.PUBLIC_URL}/sun.gif`} alt="Rotating sun" className={`sun-icon sun-icon-right ${rightSunPosition}`} />
          {fftData  && <Visualization fftData={fftData} />}
          <div className="button-container">
            <button onClick={handleStartRecording} disabled={isRecording}>
              Start Recording
            </button>
            <button onClick={handleStopRecording} disabled={!isRecording}>
              Stop Recording
            </button>
          </div>
        </div>
        <div className={`leaves ${!isRecording ? 'pop-in' : 'pop-out'}`} style={{ right: 0, opacity: 1 }}></div>
      </header>
      <div className="time-travel-bg"></div>
    </div>
  );
}


export default App;
