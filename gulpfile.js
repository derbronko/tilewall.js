'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var merge = require('merge2');
var ts = require('gulp-typescript');

gulp.task('default', function() {
  // place code for your default task here
});

gulp.task('watch scripts', function () {
    gulp.watch('./**/*.ts', ['scripts']);
});

gulp.task('watch styles', function () {
    gulp.watch('./demo/**/*.scss', ['sass']);
});

gulp.task('sass', function () {
    return gulp.src('./demo/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./demo'));
});

gulp.task("ts2js", ["ts2js_demo", "ts2js_tilewalljs"]);

gulp.task('ts2js_demo', function() {
    var tsResult = gulp.src('./demo/**/*.ts')
        .pipe(ts({
            declaration: true
        }));

    return merge([
        tsResult.dts.pipe(gulp.dest('demo/definitions')),
        tsResult.js.pipe(gulp.dest('demo/'))
    ]);
});

gulp.task('ts2js_tilewalljs', function() {
    var tsResult = gulp.src('./tilewall.ts')
        .pipe(ts({
            declaration: true
        }));

    return merge([
        tsResult.dts.pipe(gulp.dest('demo/assets/definitions')),
        tsResult.js.pipe(gulp.dest('demo/assets/'))
    ]);
});
