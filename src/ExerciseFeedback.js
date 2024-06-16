import React, { useEffect, useRef, useState, useCallback } from 'react';
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

  const calculateAngle = useCallback((point1, point2, point3) => {
    if (!point1 || !point2 || !point3) {
      return null;
    }

    const { x: x1, y: y1 } = point1;
    const { x: x2, y: y2 } = point2;
    const { x: x3, y: y3 } = point3;

    const angle = Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y1 - y2, x1 - x2);
    return Math.abs(angle * (180.0 / Math.PI));
  }, []);

  const evaluateSquat = useCallback((keypoints) => {
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
      setFeedback('Squat is so-so.');
    } else if (leftKneeAngle > 130 && leftKneeAngle <= 150 && exerciseStateRef.current === 'up') {
      setFeedback('Squat is bad.');
    }
  }, [calculateAngle]);

  const evaluateLunge = useCallback((keypoints) => {
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
      setFeedback('Lunge is so-so.');
    } else if (leftKneeAngle > 130 && leftKneeAngle <= 150 && exerciseStateRef.current === 'up') {
      setFeedback('Lunge is bad.');
    }
  }, [calculateAngle]);

  const evaluateCurl = useCallback((keypoints) => {
    if (!keypoints || !keypoints[11] || !keypoints[13] || !keypoints[15]) return;

    const leftShoulder = keypoints[11];
    const leftElbow = keypoints[13];
    const leftWrist = keypoints[15];

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    if (leftElbowAngle > 160 && exerciseStateRef.current === 'up') {
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
  }, [calculateAngle]);

  const evaluatePress = useCallback((keypoints) => {
    if (!keypoints || !keypoints[11] || !keypoints[13] || !keypoints[15]) return;

    const leftShoulder = keypoints[11];
    const leftElbow = keypoints[13];
    const leftWrist = keypoints[15];

    const leftShoulderY = leftShoulder.y;
    const leftElbowY = leftElbow.y;

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    if (leftElbowAngle <= 60 && exerciseStateRef.current === 'up') {
      setExerciseState('down');
      setFeedback('Press up!');
    } else if (leftShoulderY > leftElbowY && leftElbowAngle >= 160 && exerciseStateRef.current === 'down') {
      setExerciseState('up');
      setFeedback('Press is GREAT!');
      setCount((prevCount) => prevCount + 1);
    } else if (leftShoulderY > leftElbowY && leftElbowAngle > 130 && leftElbowAngle <= 160 && exerciseStateRef.current === 'down') {
      setFeedback('Press is so-so.');
    } else if (leftShoulderY > leftElbowY && leftElbowAngle > 100 && leftElbowAngle <= 130 && exerciseStateRef.current === 'down') {
      setFeedback('Press is bad.');
    }
  }, [calculateAngle]);

  useEffect(() => {
    let isMounted = true; // 컴포넌트가 마운트된 상태를 추적합니다.

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
      if (!isMounted) return; // 컴포넌트가 언마운트된 경우 함수 실행을 중단합니다.

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
        const rectX1 = 0.3 * canvasElement.width;
        const rectY1 = 0.2 * canvasElement.height;
        const rectX2 = 0.7 * canvasElement.width;
        const rectY2 = 0.6 * canvasElement.height;

        canvasCtx.strokeStyle = '#006400'; // 사각형의 색상을 설정합니다.
        canvasCtx.lineWidth = 1; // 사각형의 선 너비를 설정합니다.
        canvasCtx.strokeRect(rectX1, rectY1, rectX2 - rectX1, rectY2 - rectY1);

        const leftShoulder = results.poseLandmarks[11];
        const rightShoulder = results.poseLandmarks[12];
        if (leftShoulder && rightShoulder) {
          const leftShoulderX = leftShoulder.x;
          const rightShoulderX = rightShoulder.x;
          const avgX = (leftShoulderX + rightShoulderX) / 2;
          if (avgX > 0.4 && avgX < 0.6) {
            setInitialSetup(false); // 사용자가 중앙에 있을 때 초기 설정을 완료합니다.
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

    return () => {
      isMounted = false; // 컴포넌트 언마운트 시 마운트 상태를 업데이트합니다.
    };
  }, [selectedExercise, initialSetup, evaluateSquat, evaluateLunge, evaluateCurl, evaluatePress]);

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
