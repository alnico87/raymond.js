/*
 * Module main: CG2 Aufgabe 2, Winter 2012/2013
 * (C)opyright Hartmut Schirmacher, hschirmacher.beuth-hochschule.de
 *
 */

/**
 * RequireJS alias/path configuration (http://requirejs.org/)
 *
 * @author Hartmut Schirmacher, hschirmacher.beuth-hochschule.de
 * @author Niels Garve, niels.garve.yahoo.de
 */
requirejs.config({
    paths: {
        jquery: [
            // try content delivery network location first
            'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min',
            // if the load via CDN fails, load locally
            'lib/jquery-1.7.2.min'
        ],

        // require.js plugins
        domReady: 'lib/domReady',
        text: 'lib/text',

        'gl-matrix': 'lib/gl-matrix-1.3.7.min',

        'webgl-obj-loader': 'loaders/webgl-obj-loader',

        Stage: 'models/Stage'
    },

    shim: {
        'webgl-obj-loader': {
            deps: ['jquery']
        }
    },

    bDebugMode: true
});

/*
 * The function defined below is the "main" module,
 * it will be called once all prerequisites listed in the
 * define() statement are loaded.
 *
 */

define([
    'domReady',
    'webgl-debug',
    'pathtracingRT'
], function(domReady, WebGLDebugUtils, PathtracingRT) {

    'use strict';

    /**
     * This function asks the HTML Canvas element with id canvasName to create
     * a context object for WebGL rendering.
     *
     * It also creates awrapper around it for debugging
     * purposes, using webgl-debug.js
     *
     * @author Hartmut Schirmacher, hschirmacher.beuth-hochschule.de
     * @author Niels Garve, niels.garve.yahoo.de
     * @param canvasName
     * @returns {*}
     * @private
     */
    var makeWebGLContext = function(canvasName) {
        // get the canvas element to be used for drawing
        var canvas = document.getElementById(canvasName);
        if(!canvas) {
            throw 'HTML element with id "' + canvasName + '" not found';
        }

        // get WebGL rendering context for canvas element
        var options = {alpha: true, depth: true, antialias: true},
            gl = canvas.getContext('webgl', options) || canvas.getContext('experimental-webgl', options);

        if(!gl) {
            throw 'could not create WebGL rendering context';
        }

        // create a debugging wrapper of the context object
        if(require.s.contexts._.config.bDebugMode) {
            var throwOnGLError = function(err, funcName, args) {
                throw WebGLDebugUtils.glEnumToString(err) + ' was caused by call to: ' + funcName;
            };

            gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError);
        }
        return gl;
    };

    /**
     * main program, to be called once the document has loaded
     * and the DOM has been constructed
     *
     * @author Hartmut Schirmacher, hschirmacher.beuth-hochschule.de
     * @author Niels Garve, niels.garve.yahoo.de
     */
    domReady(function() {
        // catch errors for debugging purposes
        try {
            var gl = makeWebGLContext('drawing_area'),
                engine = new PathtracingRT(gl);

            engine.drawFirstFrame();

        } catch (err) {
            var errorElement = document.getElementById('error');
            if(errorElement) {
                errorElement.innerHTML = err.message || err;
                errorElement.style.display = 'block';
            }
            log('exception: ' + (err.message || err));
            throw err;
        }
    });
}); // define module
