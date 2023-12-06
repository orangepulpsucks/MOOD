import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import logo from './MoodLogo.svg';
import './App.css';
import Lottie from 'react-lottie';
import animationData from '../src/Load.json';



const WebcamComponent = () => {
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [emotionResults, setEmotionResults] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showHeader, setShowHeader] = useState(true);
    const [detectedEmotion, setDetectedEmotion] = useState("");
    const lottieOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };
    

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
            return "neutral";
        }
    };

    const handleCapture = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);

        // Call the function to send the image to Google Cloud Vision API
        await sendToGoogleCloudVision(imageSrc);

        // Save the captured image to be sent to CHATGPT4
        sendToCHATGPT4(imageSrc);
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

    const sendToCHATGPT4 = async (imagePath) => {
        setLoading(true);
        setError(null);

        // openai key
        const API_KEY = "";

        const encodeImage = async (imagePath) => {
            const response = await fetch(imagePath);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };

        try {
            const base64Image = await encodeImage(imagePath);
            const API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

            const options = {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    "model": "gpt-4-vision-preview",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Give me an accurate recreation of the photo. Use lots of descriptions."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 300
                }),
            };

            const response = await fetch(API_ENDPOINT, options);

            if (response.status === 429) {
                console.log("Rate limit exceeded. Waiting for 60 seconds...");
                await new Promise(resolve => setTimeout(resolve, 60000));
                await sendToCHATGPT4(imagePath); // Retry after waiting
            } else {
                const data = await response.json();
                console.log("ChatGPT-4 API Response:", data);

                // Access and print the response contents
                if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                    console.log("Generated Content:", data.choices[0].message.content);
                    // Set the generated text to a state variable if needed
                    // Example: setGeneratedText(data.choices[0].message.content);

                    // Use the generated content as the prompt for DALL-E
                    await sendToDALL_E(data.choices[0].message.content);
                } else {
                    console.log("No valid content found in the API response.");
                }

                // Clear any previous error
                setError(null);
            }
        } catch (error) {
            console.error("API Request Error:", error);
            // Handle the error
            // Example: setError(`Error making API request: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const sendToDALL_E = async (generatedContent) => {
        setLoading(true);
        setError(null);

        // openai key
        const API_KEY = "";

        const options = {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                'Content-Type': "application/json",
            },
            body: JSON.stringify({
                "model": "dall-e-3",
                "prompt": generatedContent,
                "n": 1,
                "size": "1024x1024",
            }),
        };

        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', options);

            if (response.status === 429) {
                console.log("Rate limit exceeded. Waiting for 60 seconds...");
                await new Promise(resolve => setTimeout(resolve, 60000));
                await sendToDALL_E(generatedContent);
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
                <div>
                    <Lottie options={lottieOptions} height={200} width={200} />
                    <p>Just a minute while I guess how you feel...</p>
                </div>
            ) : generatedImage ? (
                <div>
                    <div style={{ textAlign: 'center' }}>
                        {/* LOGO */}
                        <img
                            src={logo}
                            alt="Logo"
                            className="logo-image"
                            style={{ width: '50%', maxWidth: '200px', margin: '0 auto' }}
                        />
                    </div>                    <img src={generatedImage} alt="Generated" className="dalle-image" />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <p>You must be {detectedEmotion}!</p>
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

export default WebcamComponent;

