import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './PuzzleGames.css';

const PuzzleGames = () => {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameScore, setGameScore] = useState(0);
  // const [gameTime, setGameTime] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  // Memory Game State
  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);

  // Reaction Time Game State
  const [reactionStarted, setReactionStarted] = useState(false);
  const [reactionTime, setReactionTime] = useState(null);
  const [reactionStartTime, setReactionStartTime] = useState(null);

  // Pattern Game State
  const [pattern, setPattern] = useState([]);
  const [userPattern, setUserPattern] = useState([]);
  const [showingPattern, setShowingPattern] = useState(false);
  const [patternLevel, setPatternLevel] = useState(1);

  const games = [
    {
      id: 'memory',
      name: 'Memory Challenge',
      description: 'Test your memory skills by matching pairs of cards',
      icon: 'fas fa-brain',
      category: 'Cognitive',
      difficulty: 'Medium'
    },
    {
      id: 'reaction',
      name: 'Reaction Time',
      description: 'Measure your reaction speed and reflexes',
      icon: 'fas fa-stopwatch',
      category: 'Reflexes',
      difficulty: 'Easy'
    },
    {
      id: 'pattern',
      name: 'Pattern Recognition',
      description: 'Remember and repeat increasingly complex patterns',
      icon: 'fas fa-puzzle-piece',
      category: 'Cognitive',
      difficulty: 'Hard'
    },
    {
      id: 'coordination',
      name: 'Hand-Eye Coordination',
      description: 'Click moving targets to test your coordination',
      icon: 'fas fa-crosshairs',
      category: 'Motor Skills',
      difficulty: 'Medium'
    }
  ];

  // Memory Game Functions
  const initializeMemoryGame = () => {
    const symbols = ['🏃', '⚽', '🏀', '🎾', '🏐', '🏈', '⚾', '🏓'];
    const cards = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
        flipped: false,
        matched: false
      }));
    
    setMemoryCards(cards);
    setFlippedCards([]);
    setMatchedCards([]);
    setGameScore(0);
    setGameActive(true);
  };

  const handleCardClick = (cardId) => {
    if (!gameActive || flippedCards.length >= 2) return;
    
    const card = memoryCards.find(c => c.id === cardId);
    if (card.flipped || card.matched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setMemoryCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, flipped: true } : c
    ));

    if (newFlippedCards.length === 2) {
      const [first, second] = newFlippedCards;
      const firstCard = memoryCards.find(c => c.id === first);
      const secondCard = memoryCards.find(c => c.id === second);

      if (firstCard.symbol === secondCard.symbol) {
        // Match found
        setTimeout(() => {
          setMemoryCards(prev => prev.map(c => 
            (c.id === first || c.id === second) ? { ...c, matched: true } : c
          ));
          setMatchedCards(prev => [...prev, first, second]);
          setGameScore(prev => prev + 10);
          setFlippedCards([]);
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setMemoryCards(prev => prev.map(c => 
            (c.id === first || c.id === second) ? { ...c, flipped: false } : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Reaction Time Game Functions
  const startReactionGame = () => {
    setReactionStarted(false);
    setReactionTime(null);
    setGameActive(true);
    
    const delay = Math.random() * 3000 + 2000; // 2-5 seconds
    setTimeout(() => {
      setReactionStarted(true);
      setReactionStartTime(Date.now());
    }, delay);
  };

  const handleReactionClick = () => {
    if (!reactionStarted) {
      setGameActive(false);
      setReactionTime('Too early!');
      return;
    }

    const time = Date.now() - reactionStartTime;
    setReactionTime(time);
    setGameActive(false);
    setGameScore(Math.max(0, 1000 - time));
  };

  // Pattern Game Functions
  const generatePattern = (level) => {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const newPattern = [];
    for (let i = 0; i < level + 2; i++) {
      newPattern.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    return newPattern;
  };

  const startPatternGame = () => {
    const newPattern = generatePattern(patternLevel);
    setPattern(newPattern);
    setUserPattern([]);
    setShowingPattern(true);
    setGameActive(true);
    
    // Show pattern for 2 seconds
    setTimeout(() => {
      setShowingPattern(false);
    }, 2000);
  };

  const handlePatternClick = (color) => {
    if (showingPattern || !gameActive) return;
    
    const newUserPattern = [...userPattern, color];
    setUserPattern(newUserPattern);

    if (newUserPattern[newUserPattern.length - 1] !== pattern[newUserPattern.length - 1]) {
      // Wrong pattern
      setGameActive(false);
      setGameScore(0);
      return;
    }

    if (newUserPattern.length === pattern.length) {
      // Pattern completed successfully
      setGameScore(prev => prev + patternLevel * 10);
      setPatternLevel(prev => prev + 1);
      setTimeout(() => {
        startPatternGame();
      }, 1000);
    }
  };

  const renderGameContent = () => {
    switch (selectedGame) {
      case 'memory':
        return (
          <div className="memory-game">
            <div className="game-header">
              <h3>Memory Challenge</h3>
              <div className="game-stats">
                <span>Score: {gameScore}</span>
                <span>Matches: {matchedCards.length / 2}/8</span>
              </div>
            </div>
            <div className="memory-grid">
              {memoryCards.map(card => (
                <div
                  key={card.id}
                  className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
                  onClick={() => handleCardClick(card.id)}
                >
                  <div className="card-front">?</div>
                  <div className="card-back">{card.symbol}</div>
                </div>
              ))}
            </div>
            <button onClick={initializeMemoryGame} className="btn btn-primary">
              New Game
            </button>
          </div>
        );

      case 'reaction':
        return (
          <div className="reaction-game">
            <div className="game-header">
              <h3>Reaction Time Test</h3>
              <div className="game-stats">
                <span>Best Score: {gameScore}</span>
              </div>
            </div>
            <div className="reaction-area">
              {!gameActive && !reactionTime && (
                <div className="reaction-start">
                  <p>Click the button below to start. Wait for the green signal, then click as fast as you can!</p>
                  <button onClick={startReactionGame} className="btn btn-primary">
                    Start Test
                  </button>
                </div>
              )}
              
              {gameActive && !reactionStarted && (
                <div className="reaction-waiting">
                  <div className="waiting-indicator">
                    <p>Wait for it...</p>
                  </div>
                </div>
              )}
              
              {gameActive && reactionStarted && (
                <div className="reaction-ready" onClick={handleReactionClick}>
                  <div className="ready-indicator">
                    <p>CLICK NOW!</p>
                  </div>
                </div>
              )}
              
              {reactionTime && (
                <div className="reaction-result">
                  <h4>Result: {typeof reactionTime === 'number' ? `${reactionTime}ms` : reactionTime}</h4>
                  <button onClick={startReactionGame} className="btn btn-primary">
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'pattern':
        return (
          <div className="pattern-game">
            <div className="game-header">
              <h3>Pattern Recognition</h3>
              <div className="game-stats">
                <span>Level: {patternLevel}</span>
                <span>Score: {gameScore}</span>
              </div>
            </div>
            <div className="pattern-area">
              <div className="pattern-display">
                {pattern.map((color, index) => (
                  <div
                    key={index}
                    className={`pattern-dot ${color} ${showingPattern ? 'showing' : ''}`}
                  ></div>
                ))}
              </div>
              <div className="pattern-controls">
                {['red', 'blue', 'green', 'yellow'].map(color => (
                  <button
                    key={color}
                    className={`pattern-btn ${color}`}
                    onClick={() => handlePatternClick(color)}
                    disabled={showingPattern}
                  >
                    {color}
                  </button>
                ))}
              </div>
              {!gameActive && (
                <button onClick={startPatternGame} className="btn btn-primary">
                  Start Game
                </button>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="game-placeholder">
            <h3>Coming Soon!</h3>
            <p>This game is under development. Check back soon for more brain training exercises!</p>
          </div>
        );
    }
  };

  return (
    <div className="puzzle-games-page">
      <div className="container">
        <section className="games-header">
          <h1>Puzzle Games</h1>
          <p>Train your cognitive abilities with fun and challenging brain games</p>
        </section>

        {!selectedGame ? (
          <div className="games-selection">
            <div className="games-grid">
              {games.map(game => (
                <div key={game.id} className="game-card" onClick={() => setSelectedGame(game.id)}>
                  <div className="game-icon">
                    <i className={game.icon}></i>
                  </div>
                  <div className="game-info">
                    <h3>{game.name}</h3>
                    <p>{game.description}</p>
                    <div className="game-meta">
                      <span className="game-category">{game.category}</span>
                      <span className={`game-difficulty ${game.difficulty.toLowerCase()}`}>
                        {game.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="benefits-section">
              <h2>Benefits of Brain Training</h2>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <i className="fas fa-brain"></i>
                  <h4>Cognitive Enhancement</h4>
                  <p>Improve memory, attention, and processing speed</p>
                </div>
                <div className="benefit-item">
                  <i className="fas fa-eye"></i>
                  <h4>Visual Processing</h4>
                  <p>Enhance visual perception and spatial awareness</p>
                </div>
                <div className="benefit-item">
                  <i className="fas fa-bolt"></i>
                  <h4>Reaction Time</h4>
                  <p>Develop faster reflexes and decision-making</p>
                </div>
                <div className="benefit-item">
                  <i className="fas fa-target"></i>
                  <h4>Focus & Concentration</h4>
                  <p>Build sustained attention and mental endurance</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="game-container">
            <div className="game-navigation">
              <button 
                onClick={() => setSelectedGame(null)}
                className="btn btn-secondary"
              >
                <i className="fas fa-arrow-left"></i>
                Back to Games
              </button>
            </div>
            
            <div className="game-content">
              {renderGameContent()}
            </div>
          </div>
        )}

        {user && (
          <div className="user-progress">
            <h3>Your Progress</h3>
            <div className="progress-stats">
              <div className="stat-item">
                <span className="stat-value">{user.points || 0}</span>
                <span className="stat-label">Total Points</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user.level || 1}</span>
                <span className="stat-label">Level</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user.badges?.length || 0}</span>
                <span className="stat-label">Badges</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleGames;
