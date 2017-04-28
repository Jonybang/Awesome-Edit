var gulp = require('gulp'),

    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    cssGlobbing = require('gulp-css-globbing'),
    autoprefixer = require('gulp-autoprefixer'),

    gulpCopy = require('gulp-copy'),
    fileinclude = require('gulp-file-include'),
    ext_replace = require('gulp-ext-replace');

var build_dir = './dist/',
    js_src = './src/js/**/*.js',
    scss_src = './src/scss/**/*.scss',
    docs_tpls = './docs/tpl/**/*.tpl';

gulp.task('concatJS', function() {
  return gulp.src(js_src)
      .pipe(concat('a-edit.js'))
      .pipe(gulp.dest(build_dir));
});

gulp.task('buildSASS', function () {
  return gulp.src(scss_src)
      .pipe(cssGlobbing())
      .pipe(sass().on('error', sass.logError))
      .pipe(autoprefixer())
      .pipe(gulp.dest(build_dir));
});

gulp.task('copyToDocs', function () {
  return gulp.src([build_dir + '*', './vendor/*'])
      .pipe(cssGlobbing())
      .pipe(gulp.dest('./docs/assets'));
});

gulp.task('buildDocsTemplates', function () {
  return gulp.src([docs_tpls])
      .pipe(fileinclude())
      .pipe(ext_replace('.html'))
      .pipe(gulp.dest('./docs/'));
});

gulp.task('watch', function() {
  gulp.watch([js_src], ['concatJS', 'copyToDocs']);
  gulp.watch([scss_src], ['buildSASS', 'copyToDocs']);
  gulp.watch([docs_tpls], ['buildDocsTemplates']);
});

gulp.task('default', ['concatJS', 'buildSASS', 'copyToDocs', 'buildDocsTemplates', 'watch']);
