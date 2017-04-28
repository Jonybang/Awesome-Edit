var gulp = require('gulp');

var concat = require('gulp-concat');
var sass = require('gulp-sass');
var cssGlobbing = require('gulp-css-globbing');
var autoprefixer = require('gulp-autoprefixer');

var build_dir = './dist/';

gulp.task('concatJS', function() {
  return gulp.src('./src/js/**/*.js')
      .pipe(concat('a-edit.js'))
      .pipe(gulp.dest(build_dir));
});

gulp.task('buildSASS', function () {
  return gulp.src('./src/scss/**/*.scss')
      .pipe(cssGlobbing())
      .pipe(sass().on('error', sass.logError))
      .pipe(autoprefixer())
      .pipe(gulp.dest(build_dir));
});

gulp.task('watch', function() {
  gulp.watch(['./src/js/**/*.js'], ['concatJS']);
  gulp.watch(['./src/scss/**/*.scss'], ['buildSASS']);
});

gulp.task('default', ['concatJS', 'buildSASS', 'watch']);
