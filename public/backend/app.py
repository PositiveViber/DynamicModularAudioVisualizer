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
    """FFT Data Being Transfered In Sockets"""
    xf, yf = get_cached_fft_data()
    if xf and yf:
        return jsonify(xf=xf, yf=yf)
    else:
        return jsonify(error="FFT data not available"), 404

@socketio.on('start_visualization')
def handle_start_visualization():
    """Create socket and allow data for viusalization.jsx"""
    print('Visualization started')
    data = prepare_visualization_data()
    if data:
        emit('visualization_data', data)
    else:
        emit('error', {'message': 'Unable to prepare visualization data'})

    
@socketio.on('start_recording')
def handle_start_recording():
    """Indicate Start Reporting :("""
    print("Started recording")
    start_audio_stream()
    
@socketio.on('stop_recording')
def handle_stop_recording():
    """Indicate Stop Reporting :)"""
    print("Stopped recording")
    frames = stop_audio_stream() 

     # if avaliable, will calculate and cache the FFT data for data transfer.
    if frames:
        save_audio(frames) 
        cache_fft_data(frames) 
    # After conversion be able to retrieve the cached FFT data.
        xf, yf = get_cached_fft_data()  
        
        if xf and yf:
            plot_waveform_and_spectrum(xf, yf, frames)
            emit('visualization_data', {'xf': list(xf), 'yf': list(yf)})  # Emit both frequency bins and amplitudes.
        else:
            print('FFT data could not be calculated.')
            emit('error', {'message': 'FFT data could not be calculated.'})
    else:
        emit('error', {'message': 'No audio was recorded'})


@socketio.on('connect')
def on_connect():
    """Establish Connection with Server"""
    print('Client connected')

@socketio.on('disconnect')
def on_disconnect():
    """Establish Disconnection with Server"""
    print('Client disconnected')

if __name__ == '__main__':
    """Run the app"""
    socketio.run(app, debug=True)
