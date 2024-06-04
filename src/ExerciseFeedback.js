import React, { useEffect, useRef, useState } from 'react';
import * as cam from '@mediapipe/camera_utils';
import { Pose } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import Webcam from 'react-webcam';

const ExerciseFeedback = ({ selectedExercise }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [feedback, setFeedback] = useState('');

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

      if (selectedExercise === 'squat') {
        evaluateSquat(results.poseLandmarks);
      } else if (selectedExercise === 'lunge') {
        evaluateLunge(results.poseLandmarks);
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

  const evaluateSquat = (keypoints) => {
    const leftHip = keypoints.find(point => point.part === 'left_hip');
    const leftKnee = keypoints.find(point => point.part === 'left_knee');
    const leftAnkle = keypoints.find(point => point.part === 'left_ankle');
    const rightHip = keypoints.find(point => point.part === 'right_hip');
    const rightKnee = keypoints.find(point => point.part === 'right_knee');
    const rightAnkle = keypoints.find(point => point.part === 'right_ankle');

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    let feedbackMessage = '';

    if (leftKneeAngle >= 80 && leftKneeAngle <= 100 && rightKneeAngle >= 80 && rightKneeAngle <= 100) {
      feedbackMessage = 'Squat is perfect!';
    } else {
      feedbackMessage = 'Adjust your squat posture.';
      if (leftKneeAngle < 80 || rightKneeAngle < 80) {
        feedbackMessage += ' Bend your knees more.';
      } else if (leftKneeAngle > 100 || rightKneeAngle > 100) {
        feedbackMessage += ' Straighten your knees a bit.';
      }
    }

    setFeedback(feedbackMessage);
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

    let feedbackMessage = '';

    if (leftKneeAngle >= 80 && leftKneeAngle <= 100 && rightKneeAngle >= 80 && rightKneeAngle <= 100) {
      feedbackMessage = 'Lunge is perfect!';
    } else {
      feedbackMessage = 'Adjust your lunge posture.';
      if (leftKneeAngle < 80 || rightKneeAngle < 80) {
        feedbackMessage += ' Bend your knees more.';
      } else if (leftKneeAngle > 100 || rightKneeAngle > 100) {
        feedbackMessage += ' Straighten your knees a bit.';
      }
    }

    setFeedback(feedbackMessage);
  };

  return (
    <div>
      <Webcam ref={webcamRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ width: '640px', height: '480px' }} />
      <div style={{ marginTop: '20px', fontSize: '20px', color: '#ff0000' }}>
        {feedback}
      </div>
    </div>
  );
};

export default ExerciseFeedback;
