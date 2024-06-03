import React, { useState } from 'react';
import './App.css';
import ExerciseSelector from './ExerciseSelector';
import ExerciseFeedback from './ExerciseFeedback';

function App() {
  const [selectedExercise, setSelectedExercise] = useState('squat');

  return (
    <div className="App">
      <ExerciseSelector selectedExercise={selectedExercise} setSelectedExercise={setSelectedExercise} />
      <ExerciseFeedback selectedExercise={selectedExercise} />
    </div>
  );
}

export default App;
