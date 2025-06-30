import React, { useEffect, useRef, useState } from 'react';
import './AudioDetection.css';

const THRESHOLD = -30; // dB threshold for warning

const AudioDetection = () => {
  const [audioDetected, setAudioDetected] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    let audioContext, mic, analyser, dataArray, stream;

    async function startMic() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        mic = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        dataArray = new Uint8Array(analyser.fftSize);
        mic.connect(analyser);

        intervalRef.current = setInterval(() => {
          analyser.getByteTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          const decibels = 20 * Math.log10(rms);
          setAudioDetected(isFinite(decibels) && decibels > THRESHOLD);
        }, 100);
      } catch (err) {
        setAudioDetected(false);
      }
    }

    startMic();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContext) audioContext.close();
    };
  }, []);

  return (
    <div className={`audio-indicator ${audioDetected ? 'audio-yes' : 'audio-no'}`}>Audio detected: <span>{audioDetected ? 'Yes' : 'No'}</span></div>
  );
};

export default AudioDetection; 