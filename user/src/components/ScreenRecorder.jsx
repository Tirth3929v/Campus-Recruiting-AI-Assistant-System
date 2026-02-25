import React, { useState, useRef, useEffect } from 'react';

const ScreenRecorder = ({ jobId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const recorder = new MediaRecorder(mediaStream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Handle recorded data
          console.log('Recorded chunk:', event.data);
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="screen-recorder">
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        className="w-full h-64 bg-black rounded-lg"
      />
      <div className="mt-4 flex gap-4">
        {!isRecording ? (
          <button 
            onClick={startRecording}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Start Recording
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Stop Recording
          </button>
        )}
      </div>
    </div>
  );
};

export default ScreenRecorder;
