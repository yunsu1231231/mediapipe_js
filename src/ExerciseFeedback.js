import React, { useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera } from '@mediapipe/camera_utils';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const ExerciseFeedback = ({ selectedExercise }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const calculateKneeAngle = (poseLandmarks) => {
    // Implement the logic to calculate knee angle for squats
    // This is a placeholder function and should be replaced with actual implementation
    return 90; // Example value
  };

  const calculateFrontKneeAngle = (poseLandmarks) => {
    // Implement the logic to calculate front knee angle for lunges
    // This is a placeholder function and should be replaced with actual implementation
    return 90; // Example value
  };

  const provideFeedback = (poseLandmarks) => {
    let feedback = '';

    if (selectedExercise === 'squat') {
      const kneeAngle = calculateKneeAngle(poseLandmarks);
      if (kneeAngle < 90) {
        feedback = 'Good job! Your squat is deep enough.';
      } else {
        feedback = 'Bend your knees more to go deeper.';
      }
    } else if (selectedExercise === 'lunge') {
      const frontKneeAngle = calculateFrontKneeAngle(poseLandmarks);
      if (frontKneeAngle < 90) {
        feedback = 'Good job! Your lunge is deep enough.';
      } else {
        feedback = 'Bend your front knee more to go deeper.';
      }
    }

    return feedback;
  };

  const onResults = (results) => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');

    canvasElement.width = webcamRef.current.video.videoWidth;
    canvasElement.height = webcamRef.current.video.videoHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });

    const feedback = provideFeedback(results.poseLandmarks);
    canvasCtx.font = '24px Arial';
    canvasCtx.fillStyle = 'white';
    canvasCtx.fillText(feedback, 10, 30);

    canvasCtx.restore();
  };

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onResults);

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          await pose.send({ image: webcamRef.current.video });
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }
  }, [selectedExercise]);

  return (
    <div>
      <Webcam
        ref={webcamRef}
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 9,
          width: 1280,
          height: 720,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 9,
          width: 1280,
          height: 720,
        }}
      />
    </div>
  );
};

export default ExerciseFeedback;
