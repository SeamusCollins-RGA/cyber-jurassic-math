const GameTestingSimulator = require('./testing_simulator.js');

async function runFullTest() {
    console.log("🚀 Starting comprehensive math game testing...");

    const simulator = new GameTestingSimulator();
    const results = await simulator.runSimulation();

    // Generate and display report
    const report = simulator.generateReport(results);
    console.log(report);

    // Save results to file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test_results_${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${filename}`);

    return results;
}

// Run the test
runFullTest().catch(console.error);