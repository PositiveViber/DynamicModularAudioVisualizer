import React, { useState, useEffect } from 'react';
import { LiveAudioVisualizer } from 'react-audio-visualize';

const VisualizerApp = () => {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioData, setAudioData] = useState(null);

  // Function to start recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      setAudioData(e.data);
    };
    recorder.start();
    setMediaRecorder(recorder);
  };

  // Function to stop recording
  const stopRecording = () => {
    mediaRecorder.stop();
    // Cleanup after stopping
    setMediaRecorder(null);
  };

  // Function to play the recorded audio
  const playAudio = () => {
    if (audioData) {
      const audioUrl = URL.createObjectURL(audioData);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  // Cleanup resources when component unmounts
  useEffect(() => {
    return () => {
      mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [mediaRecorder]);

  return (
    <div className="App">
      <button onClick={startRecording} disabled={mediaRecorder !== null}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={mediaRecorder === null}>
        Stop Recording
      </button>
      <button onClick={playAudio} disabled={!audioData}>
        Play
      </button>
      {mediaRecorder && (
        <LiveAudioVisualizer mediaRecorder={mediaRecorder} width={200} height={75} />
      )}
    </div>
  );
};

export default VisualizerApp;
