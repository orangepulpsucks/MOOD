import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import logo from './MoodLogo.svg';
import './App.css';

/**
 * This version of WebcamComponent.js will print out a watercolor avatar based on
 * how you feel !
 */
const Watercolor = () => {
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [emotionResults, setEmotionResults] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showHeader, setShowHeader] = useState(true);
    const [detectedEmotion, setDetectedEmotion] = useState("");


    // Function to handle going back to localhost:3000
    const handleBack = () => {
        window.location.reload(); // Refresh the page
    };

    // Function to determine the detected emotion
    const determineDetectedEmotion = (emotionResults) => {
        if (!isNeutral(emotionResults.joy)) {
            return "happy";
        } else if (!isNeutral(emotionResults.sorrow)) {
            return "sad";
        } else if (!isNeutral(emotionResults.anger)) {
            return "angry";
        } else if (!isNeutral(emotionResults.surprise)) {
            return "surprised";
        } else {
            return "not be feeling anything";
        }
    };

    const handleCapture = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);

        // Call the function to send the image to Google Cloud Vision API
        await sendToGoogleCloudVision(imageSrc);
    };

    const sendToGoogleCloudVision = async (imageData) => {
        const apiKey = '';
        const apiUrl = 'https://vision.googleapis.com/v1/images:annotate';

        const requestBody = {
            requests: [
                {
                    image: {
                        content: imageData.split(',')[1], // Remove the 'data:image/jpeg;base64,' prefix
                    },
                    features: [
                        {
                            type: 'FACE_DETECTION',
                            maxResults: 1,
                        },
                    ],
                },
            ],
        };

        try {
            const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            console.log('Google Cloud Vision API response:', data);

            // Process the response and extract emotion information
            if (data.responses && data.responses.length > 0) {
                const faceAnnotation = data.responses[0].faceAnnotations[0];

                if (faceAnnotation) {
                    const results = {
                        joy: faceAnnotation.joyLikelihood,
                        sorrow: faceAnnotation.sorrowLikelihood,
                        anger: faceAnnotation.angerLikelihood,
                        surprise: faceAnnotation.surpriseLikelihood,
                    };

                    setEmotionResults(results);

                    // Determine the detected emotion
                    const detectedEmotion = determineDetectedEmotion(results);
                    setDetectedEmotion(detectedEmotion); // Set detectedEmotion state

                    // Send the emotion results to DALL-E
                    await sendToDALL_E(detectedEmotion);
                } else {
                    console.log('No face detected in the image.');
                }
            } else {
                console.log('Error: No valid response from the API.');
            }
        } catch (error) {
            console.error('Error sending image to Google Cloud Vision API:', error);
        }
    };

    // Function to send emotion results to DALL-E
    const sendToDALL_E = async (detectedEmotion) => {
        setLoading(true);
        setError(null);

        // open ai key
        const API_KEY = "";

        const options = {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                'Content-Type': "application/json",
            },
            body: JSON.stringify({
                "prompt": `circle-shaped watercolor avatar of a ${detectedEmotion} person, animal, or some entity`,
                "n": 1, // Requesting 1 image
                "size": "1024x1024",
            }),
        };

        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', options);

            if (response.status === 429) {
                console.log("Rate limit exceeded. Waiting for 60 seconds...");
                await new Promise(resolve => setTimeout(resolve, 60000));
                await sendToDALL_E(detectedEmotion); // Retry after waiting
            } else {
                const data = await response.json();
                console.log("DALL-E API Response:", data);

                if (
                    data.data &&
                    Array.isArray(data.data) &&
                    data.data.length > 0 &&
                    data.data[0].url
                ) {
                    setGeneratedImage(data.data[0].url);
                    setError(null);
                } else {
                    let errorMessage = "Issues with API response structure. Missing properties: ";

                    if (!data.data) {
                        errorMessage += "data, ";
                    }
                    if (!Array.isArray(data.data)) {
                        errorMessage += "data is not an array, ";
                    }
                    if (!(data.data && data.data.length > 0)) {
                        errorMessage += "data array is empty, ";
                    }
                    if (!(data.data && data.data[0].url)) {
                        errorMessage += "data[0] does not have the 'url' property, ";
                    }

                    // Remove the trailing comma and space
                    errorMessage = errorMessage.slice(0, -2);

                    setError(errorMessage);
                    setGeneratedImage(null);
                }
            }
        } catch (error) {
            console.error("API Request Error:", error);
            setError(`Error making API request: ${error.message}`);
            setGeneratedImage(null);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to check if an emotion is neutral
    const isNeutral = (emotion) => (
        emotion.toLowerCase() === 'very_unlikely' ||
        emotion.toLowerCase() === 'unlikely' ||
        emotion.toLowerCase() === 'unknown'
    );

    return (
        <div className="App">
            {/* Conditionally render loading state and DALL-E image */}
            {loading ? (
                <p>Just a minute while I guess how you feel...</p>
            ) : generatedImage ? (
                <div>
                    <img src={generatedImage} alt="Generated" className="dalle-image" />
                    <p>You must be {detectedEmotion}!</p>
                    <br />
                    {/* Back button */}
                    <button onClick={handleBack} className="back-button">Back</button>
                </div>
            ) : (
                <div>
                    {/* Conditionally render header */}
                    {showHeader && (
                        <div>
                            {/* LOGO */}
                            <img src={logo} alt="Logo" className="logo-image" />
                        </div>
                    )}

                    {/* Webcam component with circular clipping mask */}
                    <div className="circle-container">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            mirrored={true}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ width: 600, height: 400, facingMode: 'user' }}
                        />
                    </div>
                    <br />
                    <br />
                    {/* Button to trigger capture */}
                    <button onClick={handleCapture} className="detect-button">
                        Detect
                    </button>
                </div>
            )}
        </div>
    );
};

export default Watercolor;