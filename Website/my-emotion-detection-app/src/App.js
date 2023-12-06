import React, { useState } from 'react';
import WebcamComponent from './WebcamComponent';
import { BrowserRouter as Router, Link, Routes, Route } from 'react-router-dom';
import DALLE from './DALLE';
import Watercolor from "./Watercolor";
import './App.css';

const App = () => {
    // State to store emotion results
    const [emotionResults, setEmotionResults] = useState(null);

    // Callback function to receive emotion results from WebcamComponent
    const handleEmotionResults = (results) => {
        // Set the emotion results in the state
        setEmotionResults(results);
    };

    const capture = () => {
        // Capture logic
        console.log('Capture function is called!');
        // Open the entire React app in a new window
        window.open('/dalle', '_blank');
    };

    return (
        <Router>
            <div className="App">

                {/***************************HOME PAGE********************************/}
                {/* Conditional rendering of WebcamComponent based on the route */}
                {/*{window.location.pathname === '/' && <h1>S M I L E</h1>}*/}
                {window.location.pathname === '/' && (
                    <WebcamComponent capture={capture} onEmotionResults={handleEmotionResults} />
                )}

                {/* COMMENTED OUT the Link to navigate to the /DALLE page */}
                {/* {window.location.pathname === '/' &&
                    <Link to="/DALLE" target="_blank">
                        Go to DALL-E
                    </Link>} */}
                <br />

                {/***************************Dalle********************************/}
                {/* Define a Route for the Test_DALL_E page */}
                <Routes>
                    <Route path="/dalle" element={<DALLE />} />
                </Routes>

                {/***************************Dalle********************************/}
                {/* Define a Route for the Test_DALL_E page */}
                <Routes>
                    <Route path="/Watercolor" element={<Watercolor />} />
                </Routes>

            </div>
        </Router>
    );
};

export default App;
