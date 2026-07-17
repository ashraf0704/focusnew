import autocannon from 'autocannon';

async function runLoadTest() {
  const url = process.env.API_URL || 'http://localhost:4000/health';
  console.log(`Starting baseline load test against ${url}...`);
  console.log(`Config: 100 virtual users (connections) running for 60 seconds.`);

  try {
    const result = await autocannon({
      url,
      connections: 100,
      duration: 60,
    });

    console.log('\n========================================');
    console.log('            LOAD TEST RESULTS           ');
    console.log('========================================');
    console.log(`Requests per second (RPS):`);
    console.log(`  Average: ${result.requests.average} req/sec`);
    console.log(`  Max: ${result.requests.max} req/sec`);
    console.log('\nResponse Time (Latency):');
    console.log(`  Average: ${result.latency.average} ms`);
    console.log(`  Min: ${result.latency.min} ms`);
    console.log(`  Max: ${result.latency.max} ms`);
    console.log('========================================');

    // A simple sanity check on success rate
    if (result.errors > 0 || result.non2xx > 0) {
      console.warn(`Warning: There were ${result.errors} connection errors and ${result.non2xx} non-2xx responses during the test.`);
    } else {
      console.log('Performance test completed successfully with 100% success rate.');
    }
  } catch (err) {
    console.error('Load test run failed:', err);
    process.exit(1);
  }
}

runLoadTest();
