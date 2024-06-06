import React from 'react';

const ExerciseSelector = ({ selectedExercise, setSelectedExercise }) => {
  return (
    <div>
      <label htmlFor="exercise">Choose an exercise:</label>
      <select
        id="exercise"
        value={selectedExercise}
        onChange={(e) => setSelectedExercise(e.target.value)}
      >
        <option value="squat">Squat</option>
        <option value="lunge">Lunge</option>
        <option value="shoulder press">Shoulder Press</option>
        <option value="dumbbell curl">Dumbbell Curl</option>
      </select>
    </div>
  );
};

export default ExerciseSelector;
