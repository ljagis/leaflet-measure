var path = require('path'), svg2png = require('svg2png');

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('bower.json'),
    now: new Date(),
    jshint: {
      src: ['src/**/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    jscs: {
      src: ['src/**/*.js'],
      options: {
        config: '.jscsrc'
      }
    },
    clean: {
      dist: {
        src: ['dist/']
      }
    },
    browserify: {
      build: {
        files: {
          'dist/leaflet-measure.js': ['src/leaflet-measure.js']
        },
        options: {
          transform: [
            'brfs',
            'browserify-shim'
          ]
        }
      },
      dev: {
        files: {
          'dist/leaflet-measure.js': ['src/leaflet-measure.js']
        },
        options: {
          transform: [
            'brfs',
            'browserify-shim'
          ],
          browserifyOptions: {
            debug: true
          }
        }
      }
    },
    uglify: {
      build: {
        src: 'dist/leaflet-measure.js',
        dest: 'dist/leaflet-measure.min.js'
      }
    },
    sass: {
      build: {
        options: {
          sourcemap: 'none',
          style: 'compressed',
          compass: true
        },
        files: {
          'dist/leaflet-measure.css': 'scss/leaflet-measure.scss'
        }
      },
      dev: {
        options: {
          sourcemap: 'auto',
          style: 'expanded',
          compass: true
        },
        files: {
          'dist/leaflet-measure.css': 'scss/leaflet-measure.scss'
        }
      }
    },
    svg2png: {
      images: {
        files: [{
          src: 'src/images/*.svg',
          dest: 'dist/images/'
        }]
      }
    },
    release: {
      options: {
        npm: true,
        tagName: '<%= version %>',
        commitMessage: 'release <%= version %>',
        tagMessage: 'tag <%= version %>' //default: 'Version <%= version %>'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-release');

  grunt.registerMultiTask('svg2png', 'Create PNG images from SVG', function () {
    this.files.forEach(function (file) {
      file.src.forEach(function (src) {
        var png = path.basename(src, '.svg') + '.png', png2x = path.basename(src, '.svg') + '_@2X.png';
        var dest = path.join(file.dest, png), dest2x = path.join(file.dest, png2x);
        svg2png(src, dest, 0.5);
        svg2png(src, dest2x, 1.0);
      });
    });
  });

  grunt.registerTask('test', ['jshint', 'jscs']);
  grunt.registerTask('builddev', ['clean:dist', 'browserify:dev', 'sass:dev', 'svg2png']);
  grunt.registerTask('build', ['test', 'clean:dist', 'browserify:build', 'uglify:build', 'sass:build', 'svg2png']);

  grunt.registerTask('default', ['build']);
};