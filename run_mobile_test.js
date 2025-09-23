const MobileGameTestingSimulator = require('./mobile_testing_simulator.js');

async function runMobileTest() {
    console.log("📱 Starting mobile-specific math game testing...");

    const simulator = new MobileGameTestingSimulator();
    const results = await simulator.runMobileSimulation();

    // Generate and display report
    const report = simulator.generateMobileReport(results);
    console.log(report);

    // Save results to file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mobile_test_results_${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n📄 Mobile test results saved to: ${filename}`);

    return results;
}

// Run the mobile test
runMobileTest().catch(console.error);