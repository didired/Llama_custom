import * as THREE from './libs/three.module.min.js';
import { GLTFLoader } from './libs/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const clock = new THREE.Clock();
const canvasContainer = document.getElementById('canvas-container');

// Set initial renderer size based on canvas container
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
canvasContainer.appendChild(renderer.domElement);
scene.background = null;

// Set initial camera aspect ratio
camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
camera.updateProjectionMatrix();

let model;
let mixer;
let furMaterial;
let skinMaterial;
let witchHatMesh;
let shirtMesh;
let hairMesh;
let shoeMeshes = []; // Array to store all Roller_Skates-related meshes
const pivot = new THREE.Group();
scene.add(pivot);

// Rotation control variables
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationVelocity = { x: 0, y: 0 };
const decayFactor = 0.95;
const maxRotationX = Math.PI / 2;
const minRotationX = -Math.PI / 2;

// Light setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 100);
pointLight.position.set(5, 5, 5);
pointLight.castShadow = true;
scene.add(pointLight);

const loader = new GLTFLoader();
loader.load('./models/lama_hat17.glb', (gltf) => {
    model = gltf.scene;

    model.scale.set(5, 5, 5);
    pivot.add(model);

    pivot.rotation.x = Math.PI / 9.5;
    pivot.rotation.y = Math.PI / 2.7;

    // Traverse model to find specific meshes and materials
    model.traverse((child) => {
        if (child.isMesh) {
            if (child.name === "Witch_Hat") witchHatMesh = child, witchHatMesh.visible = false;
            if (child.name === "Shirt") shirtMesh = child, shirtMesh.visible = false;
            if (child.name === "hair_cut") hairMesh = child, hairMesh.visible = false;
            if (child.name.includes("Roller_Skates")) shoeMeshes.push(child), child.visible = false;
            if (child.material) {
                if (child.material.name === "fur") furMaterial = child.material;
                if (child.material.name === "skin") skinMaterial = child.material;
            }
        }
    });

    // Set up animations if they exist
    if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
        });
    }

    // Center the model initially
    centerModel();
}, undefined, (error) => {
    console.error('An error occurred while loading the model:', error);
});

camera.position.z = 10;

// Center the model function
function centerModel() {
    if (model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -center.y, -center.z);
    }
}

// Toggle visibility functions
function toggleHatVisibility(showHat) {
    if (witchHatMesh) witchHatMesh.visible = showHat;
}
function toggleShirtVisibility(showShirt) {
    if (shirtMesh) shirtMesh.visible = showShirt;
}
function toggleShoeVisibility(showShoe) {
    shoeMeshes.forEach((mesh) => mesh.visible = showShoe);
}
function toggleHairVisibility(showHair) {
    if (hairMesh) hairMesh.visible = showHair;
}

// Color update functions
function updateFurColor(color) {
    if (furMaterial) furMaterial.color.set(color);
}
function updateSkinColor(color) {
    if (skinMaterial) skinMaterial.color.set(color);
}

// Event listeners for color pickers
document.querySelectorAll('#color-picker-container .color-option').forEach((option) => {
    option.addEventListener('click', () => updateFurColor(option.getAttribute('data-color')));
});
document.querySelectorAll('#secondary-color-picker-container .color-option').forEach((option) => {
    option.addEventListener('click', () => updateSkinColor(option.getAttribute('data-color')));
});

// Event listeners for hat, shirt, shoe, and hair options
document.querySelectorAll('.hat-option[data-hat]').forEach((option) => {
    option.addEventListener('click', () => toggleHatVisibility(option.getAttribute('data-hat') !== 'none'));
});
document.querySelectorAll('.section-option[data-shirt]').forEach((option) => {
    option.addEventListener('click', () => toggleShirtVisibility(option.getAttribute('data-shirt') !== 'none'));
});
document.querySelectorAll('.shoe-option[data-shoe]').forEach((option) => {
    option.addEventListener('click', () => toggleShoeVisibility(option.getAttribute('data-shoe') !== 'none'));
});
document.querySelectorAll('.hair-option[data-hair]').forEach((option) => {
    option.addEventListener('click', () => toggleHairVisibility(option.getAttribute('data-hair') !== 'none'));
});

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    if (!isDragging && model) {
        pivot.rotation.y += rotationVelocity.y;
        pivot.rotation.x += rotationVelocity.x;
        pivot.rotation.x = Math.max(minRotationX, Math.min(maxRotationX, pivot.rotation.x));
        rotationVelocity.x *= decayFactor;
        rotationVelocity.y *= decayFactor;
    }

    renderer.render(scene, camera);
}
animate();

// Mouse control listeners
canvasContainer.addEventListener('mouseenter', () => {
    canvasContainer.style.cursor = 'grab'; // Set cursor to grab when entering canvas
});

canvasContainer.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
    rotationVelocity = { x: 0, y: 0 };
    canvasContainer.style.cursor = 'grabbing'; // Change cursor to grabbing on mousedown
});

canvasContainer.addEventListener('mousemove', (event) => {
    if (isDragging && model) {
        const deltaMove = { x: event.clientX - previousMousePosition.x, y: event.clientY - previousMousePosition.y };
        const rotationSpeed = 0.005;
        pivot.rotation.y += deltaMove.x * rotationSpeed;
        pivot.rotation.x += deltaMove.y * rotationSpeed;
        pivot.rotation.x = Math.max(minRotationX, Math.min(maxRotationX, pivot.rotation.x));
        rotationVelocity = { x: deltaMove.y * rotationSpeed, y: deltaMove.x * rotationSpeed };
        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
});

canvasContainer.addEventListener('mouseup', () => {
    isDragging = false;
    canvasContainer.style.cursor = 'grab'; // Revert cursor to grab on mouseup
});

canvasContainer.addEventListener('mouseleave', () => {
    isDragging = false;
    canvasContainer.style.cursor = 'grab'; // Ensure cursor reverts to grab if mouse leaves canvas
});

// Update canvas size and camera aspect on resize
window.addEventListener('resize', () => {
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();
});

// Remaining code for UI interactions
const actionButtons = document.querySelectorAll('.action-button');
const colorPickerContainer = document.getElementById('color-picker-container');
const secondaryColorPickerContainer = document.getElementById('secondary-color-picker-container');
const hatSelectionContainer = document.getElementById('hat-selection-container');
const shirtSelectionContainer = document.getElementById('shirt-selection-container');
const shoeSelectionContainer = document.getElementById('shoe-selection-container');
const hairSelectionContainer = document.getElementById('hair-selection-container');
const firstButton = actionButtons[0];
const hairButton = actionButtons[1];
const hatButton = actionButtons[2];
const shirtButton = actionButtons[3];
const shoeButton = actionButtons[4];
let activeButton = null;

// Deactivate button and hide containers
function deactivateActiveButton() {
    if (activeButton) {
        activeButton.classList.remove('active');
        if (activeButton === firstButton) {
            colorPickerContainer.style.display = 'none';
            secondaryColorPickerContainer.style.display = 'none';
        } else if (activeButton === hairButton) {
            hairSelectionContainer.style.display = 'none';
        } else if (activeButton === hatButton) {
            hatSelectionContainer.style.display = 'none';
        } else if (activeButton === shirtButton) {
            shirtSelectionContainer.style.display = 'none';
        } else if (activeButton === shoeButton) {
            shoeSelectionContainer.style.display = 'none';
        }
        activeButton = null;
    }
}

// Toggle containers for buttons
firstButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (activeButton === firstButton) deactivateActiveButton();
    else {
        deactivateActiveButton();
        colorPickerContainer.style.display = 'flex';
        secondaryColorPickerContainer.style.display = 'flex';
        firstButton.classList.add('active');
        activeButton = firstButton;
    }
});
hairButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (activeButton === hairButton) deactivateActiveButton();
    else {
        deactivateActiveButton();
        hairSelectionContainer.style.display = 'flex';
        hairButton.classList.add('active');
        activeButton = hairButton;
    }
});
hatButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (activeButton === hatButton) deactivateActiveButton();
    else {
        deactivateActiveButton();
        hatSelectionContainer.style.display = 'flex';
        hatButton.classList.add('active');
        activeButton = hatButton;
    }
});
shirtButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (activeButton === shirtButton) deactivateActiveButton();
    else {
        deactivateActiveButton();
        shirtSelectionContainer.style.display = 'flex';
        shirtButton.classList.add('active');
        activeButton = shirtButton;
    }
});
shoeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (activeButton === shoeButton) deactivateActiveButton();
    else {
        deactivateActiveButton();
        shoeSelectionContainer.style.display = 'flex';
        shoeButton.classList.add('active');
        activeButton = shoeButton;
    }
});

// Close active button containers when clicking outside
document.addEventListener('click', (event) => {
    if (
        activeButton &&
        !activeButton.contains(event.target) &&
        !colorPickerContainer.contains(event.target) &&
        !secondaryColorPickerContainer.contains(event.target) &&
        !hairSelectionContainer.contains(event.target) &&
        !hatSelectionContainer.contains(event.target) &&
        !shirtSelectionContainer.contains(event.target) &&
        !shoeSelectionContainer.contains(event.target)
    ) {
        deactivateActiveButton();
    }
});

// Name bar functionality
const nameBar = document.getElementById('name-bar');
const widthHelper = document.getElementById('name-bar-width-helper');
const pencilIcon = document.getElementById('pencil-icon');

nameBar.addEventListener('input', () => {
    pencilIcon.style.opacity = nameBar.value === '' ? '0.5' : '0';
});


function updateInputWidth() {
    widthHelper.textContent = nameBar.value || nameBar.placeholder;
    nameBar.style.width = `${widthHelper.offsetWidth + 30}px`;
}
nameBar.addEventListener('input', updateInputWidth);
nameBar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') nameBar.blur();
});
nameBar.addEventListener('blur', () => {
    if (nameBar.value) nameBar.classList.add('placeholder-style');
    else nameBar.classList.remove('placeholder-style');
});
nameBar.addEventListener('focus', () => nameBar.classList.remove('placeholder-style'));
updateInputWidth();

// Function to reset character selections
function resetCharacter() {
    // Example: Reset visibility of all parts
    toggleHatVisibility(false);
    toggleShirtVisibility(false);
    toggleShoeVisibility(false);
    toggleHairVisibility(false);

    // Example: Reset colors to initial state
    updateFurColor("#6161FF"); // Default fur color
    updateSkinColor("#E7AEBD"); // Default skin color

    // Reset name bar to placeholder and remove typed name
    const nameBar = document.getElementById('name-bar');
    nameBar.value = '';
    nameBar.classList.remove('placeholder-style');
    updateInputWidth();
}

// Add event listener for "Clear" button
const clearButton = document.getElementById('clear-button');
clearButton.addEventListener('click', resetCharacter);

// Function to randomize character appearance
function randomizeCharacter() {
    // Randomize visibility of each part
    toggleHatVisibility(Math.random() > 0.5);
    toggleShirtVisibility(Math.random() > 0.5);
    toggleShoeVisibility(Math.random() > 0.5);
    toggleHairVisibility(Math.random() > 0.5);

    // Generate random colors for fur and skin
    const randomFurColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    const randomSkinColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    updateFurColor(randomFurColor);
    updateSkinColor(randomSkinColor);
}

// Event listener for the Randomize button
document.getElementById('randomize-button').addEventListener('click', randomizeCharacter);

