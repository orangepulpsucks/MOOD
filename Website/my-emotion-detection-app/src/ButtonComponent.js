import React from 'react';
import './App.css'

const ButtonComponent = ({ onClick }) => {
    return (
    <button onClick={onClick} className="detect-button">Detect</button>
    );
};

export default ButtonComponent;
