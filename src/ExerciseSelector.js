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
  const [exerciseState, setExerciseState] = useState('up');
  const exerciseStateRef = useRef('up');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    exerciseStateRef.current = exerciseState;
  }, [exerciseState]);

  useEffect(() => {
    if (feedback) {
      setShowPopup(true);
      const timer = setTimeout(() => setShowPopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    setCount(0);
    if (selectedExercise === 'shoulder press') {
      setExerciseState('down');
      exerciseStateRef.current = 'down';
    } else {
      setExerciseState('up');
      exerciseStateRef.current = 'up';
    }
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
      } else {
        console.log('Pose landmarks are undefined.');
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
      console.log('One or more points are undefined:', point1, point2, point3);
      return null;
    }

    const { x: x1, y: y1 } = point1;
    const { x: x2, y: y2 } = point2;
    const { x: x3, y: y3 } = point3;

    if (x1 === undefined || x2 === undefined || x3 === undefined || y1 === undefined || y2 === undefined || y3 === undefined) {
      console.log('One or more points do not have x or y properties:', point1, point2, point3);
      return null;
    }

    const angle = Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y1 - y2, x1 - x2);
    return Math.abs(angle * (180.0 / Math.PI));
  };

  const evaluateSquat = (keypoints) => {
    const leftHip = keypoints[23];
    const leftKnee = keypoints[25];
    const leftAnkle = keypoints[27];

    if (!leftHip || !leftKnee || !leftAnkle) {
      console.log('Keypoints for squat are undefined:', { leftHip, leftKnee, leftAnkle });
      return;
    }

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

    if (leftKneeAngle === null) {
      console.log('Left knee angle could not be calculated.');
      return;
    }

    if (selectedExercise === 'squat') {
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
    }
  };

  const evaluateLunge = (keypoints) => {
    const leftHip = keypoints[23];
    const leftKnee = keypoints[25];
    const leftAnkle = keypoints[27];

    if (!leftHip || !leftKnee || !leftAnkle) {
      console.log('Keypoints for lunge are undefined:', { leftHip, leftKnee, leftAnkle });
      return;
    }

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

    if (leftKneeAngle === null) {
      console.log('Left knee angle could not be calculated.');
      return;
    }

    if (selectedExercise === 'lunge') {
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
    }
  };

  const evaluateCurl = (keypoints) => {
    const leftShoulder = keypoints[11];
    const leftElbow = keypoints[13];
    const leftWrist = keypoints[15];

    if (!leftShoulder || !leftElbow || !leftWrist) {
      console.log('Keypoints for curl are undefined:', { leftShoulder, leftElbow, leftWrist });
      return;
    }

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    if (leftElbowAngle === null) {
      console.log('Left elbow angle could not be calculated.');
      return;
    }

    if (selectedExercise === 'dumbbell curl') {
      if (leftElbowAngle > 160 && exerciseStateRef.current === 'down') {
        setExerciseState('up');
        setFeedback('Curl up!');
        setCount((prevCount) => prevCount + 1);
      } else if (leftElbowAngle <= 40 && exerciseStateRef.current === 'up') {
        setExerciseState('down');
        setFeedback('Curl is perfect!');
      } else if (exerciseStateRef.current === 'up') {
        setFeedback('Adjust your curl posture.');
      }
    }
  };

  const evaluatePress = (keypoints) => {
    const leftShoulder = keypoints[11];
    const leftElbow = keypoints[13];
    const leftWrist = keypoints[15];

    if (!leftShoulder || !leftElbow || !leftWrist) {
      console.log('Keypoints for press are undefined:', { leftShoulder, leftElbow, leftWrist });
      return;
    }

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    if (leftElbowAngle === null) {
      console.log('Left elbow angle could not be calculated.');
      return;
    }

    if (selectedExercise === 'shoulder press') {
      if (leftElbowAngle > 160 && exerciseStateRef.current === 'down') {
        setExerciseState('up');
        setFeedback('Press is perfect!');
      } else if (leftElbowAngle <= 60 && exerciseStateRef.current === 'up') {
        setExerciseState('down');
        setFeedback('Press up!');
        setCount((prevCount) => prevCount + 1);
      } else if (exerciseStateRef.current === 'down') {
        setFeedback('Adjust your press posture.');
      }
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
