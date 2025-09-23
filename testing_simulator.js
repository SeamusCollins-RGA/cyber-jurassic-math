/**
 * Math Game User Testing Simulator
 * Simulates 50 user sessions to identify UX improvements
 */

class GameTestingSimulator {
    constructor() {
        this.testResults = [];
        this.userProfiles = [
            { type: 'beginner', skill: 0.3, patience: 5, speedPref: 'slow' },
            { type: 'casual', skill: 0.6, patience: 8, speedPref: 'normal' },
            { type: 'gamer', skill: 0.8, patience: 12, speedPref: 'fast' },
            { type: 'expert', skill: 0.95, patience: 15, speedPref: 'turbo' }
        ];
        this.sessionMetrics = {
            totalSessions: 0,
            completedSessions: 0,
            averageScore: 0,
            averagePlayTime: 0,
            pauseUsage: 0,
            speedChanges: 0,
            ragequits: 0,
            difficultyStuckPoints: [],
            commonFailureScores: [],
            speedPreferences: {},
            userFeedback: []
        };
    }

    // Simulate a single user session
    simulateUserSession(userProfile, sessionId) {
        const session = {
            id: sessionId,
            userType: userProfile.type,
            startTime: Date.now(),
            actions: [],
            score: 0,
            timeActive: 0,
            pausesUsed: 0,
            speedChanges: 0,
            completed: false,
            failureReason: null,
            feedback: null
        };

        // Simulate game progression
        let currentScore = 0;
        let timeElapsed = 0;
        let currentSpeed = userProfile.speedPref;
        let difficulty = 1;
        let consecutiveFailures = 0;

        session.actions.push({
            type: 'game_start',
            timestamp: 0,
            speed: currentSpeed
        });

        // Simulate gameplay loop
        while (timeElapsed < 180000 && currentScore < 500) { // Max 3 minutes or 500 points
            const problemDifficulty = Math.min(10 + Math.floor(currentScore / 50), 20);
            const userSuccess = Math.random() < (userProfile.skill - (difficulty * 0.1));

            timeElapsed += this.getReactionTime(userProfile, difficulty);

            if (userSuccess) {
                const points = Math.floor(10 * difficulty * this.getSpeedMultiplier(currentSpeed));
                currentScore += points;
                consecutiveFailures = 0;

                session.actions.push({
                    type: 'correct_answer',
                    timestamp: timeElapsed,
                    score: currentScore,
                    difficulty: difficulty
                });

                // Difficulty increase
                difficulty = Math.min(difficulty + 0.1, 3);
            } else {
                consecutiveFailures++;
                session.actions.push({
                    type: 'wrong_answer',
                    timestamp: timeElapsed,
                    consecutiveFailures: consecutiveFailures
                });

                // Check for frustration points
                if (consecutiveFailures >= 3) {
                    // User might pause to change speed or quit
                    const frustrationAction = this.handleFrustration(userProfile, consecutiveFailures, currentScore);

                    if (frustrationAction === 'pause') {
                        session.pausesUsed++;
                        const newSpeed = this.suggestSpeedChange(userProfile, currentSpeed, consecutiveFailures);
                        if (newSpeed !== currentSpeed) {
                            currentSpeed = newSpeed;
                            session.speedChanges++;
                            session.actions.push({
                                type: 'speed_change',
                                timestamp: timeElapsed,
                                newSpeed: currentSpeed,
                                reason: 'frustration'
                            });
                        }
                        timeElapsed += 5000; // Pause time
                    } else if (frustrationAction === 'quit') {
                        session.failureReason = 'frustration_quit';
                        break;
                    }
                }
            }

            // Random pause usage (curious users exploring)
            if (Math.random() < 0.1 * userProfile.patience / 10) {
                session.pausesUsed++;
                session.actions.push({
                    type: 'pause_explore',
                    timestamp: timeElapsed,
                    currentScore: currentScore
                });
                timeElapsed += 3000;
            }

            // Dynamic difficulty adjustment based on performance
            if (currentScore > 0 && currentScore % 100 === 0) {
                difficulty = Math.min(difficulty + 0.2, 3);
            }
        }

        // Session completion
        session.score = currentScore;
        session.timeActive = timeElapsed;
        session.completed = currentScore >= 300 || timeElapsed >= 120000; // Success criteria
        session.endTime = Date.now();

        // Generate user feedback based on experience
        session.feedback = this.generateUserFeedback(session, userProfile);

        return session;
    }

    getReactionTime(userProfile, difficulty) {
        const baseTime = 2000; // 2 seconds base
        const skillFactor = (1 - userProfile.skill) * 1500; // Up to 1.5s penalty
        const difficultyFactor = difficulty * 200; // Up to 600ms penalty
        return baseTime + skillFactor + difficultyFactor + (Math.random() * 1000);
    }

    getSpeedMultiplier(speed) {
        const multipliers = {
            'slow': 0.6,
            'normal': 1.0,
            'fast': 1.4,
            'turbo': 1.8
        };
        return multipliers[speed] || 1.0;
    }

    handleFrustration(userProfile, consecutiveFailures, currentScore) {
        const quitProbability = Math.min(consecutiveFailures * 0.2 - (userProfile.patience * 0.02), 0.8);
        const pauseProbability = 0.6; // Most users try to adjust before quitting

        if (Math.random() < quitProbability && currentScore < 50) {
            return 'quit';
        } else if (Math.random() < pauseProbability) {
            return 'pause';
        }
        return 'continue';
    }

    suggestSpeedChange(userProfile, currentSpeed, consecutiveFailures) {
        const speeds = ['slow', 'normal', 'fast', 'turbo'];
        const currentIndex = speeds.indexOf(currentSpeed);

        // If struggling, suggest slower speed
        if (consecutiveFailures >= 4 && currentIndex > 0) {
            return speeds[currentIndex - 1];
        }

        // If doing well but user is impatient, might try faster
        if (consecutiveFailures < 2 && userProfile.patience > 8 && currentIndex < speeds.length - 1) {
            return Math.random() < 0.3 ? speeds[currentIndex + 1] : currentSpeed;
        }

        return currentSpeed;
    }

    generateUserFeedback(session, userProfile) {
        const feedback = {
            enjoyment: 0, // 1-10 scale
            difficulty: 0, // 1-10 scale (1 = too easy, 10 = too hard)
            controls: 0, // 1-10 scale
            recommendations: []
        };

        // Enjoyment based on success rate and time spent
        const successRate = session.actions.filter(a => a.type === 'correct_answer').length /
                          Math.max(session.actions.filter(a => a.type === 'correct_answer' || a.type === 'wrong_answer').length, 1);

        feedback.enjoyment = Math.max(1, Math.min(10,
            5 + (successRate * 4) + (session.completed ? 2 : -2) + (Math.random() * 2 - 1)
        ));

        // Difficulty perception
        if (successRate > 0.8) {
            feedback.difficulty = 2 + Math.random() * 2; // Too easy
            feedback.recommendations.push("Add more challenging problems");
        } else if (successRate < 0.3) {
            feedback.difficulty = 8 + Math.random() * 2; // Too hard
            feedback.recommendations.push("Need better difficulty progression");
        } else {
            feedback.difficulty = 4 + Math.random() * 3; // Just right
        }

        // Controls feedback
        feedback.controls = 7 + Math.random() * 2; // Generally good
        if (session.pausesUsed > 0) {
            feedback.recommendations.push("Pause menu is helpful");
        }
        if (session.speedChanges > 0) {
            feedback.recommendations.push("Speed adjustment is useful");
        }

        // Specific feedback based on user type
        switch (userProfile.type) {
            case 'beginner':
                if (!session.completed) {
                    feedback.recommendations.push("Need tutorial mode");
                    feedback.recommendations.push("More encouraging feedback");
                }
                break;
            case 'expert':
                if (session.completed && session.timeActive < 60000) {
                    feedback.recommendations.push("Need harder challenges");
                    feedback.recommendations.push("Add time-based scoring");
                }
                break;
            case 'gamer':
                feedback.recommendations.push("Add achievements");
                feedback.recommendations.push("Show progress bars");
                break;
        }

        return feedback;
    }

    // Run full simulation
    async runSimulation() {
        console.log("🧪 Starting 50-session user testing simulation...");

        this.testResults = [];
        const progressInterval = setInterval(() => {
            console.log(`Progress: ${this.testResults.length}/50 sessions completed`);
        }, 1000);

        for (let i = 0; i < 50; i++) {
            // Select random user profile
            const userProfile = this.userProfiles[Math.floor(Math.random() * this.userProfiles.length)];

            // Simulate session
            const session = this.simulateUserSession(userProfile, i + 1);
            this.testResults.push(session);

            // Small delay to simulate real testing
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        clearInterval(progressInterval);

        // Analyze results
        this.analyzeResults();

        // Generate enhancement recommendations
        const recommendations = this.generateEnhancements();

        console.log("✅ Testing simulation completed!");
        return {
            results: this.sessionMetrics,
            recommendations: recommendations,
            rawData: this.testResults
        };
    }

    analyzeResults() {
        this.sessionMetrics.totalSessions = this.testResults.length;
        this.sessionMetrics.completedSessions = this.testResults.filter(s => s.completed).length;
        this.sessionMetrics.averageScore = this.testResults.reduce((sum, s) => sum + s.score, 0) / this.testResults.length;
        this.sessionMetrics.averagePlayTime = this.testResults.reduce((sum, s) => sum + s.timeActive, 0) / this.testResults.length / 1000;
        this.sessionMetrics.pauseUsage = this.testResults.reduce((sum, s) => sum + s.pausesUsed, 0);
        this.sessionMetrics.speedChanges = this.testResults.reduce((sum, s) => sum + s.speedChanges, 0);
        this.sessionMetrics.ragequits = this.testResults.filter(s => s.failureReason === 'frustration_quit').length;

        // Speed preferences
        this.testResults.forEach(session => {
            const speedActions = session.actions.filter(a => a.type === 'speed_change');
            speedActions.forEach(action => {
                this.sessionMetrics.speedPreferences[action.newSpeed] =
                    (this.sessionMetrics.speedPreferences[action.newSpeed] || 0) + 1;
            });
        });

        // Common failure points
        const failedSessions = this.testResults.filter(s => !s.completed);
        this.sessionMetrics.commonFailureScores = failedSessions.map(s => s.score).sort((a, b) => a - b);

        // Aggregate user feedback
        this.sessionMetrics.userFeedback = this.testResults.map(s => s.feedback);
    }

    generateEnhancements() {
        const enhancements = [];
        const metrics = this.sessionMetrics;

        // Completion rate analysis
        const completionRate = metrics.completedSessions / metrics.totalSessions;
        if (completionRate < 0.6) {
            enhancements.push({
                priority: 'HIGH',
                category: 'Difficulty',
                issue: 'Low completion rate',
                recommendation: 'Implement adaptive difficulty that reduces when player struggles',
                implementation: 'Add dynamic difficulty scaling based on consecutive failures'
            });
        }

        // Rage quit analysis
        const ragequitRate = metrics.ragequits / metrics.totalSessions;
        if (ragequitRate > 0.2) {
            enhancements.push({
                priority: 'HIGH',
                category: 'User Experience',
                issue: 'High frustration quit rate',
                recommendation: 'Add encouraging feedback and help hints',
                implementation: 'Show hints after 3 wrong answers, add motivational messages'
            });
        }

        // Pause usage analysis
        if (metrics.pauseUsage > metrics.totalSessions * 0.8) {
            enhancements.push({
                priority: 'MEDIUM',
                category: 'UI/UX',
                issue: 'High pause usage indicates good feature adoption',
                recommendation: 'Enhance pause menu with more options',
                implementation: 'Add sound settings, visual effects toggle, and help section'
            });
        }

        // Speed change analysis
        if (metrics.speedChanges > 0) {
            const topSpeed = Object.keys(metrics.speedPreferences).reduce((a, b) =>
                metrics.speedPreferences[a] > metrics.speedPreferences[b] ? a : b
            );
            enhancements.push({
                priority: 'LOW',
                category: 'Performance',
                issue: 'Speed adjustment feature is being used',
                recommendation: `Most popular speed is "${topSpeed}" - consider making this default`,
                implementation: `Set default speed to ${topSpeed} for new players`
            });
        }

        // Feedback analysis
        const avgEnjoyment = metrics.userFeedback.reduce((sum, f) => sum + f.enjoyment, 0) / metrics.userFeedback.length;
        if (avgEnjoyment < 6) {
            enhancements.push({
                priority: 'HIGH',
                category: 'Game Design',
                issue: 'Low average enjoyment score',
                recommendation: 'Add more engaging visual feedback and rewards',
                implementation: 'Implement combo system, achievement badges, and better particle effects'
            });
        }

        // Common recommendations from feedback
        const allRecommendations = metrics.userFeedback.flatMap(f => f.recommendations);
        const recommendationCounts = {};
        allRecommendations.forEach(rec => {
            recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
        });

        Object.entries(recommendationCounts)
            .filter(([rec, count]) => count >= 5) // At least 10% of users suggested it
            .forEach(([rec, count]) => {
                enhancements.push({
                    priority: 'MEDIUM',
                    category: 'User Request',
                    issue: `${count} users suggested: ${rec}`,
                    recommendation: rec,
                    implementation: 'User-driven feature request'
                });
            });

        return enhancements.sort((a, b) => {
            const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // Generate detailed report
    generateReport(results) {
        return `
🎮 MATH GAME USER TESTING REPORT
=================================

📊 OVERALL METRICS
- Total Sessions: ${results.results.totalSessions}
- Completion Rate: ${((results.results.completedSessions / results.results.totalSessions) * 100).toFixed(1)}%
- Average Score: ${Math.round(results.results.averageScore)}
- Average Play Time: ${Math.round(results.results.averagePlayTime)}s
- Total Pauses Used: ${results.results.pauseUsage}
- Speed Changes: ${results.results.speedChanges}
- Rage Quits: ${results.results.ragequits}

🎯 KEY FINDINGS
${results.recommendations.slice(0, 5).map(r => `
  ${r.priority} PRIORITY - ${r.category}
  Issue: ${r.issue}
  Recommendation: ${r.recommendation}
  Implementation: ${r.implementation}
`).join('')}

💡 TOP ENHANCEMENT PRIORITIES
${results.recommendations.filter(r => r.priority === 'HIGH').map((r, i) => `
  ${i + 1}. ${r.recommendation}
     Category: ${r.category}
     Implementation: ${r.implementation}
`).join('')}

📈 SPEED PREFERENCES
${Object.entries(results.results.speedPreferences).map(([speed, count]) => `
  ${speed}: ${count} changes`).join('')}

🎨 USER SATISFACTION
Average Enjoyment: ${(results.results.userFeedback.reduce((sum, f) => sum + f.enjoyment, 0) / results.results.userFeedback.length).toFixed(1)}/10
Average Difficulty Rating: ${(results.results.userFeedback.reduce((sum, f) => sum + f.difficulty, 0) / results.results.userFeedback.length).toFixed(1)}/10
Average Controls Rating: ${(results.results.userFeedback.reduce((sum, f) => sum + f.controls, 0) / results.results.userFeedback.length).toFixed(1)}/10
        `;
    }
}

// Export for use in browser console or testing environment
if (typeof window !== 'undefined') {
    window.GameTestingSimulator = GameTestingSimulator;
}

// Node.js export
if (typeof module !== 'undefined') {
    module.exports = GameTestingSimulator;
}