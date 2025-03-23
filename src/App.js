import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

// Set base URL based on current environment
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:8000' 
  : 'https://genai-chat-backend-1.onrender.com';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isAudio, setIsAudio] = useState(false);
  const [timestamps, setTimestamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatActive, setChatActive] = useState(true);
  const [mediaKey, setMediaKey] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRef = useRef(null);

  const handleSend = async () => {
    if (!question) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("question", question);
    if (file) formData.append("file", file);

    try {
      const response = await axios.post(`${API_BASE}/chat/file_summarize/`, formData);

      if (response.data) {
        setMessages([...messages, { 
          you: question, 
          bot: response.data.answer, 
          summary: response.data.summarize 
        }]);
        setTimestamps(response.data.timestamps || []);
        setFileURL(response.data.file_url ? `${API_BASE}${response.data.file_url}` : null);
        setIsVideo(response.data.is_video);
        setIsAudio(response.data.is_audio);
      }
      setChatActive(false);
    } catch (error) {
      console.error("Error fetching response", error);
    }
    setLoading(false);
  };

  const handleNewChat = async () => {
    try {
      await axios.post(`${API_BASE}/chat/delete_transcription/`);
      setMessages([]);
      setFile(null);
      setFileURL(null);
      setIsVideo(false);
      setIsAudio(false);
      setTimestamps([]);
      setQuestion("");
      setChatActive(true);
      setMediaReady(false);
    } catch (error) {
      console.error("Error deleting transcription", error);
    }
  };

  const seekToTimestamp = (time) => {
    if (!mediaRef.current || !mediaReady) {
      console.log("Media not ready for seeking");
      return;
    }

    const seekTime = parseFloat(time);
    if (isNaN(seekTime)) {
      console.error("Invalid timestamp:", time);
      return;
    }

    try {
      mediaRef.current.pause();
      mediaRef.current.currentTime = seekTime;
      mediaRef.current.play().catch(error => {
        console.error("Playback error:", error);
      });
    } catch (error) {
      console.error("Seeking failed:", error);
    }
  };

  const handleMediaLoaded = () => {
    console.log("Media metadata loaded");
    setMediaReady(true);
  };

  const handleMediaError = () => {
    console.error("Media loading error");
    setMediaReady(false);
  };

  useEffect(() => {
    setMediaKey(prevKey => prevKey + 1);
    setMediaReady(false);
  }, [fileURL]);

  return (
    <div className="chat-container">
      <h2 className="chat-title">ASK ME ANYTHING</h2>

      {chatActive ? (
        <div className="input-container">
          <input 
            type="text" 
            placeholder="Ask something..." 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            className="chat-input"
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => setFile(e.target.files[0])} 
            className="hidden-file-input" 
          />
          <button className="file-btn" onClick={() => fileInputRef.current.click()}>
            +
          </button>
          
          <button 
            onClick={handleSend} 
            disabled={!question || loading} 
            className="send-btn"
          >
            {loading ? "Processing..." : "Ask"}
          </button>
        </div>
      ) : (
        <button onClick={handleNewChat} className="new-chat-btn">
          Start New Chat
        </button>
      )}

      {file && <p className="file-name">📂 {file.name}</p>}

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className="message-box">
            <p><strong>You:</strong> {msg.you}</p>
            {msg.summary && <p><strong>Summary:</strong> {msg.summary}</p>}
            <p><strong>Raghav(9354537763):</strong> {msg.bot}</p>
          </div>
        ))}
      </div>

      {isVideo && fileURL && (
        <video 
          key={mediaKey}
          ref={mediaRef}
          controls 
          className="media-player"
          onLoadedMetadata={handleMediaLoaded}
          onError={handleMediaError}
          preload="metadata"
        >
          <source src={fileURL} type="video/mp4" />
        </video>
      )}
      
      {isAudio && fileURL && (
        <audio 
          key={mediaKey}
          ref={mediaRef}
          controls 
          className="media-player"
          onLoadedMetadata={handleMediaLoaded}
          onError={handleMediaError}
          preload="metadata"
        >
          <source src={fileURL} type="audio/mpeg" />
        </audio>
      )}

      {timestamps.length > 0 && (
        <div className="timestamps-container">
          <h3 className="timestamps-heading">Key Moments</h3>
          {timestamps.map((t, i) => (
            <button
              key={i}
              onClick={() => seekToTimestamp(t.start_time)}
              className="timestamp-btn"
              disabled={!mediaReady}
            >
              ▶ {typeof t.start_time === 'number' 
                ? t.start_time.toFixed(2) 
                : parseFloat(t.start_time).toFixed(2)} sec: {t.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;