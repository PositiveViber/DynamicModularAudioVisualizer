import pyaudio
import numpy as np
from scipy.fft import rfft, rfftfreq
import matplotlib.pyplot as plt
import wave
import os
from flask import Flask, jsonify
import threading


fft_cache = {}  # Dictionary to store cached data
# Lock for thread-safe operations on cache
cache_lock = threading.Lock()  

p = pyaudio.PyAudio()

frames = []
audio_stream = None
# Constants
FORMAT = pyaudio.paInt16  # Audio format
CHANNELS = 1              # Mono audio
RATE = 44100              # Sample rate
CHUNK = 1024              # Samples per buffer
RECORD_SECONDS = 5        # Duration of recording
OUTPUT_DIR = "public"     # Output directory
WAVE_OUTPUT_FILENAME = os.path.join(OUTPUT_DIR, "output.wav")

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR) 


def start_audio_stream():
    global audio_stream, frames, p
    frames = []  # Clear previous frames
    p = pyaudio.PyAudio()
    def callback(in_data, frame_count, time_info, status):
        frames.append(in_data)
        return (None, pyaudio.paContinue)

    audio_stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE,
                          input=True, frames_per_buffer=CHUNK,
                          stream_callback=callback)
    audio_stream.start_stream()
    print("Recording started...")

def stop_audio_stream():
    global audio_stream, p
    if audio_stream:
        audio_stream.stop_stream()
        audio_stream.close()
        audio_stream = None
        p.terminate()
        print("Recording stopped.")
        return frames
    else:
        print("No active audio stream to stop.")
        return []

def save_audio(framesData, filename=WAVE_OUTPUT_FILENAME):
    global audio_stream, frames
    if not frames:
        print("No frames to save.")
        return
    try:
        wf = wave.open(filename, 'wb')
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(p.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b''.join(frames))
        wf.close()
        p.terminate()
        print(f"Audio saved successfully to {filename}")
    except Exception as e:
        print(f"Failed to save audio: {e}")
        
def plot_waveform_and_spectrum(xf, yf, frames, filename='audio_plot.png'):
    if not frames:
        print("No frames to plot.")
        return
   
    plot_path = os.path.abspath(r"C:\Users\grego\audio-project\public\backend\output")
    plot_file = os.path.join(plot_path, filename)
    
    # Check if the directory exists, if not, create it
    if not os.path.exists(plot_path):
        os.makedirs(plot_path)
    
    fig, axs = plt.subplots(2)
    axs[0].plot(xf, yf)
    axs[0].set_title('Frequency domain')
    axs[0].set_xlabel('Frequency')
    axs[0].set_ylabel('Amplitude')

    # convert byte data from frames to numpy array
    audio_data = np.frombuffer(b''.join(frames), dtype=np.int16)
    axs[1].plot(np.arange(len(audio_data)) / RATE, audio_data)
    axs[1].set_title('Time domain')
    axs[1].set_xlabel('Time (s)')
    axs[1].set_ylabel('Amplitude')

    # save the figure using the absolute path
    plt.savefig(plot_file)  # Corrected to use plot_file
    plt.close(fig)
    print(f"Plot saved successfully at {plot_file}.")  # Corrected to reference the file, not the path

    
def prepare_visualization_data():
    frames = stop_audio_stream()
    if frames:
        xf, yf = calculate_fft(frames)
        # convert data to lists for JSON serialization
        return {'xf': xf.tolist(), 'yf': yf.tolist()}
    else:
        return {'xf': [], 'yf': []}

def cache_fft_data(frames):
    if frames:
        xf, yf = calculate_fft(frames)
        with cache_lock:
            fft_cache['xf'] = xf.tolist()
            fft_cache['yf'] = yf.tolist()

def get_cached_fft_data():
    with cache_lock:
        return fft_cache.get('xf', []), fft_cache.get('yf', [])

def calculate_fft(frames, sample_rate):
    # Assuming 'frames' is a list of byte strings from the audio stream
    # Concatenate byte strings and convert to 'int16' numpy array
    audio_data = np.frombuffer(b''.join(frames), dtype=np.int16)

    # Perform the real FFT
    yf = rfft(audio_data)
    xf = rfftfreq(len(audio_data), 1 / sample_rate)

    # Convert complex values to magnitude
    yf = np.abs(yf)

    return xf, yf
