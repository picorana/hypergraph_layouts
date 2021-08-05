var gulp = require('gulp');
var concat = require('gulp-concat');
// var sourcemaps = require('gulp-sourcemaps');
 
gulp.task('compile1', function() {
  return gulp.src(['src/**/*.js', '!src/nodescript.js'])
      .pipe(concat('tmp.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('compile2', function() {
  return gulp.src(['dist/tmp.js', 'src/nodescript.js'])
    .pipe(concat('all.js'))
  .pipe(gulp.dest('dist'));
});

// watch js and html files, reload when something changes
// gulp.task('watch', function() {
//   gulp.watch(
//     ['./src/**/*.js', './lib/*.js', './*.html'],
//     gulp.parallel('compile1', 'compile2'),
//   );
//   // browserSync.reload();
// });

// default task
gulp.task('default', gulp.parallel('compile1', 'compile2'));