
let scene, camera, renderer, clock, mixer, actions = [], isWireframe = false, params, lights;
let loadedModel;
let secondModelMixer, secondModelActions = [];
let sound, secondSound;

// figure out which model
function getModelPath() {
    var page = window.location.pathname.split('/').pop();
    if (page === 'compass.html') return 'assets/models/Compass/compassMaxwell.glb';
    if (page === 'flashlight.html') return 'assets/models/Flashlight/flashlightMaxwell.glb';
    return 'assets/models/Medkit/MedkitMaxwell.glb'; 
}

// switching model
function getModel2Path() {
    var page = window.location.pathname.split('/').pop();
    if (page === 'compass.html') return 'assets/models/Flashlight/flashlightMaxwell.glb';
    if (page === 'flashlight.html') return 'assets/models/Medkit/MedkitMaxwell.glb';
    return 'assets/models/Compass/compassMaxwell.glb';
}

// get the audio file for the specific model
function getAudioPath() {
    var page = window.location.pathname.split('/').pop();
    if (page === 'compass.html') return 'assets/audio/Compass.mp3';
    if (page === 'flashlight.html') return 'assets/audio/Flashlight.mp3';
    return 'assets/audio/Medikit.mp3'; 
}

// audio file for the new modeule
function getAudio2Path() {
    var page = window.location.pathname.split('/').pop();
    if (page === 'compass.html') return 'assets/audio/Flashlight.mp3';
    if (page === 'flashlight.html') return 'assets/audio/Medikit.mp3';
    return 'assets/audio/Compass.mp3';
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

    // 3 WAY LIGHTING (SELF IMPLEMENTED)
    const ambient = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(ambient);

    // key light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

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

    // Audio
    const listener = new THREE.AudioListener();
    camera.add(listener);

    sound = new THREE.Audio(listener);
    secondSound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(getAudioPath(), function(buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(1.0);
    });
    audioLoader.load(getAudio2Path(), function(buffer) {
        secondSound.setBuffer(buffer);
        secondSound.setLoop(false);
        secondSound.setVolume(1.0);
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
    });

    // switch to wireframe button
    var wireframeBtn = document.getElementById('toggleWireframe');
    wireframeBtn.addEventListener('click', function() {
        isWireframe = !isWireframe;
        toggleWireframe(isWireframe);
    });


    // rotate model button
    var rotateBtn = document.getElementById('rotate');
    rotateBtn.addEventListener('click', function() {
        if (loadedModel) {
            var axis = new THREE.Vector3(0, 1, 0);
            loadedModel.rotateOnAxis(axis, Math.PI / 8);
        } else {
            console.warn('Model not loaded yet');
        }
    });

    // change model (delete?)
    var switchBtn = document.getElementById('switchmodel');
    switchBtn.addEventListener('click', function() {
        loadModel(getModel2Path());
    });

    // alt animation button
    var playSecondBtn = document.getElementById('playSecondModelAnimation');
    playSecondBtn.addEventListener('click', function() {
        if (secondModelActions.length > 0) {
            secondModelActions.forEach(function(action) {
                action.reset();
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.play();
            });
            if (secondSound.isPlaying) secondSound.stop();
            secondSound.play();
        } else {
            console.warn('No animation for second model');
        }
    });

    // turn on and off spotlight 
    var spotBtn = document.getElementById('spotToggle');
    spotBtn.addEventListener('click', function() {
        lights.spot.visible = !lights.spot.visible;
        params.spot.enable  = lights.spot.visible;
    });

    // load model
    var loader = new THREE.GLTFLoader();

    function loadModel(modelPath) {
        if (loadedModel) {
            scene.remove(loadedModel);
        }

        loader.load(modelPath, function(gltf) {
            var model = gltf.scene;
            scene.add(model);
            loadedModel = model;

            // auto center the model in the screen
            model.updateMatrixWorld(true);
            var box = new THREE.Box3().setFromObject(model);
            var centre = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            model.position.sub(centre);
            camera.position.set(0, maxDim * 0.6, maxDim * 2.8);
            controls.target.set(0, 0, 0);
            controls.update();


            mixer = new THREE.AnimationMixer(model);
            var animations = gltf.animations;
            actions = [];


            animations.forEach(function(clip) {
                var action = mixer.clipAction(clip);
                actions.push(action);
            });


            if (modelPath === getModel2Path() && modelPath !== getModelPath()) {
                secondModelMixer = mixer;
                secondModelActions = actions;
            }


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

//animation function
function animate() {
    requestAnimationFrame(animate);

    if (mixer) {
        mixer.update(clock.getDelta());
    }
    if (secondModelMixer) {
        secondModelMixer.update(clock.getDelta());
    }

    renderer.render(scene, camera);

    var time  = clock.getElapsedTime();
    var delta = Math.sin(time) * 5;
    if (params && params.spot.moving) {
        lights.spot.position.x = delta;
        lights.spotHelper.update();
    }
}

//resize function
function onResize() {
    // use the canvass actual column width to work it out
    var canvas = document.getElementById('threeContainer');
    var parent = canvas.parentElement;
    var width  = parent ? parent.clientWidth : window.innerWidth;
    var height = Math.max(400, window.innerHeight - 180);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}
