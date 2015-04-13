requirejs.config({
    paths: {
        // require.js plugins
        hgn: '../bower_components/requirejs-hogan-plugin/hgn',
        text: '../bower_components/requirejs-hogan-plugin/text',
        hogan: '../bower_components/requirejs-hogan-plugin/hogan',

        threejs: '../bower_components/three.js/three',
        controls: 'vendor/TrackballControls'
    },

    shim: {
        threejs: {
            exports: 'THREE'
        },
        controls: {
            deps: [ 'threejs' ],
            exports: 'THREE.TrackballControls'
        }
    },

    // configure hgn! plugin
    hgn: {
        // load "*.mustache" files, set to empty string if you
        // want to specify the template extension for each individual file
        // the default value is ".mustache"
        templateExtension: '',

        // if you need to set custom options it can be done through the
        // "compilationOptions" setting, check hogan documentation:
        // https://github.com/twitter/hogan.js#compilation-options
        compilationOptions: {
            // delimiters : '<% %>',
            // sectionTags: [{o: '_foo', c: 'foo'}],
            // disableLambda : true
        }
    }
});

define([
    'hgn!../shaders/pathtracing.vert',
    'hgn!../shaders/pathtracing.frag',
    'hgn!../shaders/texture.vert',
    'hgn!../shaders/texture.frag',
    'controls'
], function( pathtracingVert, pathtracingFrag, textureVert, textureFrag ) {
    var scene = new THREE.Scene(),
        scene2 = new THREE.Scene(),
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1000),
        controls = new THREE.TrackballControls(camera),
        renderer = new THREE.WebGLRenderer(),
        swappy,
        geometry,
        minCorner = [ -15, -15, -1 ], // [x, y, z]
        maxCorner = [ 15, 5, 29 ], // [x, y, z]
        material,
        material2,
        plane,
        plane2,
        time = new Date().getTime(),
        now,
        sampleCounter = 0;

    controls.target = new THREE.Vector3(0, 0, -2);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [ 65, 83, 68 ];
    controls.addEventListener('change', onMove);

    renderer.setSize(256, 256);
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);

    swappy = [
        new THREE.WebGLRenderTarget(256, 256, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat
        }),
        new THREE.WebGLRenderTarget(256, 256, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat
        })
    ];

    geometry = new THREE.PlaneGeometry(2, 2);
    material = new THREE.ShaderMaterial({
        uniforms: {
            eyePosition: { type: 'v3', value: new THREE.Vector3(0, 0, 0) },
            La: { type: 'v3', value: new THREE.Vector3(0.133, 0.133, 0.133) },

            // light
            'spheres[0].center': { type: 'v3', value: new THREE.Vector3(0, 12.5, 15) },
            'spheres[0].radius': { type: 'f', value: 10 },
            'sphereMaterials[0].isPerfectMirror': { type: 'i', value: 0 },
            'sphereMaterials[0].isDiffuse': { type: 'i', value: 0 },
            'sphereMaterials[0].Le': { type: 'v3', value: new THREE.Vector3(1, 1, 1) },
            'sphereMaterials[0].Kd': { type: 'v3', value: new THREE.Vector3(1, 1, 1) },

            // object
            'spheres[1].center': { type: 'v3', value: new THREE.Vector3(0, -10, 20) },
            'spheres[1].radius': { type: 'f', value: 5 },
            'sphereMaterials[1].isPerfectMirror': { type: 'i', value: 1 },
            'sphereMaterials[1].isDiffuse': { type: 'i', value: 0 },
            'sphereMaterials[1].Le': { type: 'v3', value: new THREE.Vector3(0, 0, 0) },
            'sphereMaterials[1].Kd': { type: 'v3', value: new THREE.Vector3(0, 0, 0) },

            // left
            'cornellBox.planes[0].n': { type: 'v3', value: new THREE.Vector3(1, 0, 0) },
            'cornellBox.planes[0].d': { type: 'f', value: minCorner[ 0 ] }, // x
            'cornellBox.materials[0].isPerfectMirror': { type: 'i', value: 0 },
            'cornellBox.materials[0].isDiffuse': { type: 'i', value: 1 },
            'cornellBox.materials[0].Le': { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) },
            'cornellBox.materials[0].Kd': { type: 'v3', value: new THREE.Vector3(0.4, 0.0, 0.4) },

            // right
            'cornellBox.planes[1].n': { type: 'v3', value: new THREE.Vector3(-1, 0, 0) },
            'cornellBox.planes[1].d': { type: 'f', value: -maxCorner[ 0 ] }, // x
            'cornellBox.materials[1].isPerfectMirror': { type: 'i', value: 0 },
            'cornellBox.materials[1].isDiffuse': { type: 'i', value: 1 },
            'cornellBox.materials[1].Le': { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) },
            'cornellBox.materials[1].Kd': { type: 'v3', value: new THREE.Vector3(0.0, 0.4, 0.0) },

            // bottom
            'cornellBox.planes[2].n': { type: 'v3', value: new THREE.Vector3(0, 1, 0) },
            'cornellBox.planes[2].d': { type: 'f', value: minCorner[ 1 ] }, // y
            'cornellBox.materials[2].isPerfectMirror': { type: 'i', value: 0 },
            'cornellBox.materials[2].isDiffuse': { type: 'i', value: 1 },
            'cornellBox.materials[2].Le': { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) },
            'cornellBox.materials[2].Kd': { type: 'v3', value: new THREE.Vector3(0.2, 0.2, 0.2) },

            // top
            'cornellBox.planes[3].n': { type: 'v3', value: new THREE.Vector3(0, -1, 0) },
            'cornellBox.planes[3].d': { type: 'f', value: -maxCorner[ 1 ] }, // y
            'cornellBox.materials[3].isPerfectMirror': { type: 'i', value: 0 },
            'cornellBox.materials[3].isDiffuse': { type: 'i', value: 1 },
            'cornellBox.materials[3].Le': { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) },
            'cornellBox.materials[3].Kd': { type: 'v3', value: new THREE.Vector3(0.8, 0.8, 0.8) },

            // near
            'cornellBox.planes[4].n': { type: 'v3', value: new THREE.Vector3(0, 0, 1) },
            'cornellBox.planes[4].d': { type: 'f', value: minCorner[ 2 ] }, // z
            'cornellBox.materials[4].isPerfectMirror': { type: 'i', value: 0 },
            'cornellBox.materials[4].isDiffuse': { type: 'i', value: 1 },
            'cornellBox.materials[4].Le': { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) },
            'cornellBox.materials[4].Kd': { type: 'v3', value: new THREE.Vector3(0.8, 0.8, 0.8) },

            // far
            'cornellBox.planes[5].n': { type: 'v3', value: new THREE.Vector3(0, 0, -1) },
            'cornellBox.planes[5].d': { type: 'f', value: -maxCorner[ 2 ] }, // z
            'cornellBox.materials[5].isPerfectMirror': { type: 'i', value: 0 },
            'cornellBox.materials[5].isDiffuse': { type: 'i', value: 1 },
            'cornellBox.materials[5].Le': { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) },
            'cornellBox.materials[5].Kd': { type: 'v3', value: new THREE.Vector3(0.8, 0.8, 0.8) },

            secondsSinceStart: { type: 'f', value: 0 },
            texture0: { type: 't', value: swappy[ 0 ] },
            textureWeight: { type: 'f', value: 0 }
        },
        vertexShader: pathtracingVert(),
        fragmentShader: pathtracingFrag({
            hasSpheres: true,
            numberOfSpheres: 2,
            numberOfSphericalLights: 1,
            hasCornellBox: true,
            hasMesh: false,
            meshSamplerWidth: 256
        })
    });
    material2 = new THREE.ShaderMaterial({
        uniforms: {
            texture0: { type: 't', value: swappy[ 0 ] }
        },
        vertexShader: textureVert(),
        fragmentShader: textureFrag()
    });

    plane = new THREE.Mesh(geometry, material);
    plane2 = new THREE.Mesh(geometry, material2);
    plane.position.z = plane2.position.z = -2;

    scene.add(plane);
    scene2.add(plane2);

    function onMove() {
        sampleCounter = 0;
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        now = new Date().getTime();
        material.uniforms.secondsSinceStart.value = (now - time) * 0.001;
        material.uniforms.textureWeight.value = sampleCounter / (sampleCounter + 1);
        material.uniforms.texture0.value = swappy[ sampleCounter % 2 ];
        material2.uniforms.texture0.value = swappy[ sampleCounter % 2 ];

        renderer.clear();
        renderer.render(scene, camera, swappy[ (sampleCounter + 1) % 2 ], false);
        renderer.render(scene2, camera);
        stats.update();

        sampleCounter++;
    }

    animate();
});