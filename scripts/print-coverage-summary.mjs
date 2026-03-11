import fs from 'node:fs';
import path from 'node:path';

const summaryPath = path.resolve('coverage/lcov-report/src/index.html');
const coverageDir = path.resolve('coverage');
const rootIndexPath = path.resolve('coverage/index.html');
const textSummaryPath = path.resolve('coverage/summary.txt');
const markdownSummaryPath = path.resolve('coverage/summary.md');

if (!fs.existsSync(summaryPath)) {
  console.warn(
    'Coverage summary unavailable: coverage/lcov-report/src/index.html not found',
  );
  process.exit(0);
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

const consoleLines = [
  '',
  'Source coverage (src/**/*.ts)',
  ...metrics.map(
    metric =>
      `${metric.label.padEnd(10)} ${metric.percent.padStart(7)} (${metric.fraction})`,
  ),
];

for (const line of consoleLines) {
  console.log(line);
}

fs.mkdirSync(coverageDir, { recursive: true });

const htmlRedirect = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=./lcov-report/src/index.html" />
    <title>Coverage Report</title>
  </head>
  <body>
    <p>Redirecting to <a href="./lcov-report/src/index.html">source coverage report</a>...</p>
  </body>
</html>
`;

fs.writeFileSync(rootIndexPath, htmlRedirect);
fs.writeFileSync(textSummaryPath, `${consoleLines.join('\n')}\n`);

const markdownLines = [
  '## Source coverage (`src/**/*.ts`)',
  '',
  '| Metric | Coverage | Hits |',
  '| --- | ---: | ---: |',
  ...metrics.map(metric => {
    const [hit = '0', found = '0'] = metric.fraction.split('/');
    return `| ${metric.label} | ${metric.percent} | ${hit}/${found} |`;
  }),
  '',
];

const markdownSummary = `${markdownLines.join('\n')}\n`;
fs.writeFileSync(markdownSummaryPath, markdownSummary);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdownSummary);
}
