//Test for play back within React client
//not in use

import React, { useState, useEffect } from 'react';

const AudioRecorder = ({ onRecordingComplete }) => {
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        return () => {
            if (mediaRecorder) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [mediaRecorder]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            let audioChunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                // Combine chunks and complete the recording
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                onRecordingComplete(audioBlob);
            };

            recorder.start();

            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (error) {
            console.error('Could not start audio recording:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    return (
        <div>
            <button onClick={startRecording} disabled={isRecording}>Start Recording</button>
            <button onClick={stopRecording} disabled={!isRecording}>Stop Recording</button>
            {isRecording && <p>Recording...</p>}
        </div>
    );
};

export default AudioRecorder;
