
let scene, camera, renderer, clock, mixer, actions = [], isWireframe = false, params, lights;
let loadedModel;
let sound, audioLoader;
let currentModelPath = '';
let modelDataMap = {};

// flashlight emission
let flashlightMeshes = [];
let flashlightAnimating = false;
let flashlightAnimStartTime = 0;

// figure out which model to load on this page
function getModelPath() {
    var page = window.location.pathname.split('/').pop();
    if (page === 'compass.html') return 'assets/models/Compass/compassMaxwell.glb';
    if (page === 'flashlight.html') return 'assets/models/Flashlight/flashlightMaxwell.glb';
    return 'assets/models/Medkit/MedkitMaxwell.glb';
}

// all models to cycle through when switching
var allModels = [
    'assets/models/Medkit/MedkitMaxwell.glb',
    'assets/models/Compass/compassMaxwell.glb',
    'assets/models/Flashlight/flashlightMaxwell.glb'
];

// maps model paths to their audio files
function getAudioForModel(modelPath) {
    if (modelPath.includes('Compass')) return 'assets/audio/Compass.mp3';
    if (modelPath.includes('Flashlight')) return 'assets/audio/Flashlight.mp3';
    return 'assets/audio/Medikit.mp3';
}

// MANUAL ANIMATION SYSTEM | calculate emission intensity based on animation time
function getFlashlightEmission(t) {
    var t13 = 13 / 24;
    var t27 = 27 / 24;
    var t40 = 40 / 24;
    if (t < t13) return 0;
    if (t <= t27) return 8.0 * ((t - t13) / (t27 - t13));
    if (t <= t40) return 8.0 * (1 - (t - t27) / (t40 - t27));
    return 0;
}

init();

function init() {

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x888888);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-5, 25, 20);

    const canvas = document.getElementById('threeContainer');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    onResize();

    // 3 WAY LIGHTING
    const ambient = new THREE.HemisphereLight(0xffffff, 0x444444, 1.8);
    scene.add(ambient);

    // key light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // extra front light for flashlight page
    var page = window.location.pathname.split('/').pop();
    if (page === 'flashlight.html') {
        const frontLight = new THREE.DirectionalLight(0xffffff, 2.5);
        frontLight.position.set(0, 10, 2);
        scene.add(frontLight);

        const sideLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sideLight.position.set(8, 5, 5);
        scene.add(sideLight);
    }

    // spotlight
    lights = {};
    lights.spot = new THREE.SpotLight();
    lights.spot.visible = false;
    lights.spot.position.set(0, 20, 0);
    lights.spotHelper = new THREE.SpotLightHelper(lights.spot);
    lights.spotHelper.visible = false;
    scene.add(lights.spot);
    scene.add(lights.spotHelper);

    params = {
        spot: {
            enable: false,
            color: 0xffffff,
            distance: 20,
            angle: Math.PI / 2,
            penumbra: 0,
            helper: false,
            moving: false
        }
    };

    // dat.GUI spotlight controls (little top left pop up)
    const gui = new dat.GUI({ autoPlace: false });
    const guiContainer = document.getElementById('gui-container');
    guiContainer.appendChild(gui.domElement);
    guiContainer.style.position = 'fixed';

    const spot = gui.addFolder('Spot Light');
    spot.open();
    spot.add(params.spot, 'enable').onChange(function(value) {
        lights.spot.visible = value;
    });
    spot.addColor(params.spot, 'color').onChange(function(value) {
        lights.spot.color = new THREE.Color(value);
    });
    spot.add(params.spot, 'distance').min(0).max(20).onChange(function(value) {
        lights.spot.distance = value;
    });
    spot.add(params.spot, 'angle').min(0.1).max(6.28).onChange(function(value) {
        lights.spot.angle = value;
    });
    spot.add(params.spot, 'penumbra').min(0).max(1).onChange(function(value) {
        lights.spot.penumbra = value;
    });
    spot.add(params.spot, 'helper').onChange(function(value) {
        lights.spotHelper.visible = value;
    });
    spot.add(params.spot, 'moving');

    // controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.target.set(0, 0, 0);
    controls.update();

    // audio setup
    const listener = new THREE.AudioListener();
    camera.add(listener);
    sound = new THREE.Audio(listener);
    audioLoader = new THREE.AudioLoader();

    // preload model data
    $.getJSON('data.json', function(data) {
        data.objects.forEach(function(obj) {
            modelDataMap[obj.model] = obj;
        });
    });

    // play animation button
    var btn = document.getElementById('btn');
    btn.addEventListener('click', function() {

        if (actions.length > 0) {
            actions.forEach(function(action) {
                action.timeScale = 1;
                action.reset();
                action.play();
            });
            if (sound.isPlaying) sound.stop();
            sound.play();
        }

        // start flashlight emission sync
        if (flashlightMeshes.length > 0) {
            flashlightAnimating = true;
            flashlightAnimStartTime = clock.getElapsedTime();
        }
    });

    // wireframe button
    var wireframeBtn = document.getElementById('toggleWireframe');
    wireframeBtn.addEventListener('click', function() {
        isWireframe = !isWireframe;
        toggleWireframe(isWireframe);
    });

    // rotate button
    var rotateBtn = document.getElementById('rotate');
    rotateBtn.addEventListener('click', function() {
        if (loadedModel) {
            var axis = new THREE.Vector3(0, 1, 0);
            loadedModel.rotateOnAxis(axis, Math.PI / 8);
        }
    });

    // switch model button - cycles through all three models
    var switchBtn = document.getElementById('switchmodel');
    switchBtn.addEventListener('click', function() {
        var currentIndex = allModels.indexOf(currentModelPath);
        var nextIndex = (currentIndex + 1) % allModels.length;
        loadModel(allModels[nextIndex]);
    });

    // load model
    var loader = new THREE.GLTFLoader();

    function loadModel(modelPath) {
        if (loadedModel) {
            scene.remove(loadedModel);
        }

        isWireframe = false;
        flashlightMeshes = [];
        flashlightAnimating = false;

        loader.load(modelPath, function(gltf) {
            var model = gltf.scene;
            scene.add(model);
            loadedModel = model;
            currentModelPath = modelPath;

            // auto center
            model.updateMatrixWorld(true);
            var box = new THREE.Box3().setFromObject(model);
            var centre = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            model.position.sub(centre);
            camera.position.set(0, maxDim * 0.6, maxDim * 2.8);
            controls.target.set(0, 0, 0);
            controls.update();

            // animations (CONTINUED)
            mixer = new THREE.AnimationMixer(model);
            actions = [];
            gltf.animations.forEach(function(clip) {
                actions.push(mixer.clipAction(clip));
            });

            // store flashlight emission meshes
            if (modelPath.includes('Flashlight')) {
                model.traverse(function(object) {
                    if (object.isMesh) {
                        var n = object.name.toLowerCase();
                        if (n.includes('bulb') || n.includes('glass') || n.includes('lens')) {
                            object.material = object.material.clone();
                            object.material.emissive = new THREE.Color(1, 0.5, 0.0);
                            object.material.emissiveIntensity = 0;
                            object.userData.origOpacity = object.material.opacity;
                            object.userData.emissiveMultiplier = n.includes('bulb') ? 0.4 : 1.0;
                            flashlightMeshes.push(object);
                        }
                    }
                });
            }

            // update info panel
            if (modelDataMap[modelPath]) {
                var info = modelDataMap[modelPath];
                $('#page-title').text(info.name);
                $('#info-title').text(info.name);
                $('#info-desc').text(info.desc);
            }

            // update audio
            if (sound.isPlaying) sound.stop();
            audioLoader.load(getAudioForModel(modelPath), function(buffer) {
                sound.setBuffer(buffer);
                sound.setLoop(false);
                sound.setVolume(1.0);
            });

        }, undefined, function(error) {
            console.error('Error loading model:', error);
        });
    }

    window._loadModel = loadModel;
    loadModel(getModelPath());
    window.addEventListener('resize', onResize, false);
    animate();
}

function toggleWireframe(enable) {
    scene.traverse(function(object) {
        if (object.isMesh) {
            object.material.wireframe = enable;
        }
    });
}

// animation loop
function animate() {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();

    if (mixer) {
        mixer.update(delta);
    }

    // drive flashlight emission from animation time
    if (flashlightAnimating && flashlightMeshes.length > 0) {
        var elapsed = clock.getElapsedTime() - flashlightAnimStartTime;
        var intensity = getFlashlightEmission(elapsed);
        var t = intensity / 8.0;
        flashlightMeshes.forEach(function(mesh) {
            var multiplier = mesh.userData.emissiveMultiplier !== undefined ? mesh.userData.emissiveMultiplier : 1.0;
            mesh.material.emissiveIntensity = intensity * multiplier;
            var origOpacity = mesh.userData.origOpacity !== undefined ? mesh.userData.origOpacity : 1.0;
            mesh.material.opacity = origOpacity + t * (1.0 - origOpacity);
            mesh.material.transparent = mesh.material.opacity < 1.0;
            mesh.material.needsUpdate = true;
        });

        if (elapsed > 54 / 24) {
            flashlightAnimStartTime = clock.getElapsedTime();
        }
    }

    renderer.render(scene, camera);

    var time = clock.getElapsedTime();
    var spotDelta = Math.sin(time) * 5;
    if (params && params.spot.moving) {
        lights.spot.position.x = spotDelta;
        lights.spotHelper.update();
    }
}

// resize function
function onResize() {
    var canvas = document.getElementById('threeContainer');
    var parent = canvas.parentElement;
    var width  = parent ? parent.clientWidth : window.innerWidth;
    var height = Math.max(400, window.innerHeight - 180);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}
