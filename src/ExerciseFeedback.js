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
    setInitialSetup(true); // Reset initial setup when exercise changes
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
    
      if (initialSetup) {
        // Draw the rectangle
        const rectX1 = 0.3 * canvasElement.width;
        const rectY1 = 0.2 * canvasElement.height;
        const rectX2 = 0.7 * canvasElement.width;
        const rectY2 = 0.6 * canvasElement.height;
        
        canvasCtx.strokeStyle = '#006400'; // Dark green color of the rectangle
        canvasCtx.lineWidth = 1; // Width of the rectangle lines
        canvasCtx.strokeRect(rectX1, rectY1, rectX2 - rectX1, rectY2 - rectY1);
    
        const leftShoulder = results.poseLandmarks[11];
        const rightShoulder = results.poseLandmarks[12];
        if (leftShoulder && rightShoulder) {
          const leftShoulderX = leftShoulder.x;
          const rightShoulderX = rightShoulder.x;
          const avgX = (leftShoulderX + rightShoulderX) / 2;
          if (avgX > 0.4 && avgX < 0.6) {
            setInitialSetup(false);
            setFeedback('Great! You are in the right position.');
          } else {
            setFeedback('Please move to the center of the frame.');
          }
        }
      } else {
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
    
      canvasCtx.restore();
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
  }, [selectedExercise, initialSetup]);

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
    if (!keypoints || !keypoints[23] || !keypoints[25] || !keypoints[27]) return;

    const leftHip = keypoints[23];
    const leftKnee = keypoints[25];
    const leftAnkle = keypoints[27];

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

    if (leftKneeAngle > 169 && exerciseStateRef.current === 'down') {
      setExerciseState('up');
      setFeedback('Bend your leg!');
    } else if (leftKneeAngle <= 110 && exerciseStateRef.current === 'up') {
      setExerciseState('down');
      setFeedback('Squat is GREAT!');
      setCount((prevCount) => prevCount + 1);
    } else if (leftKneeAngle > 110 && leftKneeAngle <= 130 && exerciseStateRef.current === 'up') {
      //setExerciseState('down');
      setFeedback('Squat is so-so.');
    } else if (leftKneeAngle > 130 && leftKneeAngle <= 150 && exerciseStateRef.current === 'up') {
      //setExerciseState('down');
      setFeedback('Squat is bad.');
    }
  };

  const evaluateLunge = (keypoints) => {
    if (!keypoints || !keypoints[23] || !keypoints[25] || !keypoints[27]) return;

    const leftHip = keypoints[23];
    const leftKnee = keypoints[25];
    const leftAnkle = keypoints[27];

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

    if (leftKneeAngle > 169 && exerciseStateRef.current === 'down') {
      setExerciseState('up');
      setFeedback('Bend your leg!');
    } else if (leftKneeAngle <= 110 && exerciseStateRef.current === 'up') {
      setExerciseState('down');
      setFeedback('Lunge is GREAT!');
      setCount((prevCount) => prevCount + 1);
    } else if (leftKneeAngle > 110 && leftKneeAngle <= 130 && exerciseStateRef.current === 'up') {
      //setExerciseState('down');
      setFeedback('Lunge is so-so.');
    } else if (leftKneeAngle > 130 && leftKneeAngle <= 150 && exerciseStateRef.current === 'up') {
      //setExerciseState('down');
      setFeedback('Lunge is bad.');
    }
    
  };

  const evaluateCurl = (keypoints) => {
    if (!keypoints || !keypoints[11] || !keypoints[13] || !keypoints[15]) return;
  
    const leftShoulder = keypoints[11];
    const leftElbow = keypoints[13];
    const leftWrist = keypoints[15];
  
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  
    if (leftElbowAngle > 160 && exerciseStateRef.current === 'up') {//팔을 뻗으면서 시작
      setExerciseState('down');
      setFeedback('Bend your arm!');
    } else if (leftElbowAngle <= 40 && exerciseStateRef.current === 'down') {
      setExerciseState('up');
      setFeedback('Curl is GREAT!');
      setCount((prevCount) => prevCount + 1);
    } else if (leftElbowAngle > 40 && leftElbowAngle <= 60 && exerciseStateRef.current === 'down') {
      setFeedback('Curl is so-so.');
    } else if (leftElbowAngle > 60 && leftElbowAngle <= 80 && exerciseStateRef.current === 'down') {
      setFeedback('Curl is bad.');
    }
  };
  

  const evaluatePress = (keypoints) => {
    if (!keypoints || !keypoints[11] || !keypoints[13] || !keypoints[15]) return;

    const leftShoulder = keypoints[11];
    const leftElbow = keypoints[13];
    const leftWrist = keypoints[15];

    const leftShoulderY = leftShoulder.y;
    const leftElbowY = leftElbow.y;
    
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    if (leftElbowAngle <= 60 && exerciseStateRef.current === 'up'){
      setExerciseState('down');//팔을 구부리면서 시작
      setFeedback('Press up!');//팔피라고 말해주기
    } else if (leftShoulderY > leftElbowY && leftElbowAngle >= 160 && exerciseStateRef.current === 'down'){
      setExerciseState('up');
      setFeedback('Press is GREAT!');
      setCount((prevCount) => prevCount + 1);
    } else if (leftShoulderY > leftElbowY && leftElbowAngle > 130 && leftElbowAngle <= 160 && exerciseStateRef.current === 'down'){
      //setExerciseState('up'); // 이거를 빼야할지 넣어야할지 생각. 나는 빼는거 한표.
      setFeedback('Press is so-so.');
    } else if (leftShoulderY > leftElbowY && leftElbowAngle > 100 && leftElbowAngle <= 130 && exerciseStateRef.current === 'down'){
      setFeedback('Press is bad.');
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
