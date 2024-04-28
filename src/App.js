import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Visualization from './components/Visualization.js';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef(null);
  const [fftData, setFftData] = useState(null); // State to store the fetched FFT data
  const socket = useRef(null);
  const animationRef = useRef(null);

  const handleStartRecording = () => {
    socket.current.emit('start_recording');
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    socket.current.emit('stop_recording');
    setIsRecording(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    socket.current = io('http://localhost:5000');
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);


  const fetchFftData = async () => {
    try {
      const response = await fetch('http://localhost:5000/fft_data');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('FFT Data fetched:', data);
      setFftData(data);
    } catch (error) {
      console.error("Fetching FFT data failed:", error);
    }
  };
  
  
    // Effect hook to fetch FFT data when recording stops
    useEffect(() => {
      if (!isRecording && fftData === null) {
        fetchFftData();
      }
    }, [isRecording, fftData]);

    const draw = () => {
     
        
    }; // Depend on fftData
  


  return (
    <div className="App">
      <header className="App-header">
        <div className="content-container">
         
          <div className={`text ${isRecording ? 'pop-in' : 'pop-out'}`} style={{ right: 0}}>
            <p style={{opacity: isRecording ? 1 : 0}}>Visualizing...</p>
          </div>
          <img src={`${process.env.PUBLIC_URL}/sun.gif`} alt="Rotating sun" className="sun-icon sun-icon-left" />
          <img src={`${process.env.PUBLIC_URL}/sun.gif`} alt="Rotating sun" className="sun-icon sun-icon-right" />

          <Visualization fftData={fftData} />
          <div className="button-container">
            <button onClick={handleStartRecording} disabled={isRecording}>
              Start Recording
            </button>
            <button onClick={handleStopRecording} disabled={!isRecording}>
              Stop Recording
            </button>
          </div>
        </div>
        <div className={`leaves ${!isRecording ? 'pop-in' : 'pop-out'}`} style={{ right: 0, opacity: 1}}></div>
      </header>
    </div>
  );
}

export default App;
