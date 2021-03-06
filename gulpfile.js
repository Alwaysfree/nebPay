#!/usr/bin/env node

'use strict';

var version = require('./libs/version.json');
var path = require('path');

var del = require('del');
var gulp = require('gulp');
var browserify = require('browserify');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var notify  = require('gulp-notify');
var source = require('vinyl-source-stream');
var exorcist = require('exorcist');
var streamify = require('gulp-streamify');
var replace = require('gulp-replace');
var babelify     = require('babelify');
var buffer       = require('vinyl-buffer');
var jsdoc = require("gulp-jsdoc3");
var pkg = require("./package.json");

var DEST = path.join(__dirname, 'dist/');
var dst = 'nebPay';
var documentationDst =  path.join(__dirname, 'docs/');

// Error / Success Handling
var onError = function(err) {
    notify.onError({
        title: "Error: " + err.plugin,
        subtitle: "<%= file.relative %>",
        message: "<%= error.message %>",
        sound: "Beep",
    })(err);
    console.log(err.toString())
    this.emit('end');
}

function onSuccess(msg) {
    return {
        message: msg + " Complete! ",
        onLast: true
    }
}

function notifyFunc(msg) {
    return gulp.src('.', { read: false })
        .pipe(notify(onSuccess(msg)))
}

var browserifyOptions = {
    debug: true,
    insert_global_vars: false, // jshint ignore:line
    detectGlobals: false,
    bundleExternal: true
};

gulp.task('version', function(){
  gulp.src(['./package.json'])
    .pipe(replace(/\"version\"\: \"([\.0-9]*)\"/, '"version": "'+ version.version + '"'))
    .pipe(gulp.dest('./'));
});

gulp.task('lint', [], function(){
    return gulp.src(['./nebpay.js', './libs/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('clean', ['lint'], function(cb) {
    del([ DEST ]).then(cb.bind(null, null));
});

gulp.task('nebpay', ['clean'], function () {
    return browserify()
        .require('./nebpay.js', {expose: 'nebpay'})
        .transform(babelify)
        .bundle()
        .pipe(plumber({ errorHandler: onError }))
        // .pipe(exorcist(path.join( DEST, nebulasDst + '.js.map')))
        .pipe(source('nebPay.js'))
        .pipe(buffer())
        .pipe(rename(dst + '.js'))
        .pipe(gulp.dest(DEST))
        .pipe(uglify())
        .pipe(rename(dst + '.min.js'))
        .pipe(gulp.dest(DEST));
});

gulp.task('watch', function() {
    gulp.watch(['./libs/*.js'], ['lint', 'build']);
});

gulp.task('documentation', function(cb) {

    gulp.src(['README.md', './libs/*.js'])
        .pipe(jsdoc({
            opts: {
                destination: documentationDst,
                "template": "./docs-data/template"
            },
            templates: {
                "systemName"            : pkg.description,
                "logoFile"              : "img/logo.png",
                "copyright"             :  pkg.copyright,
                "theme"                 : "lumen",
                "linenums"              : true,
                "sort"				    : false,
            }
        }, cb))
});

gulp.task('default', ['version', 'lint', 'clean', 'nebpay']);

