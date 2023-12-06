import React, { useState } from 'react';
import './DALLE.css';

// open ai key
const API_KEY = "";

const DALLE = () => {
    const [inputValue, setInputValue] = useState("");
    const [generatedImage, setGeneratedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (event) => {
        setInputValue(event.target.value);
        setError(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        await getImages();
        setLoading(false);
    };

    const getImages = async () => {
        const options = {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                'Content-Type': "application/json"
            },
            body: JSON.stringify({
                "prompt": inputValue,
                "n": 4,
                "size": "1024x1024"
            })
        };

        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', options);

            if (response.status === 429) {
                console.log("Rate limit exceeded. Waiting for 60 seconds...");
                await new Promise(resolve => setTimeout(resolve, 60000));
                await getImages();
            } else {
                const data = await response.json();
                console.log("API Response:", data);

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
        }
    };

    return (
        <div>
            <h1>DALL-E</h1>
            <form className="input-container" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                />
                <button type="submit" id="submit-button">Submit</button>
            </form>

            {loading && <p>Loading...</p>}

            {error && (
                <div>
                    <h2>Error:</h2>
                    <p>{error}</p>
                </div>
            )}

            {generatedImage && (
                <div>
                    <br />
                    <br />
                    {/*<h2>Generated Image:</h2>*/}
                    <img src={generatedImage} alt="Generated"
                         className="dalle-image"/>
                    <br />
                    <br />
                    <br />
                    <br />
                </div>
            )}
        </div>
    );
}

export default DALLE;




// FOUR IMAGES AT ONCE
// import React, { useState } from 'react';
// import './DALLE.css';
//
// const API_KEY = "";
//
// const DALLE = () => {
//     const [inputValue, setInputValue] = useState("");
//     const [generatedImages, setGeneratedImages] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//
//     const handleChange = (event) => {
//         setInputValue(event.target.value);
//         setError(null);
//     };
//
//     const handleSubmit = async (event) => {
//         event.preventDefault();
//         setError(null);
//         setLoading(true);
//         await getImages();
//         setLoading(false);
//     };
//
//     const getImages = async () => {
//         const options = {
//             method: "POST",
//             headers: {
//                 "Authorization": `Bearer ${API_KEY}`,
//                 'Content-Type': "application/json"
//             },
//             body: JSON.stringify({
//                 "prompt": inputValue,
//                 "n": 4, // Requesting 4 images
//                 "size": "1024x1024"
//             })
//         };
//
//         try {
//             const response = await fetch('https://api.openai.com/v1/images/generations', options);
//
//             if (response.status === 429) {
//                 console.log("Rate limit exceeded. Waiting for 60 seconds...");
//                 await new Promise(resolve => setTimeout(resolve, 60000));
//                 await getImages();
//             } else {
//                 const data = await response.json();
//                 console.log("API Response:", data);
//
//                 if (
//                     data.data &&
//                     Array.isArray(data.data) &&
//                     data.data.length > 0 &&
//                     data.data[0].url
//                 ) {
//                     // Extracting all image URLs into an array
//                     const imageUrls = data.data.map(item => item.url);
//                     setGeneratedImages(imageUrls);
//                     setError(null);
//                 } else {
//                     let errorMessage = "Issues with API response structure. Missing properties: ";
//
//                     if (!data.data) {
//                         errorMessage += "data, ";
//                     }
//                     if (!Array.isArray(data.data)) {
//                         errorMessage += "data is not an array, ";
//                     }
//                     if (!(data.data && data.data.length > 0)) {
//                         errorMessage += "data array is empty, ";
//                     }
//                     if (!(data.data && data.data[0].url)) {
//                         errorMessage += "data[0] does not have the 'url' property, ";
//                     }
//
//                     // Remove the trailing comma and space
//                     errorMessage = errorMessage.slice(0, -2);
//
//                     setError(errorMessage);
//                     setGeneratedImages([]); // Set an empty array in case of an error
//                 }
//             }
//         } catch (error) {
//             console.error("API Request Error:", error);
//             setError(`Error making API request: ${error.message}`);
//             setGeneratedImages([]); // Set an empty array in case of an error
//         }
//     };
//
//     return (
//         <div>
//             <h1>DALL-E</h1>
//             <form className="input-container" onSubmit={handleSubmit}>
//                 <input
//                     type="text"
//                     value={inputValue}
//                     onChange={handleChange}
//                 />
//                 <button type="submit" id="submit-button">Submit</button>
//             </form>
//
//             {loading && <p>Loading...</p>}
//
//             {error && (
//                 <div>
//                     <h2>Error:</h2>
//                     <p>{error}</p>
//                 </div>
//             )}
//
//             {generatedImages.length > 0 && (
//                 <div>
//                     <br />
//                     <br />
//                     {/*<h2>Generated Images:</h2>*/}
//                     {generatedImages.map((imageUrl, index) => (
//                         <img key={index} src={imageUrl} alt={`Generated ${index + 1}`}
//                              className="dalle-image"/>
//                     ))}
//                     <br />
//                     <br />
//                     <br />
//                     <br />
//                 </div>
//             )}
//         </div>
//     );
// }
//
// export default DALLE;




