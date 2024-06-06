import React, { useEffect, useRef, useState } from 'react';
import * as cam from '@mediapipe/camera_utils';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import Webcam from 'react-webcam';

const ExerciseFeedback = ({ selectedExercise }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [feedback, setFeedback] = useState('');
  const [count, setCount] = useState(0);
  const [squatState, setSquatState] = useState('up');

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
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
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
  }, [selectedExercise, squatState]);

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
    if (!keypoints || keypoints.length === 0) {
      console.log('Keypoints are undefined or empty.');
      return;
    }

    const leftHip = keypoints[23];
    const leftKnee = keypoints[25];
    const leftAnkle = keypoints[27];

    if (!leftHip || !leftKnee || !leftAnkle) {
      console.log('One or more keypoints are missing:', { leftHip, leftKnee, leftAnkle });
      return;
    }

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

    if (leftKneeAngle === null) {
      console.log('One or more angles could not be calculated.');
      return;
    }

    console.log(`Left Knee Angle: ${leftKneeAngle}`);

    if (leftKneeAngle > 169) {
      setSquatState('up');
      setFeedback('Stand up straight!');
    } else if (squatState === 'up' && leftKneeAngle >= 70 && leftKneeAngle <= 110) {
      setSquatState('down');
      setFeedback('Squat is perfect!');
    } else if (squatState === 'down' && leftKneeAngle > 150) {
      setCount((prevCount) => prevCount + 1);
      setSquatState('up');
      setFeedback('Good job! Stand up straight!');
    } else if (squatState === 'up') {
      setFeedback('Adjust your squat posture.');
    }
  };

  const evaluateLunge = (keypoints) => {
    const leftHip = keypoints[23];
    const leftKnee = keypoints[25];
    const leftAnkle = keypoints[27];
    const rightHip = keypoints[24];
    const rightKnee = keypoints[26];
    const rightAnkle = keypoints[28];

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    let feedbackMessage = '';

    if (leftKneeAngle >= 70 && leftKneeAngle <= 110 && rightKneeAngle >= 70 && rightKneeAngle <= 110) {
      feedbackMessage = 'Lunge is perfect!';
    } else {
      feedbackMessage = 'Adjust your lunge posture.';
      if (leftKneeAngle < 70 || rightKneeAngle < 70) {
        feedbackMessage += ' Bend your knees more.';
      } else if (leftKneeAngle > 110 || rightKneeAngle > 110) {
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
      <div style={{ marginTop: '10px', fontSize: '18px', color: '#0000ff' }}>
        Squat Count: {count}
      </div>
    </div>
  );
};

export default ExerciseFeedback;
