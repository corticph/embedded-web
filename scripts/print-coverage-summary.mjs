import fs from 'node:fs';
import path from 'node:path';

const summaryPath = path.resolve('coverage/lcov-report/src/index.html');

if (!fs.existsSync(summaryPath)) {
  console.error(
    'Coverage summary unavailable: coverage/lcov-report/src/index.html not found',
  );
  process.exit(1);
}

const html = fs.readFileSync(summaryPath, 'utf8');

const metrics = ['Statements', 'Branches', 'Functions', 'Lines'].map(label => {
  const pattern = new RegExp(
    `<span class="strong">([^<]+)</span>\\s*<span class="quiet">${label}</span>\\s*<span class='fraction'>([^<]+)</span>`,
    'i',
  );
  const match = html.match(pattern);

  return {
    label,
    percent: match?.[1]?.trim() || 'Unknown%',
    fraction: match?.[2]?.trim() || '0/0',
  };
});

console.log('');
console.log('Source coverage (src/**/*.ts)');
for (const metric of metrics) {
  console.log(
    `${metric.label.padEnd(10)} ${metric.percent.padStart(7)} (${metric.fraction})`,
  );
}
