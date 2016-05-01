var gulp = require('gulp');
var babel = require('gulp-babel');
var jshint = require('gulp-jshint');
var nodemon = require('gulp-nodemon');
var uglify = require('gulp-uglify');
var util = require('gulp-util');
var mocha = require('gulp-mocha');
var webpack = require('webpack-stream');


gulp.task('build', ['build-client', 'build-server', 'test']);

gulp.task('test', ['lint'], function () {
    gulp.src(['test/**/*.js'])
        .pipe(mocha());
});

gulp.task('lint', function () {
  return gulp.src(['**/*.js', '!node_modules/**/*.js', '!bin/**/*.js'])
    .pipe(jshint({
          esnext: true
      }))
    .pipe(jshint.reporter('default', { verbose: true}))
    .pipe(jshint.reporter('fail'));
});

gulp.task('build-client', ['lint', 'move-client'], function () {
  return gulp.src(['src/client/js/app.js'])
    .pipe(webpack(require('./webpack.config.js')))
    //.pipe(uglify())
    .pipe(gulp.dest('bin/client/js/'));
});

gulp.task('move-client', function () {
  return gulp.src(['src/client/**/*.*', '!client/js/*.js'])
    .pipe(gulp.dest('./bin/client/'));
});


gulp.task('build-server', ['lint'], function () {
  return gulp.src(['src/server/**/*.*', 'src/server/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('bin/server/'));
});

gulp.task('crop-faces', function() {
  var easyimg = require('easyimage'),
      glob    = require('glob'),
      fs      = require('fs'),
      os      = require('os'),
      mapping = require('./faces-mapping.json');

  glob('./faces/*.*', function(er, files){
    files.forEach(function(input){

      var parts        = input.split('/'),
          mappingInfo  = parts[parts.length-1].match(/(\w*)\.\w*$/),
          temp         = os.tmpdir() + parts[parts.length-1] + '.temp';

      var output = '';
      if (mappingInfo && mappingInfo[1]) {
          var mappingValue = mapping[mappingInfo[1]];
          if (typeof mappingValue == 'undefined') {
              return;
          }
          output = './src/client/img/faces/' + mappingValue + '.png';
      } else {
          output = './src/client/img/faces/' + parts[parts.length-1].replace('.jpg','') + '.png';
      }

      easyimg.info(input).then(function(file) {
        var size = file.height < file.width ? file.height : file.width;
        easyimg.exec('convert ' + input + ' -resize ' + (size) + 'x' + (size) + '^  -gravity center -crop ' + (size + 2) + 'x' + (size + 2) + '+0+0 +repage ' + temp).then(function success () {
            easyimg.exec('convert -size '+size+'x'+size+' xc:none -fill '+temp+' -draw "circle '+size/2+','+size/2+' '+size/2+',1" ' + output).then(function success () {
              fs.unlink(temp);
              console.log(output);
            }, function error (err) {
              console.err(err);
            });
          });
      }, function error (err) {
        console.err(err);
      });
    });
  });

});

gulp.task('watch', ['build'], function () {
  gulp.watch(['src/client/**/*.*'], ['build-client', 'move-client']);
  gulp.watch(['src/server/*.*', 'src/server/**/*.js'], ['build-server']);
  gulp.start('run-only');
});

gulp.task('run', ['build'], function () {
    nodemon({
        delay: 10,
        script: './server/server.js',
        cwd: "./bin/",
        args: ["config.json"],
        ext: 'html js css'
    })
    .on('restart', function () {
        util.log('server restarted!');
    });
});

gulp.task('run-only', function () {
    nodemon({
        delay: 10,
        script: './server/server.js',
        cwd: "./bin/",
        args: ["config.json"],
        ext: 'html js css'
    })
    .on('restart', function () {
        util.log('server restarted!');
    });
});

gulp.task('default', ['run']);