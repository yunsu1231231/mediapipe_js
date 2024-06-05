import React, { useEffect, useRef, useState } from 'react';
import * as cam from '@mediapipe/camera_utils';
import { Pose } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import Webcam from 'react-webcam';
import './ExerciseFeedback.css';

const ExerciseFeedback = ({ selectedExercise }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [feedback, setFeedback] = useState('');
  const [positionMessage, setPositionMessage] = useState('');
  const [exerciseCount, setExerciseCount] = useState(0);
  const [inCorrectForm, setInCorrectForm] = useState(false);

  useEffect(() => {
    const userPose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
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
      drawConnectors(canvasCtx, results.poseLandmarks, Pose.POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4,
      });
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
      });
      canvasCtx.restore();

      adjustUserPosition(results.poseLandmarks);

      if (selectedExercise === 'squat') {
        evaluateSquat(results.poseLandmarks);
      } else if (selectedExercise === 'lunge') {
        evaluateLunge(results.poseLandmarks);
      } else if (selectedExercise === 'dumbbell_curl') {
        evaluateDumbbellCurl(results.poseLandmarks);
      } else if (selectedExercise === 'shoulder_press') {
        evaluateShoulderPress(results.poseLandmarks);
      }
    });

    if (typeof webcamRef.current !== 'undefined' && webcamRef.current !== null) {
      const camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await userPose.send({ image: webcamRef.current.video });
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }
  }, [selectedExercise]);

  const calculateAngle = (pointA, pointB, pointC) => {
    const AB = Math.sqrt(Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2));
    const BC = Math.sqrt(Math.pow(pointC.x - pointB.x, 2) + Math.pow(pointC.y - pointB.y, 2));
    const AC = Math.sqrt(Math.pow(pointC.x - pointA.x, 2) + Math.pow(pointC.y - pointA.y, 2));
    return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB)) * (180 / Math.PI);
  };

  const adjustUserPosition = (keypoints) => {
    const nose = keypoints.find(point => point.part === 'nose');
    if (nose) {
      const x = nose.x;
      const y = nose.y;
      let message = '';

      if (x < 0.3) {
        message = 'Move to the right';
      } else if (x > 0.7) {
        message = 'Move to the left';
      } else if (y < 0.3) {
        message = 'Move back';
      } else if (y > 0.7) {
        message = 'Move forward';
      }

      setPositionMessage(message);
    }
  };

  const evaluateSquat = (keypoints) => {
    const leftHip = keypoints.find(point => point.part === 'left_hip');
    const leftKnee = keypoints.find(point => point.part === 'left_knee');
    const leftAnkle = keypoints.find(point => point.part === 'left_ankle');
    const rightHip = keypoints.find(point => point.part === 'right_hip');
    const rightKnee = keypoints.find(point => point.part === 'right_knee');
    const rightAnkle = keypoints.find(point => point.part === 'right_ankle');

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    if (leftKneeAngle >= 70 && leftKneeAngle <= 110 && rightKneeAngle >= 70 && rightKneeAngle <= 110) {
      if (!inCorrectForm) {
        setExerciseCount(prevCount => prevCount + 1);
        setInCorrectForm(true);
      }
      setFeedback('Squat is perfect!');
    } else {
      setInCorrectForm(false);
      setFeedback('');
    }
  };

  const evaluateLunge = (keypoints) => {
    const leftHip = keypoints.find(point => point.part === 'left_hip');
    const leftKnee = keypoints.find(point => point.part === 'left_knee');
    const leftAnkle = keypoints.find(point => point.part === 'left_ankle');
    const rightHip = keypoints.find(point => point.part === 'right_hip');
    const rightKnee = keypoints.find(point => point.part === 'right_knee');
    const rightAnkle = keypoints.find(point => point.part === 'right_ankle');

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    if (leftKneeAngle >= 70 && leftKneeAngle <= 110 && rightKneeAngle >= 70 && rightKneeAngle <= 110) {
      if (!inCorrectForm) {
        setExerciseCount(prevCount => prevCount + 1);
        setInCorrectForm(true);
      }
      setFeedback('Lunge is perfect!');
    } else {
      setInCorrectForm(false);
      setFeedback('');
    }
  };

  const evaluateDumbbellCurl = (keypoints) => {
    const leftShoulder = keypoints.find(point => point.part === 'left_shoulder');
    const leftElbow = keypoints.find(point => point.part === 'left_elbow');
    const leftWrist = keypoints.find(point => point.part === 'left_wrist');
    const rightShoulder = keypoints.find(point => point.part === 'right_shoulder');
    const rightElbow = keypoints.find(point => point.part === 'right_elbow');
    const rightWrist = keypoints.find(point => point.part === 'right_wrist');

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

    if (leftElbowAngle >= 40 && leftElbowAngle <= 160 && rightElbowAngle >= 40 && rightElbowAngle <= 160) {
      if (!inCorrectForm) {
        setExerciseCount(prevCount => prevCount + 1);
        setInCorrectForm(true);
      }
      setFeedback('Dumbbell curl is perfect!');
    } else {
      setInCorrectForm(false);
      setFeedback('');
    }
  };

  const evaluateShoulderPress = (keypoints) => {
    const leftShoulder = keypoints.find(point => point.part === 'left_shoulder');
    const leftElbow = keypoints.find(point => point.part === 'left_elbow');
    const leftWrist = keypoints.find(point => point.part === 'left_wrist');
    const rightShoulder = keypoints.find(point => point.part === 'right_shoulder');
    const rightElbow = keypoints.find(point => point.part === 'right_elbow');
    const rightWrist = keypoints.find(point => point.part === 'right_wrist');

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

    if (leftElbowAngle >= 150 && leftElbowAngle <= 180 && rightElbowAngle >= 150 && rightElbowAngle <= 180) {
      if (!inCorrectForm) {
        setExerciseCount(prevCount => prevCount + 1);
        setInCorrectForm(true);
      }
      setFeedback('Shoulder press is perfect!');
    } else {
      setInCorrectForm(false);
      setFeedback('');
    }
  };

  return (
    <div>
      <Webcam ref={webcamRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ width: '640px', height: '480px' }} />
      <div style={{ marginTop: '20px', fontSize: '20px', color: '#ff0000' }}>
        <div className="popup">{feedback}</div>
        <div>{positionMessage}</div>
        <div>Count: {exerciseCount}</div>
      </div>
    </div>
  );
};

export default ExerciseFeedback;
