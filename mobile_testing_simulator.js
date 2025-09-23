/**
 * Mobile-Specific Math Game User Testing Simulator
 * Simulates 40 mobile user sessions to identify mobile UX issues
 */

class MobileGameTestingSimulator {
    constructor() {
        this.testResults = [];
        this.mobileUserProfiles = [
            { type: 'phone_portrait', device: 'iPhone', skill: 0.5, patience: 6, touchAccuracy: 0.8, screenSize: 'small' },
            { type: 'phone_landscape', device: 'iPhone', skill: 0.6, patience: 7, touchAccuracy: 0.9, screenSize: 'small' },
            { type: 'tablet_portrait', device: 'iPad', skill: 0.7, patience: 9, touchAccuracy: 0.95, screenSize: 'large' },
            { type: 'tablet_landscape', device: 'iPad', skill: 0.8, patience: 10, touchAccuracy: 0.95, screenSize: 'large' },
            { type: 'android_phone', device: 'Android', skill: 0.55, patience: 6, touchAccuracy: 0.75, screenSize: 'medium' },
            { type: 'android_tablet', device: 'AndroidTab', skill: 0.75, patience: 8, touchAccuracy: 0.9, screenSize: 'large' }
        ];
        this.mobileIssues = {
            touchMisses: 0,
            pinchZoomAttempts: 0,
            orientationChanges: 0,
            keyboardIssues: 0,
            pauseMenuUsability: 0,
            buttonSizeComplaints: 0,
            textReadability: 0,
            performanceIssues: 0,
            batteryDrain: 0
        };
    }

    simulateMobileSession(userProfile, sessionId) {
        const session = {
            id: sessionId,
            device: userProfile.device,
            orientation: userProfile.type.includes('landscape') ? 'landscape' : 'portrait',
            userType: userProfile.type,
            startTime: Date.now(),
            actions: [],
            score: 0,
            timeActive: 0,
            mobileIssues: [],
            touchInteractions: 0,
            successful: false,
            quitReason: null,
            usabilityScore: 0
        };

        let currentScore = 0;
        let timeElapsed = 0;
        let touchMisses = 0;
        let frustrationLevel = 0;

        session.actions.push({
            type: 'mobile_game_start',
            timestamp: 0,
            device: userProfile.device,
            orientation: session.orientation,
            screenSize: userProfile.screenSize
        });

        // Mobile-specific initial setup challenges
        if (Math.random() < 0.3) {
            session.mobileIssues.push('canvas_sizing_issue');
            timeElapsed += 2000; // Time spent trying to see full game
        }

        // Simulate mobile gameplay
        while (timeElapsed < 120000 && currentScore < 400 && frustrationLevel < 10) {
            const problemDifficulty = Math.min(1 + Math.floor(currentScore / 100), 3);

            // Mobile touch interaction
            session.touchInteractions++;
            const touchSuccess = Math.random() < userProfile.touchAccuracy;

            if (!touchSuccess) {
                touchMisses++;
                this.mobileIssues.touchMisses++;
                session.mobileIssues.push({
                    type: 'touch_miss',
                    timestamp: timeElapsed,
                    target: 'answer_input'
                });
                frustrationLevel += 0.5;
                timeElapsed += 1000; // Time to retry touch
            }

            // Keyboard appearance issues on mobile
            if (Math.random() < 0.4 && userProfile.screenSize === 'small') {
                session.mobileIssues.push({
                    type: 'keyboard_obstruction',
                    timestamp: timeElapsed,
                    description: 'Virtual keyboard blocks game view'
                });
                this.mobileIssues.keyboardIssues++;
                timeElapsed += 2000; // Time to scroll/adjust
                frustrationLevel += 1;
            }

            // Answer accuracy affected by mobile UI
            const baseAccuracy = userProfile.skill;
            const mobileUIFactor = userProfile.screenSize === 'small' ? 0.85 : 0.95;
            const touchAccuracyFactor = touchSuccess ? 1.0 : 0.7;

            const adjustedAccuracy = baseAccuracy * mobileUIFactor * touchAccuracyFactor;
            const answerCorrect = Math.random() < adjustedAccuracy;

            timeElapsed += this.getMobileReactionTime(userProfile, problemDifficulty);

            if (answerCorrect) {
                const points = 10 * problemDifficulty;
                currentScore += points;
                frustrationLevel = Math.max(0, frustrationLevel - 0.2);

                session.actions.push({
                    type: 'mobile_correct_answer',
                    timestamp: timeElapsed,
                    score: currentScore,
                    touchAccuracy: touchSuccess
                });
            } else {
                frustrationLevel += 1;
                session.actions.push({
                    type: 'mobile_wrong_answer',
                    timestamp: timeElapsed,
                    frustrationLevel: frustrationLevel
                });
            }

            // Mobile-specific interruptions
            if (Math.random() < 0.1) {
                const interruption = this.simulateMobileInterruption(userProfile);
                if (interruption) {
                    session.mobileIssues.push(interruption);
                    timeElapsed += interruption.delay;

                    if (interruption.type === 'app_background') {
                        // Some users don't return after backgrounding
                        if (Math.random() < 0.3) {
                            session.quitReason = 'app_interrupted';
                            break;
                        }
                    }
                }
            }

            // Test pause menu on mobile
            if (Math.random() < 0.15 && currentScore > 50) {
                const pauseSuccess = this.testMobilePauseMenu(userProfile);
                this.mobileIssues.pauseMenuUsability += pauseSuccess ? 0 : 1;

                if (!pauseSuccess) {
                    session.mobileIssues.push({
                        type: 'pause_menu_difficulty',
                        timestamp: timeElapsed,
                        issue: 'Small buttons, hard to tap'
                    });
                    frustrationLevel += 1;
                }

                timeElapsed += 3000;
            }

            // Orientation changes
            if (Math.random() < 0.05) {
                this.mobileIssues.orientationChanges++;
                session.actions.push({
                    type: 'orientation_change',
                    timestamp: timeElapsed,
                    newOrientation: session.orientation === 'portrait' ? 'landscape' : 'portrait'
                });
                session.orientation = session.orientation === 'portrait' ? 'landscape' : 'portrait';
                timeElapsed += 3000; // Reorientation delay

                // Some layout issues after rotation
                if (Math.random() < 0.4) {
                    session.mobileIssues.push({
                        type: 'rotation_layout_issue',
                        timestamp: timeElapsed,
                        description: 'Game elements overlapped after rotation'
                    });
                    frustrationLevel += 1;
                }
            }

            // Battery/performance concerns on mobile
            if (timeElapsed > 60000 && Math.random() < 0.1) {
                session.mobileIssues.push({
                    type: 'performance_slowdown',
                    timestamp: timeElapsed,
                    description: 'Frame rate drops, particles causing lag'
                });
                this.mobileIssues.performanceIssues++;
                // Slower reaction times due to lag
                timeElapsed += 500;
            }
        }

        // Session completion analysis
        session.score = currentScore;
        session.timeActive = timeElapsed;
        session.successful = currentScore >= 200 && frustrationLevel < 8;
        session.touchAccuracy = touchMisses / Math.max(session.touchInteractions, 1);

        // Calculate mobile usability score
        session.usabilityScore = this.calculateMobileUsabilityScore(session, userProfile);

        // Generate mobile-specific feedback
        session.mobileFeedback = this.generateMobileFeedback(session, userProfile);

        return session;
    }

    getMobileReactionTime(userProfile, difficulty) {
        const baseTime = 2500; // Slightly slower on mobile
        const deviceFactor = userProfile.screenSize === 'small' ? 800 : 200;
        const touchFactor = (1 - userProfile.touchAccuracy) * 1000;
        return baseTime + deviceFactor + touchFactor + (Math.random() * 800);
    }

    simulateMobileInterruption(userProfile) {
        const interruptions = [
            { type: 'notification', delay: 1500, probability: 0.3 },
            { type: 'phone_call', delay: 5000, probability: 0.1 },
            { type: 'app_background', delay: 8000, probability: 0.2 },
            { type: 'low_battery_warning', delay: 1000, probability: 0.15 },
            { type: 'network_issue', delay: 3000, probability: 0.25 }
        ];

        for (const interrupt of interruptions) {
            if (Math.random() < interrupt.probability) {
                return {
                    type: interrupt.type,
                    timestamp: Date.now(),
                    delay: interrupt.delay,
                    description: this.getInterruptionDescription(interrupt.type)
                };
            }
        }
        return null;
    }

    getInterruptionDescription(type) {
        const descriptions = {
            'notification': 'Push notification caused brief distraction',
            'phone_call': 'Incoming call interrupted game session',
            'app_background': 'User switched to another app',
            'low_battery_warning': 'Low battery popup appeared',
            'network_issue': 'Brief connectivity problem'
        };
        return descriptions[type] || 'Unknown interruption';
    }

    testMobilePauseMenu(userProfile) {
        // Simulate trying to use pause menu on mobile
        const buttonSize = userProfile.screenSize === 'small' ? 0.7 : 1.0;
        const touchAccuracy = userProfile.touchAccuracy * buttonSize;

        return Math.random() < touchAccuracy;
    }

    calculateMobileUsabilityScore(session, userProfile) {
        let score = 100;

        // Deduct for each mobile issue
        const issueDeductions = {
            'touch_miss': -2,
            'keyboard_obstruction': -5,
            'pause_menu_difficulty': -8,
            'canvas_sizing_issue': -10,
            'rotation_layout_issue': -7,
            'performance_slowdown': -5
        };

        session.mobileIssues.forEach(issue => {
            const issueType = typeof issue === 'string' ? issue : issue.type;
            score += issueDeductions[issueType] || -3;
        });

        // Bonus for successful completion on mobile
        if (session.successful) score += 20;

        // Touch accuracy factor
        score += (session.touchAccuracy * 20) - 10;

        return Math.max(0, Math.min(100, score));
    }

    generateMobileFeedback(session, userProfile) {
        const feedback = {
            overall: 0, // 1-10 scale
            touchControls: 0, // 1-10 scale
            screenLayout: 0, // 1-10 scale
            performance: 0, // 1-10 scale
            mobileRecommendations: []
        };

        // Overall mobile experience
        feedback.overall = Math.max(1, Math.min(10, session.usabilityScore / 10));

        // Touch controls rating
        const touchIssues = session.mobileIssues.filter(issue =>
            (typeof issue === 'object' && issue.type === 'touch_miss') || issue === 'touch_miss'
        ).length;
        feedback.touchControls = Math.max(1, 10 - (touchIssues * 2));

        // Screen layout rating
        const layoutIssues = session.mobileIssues.filter(issue =>
            typeof issue === 'string' ?
            ['canvas_sizing_issue', 'keyboard_obstruction', 'rotation_layout_issue'].includes(issue) :
            ['canvas_sizing_issue', 'keyboard_obstruction', 'rotation_layout_issue'].includes(issue.type)
        ).length;
        feedback.screenLayout = Math.max(1, 10 - (layoutIssues * 3));

        // Performance rating
        const perfIssues = session.mobileIssues.filter(issue =>
            (typeof issue === 'object' && issue.type === 'performance_slowdown') ||
            issue === 'performance_slowdown'
        ).length;
        feedback.performance = Math.max(1, 10 - (perfIssues * 4));

        // Generate recommendations
        if (touchIssues > 0) {
            feedback.mobileRecommendations.push('Increase button sizes for better touch targets');
        }
        if (layoutIssues > 0) {
            feedback.mobileRecommendations.push('Improve responsive layout for mobile screens');
        }
        if (perfIssues > 0) {
            feedback.mobileRecommendations.push('Optimize particle effects for mobile performance');
        }
        if (userProfile.screenSize === 'small' && !session.successful) {
            feedback.mobileRecommendations.push('Add mobile-specific UI scaling options');
        }

        // Device-specific recommendations
        switch (userProfile.device) {
            case 'iPhone':
                feedback.mobileRecommendations.push('Test safe area insets for notched devices');
                break;
            case 'Android':
                feedback.mobileRecommendations.push('Test across various Android screen densities');
                break;
        }

        return feedback;
    }

    async runMobileSimulation() {
        console.log("📱 Starting 40-session mobile user testing simulation...");

        this.testResults = [];
        const progressInterval = setInterval(() => {
            console.log(`Mobile Testing Progress: ${this.testResults.length}/40 sessions completed`);
        }, 1000);

        for (let i = 0; i < 40; i++) {
            // Select random mobile profile
            const userProfile = this.mobileUserProfiles[Math.floor(Math.random() * this.mobileUserProfiles.length)];

            // Simulate mobile session
            const session = this.simulateMobileSession(userProfile, i + 1);
            this.testResults.push(session);

            await new Promise(resolve => setTimeout(resolve, 80));
        }

        clearInterval(progressInterval);

        // Analyze mobile results
        const analysis = this.analyzeMobileResults();
        const recommendations = this.generateMobileEnhancements(analysis);

        console.log("✅ Mobile testing simulation completed!");
        return {
            results: analysis,
            recommendations: recommendations,
            rawData: this.testResults
        };
    }

    analyzeMobileResults() {
        const metrics = {
            totalSessions: this.testResults.length,
            successfulSessions: this.testResults.filter(s => s.successful).length,
            averageScore: this.testResults.reduce((sum, s) => sum + s.score, 0) / this.testResults.length,
            averageUsabilityScore: this.testResults.reduce((sum, s) => sum + s.usabilityScore, 0) / this.testResults.length,
            totalTouchInteractions: this.testResults.reduce((sum, s) => sum + s.touchInteractions, 0),
            averageTouchAccuracy: this.testResults.reduce((sum, s) => sum + s.touchAccuracy, 0) / this.testResults.length,
            deviceBreakdown: {},
            orientationBreakdown: {},
            commonMobileIssues: {},
            mobileFeedback: this.testResults.map(s => s.mobileFeedback),
            globalMobileIssues: this.mobileIssues
        };

        // Device breakdown
        this.testResults.forEach(session => {
            metrics.deviceBreakdown[session.device] = (metrics.deviceBreakdown[session.device] || 0) + 1;
        });

        // Orientation breakdown
        this.testResults.forEach(session => {
            metrics.orientationBreakdown[session.orientation] = (metrics.orientationBreakdown[session.orientation] || 0) + 1;
        });

        // Common mobile issues
        this.testResults.forEach(session => {
            session.mobileIssues.forEach(issue => {
                const issueType = typeof issue === 'string' ? issue : issue.type;
                metrics.commonMobileIssues[issueType] = (metrics.commonMobileIssues[issueType] || 0) + 1;
            });
        });

        return metrics;
    }

    generateMobileEnhancements(metrics) {
        const enhancements = [];

        // Success rate analysis
        const successRate = metrics.successfulSessions / metrics.totalSessions;
        if (successRate < 0.5) {
            enhancements.push({
                priority: 'CRITICAL',
                category: 'Mobile Usability',
                issue: `Low mobile success rate: ${(successRate * 100).toFixed(1)}%`,
                recommendation: 'Major mobile UI overhaul needed',
                implementation: 'Redesign interface specifically for touch devices',
                impact: 'HIGH'
            });
        }

        // Touch accuracy issues
        if (metrics.averageTouchAccuracy < 0.8) {
            enhancements.push({
                priority: 'HIGH',
                category: 'Touch Interface',
                issue: `Poor touch accuracy: ${(metrics.averageTouchAccuracy * 100).toFixed(1)}%`,
                recommendation: 'Increase button sizes and improve touch targets',
                implementation: 'Minimum 44px touch targets, better spacing',
                impact: 'HIGH'
            });
        }

        // Usability score analysis
        if (metrics.averageUsabilityScore < 70) {
            enhancements.push({
                priority: 'HIGH',
                category: 'Mobile UX',
                issue: `Low usability score: ${metrics.averageUsabilityScore.toFixed(1)}/100`,
                recommendation: 'Comprehensive mobile UX improvements',
                implementation: 'Mobile-first design approach, user testing',
                impact: 'HIGH'
            });
        }

        // Common issues analysis
        Object.entries(metrics.commonMobileIssues).forEach(([issue, count]) => {
            if (count > 5) { // More than 12.5% of sessions
                const issueInfo = this.getMobileIssueInfo(issue);
                enhancements.push({
                    priority: issueInfo.priority,
                    category: 'Mobile Issues',
                    issue: `${count} sessions affected by: ${issue}`,
                    recommendation: issueInfo.recommendation,
                    implementation: issueInfo.implementation,
                    impact: 'MEDIUM'
                });
            }
        });

        // Device-specific recommendations
        Object.entries(metrics.deviceBreakdown).forEach(([device, count]) => {
            if (device === 'Android' && count > 5) {
                enhancements.push({
                    priority: 'MEDIUM',
                    category: 'Device Compatibility',
                    issue: 'Android-specific testing needed',
                    recommendation: 'Enhanced Android compatibility testing',
                    implementation: 'Test on various Android devices and versions',
                    impact: 'MEDIUM'
                });
            }
        });

        return enhancements.sort((a, b) => {
            const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    getMobileIssueInfo(issue) {
        const issueMap = {
            'touch_miss': {
                priority: 'HIGH',
                recommendation: 'Increase button sizes and touch target areas',
                implementation: 'Minimum 44px touch targets with proper spacing'
            },
            'keyboard_obstruction': {
                priority: 'HIGH',
                recommendation: 'Adjust layout when virtual keyboard appears',
                implementation: 'Detect keyboard open/close, adjust viewport'
            },
            'canvas_sizing_issue': {
                priority: 'CRITICAL',
                recommendation: 'Implement proper responsive canvas sizing',
                implementation: 'CSS viewport units, dynamic canvas scaling'
            },
            'pause_menu_difficulty': {
                priority: 'MEDIUM',
                recommendation: 'Redesign pause menu for mobile',
                implementation: 'Larger buttons, simplified layout'
            },
            'rotation_layout_issue': {
                priority: 'MEDIUM',
                recommendation: 'Fix orientation change handling',
                implementation: 'Test and fix layout on orientation changes'
            },
            'performance_slowdown': {
                priority: 'HIGH',
                recommendation: 'Optimize for mobile performance',
                implementation: 'Reduce particle effects, optimize animations'
            }
        };

        return issueMap[issue] || {
            priority: 'LOW',
            recommendation: 'Address mobile-specific issue',
            implementation: 'Further investigation needed'
        };
    }

    generateMobileReport(results) {
        return `
📱 MOBILE MATH GAME USER TESTING REPORT
=======================================

📊 MOBILE-SPECIFIC METRICS
- Total Mobile Sessions: ${results.results.totalSessions}
- Mobile Success Rate: ${((results.results.successfulSessions / results.results.totalSessions) * 100).toFixed(1)}%
- Average Mobile Score: ${Math.round(results.results.averageScore)}
- Average Usability Score: ${results.results.averageUsabilityScore.toFixed(1)}/100
- Total Touch Interactions: ${results.results.totalTouchInteractions}
- Touch Accuracy: ${(results.results.averageTouchAccuracy * 100).toFixed(1)}%

📱 DEVICE BREAKDOWN
${Object.entries(results.results.deviceBreakdown).map(([device, count]) => `
  ${device}: ${count} sessions (${((count / results.results.totalSessions) * 100).toFixed(1)}%)`).join('')}

🔄 ORIENTATION BREAKDOWN
${Object.entries(results.results.orientationBreakdown).map(([orientation, count]) => `
  ${orientation}: ${count} sessions`).join('')}

⚠️ CRITICAL MOBILE ISSUES
${results.recommendations.filter(r => r.priority === 'CRITICAL').map((r, i) => `
  ${i + 1}. ${r.issue}
     Recommendation: ${r.recommendation}
     Implementation: ${r.implementation}
     Impact: ${r.impact}
`).join('')}

📈 HIGH PRIORITY MOBILE FIXES
${results.recommendations.filter(r => r.priority === 'HIGH').map((r, i) => `
  ${i + 1}. ${r.issue}
     Fix: ${r.recommendation}
     How: ${r.implementation}
`).join('')}

🔧 MOBILE ISSUE FREQUENCY
${Object.entries(results.results.commonMobileIssues).map(([issue, count]) => `
  ${issue}: ${count} occurrences`).join('')}

🎯 MOBILE UX SCORES
Average Touch Controls: ${(results.results.mobileFeedback.reduce((sum, f) => sum + f.touchControls, 0) / results.results.mobileFeedback.length).toFixed(1)}/10
Average Screen Layout: ${(results.results.mobileFeedback.reduce((sum, f) => sum + f.screenLayout, 0) / results.results.mobileFeedback.length).toFixed(1)}/10
Average Performance: ${(results.results.mobileFeedback.reduce((sum, f) => sum + f.performance, 0) / results.results.mobileFeedback.length).toFixed(1)}/10
Overall Mobile Rating: ${(results.results.mobileFeedback.reduce((sum, f) => sum + f.overall, 0) / results.results.mobileFeedback.length).toFixed(1)}/10
        `;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.MobileGameTestingSimulator = MobileGameTestingSimulator;
}

if (typeof module !== 'undefined') {
    module.exports = MobileGameTestingSimulator;
}