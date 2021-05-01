var container, controlsa;
var camera, scene, renderer, light1;

//var clock = new THREE.Clock();
var mixers = [];
var Model;

var envMap;

var mixer;
var AnimtionsList;
var IdleManager;

var  mouse;
var sceneHelpers;
var helper;



var meshList = [];
var meshStore = [];
//var ShaderOn =false;

var meshHelper;
//seclected object
var pickObj;
var tempScale;
//picked obj storec
var gui;
var guif;
var controls = new function(){
	this.ShaderOn = false;
	this.Toon = false;
	this.spotlight=1.0;
}
function MaterialChange() {
	
	if (guif != null) {
		guif.destroy();
	}
	guif = new dat.GUI();
	var MaterialGroup = guif.addFolder('Material Change');
	MaterialGroup.open();
	MaterialGroup.add(controls, 'ShaderOn').name('my shader').onChange(function (str) {
		//shaderon = str;
		controls.ShaderOn =str;
	});
	MaterialGroup.add(controls,'Toon').name('Toon shader').onChange(function (str) {
		controls.Toon = str;
	})
	MaterialGroup.add(controls,'spotlight',0,1,0.1).name('spotlight').onChange(function (val) {
		controls.spotlight = val;
	})
}
MaterialChange();
init();//main



function init() {
	mouse = new THREE.Vector2();
	sceneHelpers = new THREE.Scene();
	helper = new THREE.BoxHelper();
	sceneHelpers.add(helper);
    scene = new THREE.Scene();
	// container
	container = document.createElement('div');
	document.body.appendChild(container);

    //camera
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 2000);
	camera.position.set(0, 1, -8);

	//light
	light1 = new THREE.SpotLight(0xffffff, controls.spotlight);
	scene.add(light1);
	light1.position.set(0,20, 0); 
	light1.castShadow = true; 

	//skybox
	scene.background = new THREE.CubeTextureLoader()
		.setPath('myresource/cloudsky/')
		.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

	envMap =
		new THREE.CubeTextureLoader()
		.setPath('myresource/cloudsky/')
		.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

	//GLTF load
	var loader = new THREE.GLTFLoader();
	loadmodel('myresource/Aloe_5K.gltf');
    loadmodel('myresource/lamborghini_aventador_svj_sdc__free/scene.gltf',3,3,1);
	loadmodel('myresource/armchair_patricia/scene.gltf',0,0,0,0.001,0.001,0.001);
    
	const chinatex = new THREE.TextureLoader().load('myresource/texturemap/china.jpg');
	const woodtex= new THREE.TextureLoader().load('myresource/texturemap/wood.jpg');
	const sphgeo = new THREE.SphereGeometry( 5, 32, 32 );

	const sphmaterial = new THREE.MeshPhysicalMaterial( {map:chinatex});
	const chinasphere = new THREE.Mesh( sphgeo, sphmaterial );
	chinasphere.name='chinasphere';
	chinasphere.position.set(3,5,2);
	chinasphere.scale.set(0.2,0.2,0.2)
	meshList.push(chinasphere);
	scene.add( chinasphere );

	const woodmaterial = new THREE.MeshPhysicalMaterial( {map:woodtex});
	const woodsphere = new THREE.Mesh( sphgeo, woodmaterial );
	woodsphere.name='woodsphere';
	woodsphere.position.set(1,5,2);
	woodsphere.scale.set(0.2,0.2,0.2)
	meshList.push(woodsphere);
	scene.add( woodsphere );

    //loadmodel fuction
	function loadmodel(modelname,x=0,y=0,z=0,sx=1,sy=1,sz=1){
		loader.load(modelname, function (object) {
			Model = object;
			Model.scene.position.set(x,y,z);//set position here
            Model.scene.scale.set(sx,sy,sz);
			scene.add(Model.scene);
			tempScale = Model.scene.scale.x
			//default V2.0
			//transparentObj_Recursive();
			controlObj_Recursive();
			AnimtionsList = Model.animations;
			mixer = new THREE.AnimationMixer(Model.scene);

			mixers.push(mixer);

			if (AnimtionsList[0] != null) {
				IdleManager = mixer.clipAction(AnimtionsList[0]);
				IdleManager.play();
			}

			document.getElementById('table').innerText = '';


		}, undefined, function (e) {
			console.error(e);
		});
	}

	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
	
	});

	//sahdow effect
	renderer.shadowMap.enabled = true;

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.type = 2;
	renderer.shadowMap.enabled = true;
	//renderer.gammaOutput = true;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.25;

	renderer.autoClear = false;
	controlsa = new THREE.OrbitControls(camera, renderer.domElement);
	controlsa.target.set(0, 0, 0);
	controlsa.update();
	// proton = new Proton();
	// proton.addRender(new Proton.SpriteRender(scene));

	var animate = function() {
		requestAnimationFrame(animate);

		renderer.render(scene, camera);
		renderer.render(sceneHelpers, camera);
		light1.intensity=controls.spotlight;
	};
	animate();
	container.appendChild(renderer.domElement);
	renderer.sortObjects = true;
	//select obj
	container.addEventListener('click', onDocumentMouseDown);
	container.addEventListener( 'resize', onWindowResize, false );

	document.body.addEventListener('touchmove', function(e) {

		e.preventDefault(); //Prevent the effect of the default drop-down sliding
		passive: false
	}); //ios &android

}

function onWindowResize() {
	camera.aspect = document.body.clientWidth / document.body.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(document.body.clientWidth, document.body.clientHeight);
}

function update(mixerUpdateDelta) {

	//console.log(12);

	for (var i = 0; i < mixers.length; i++) {
		mixers[i].update(mixerUpdateDelta);
	}
}

//select obj
function onDocumentMouseDown(e) {//mouse down

	e.preventDefault();
	mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
	var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
	var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
	var intersects = raycaster.intersectObjects(scene.children, true);
	if (intersects.length > 0) {

		for (let i = 0; i < meshList.length; i++) {
			if (meshList[i].name === intersects[0].object.name){
				//console.log(i);
				selectedObjectChanged(meshList[i]);

				pickObj = meshList[i];
				//meshStore[i] = meshList[i].material.clone();
				if (controls.ShaderOn == true){
					//var PerMaterial = new THREE.MeshPhongMaterial();
					var PerMaterial = new THREE.ShaderMaterial({
						vertexShader: document.getElementById('phongvertex-shader').textContent,
						fragmentShader: document.getElementById('phongfragment-shader').textContent,
					});
					
					//PerMaterial.copy(meshList[i].material);
					meshList[i].material = PerMaterial;
					console.log('my Shader on');
					console.log(controls.ShaderOn);
				}
				else if(controls.Toon == true){
					var ToonMaterial = new THREE.MeshToonMaterial();
					ToonMaterial.copy(meshList[i].material);
					meshList[i].material = ToonMaterial;
					UseGUI(meshList[i]);
				}
				else{
				meshList[i].material=(meshStore[i]);
				//UseGUI(meshList[i]);
				UseGUI(meshList[i]);
				console.log(controls.ShaderOn);
				}
			}
		}

	}
}
//selected effect :Yellow border
function selectedObjectChanged(object) {
	if (object === undefined) object = null;
	if (object === null) {
		helper.visible = false;
	} else {
		helper.setFromObject(object);
		helper.visible = true;
	}
}
//Recursive ,list of all objects
function controlObj_Recursive() {
	if (Model != null) {
		var objParet = Model.scene;
		objParet.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				meshList.push(child);
                //console.log(meshList.length);
				var mtl = new THREE.MeshPhysicalMaterial();
				mtl.copy(child.material);
				mtl.envMap = envMap;
				child.material = mtl;
				//Material
				 
				//console.log(child.material);
			}
		});
	}
	for (let i = 0; i < meshList.length; i++) {
		meshStore[i] = meshList[i].material.clone();}


}

//UseGUI
function UseGUI(mesh,index=0){
	let material;
	if (mesh.material.length!=undefined){
		material = mesh.material[index];
	}
	else{
		material = mesh.material;
	}

	function updateMaterial(){
		var controls = new function(){
			this.modelName = mesh.name;
			this.renderOrder = mesh.renderOrder;
			this.castShadow = mesh.castShadow;
			this.receiveShadow = mesh.receiveShadow;
			if (material.envMap != null) {
				this.isenvMap = true;
			} 
			else {
				this.isenvMap = false;
			}
			this.envMapIntensity = material.envMapIntensity == null ? 0 : material.envMapIntensity;
			this.materialName = material.name;
			this.defaultSide = material.side;
			this.mapColor = material.color == null ? new THREE.Color(0xFFFFFF) : material.color;
			this.roughness = material.roughness == null ? 0 : material.roughness;
			this.metalness = material.metalness == null ? 0 : material.metalness;
			this.normalScale = material.normalScale == null ? 0 : material.normalScale.x;
			this.pershader = false;
			//Texture
			// this.useMap = useMap;
			// if (material.map != null) {
			// 	//console.log(material.map.image);
			// 	var tempArray = material.map.image.src.split('/');
			// 	this.jpgPngTexture = tempArray[tempArray.length - 1];
			// } 
			// else {
			// 	this.jpgPngTexture = "";
			// }
			// this.loadTexture = function() {};
			// //NormalMap
			// this.useNormalsMap = useNormalsMap;
			// if (material.normalMap != null) {
			// 	var tempArray = material.normalMap.image.src.split('/');
			// 	this.jpgPngNormalMap = tempArray[tempArray.length - 1];

			// } 
			// else {
			// 	this.jpgPngNormalMap = "";
			// }

		}
		if (gui != null){
			gui.destroy();
		}
		gui = new dat.GUI();
		var Group = gui.addFolder('Material Change');
		
		//Group.open();
		Group.add(controls,'modelName').name('ModelName');
		Group.add(controls,'renderOrder',0,100,1).name('Render Order');
		Group.add(controls,'castShadow').name('Cast Shadow').onChange(function(str){
			mesh.castShadow = str;
			material.needsUpdate = true;
		});
		Group.add(controls,'receiveShadow').name('Receive Shadow').onChange(function(str){
			mesh.receiveShadow = str;
			material.needsUpdate = true;
		});
		Group.add(controls,'isenvMap').name('Env Reflection on').onChange(function(val){
			if (val){
				material.envMap = envMap;
			}
			else{
				material.envMap = null;
			}
			material.needsUpdate = true;
		});
		Group.add(controls,'envMapIntensity',0,2).name('Reflection Intensity').onChange(function(val){
			material.envMapIntensity = val;
		});
		Group.add(controls, 'materialName').name('Material Name').onChange(function(str) {
			material.name = str;
		});

		Group.add(controls, 'defaultSide', {FrontSide: 0, BackSide: 1, DoubleSide: 2}).name('Side').onChange(function(str) {
			defaultSide = str;
			if (defaultSide == 0) {
				//console.log("mesh-FrontSide");
				material.side = THREE.FrontSide;
			}
			else if (defaultSide == 1) {
				//console.log("mesh-BackSide");
				material.side = THREE.BackSide;
			}
			else if (defaultSide == 2) {
				//console.log("mesh-DoubleSide");
				material.side = THREE.DoubleSide;

			}
		});
		Group.addColor(controls, 'mapColor').name('Color').onChange(function (str) {
			var r = str.r / 255;
			var g = str.g / 255;
			var b = str.b / 255;
			material.color = {
				r,
				g,
				b
			};
			material.needsUpdate = true;
		});

		Group.add(controls, 'metalness', 0, 1, 0.1).name('Metalness').onChange(function (val) {
			material.metalness = val;
			material.needsUpdate = true;
		});
		Group.add(controls, 'roughness', 0, 1, 0.1).name('Roughness').onChange(function (val) {
			material.roughness = val;
			material.needsUpdate = true;
		});
		Group.add(controls, 'normalScale', 0, 1, 0.1).name('Normal Scale').onChange(function (val) {
			if (material.normalMap != null) {
				material.normalScale.x = val;
				material.normalScale.y = -val;
				material.needsUpdate = true;
			}
		});
	

	}
	updateMaterial();
}




