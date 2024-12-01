const gulp = require('gulp');
const fs = require('fs');
const path = require('path');

const paths = {
  src: 'src/**/*.js', // All JavaScript files in the src directory and subdirectories
  tests: 'test/unit/**/*.test.js', // All test files with .test.js extension
};

// Helper to ensure matching test files exist
function checkTestFiles(done) {
  const srcFiles = getFilesRecursive(paths.src);
  const missingTests = [];

  srcFiles.forEach((file) => {
    const testFile = file.replace(paths.src, paths.test).replace(/\.js$/, '.test.js');
    if (!fs.existsSync(testFile)) {
      missingTests.push(testFile);
    }
  });

  if (missingTests.length > 0) {
    console.error('Missing test files for:');
    console.error(missingTests.join('\n'));
    done(new Error('Some source files do not have corresponding test files.'));
  } else {
    done();
  }
}

// Helper to get all JavaScript files recursively
function getFilesRecursive(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursive(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

function watchFiles() {
  gulp.watch([paths.src, paths.tests], runTests);
}

async function runTests() {
  const mocha = await import('gulp-mocha');
  return gulp.src(paths.tests, { read: false })
    .pipe(mocha.default({ reporter: 'spec' }))
    .on('error', function (err) { // Use a regular function
      console.error(err);
      this.emit('end'); // Emit 'end' on the current stream
    });
}

// function runTests() {
//   return gulp.src(paths.tests, { read: false })
//     .pipe(mocha({ reporter: 'spec' }))
//     .on('error', (err) => {
//       console.error(err);
//       this.emit('end'); // Prevent Gulp from exiting on error
//     });
// }

// Define Gulp tasks
gulp.task('check-tests', checkTestFiles);
gulp.task('watch', watchFiles);
gulp.task('test', runTests);
gulp.task('default', gulp.series('test', 'watch'));
// gulp.task('test', gulp.series('check-tests', runTests));
