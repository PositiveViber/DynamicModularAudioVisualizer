from flask import Flask, render_template, send_file, jsonify
from flask_socketio import SocketIO, emit
import os
from audio_processing import start_audio_stream, stop_audio_stream, save_audio, calculate_fft, plot_waveform_and_spectrum, prepare_visualization_data ,get_cached_fft_data, cache_fft_data
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")


@app.route('/')
def index():
    """Serve the main HTML page."""
    return render_template('index.html')

@app.route('/audio')
def serve_audio():
    """Serve the audio file if available."""
    audio_path = os.path.join(app.root_path, 'output', 'output.wav')
    if os.path.exists(audio_path):
        return send_file(audio_path, mimetype="audio/wav")
    return jsonify({"error": "Audio file not found"}), 404

@app.route('/audio_plot')
def audio_plot():
    """Serve the audio plot image if available."""
    image_path = os.path.join(app.root_path, 'static', 'audio_plot.png')
    if os.path.exists(image_path):
        return send_file(image_path, mimetype='image/png')
    return jsonify({"error": "Plot not found"}), 404

@app.route('/fft_data')
def get_fft_data():
    xf, yf = get_cached_fft_data()
    if xf and yf:
        return jsonify(xf=xf, yf=yf)
    else:
        return jsonify(error="FFT data not available"), 404

@socketio.on('start_visualization')
def handle_start_visualization():
    print('Visualization started')
    data = prepare_visualization_data()
    if data:
        emit('visualization_data', data)
    else:
        emit('error', {'message': 'Unable to prepare visualization data'})

    
@socketio.on('start_recording')
def handle_start_recording():
    print("Started recording")
    start_audio_stream()
    
@socketio.on('stop_recording')
def handle_stop_recording():
    print("Stopped recording")
    frames = stop_audio_stream()  # This should stop recording and return the recorded frames.
    
    if frames:
        save_audio(frames)  # This should save the audio data to a file.
        
        # Here's where you'd determine your sample_rate, either by a constant you've set
        # elsewhere in your code, or by inspecting the audio data, etc.
        sample_rate = 44100  # or whatever your sample rate is

        # Calculate FFT data immediately before sending
        xf, yf = calculate_fft(frames, sample_rate)

        # Assuming plot_waveform_and_spectrum can use the same data
        plot_waveform_and_spectrum(xf, yf, frames)

        print('Emitting visualization_data', {'xf': list(xf), 'yf': list(yf)})
        emit('visualization_data', {'xf': list(xf), 'yf': list(yf)})  # Emit both frequency bins and amplitudes.
    else:
        emit('error', {'message': 'No audio was recorded'})


@socketio.on('connect')
def on_connect():
    print('Client connected')

@socketio.on('disconnect')
def on_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, debug=True)
