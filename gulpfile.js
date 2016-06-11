var gulp = require('gulp');

var concat = require('gulp-concat');
var concatCss = require('gulp-concat-css');

gulp.task('concatJS', function() {
  return gulp.src('./src/**/*.js')
      .pipe(concat('a-edit.js'))
      .pipe(gulp.dest('./dist/'));
});

gulp.task('concatCSS', function() {
  return gulp.src('./src/**/*.css')
    .pipe(concatCss("a-edit.css"))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function() {
  gulp.watch(['./src/**/*.js'], ['concatJS']);
  gulp.watch(['./src/**/*.css'], ['concatCSS']);
});

gulp.task('default', ['concatCSS', 'concatJS', 'watch']);
