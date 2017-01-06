"use strict";
var gulp = require("gulp"),
    util = require("gulp-util"),
    sass = require("gulp-sass"),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    log = util.log,
    include = require("gulp-include"),
    debug = require('gulp-debug');

gulp.task('default', ["scss"], function () {


});

gulp.task("scss", function(){
    log("Generate CSS files " + (new Date()).toString());
    gulp.src("demo/assets/*.scss")
        .pipe(sass({ style: 'expanded' }))
        .pipe(autoprefixer("last 3 version","safari 5", "ie 8", "ie 9"))
        .pipe(gulp.dest("demo/assets"))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest('demo/assets'));
});

gulp.task("watch scss", function(){
    log("Watching scss files for modifications");
    gulp.watch("demo/assets/*.scss", ["scss"]);
});

