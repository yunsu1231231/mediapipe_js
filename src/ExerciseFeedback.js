import React, { useEffect, useRef, useState } from 'react';
import * as cam from '@mediapipe/camera_utils';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import Webcam from 'react-webcam';
import './ExerciseFeedback.css';

const ExerciseFeedback = ({ selectedExercise }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [feedback, setFeedback] = useState('');
  const [count, setCount] = useState(0);
  const [exerciseState, setExerciseState] = useState('down');
  const exerciseStateRef = useRef('down');
  const [showPopup, setShowPopup] = useState(false);
  const [initialSetup, setInitialSetup] = useState(true);

  useEffect(() => {
    exerciseStateRef.current = exerciseState;
  }, [exerciseState]);

  useEffect(() => {
    if (feedback) {
      setShowPopup(true);
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    setCount(0);
    setExerciseState('down');
    exerciseStateRef.current = 'down';
    setInitialSetup(true);  // Reset initial setup when exercise changes
  }, [selectedExercise]);

  useEffect(() => {
    const userPose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    userPose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    userPose.onResults((results) => {
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext('2d');

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4,
      });
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
      });
      canvasCtx.restore();

      if (initialSetup) {
        const nose = results.poseLandmarks[0];
        if (nose) {
          const { x, y } = nose;
          if (x > 0.4 && x < 0.6 && y > 0.4 && y < 0.6) {
            setInitialSetup(false);
            setFeedback('Great! You are in the right position.');
          } else {
            setFeedback('Please move to the center of the frame.');
          }
        }
      } else {
        if (results.poseLandmarks) {
          switch (selectedExercise) {
            case 'squat':
              evaluateSquat(results.poseLandmarks);
              break;
            case 'lunge':
              evaluateLunge(results.poseLandmarks);
              break;
            case 'dumbbell curl':
              evaluateCurl(results.poseLandmarks);
              break;
            case 'shoulder press':
              evaluatePress(results.poseLandmarks);
              break;
            default:
              break;
          }
        }
      }
    });

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await userPose.send({ image: webcamRef.current.video });
        },
        width: 1920,
        height: 1080,
      });
      camera.start();
    }
  }, [selectedExercise]);

  const calculateAngle = (point1, point2, point3) => {
    if (!point1 || !point2 || !point3) {
      return null;
    }

    const { x: x1, y: y1 } = point1;
    const { x: x2, y: y2 } = point2;
    const { x: x3, y: y3 } = point3;

    const angle = Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y1 - y2, x1 - x2);
    return Math.abs(angle * (180.0 / Math.PI));
  };

  const evaluateSquat = (keypoints) => {
    if (!keypoints[23] || !keypoints[25] || !keypoints[27]) return;

    const leftHip = keypoints[23];
    const leftKnee = keypoints[25];
    const leftAnkle = keypoints[27];

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

    if (leftKneeAngle > 169 && exerciseStateRef.current === 'down') {
      setExerciseState('up');
      setFeedback('Stand up straight!');
      setCount((prevCount) => prevCount + 1);
    } else if (leftKneeAngle >= 70 && leftKneeAngle <= 110 && exerciseStateRef.current === 'up') {
      setExerciseState('down');
      setFeedback('Squat is perfect!');
    } else if (exerciseStateRef.current === 'up') {
      setFeedback('Adjust your squat posture.');
    }
  };

  const evaluateLunge = (keypoints) => {
    if (!keypoints[23] || !keypoints[25] || !keypoints[27]) return;

    const leftHip = keypoints[23];
    const leftKnee = keypoints[25];
    const leftAnkle = keypoints[27];

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

    if (leftKneeAngle > 169 && exerciseStateRef.current === 'down') {
      setExerciseState('up');
      setFeedback('Stand up straight!');
      setCount((prevCount) => prevCount + 1);
    } else if (leftKneeAngle >= 70 && leftKneeAngle <= 110 && exerciseStateRef.current === 'up') {
      setExerciseState('down');
      setFeedback('Lunge is perfect!');
    } else if (exerciseStateRef.current === 'up') {
      setFeedback('Adjust your lunge posture.');
    }
  };

  const evaluateCurl = (keypoints) => {
    if (!keypoints[11] || !keypoints[13] || !keypoints[15]) return;

    const leftShoulder = keypoints[11];
    const leftElbow = keypoints[13];
    const leftWrist = keypoints[15];

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    if (leftElbowAngle > 160 && exerciseStateRef.current === 'up') { // Slightly adjusted angle for better detection
      setExerciseState('down');
      setFeedback('Fully extend your arm.');
      setCount((prevCount) => prevCount + 1);
    } else if (leftElbowAngle <= 30 && exerciseStateRef.current === 'down') { // Slightly adjusted angle for better detection
      setExerciseState('up');
      setFeedback('Curl up the dumbbell!');
    } else if (exerciseStateRef.current === 'down') {
      setFeedback('Lower the dumbbell.');
    } else if (exerciseStateRef.current === 'up') {
      setFeedback('Good form! Keep going.');
    }
  };

  const evaluatePress = (keypoints) => {
    if (!keypoints[11] || !keypoints[13] || !keypoints[15]) return;

    const leftShoulder = keypoints[11];
    const leftElbow = keypoints[13];
    const leftWrist = keypoints[15];

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    if (leftElbowAngle > 160 && exerciseStateRef.current === 'down') {
      setExerciseState('up');
      setFeedback('Press up!');
      setCount((prevCount) => prevCount + 1);
    } else if (leftElbowAngle <= 60 && exerciseStateRef.current === 'up') {
      setExerciseState('down');
      setFeedback('Press is perfect!');
    } else if (exerciseStateRef.current === 'up') {
      setFeedback('Adjust your press posture.');
    }
  };

  return (
    <div style={{ position: 'relative', width: '95vw', height: '95vh' }}>
      <Webcam
        ref={webcamRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      <div className={`popup ${showPopup ? 'show' : ''}`}>{feedback}</div>
      <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '20px', color: '#0000ff', backgroundColor: '#ffffff', padding: '5px' }}>
        Count: {count}
      </div>
    </div>
  );
};

export default ExerciseFeedback;
