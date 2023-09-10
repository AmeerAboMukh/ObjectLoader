import { OrbitControls } from 'OrbitControls';


var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
scene.background = new THREE.Color(0xffffff);
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight);
console.log("ffffffff: ", window.innerWidth);
camera.position.z = 500;
document.body.appendChild( renderer.domElement );

var controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

var keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
keyLight.position.set(-100, 0, 100);

var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
fillLight.position.set(100, 0, 100);

var backLight = new THREE.DirectionalLight(0xffffff, 1.0);
backLight.position.set(100, 0, -100).normalize();


var obj1;
var objects;
var mtl1;

document.addEventListener('DOMContentLoaded', function() {
    const tempFileDataElement = document.getElementById('tempFileData');
    const file = JSON.parse(tempFileDataElement.getAttribute('data-file'));
   obj1 = file + '.obj';
     mtl1 =  file + '.mtl';


console.log(obj1);
console.log(mtl1);

scene.add(keyLight);
scene.add(fillLight);
scene.add(backLight);


var mtlLoader = new THREE.MTLLoader();
mtlLoader.setTexturePath('./public/objmodels/');
mtlLoader.setPath('./public/objmodels/');
mtlLoader.load(mtl1, function (materials) {

    materials.preload();

    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('./public/objmodels/');
    objLoader.load(obj1, function (object) {
    
    const boundingBox = new THREE.Box3().setFromObject(object);

    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim / Math.tan((camera.fov / 2) * (Math.PI / 180));

    camera.position.copy(center);
    camera.position.z += distance;
    camera.lookAt(center);

    object.rotation.set(Math.PI*1.5, 0, 0);
    object.position.set(0, -15, 0);

    camera.position.set(37.5, 0, 37.5);
    
    scene.add(object);
    objects =object;

    });

});
});
const textureImages = document.querySelectorAll('.texture-image');
    
    textureImages.forEach((image) => {
        image.addEventListener('click', (event) => {
            const texturePath = event.target.getAttribute('src');
            const texturePart = event.target.getAttribute('data-texture-part');
            console.log("texturePath ",texturePath);
            console.log("texturePart ",texturePart);

            changeTexture(texturePath, texturePart);

        });
    });
const colorSelects = document.querySelectorAll('.color-select');
colorSelects.forEach((select) => {
    select.addEventListener('change', (event) => {
        const colorInfo = JSON.parse(select.getAttribute('data-color-info'));
        const selectedColor = event.target.value;

        changePartColor(colorInfo.color_part, selectedColor);
    });
});

function changePartColor(partName, selectedColor) {
    objects.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === partName) {
            const clonedMaterial = child.material.clone();
            clonedMaterial.color.set(selectedColor);

            child.material = clonedMaterial;
        }
    });
    renderer.render(scene, camera);
}

function changeTexture(texturePath, texturePart) {
    console.log(objects);
    objects.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === texturePart) {
        const clonedMaterial = child.material.clone();
  
        const textureLoader = new THREE.TextureLoader();
        const newTexture = textureLoader.load(texturePath);
        clonedMaterial.map = newTexture;
  
        child.material = clonedMaterial;
      }
    });
    renderer.render(scene, camera);
}

var animate = function () {
	requestAnimationFrame( animate );
    if (objects) {
        objects.rotation.z += 0.004;
    }
	controls.update();
	renderer.render(scene, camera);
};

animate();
