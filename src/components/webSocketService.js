import io from 'socket.io-client';

// Initialize the socket connection immediately upon loading the service.
const socket = io('http://localhost:5000');

const SocketService = {
    startVisualization: () => {
        socket.emit('start_visualization');
    },
    stopVisualization: () => {
        socket.emit('stop_visualization');
    },
    onAudioChunk: (callback) => {
        socket.on('audio_chunk', callback);
    },
    offAudioChunk: () => {
        socket.off('audio_chunk');
    },
    startRecording: () => {
        socket.emit('start_recording');
    },
    stopRecording: () => {
        socket.emit('stop_recording');
    }
};

export default SocketService;
