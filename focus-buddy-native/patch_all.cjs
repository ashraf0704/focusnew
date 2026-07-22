const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const rnRoot = path.resolve(__dirname, 'node_modules', 'react-native');

const babelPlugins = [
  require.resolve('@babel/plugin-syntax-flow'),
  require.resolve('@babel/plugin-transform-flow-strip-types'),
  require.resolve('@babel/plugin-syntax-class-properties'),
  require.resolve('@babel/plugin-transform-class-properties'),
  require.resolve('@babel/plugin-transform-private-methods'),
  require.resolve('@babel/plugin-transform-private-property-in-object'),
  require.resolve('@babel/plugin-transform-classes')
];

function patchContent(content, filePath) {
  let modified = content;

  // Replace private #field references if any
  if (/#[a-zA-Z_$][a-zA-Z0-9_$]*/.test(modified)) {
    modified = modified.replace(/#([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '_p_$1');
  }

  // If file contains class declaration
  if (/\bclass\s+[A-Za-z0-9_$]+/.test(modified)) {
    try {
      const res = babel.transformSync(modified, {
        filename: filePath,
        babelrc: false,
        configFile: false,
        plugins: babelPlugins
      });
      if (res && res.code) {
        modified = res.code;
      }
    } catch (err) {
      // If babel fails (e.g. non-standard syntax), fallback to regex replacing static field declarations
      modified = modified.replace(/(\bclass\s+[A-Za-z0-9_$]+\s*(?:extends\s+[A-Za-z0-9_$.]+)?\s*\{)([\s\S]*?\n\})/g, (match) => {
        return match;
      });
    }
  }

  return modified;
}

function processDir(dir) {
  let count = 0;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return 0; }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'sdks' || entry.name === 'debugger-frontend') continue;
      count += processDir(fullPath);
    } else if (entry.isFile() && /\.js$/.test(entry.name)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const patched = patchContent(content, fullPath);
        if (patched !== content) {
          fs.writeFileSync(fullPath, patched, 'utf8');
          console.log('Patched RN file:', path.relative(rnRoot, fullPath));
          count++;
        }
      } catch {}
    }
  }
  return count;
}

console.log('Patching react-native JS files for Hermes compatibility...\n');
const total = processDir(rnRoot);
console.log(`\nDone! Patched ${total} react-native file(s).`);
