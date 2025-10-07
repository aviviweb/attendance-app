import React, { useState, useEffect, useRef } from 'react';
import './styles/AIAssistant.css';

const AIAssistant = () => {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiFeatures, setAiFeatures] = useState({
    faceRecognition: true,
    behaviorAnalysis: true,
    fraudDetection: true,
    predictiveAnalytics: true,
    smartScheduling: true,
    voiceCommands: true
  });
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // אתחול Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'he-IL';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // הודעת ברוכים הבאים
    setMessages([
      {
        id: 1,
        type: 'ai',
        text: 'שלום! אני העוזר החכם שלך. איך אוכל לעזור לך היום?',
        timestamp: new Date().toISOString()
      }
    ]);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // סימולציה של תגובת AI
    setTimeout(() => {
      const aiResponse = generateAIResponse(message);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: aiResponse,
        timestamp: new Date().toISOString(),
        actions: getMessageActions(message)
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('נוכחות') || lowerMessage.includes('attendance')) {
      return 'אני יכול לעזור לך עם נוכחות עובדים. אני יכול לנתח דפוסי נוכחות, לזהות חריגות ולהציע שיפורים. מה תרצה לדעת?';
    }
    
    if (lowerMessage.includes('דוח') || lowerMessage.includes('report')) {
      return 'אני יכול ליצור דוחות חכמים עבורך! אני יכול לנתח נתונים, לזהות מגמות ולהציע תובנות. איזה סוג דוח אתה צריך?';
    }
    
    if (lowerMessage.includes('הונאה') || lowerMessage.includes('fraud')) {
      return 'אני מפעיל מערכת זיהוי הונאה מתקדמת. אני יכול לזהות פעילות חשודה, GPS jumps, וחריגות בזמנים. האם יש משהו ספציפי שאתה רוצה שאבדוק?';
    }
    
    if (lowerMessage.includes('מפה') || lowerMessage.includes('map')) {
      return 'אני יכול לעזור לך עם המפה! אני יכול לנתח מיקומי עובדים, לזהות אזורי עבודה אופטימליים ולהציע שיפורים בגיאופינסינג. מה תרצה לעשות?';
    }
    
    if (lowerMessage.includes('תזמון') || lowerMessage.includes('schedule')) {
      return 'אני יכול לעזור לך עם תזמון חכם! אני יכול לנתח דפוסי עבודה, לזהות זמנים אופטימליים ולהציע לוחות זמנים משופרים. איך אוכל לעזור?';
    }
    
    if (lowerMessage.includes('עובד') || lowerMessage.includes('employee')) {
      return 'אני יכול לעזור לך עם ניהול עובדים! אני יכול לנתח ביצועים, לזהות צרכים ולהציע שיפורים. איזה עובד אתה רוצה לבדוק?';
    }
    
    return 'אני כאן לעזור לך! אני יכול לעזור עם נוכחות, דוחות, זיהוי הונאה, מפות, תזמון ועוד. מה תרצה לעשות?';
  };

  const getMessageActions = (message) => {
    const lowerMessage = message.toLowerCase();
    const actions = [];

    if (lowerMessage.includes('דוח') || lowerMessage.includes('report')) {
      actions.push(
        { label: '📊 צור דוח נוכחות', action: 'create-attendance-report' },
        { label: '📈 דוח תפוקה', action: 'create-productivity-report' },
        { label: '⏰ דוח שעות', action: 'create-hours-report' }
      );
    }

    if (lowerMessage.includes('הונאה') || lowerMessage.includes('fraud')) {
      actions.push(
        { label: '🔍 סרוק חריגות', action: 'scan-anomalies' },
        { label: '📋 דוח הונאה', action: 'fraud-report' },
        { label: '⚙️ הגדרות זיהוי', action: 'fraud-settings' }
      );
    }

    if (lowerMessage.includes('מפה') || lowerMessage.includes('map')) {
      actions.push(
        { label: '🗺️ פתח מפה', action: 'open-map' },
        { label: '📍 ניתוח מיקומים', action: 'analyze-locations' },
        { label: '🎯 אופטימיזציה', action: 'optimize-locations' }
      );
    }

    return actions;
  };

  const handleActionClick = (action) => {
    const actionMessage = {
      id: Date.now(),
      type: 'ai',
      text: `מבצע פעולה: ${action}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, actionMessage]);

    // כאן יהיה ביצוע הפעולה בפועל
    setTimeout(() => {
      const resultMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: `פעולה הושלמה בהצלחה!`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, resultMessage]);
    }, 1000);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleAI = () => {
    setIsActive(!isActive);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        text: 'הצ\'אט נוקה. איך אוכל לעזור לך?',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleFeatureToggle = (feature) => {
    setAiFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  return (
    <>
      {/* כפתור הפעלה */}
      <button 
        className={`ai-toggle-btn ${isActive ? 'active' : ''}`}
        onClick={toggleAI}
      >
        {isActive ? '🤖' : '🤖'}
        <span className="ai-status">
          {isActive ? 'סגור AI' : 'פתח AI'}
        </span>
      </button>

      {/* חלון AI */}
      {isActive && (
        <div className="ai-assistant">
          <div className="ai-header">
            <div className="ai-title">
              <div className="ai-avatar">🤖</div>
              <div className="ai-info">
                <h3>עוזר AI חכם</h3>
                <p>זיהוי פנים • ניתוח התנהגות • זיהוי הונאה</p>
              </div>
            </div>
            <div className="ai-controls">
              <button className="control-btn" onClick={clearChat}>
                🗑️
              </button>
              <button className="control-btn" onClick={toggleAI}>
                ✕
              </button>
            </div>
          </div>

          <div className="ai-features">
            <div className="feature-grid">
              <label className="feature-item">
                <input 
                  type="checkbox" 
                  checked={aiFeatures.faceRecognition}
                  onChange={() => handleFeatureToggle('faceRecognition')}
                />
                <span>👤 זיהוי פנים</span>
              </label>
              <label className="feature-item">
                <input 
                  type="checkbox" 
                  checked={aiFeatures.behaviorAnalysis}
                  onChange={() => handleFeatureToggle('behaviorAnalysis')}
                />
                <span>🧠 ניתוח התנהגות</span>
              </label>
              <label className="feature-item">
                <input 
                  type="checkbox" 
                  checked={aiFeatures.fraudDetection}
                  onChange={() => handleFeatureToggle('fraudDetection')}
                />
                <span>🚨 זיהוי הונאה</span>
              </label>
              <label className="feature-item">
                <input 
                  type="checkbox" 
                  checked={aiFeatures.predictiveAnalytics}
                  onChange={() => handleFeatureToggle('predictiveAnalytics')}
                />
                <span>📊 ניתוח חיזוי</span>
              </label>
              <label className="feature-item">
                <input 
                  type="checkbox" 
                  checked={aiFeatures.smartScheduling}
                  onChange={() => handleFeatureToggle('smartScheduling')}
                />
                <span>⏰ תזמון חכם</span>
              </label>
              <label className="feature-item">
                <input 
                  type="checkbox" 
                  checked={aiFeatures.voiceCommands}
                  onChange={() => handleFeatureToggle('voiceCommands')}
                />
                <span>🎤 פקודות קול</span>
              </label>
            </div>
          </div>

          <div className="ai-chat">
            <div className="messages-container">
              {messages.map(message => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-content">
                    <div className="message-text">{message.text}</div>
                    <div className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString('he-IL')}
                    </div>
                    {message.actions && (
                      <div className="message-actions">
                        {message.actions.map((action, index) => (
                          <button 
                            key={index}
                            className="action-btn"
                            onClick={() => handleActionClick(action.action)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message ai typing">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
              <div className="input-group">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="שאל את העוזר החכם..."
                  className="message-input"
                />
                <button 
                  className={`voice-btn ${isListening ? 'listening' : ''}`}
                  onClick={isListening ? stopListening : startListening}
                  disabled={!aiFeatures.voiceCommands}
                >
                  {isListening ? '🔴' : '🎤'}
                </button>
                <button 
                  className="send-btn"
                  onClick={() => handleSendMessage()}
                >
                  📤
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;


