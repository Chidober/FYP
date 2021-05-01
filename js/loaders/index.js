import { SubsurfaceScatteringShader } from './SubsurfaceScatteringShader.js';
import { FresnelShader } from './FresnelShader.js';

import * as ThreeModule from "../../build/three.module.js";

if (!Detector.webgl) Detector.addGetWebGLMessage();
var container, controlsa;
var camera, scene, renderer, light1;
var ani;
var clock = new THREE.Clock();
var mixers = [];
var xinzangModel;
var matIndex = 0; //当前材质索引
//是否开启斑化问题
var isDepthTest = false;
var tgaTexture;
//是否暂停动画
var isPlay = false;
var envMap;

var mixer;
var AnimtionsList;
var IdleManager;

var raycaster, mouse;
var sceneHelpers;
var helper;

var gui;
var AnimationIndex = 0; //当前动画索引
var operateModelIndex = 0;
var meshList = [];

init();

var meshHelper;
//被选中的物体
var pickObj;
var tempScale;
//记录原来的材质
var oldMaterial;
var isGlass= false;
var tempGlassColor = new THREE.Color(0x2BFFFF);

//水面流动亮宇
var is_wave = false;
var is_wave_x = true;
var is_wave_y = true;
var wave_texture;
var waveSpeedX = 0.01; //流动的速度
var waveSpeedY = 0.01;

//灯光亮宇
var lightIndex = -1;
var lightlist = [];
var lightgui;

//粒子系统
var emitterIndex = -1;
var emitterlist = [];
var emittergui;
var bodyTextureSrc = "img/dot.png";
var ShapeZone;
var ZoneType = 1;
var texAnimatorObj = null;
var textureRotate = false;
var readEmitterTemplate = false;
var mesh;
var meshSrc = "assets/teapot.json";
var meshScale = 1;

var proton;
var tempMaterial;
//END
var CONFIG = {
	//1。。。。。。。。。。。。。粒子名称
	Looping : true,
	//PosVar 发射器位置浮动
	//PositionType  FREE RELATIVE GROUPED
	SimulationSpace: {

		//世界坐标
		World: {
			WorldX: 0.0,
			WorldY: 0.0,
			WorldZ: 0.0
		}
	},

	Shape: {
		PointZone:{
			LocalX: 0.0,
			LocalY: 0.0,
			LocalZ: 0.0
		},

		BoxZone:{
			BoxZoneX: 0.0,
			BoxZoneY: 0.0,
			BoxZoneZ: 0.0,
			BoxZoneWidth: 2.0,
			BoxZoneHeight: 2.0,
			BoxZoneDepth: 2.0
		},
		//世界坐标
		SphereZone: {
			SphereZoneX: 0.0,
			SphereZoneY: 0.0,
			SphereZoneZ: 0.0,
			SphereZoneRadius: 3.0,
		}
	},

	//发射速率
	EmissionRate: {
		//发射时间
		timePan: 0.15,
		//发射数量
		numPan: 10
	},
	//2。。。。。。。。。。。。。粒子初始化
	Body: createSprite(),
	isTexAnimator : false,
	TexAnimator: {
		texHoriz: 4,
		texvert: 4,
		texTotal: 16,
		texDuration: 5
	},

	//初始化质量
	mass: 1,

	//初始化加速度
	velocity: {
		radiusPan:
			3,
		dir: new Proton.Vector3D(0, 1, 0),
		//发射角度
		tha: 45
	},

	//初始化生命周期
	startLife: 1,

	//3。。。。。。。。。。。。。粒子脚本行为
	/*Behaiviors*/
	PhysicsOpen : false,
	gravity : 0,
	//粒子大小
	size: {
		sizeFrom: 0.1,
		sizeTo: 0
	},

	colorChange : false,
	//粒子颜色
	color: {
		colorFrom:
			'#4F1500'
		,
		colorTo:
			'#0029FF'
	},

	//粒子透明
	alpha : {
		alphaFrom:  1,
		alphaTo: 0
	},

	//粒子角度
	rotate: {
		rotateFrom:  90,
		rotateTo: 0
	}
};

//4, 4, 16, 55 ); // texture, #horiz, #vert, #total, duration.
function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration)
{
	// note: texture passed by reference, will be updated by the update function.

	this.tilesHorizontal = tilesHoriz;
	this.tilesVertical = tilesVert;
	// how many images does this spritesheet contain?
	//  usually equals tilesHoriz * tilesVert, but not necessarily,
	//  if there at blank tiles at the bottom of the spritesheet.
	this.numberOfTiles = numTiles;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

	// how long should each image be displayed?
	this.tileDisplayDuration = tileDispDuration;

	// how long has the current image been displayed?
	this.currentDisplayTime = 0;

	// which image is currently being displayed?
	this.currentTile = 0;

	this.update = function( milliSec )
	{
		this.currentDisplayTime += milliSec;
		while (this.currentDisplayTime > this.tileDisplayDuration)
		{
			this.currentDisplayTime -= this.tileDisplayDuration;
			this.currentTile++;
			if (this.currentTile == this.numberOfTiles)
				this.currentTile = 0;
			var currentColumn = this.currentTile % this.tilesHorizontal;
			texture.offset.x = currentColumn / this.tilesHorizontal;
			var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
			texture.offset.y = currentRow / this.tilesVertical;
		}
	};
}

function init() {
	raycaster = new THREE.Raycaster(); //光线投射器;
	mouse = new THREE.Vector2();
	sceneHelpers = new THREE.Scene();
	helper = new THREE.BoxHelper();
	sceneHelpers.add(helper);
	// 容器
	container = document.createElement('div');
	document.body.appendChild(container);

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 2000);
	camera.position.set(0, 1, -8);
	scene = new THREE.Scene();
	light1 = new THREE.SpotLight(0xffffff, 1.4);
	scene.add(light1);
	light1.position.set(0,20, 0);
	light1.castShadow = true; //开启灯光投射阴影
	//天空盒子
	scene.background = new THREE.CubeTextureLoader()
		.setPath('sky/')
		.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

	envMap =
		new THREE.CubeTextureLoader()
		.setPath('sky/')
		.load(['right.jpg', 'left.jpg', 'top.jpg', 'bottom.jpg', 'front.jpg', 'back.jpg']);

	var ly;
	//GLTF加载
	var loader = new THREE.GLTFLoader();
	loader.load("../three.js-r126/myresource/lamborghini_aventador_svj_sdc__free/scene.gltf", function(object) {
		xinzangModel = object;
		ly = xinzangModel.scene.children;
		//xinzangModel.scene.rotation.y = Math.PI * 0.4;
		scene.add(xinzangModel.scene);

		tempScale = xinzangModel.scene.scale.x
		//递归将所有物体默认打开双面，V2.0
		//transparentObj_Recursive();
		controlObj_Recursive();
		AnimtionsList = xinzangModel.animations;
		mixer = new THREE.AnimationMixer(xinzangModel.scene);

		mixers.push(mixer);

		var rect1 = document.getElementById("rect1");
		var rect2 = document.getElementById("rect2");
		var rect3 = document.getElementById("rect3");
		var rect4 = document.getElementById("rect4");

		var newMask = document.createElement("div");
		newMask.id = "newMask";
		rect1.appendChild(newMask);
		rect2.appendChild(newMask);
		rect3.appendChild(newMask);
		rect4.appendChild(newMask);

		rect1.parentNode.removeChild(rect1);
		rect2.parentNode.removeChild(rect2);
		rect3.parentNode.removeChild(rect3);
		rect4.parentNode.removeChild(rect4);

		if (AnimtionsList[0] != null) {
			IdleManager = mixer.clipAction(AnimtionsList[0]);
			IdleManager.play();
		}

		document.getElementById('table').innerText = '';


	}, undefined, function(e) {
		console.error(e);
	});
	//antialias:true增加抗锯齿效果
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
		//logarithmicDepthBuffer: true//解决阴影闪烁的问题（测试LY_8.12）
	});
	//阴影效果
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
	proton = new Proton();
	proton.addRender(new Proton.SpriteRender(scene));
	var animate = function() {
		requestAnimationFrame(animate);
		var mixerUpdateDelta = clock.getDelta();
		if (mixers.length > 0) {
			if (isPlay) {
				update(mixerUpdateDelta);
			}

		}
		if (is_wave) {
			if (is_wave_x)
				wave_texture.offset.x -= waveSpeedX;
			if (is_wave_y)
				wave_texture.offset.y -= waveSpeedY;
		}
		if (proton!=null){
			proton.update();
			Proton.Debug.renderInfo(proton, 3);
		}
		if(texAnimatorObj!= null)
		{
			texAnimatorObj.update(100 * mixerUpdateDelta);
		}
		if(textureRotate){
			emitterlist[emitterIndex].initializes[1].body._arr[0].material.rotation = Math.random()*180;

		}
		renderer.render(scene, camera);
		renderer.render(sceneHelpers, camera);
	};
	animate();
	container.appendChild(renderer.domElement);
	renderer.sortObjects = true;
	//选择物体
	container.addEventListener('click', onDocumentMouseDown);
	container.addEventListener( 'resize', onWindowResize, false );

	document.body.addEventListener('touchmove', function(e) {

		e.preventDefault(); //阻止默认的处理方式(阻止下拉滑动的效果)
	}, {
		passive: false
	}); //passive 参数不能省略，用来兼容ios和android

}

function onWindowResize() {
	camera.aspect = document.body.clientWidth / document.body.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(document.body.clientWidth, document.body.clientHeight);
}

function update(mixerUpdateDelta) {

	console.log(12);
	//每帧动画渲染
	for (var i = 0; i < mixers.length; i++) {
		mixers[i].update(mixerUpdateDelta);
	}
}

//选择物体
function onDocumentMouseDown(e) {

	e.preventDefault();
	//controls.update();
	//将鼠标点击位置的屏幕坐标转成threejs中的标准坐标,具体解释见代码释义
	mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
	//新建一个三维单位向量 假设z方向就是0.5
	//根据照相机，把这个向量转换到视点坐标系
	var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);

	//在视点坐标系中形成射线,射线的起点向量是照相机， 射线的方向向量是照相机到点击的点，这个向量应该归一标准化。
	var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
	//射线和模型求交，选中一系列直线intersectObjects
	var intersects = raycaster.intersectObjects(xinzangModel.scene.children, true);
	if (intersects.length > 0) {

		for (let i = 0; i < meshList.length; i++) {
			if (meshList[i].name === intersects[0].object.name){
				//console.log(meshList[i])
				//选中第一个射线相交的物体
				selectedObjectChanged(meshList[i]);

				//寄存选中的物体
				pickObj = meshList[i];
				UseGUI(meshList[i]);
			}
		}

	}
}
//添加选中效果
function selectedObjectChanged(object) {
	if (object === undefined) object = null;
	if (object === null) {
		helper.visible = false;
	} else {
		helper.setFromObject(object);
		helper.visible = true;
	}
}
//存储数据
var Ly_content = {};

var Ly_data = [];
var Ly_LightData = [];
var Ly_ParticleData = [];

function UseGUI(mesh, index = 0) {
	var material;

	//贴图修改
	var useMap = false,
		useNormalsMap = false,
		useTransparent = false,
		useEmissiveMap = false,

		useclearcoatRoughnessMap= false,
		useclearcoatNormalMap = false,
		useClearcoatMap = false,

		useSkin = false,
		useSkinTransparent = false,
		useFresnel = false,
		useRim = false,
		useRimOpaque = false,
		useAlphaMap = false;

	var defaultSide = THREE.DoubleSide,
		SkinMaterial,SkinUniforms,FresnelMaterial,FresnelUniforms,RimMaterial;
	//mesh-standard
	if (mesh.material.length != undefined) {
		material = mesh.material[index];
	} else {
		matIndex = 0;
		material = mesh.material;
	}
	tempMaterial = material;

	function updateMaterial() {
		//存放有所有需要改变的属性的对象
		var controls = new function() {
			//模型名
			this.modelName = mesh.name;
			this.renderOrderValue = mesh.renderOrder;
			//是否开启阴影
			this.castShadow = mesh.castShadow;
			//是否接收阴影
			this.receiveShadow = mesh.receiveShadow;
			//envMap
			if (material.envMap != null) {
				this.isenvMap = true;
			} else {
				this.isenvMap = false;
			}
			this.envMapIntensity = material.envMapIntensity == null ? 0 : material.envMapIntensity;

			//材质名
			this.materialName = material.name;

			//折射率
			this.refractionRatio = material.refractionRatio == null ? 1 : material.refractionRatio;
			this.mapColor = material.color == null ? new THREE.Color(0xFFFFFF) : material.color;

			this.roughness = material.roughness == null ? 0 : material.roughness;
			this.metalness = material.metalness == null ? 0 : material.metalness;
			this.normalScale = material.normalScale == null ? 0 : material.normalScale.x;
			//普通贴图修改
			this.useMap = useMap;
			if (material.map != null) {
				//console.log(material.map.image);
				var tempArray = material.map.image.src.split('/');
				this.jpgPngTexture = tempArray[tempArray.length - 1];
			} else {
				this.jpgPngTexture = "";
			}
			this.loadTexture = function() {};
			//凹凸贴图修改
			this.useNormalsMap = useNormalsMap;
			if (material.normalMap != null) {
				var tempArray = material.normalMap.image.src.split('/');
				this.jpgPngNormalMap = tempArray[tempArray.length - 1];

			} else {
				this.jpgPngNormalMap = "";
			}
			//自发光贴图修改
			this.useEmissiveMap = useEmissiveMap;
			if (material.emissiveMap != null) {
				var tempArray = material.emissiveMap.image.src.split('/');
				this.jpgPngEmissiveMap = tempArray[tempArray.length - 1];

			} else {
				this.jpgPngEmissiveMap = "";
			}
			this.emissiveColor = material.emissive == null ? new THREE.Color(0xFFFFFF) : material.emissive;
			this.emissiveIntensity = material.emissiveIntensity == null ? 0 : material.emissiveIntensity;

			this.defaultSide = material.side;
			this.opacity = material.opacity == null ? 1 : material.opacity;
			this.transparent = useTransparent;

			this.clearcoat = material.clearcoat == null ? 0.0 : material.clearcoat;
			this.clearcoatMap = material.clearcoatMap == null ? null : material.clearcoatMap;
			this.clearcoatRoughness = material.clearcoatRoughness == null ? 0.0 : material.clearcoatRoughness;
			this.clearcoatRoughnessMap = material.clearcoatRoughnessMap == null ? null : material.clearcoatRoughnessMap;
			this.clearcoatNormalScale = material.clearcoatNormalScale == null ? 1 : material.clearcoatNormalScale.x ;
			this.clearcoatNormalMap = material.clearcoatNormalMap == null ? null : material.clearcoatNormalMap;
			this.reflectivity = material.reflectivity == null ? 0.5 : material.reflectivity; // maps to F0 = 0.04
			this.useClearcoatMap = useClearcoatMap;
			if (material.clearcoatMap != null) {
				var tempArray = material.clearcoatMap.image.src.split('/');
				this.jpgPngClearcoatMap = tempArray[tempArray.length - 1];

			} else {
				this.jpgPngClearcoatMap = "";
			}
			this.useclearcoatRoughnessMap = useclearcoatRoughnessMap;
			if (material.clearcoatRoughnessMap != null) {
				var tempArray = material.clearcoatRoughnessMap.image.src.split('/');
				this.jpgPngClearcoatRoughnessMap = tempArray[tempArray.length - 1];

			} else {
				this.jpgPngClearcoatRoughnessMap = "";
			}
			this.useclearcoatNormalMap = useclearcoatNormalMap;
			if (material.clearcoatNormalMap != null) {
				var tempArray = material.clearcoatNormalMap.image.src.split('/');
				this.jpgPngClearcoatNormalMap = tempArray[tempArray.length - 1];

			} else {
				this.jpgPngClearcoatNormalMap = "";
			}
			this.useAlphaMap = useAlphaMap;
			if (material.alphaMap != null) {
				var tempArray = material.alphaMap.image.src.split('/');
				this.jpgPngAlphaMap = tempArray[tempArray.length - 1];

			} else {
				this.jpgPngAlphaMap = "";
			}

			//alpha
			this.alphaTest = material.alphaTest == null ? 0 : material.alphaTest;
			this.transmission = material.transmission == null ? 0 : material.transmission;
			this.ior = material.ior == null ? 1.5 : material.ior;

			//Subsurface Scattering
			this.sheen = material.sheen == null ? new THREE.Color( 10, 10, 10 ) : material.sheen;
			this.useSkin = useSkin;
			this.skinColor = new THREE.Color(0xFFC495);
			this.bloodColor = new THREE.Color(0x6b0602);
			this.shininess = 500;
			this.thicknessDistortion = 0.1;
			this.thicknessAmbient = 0.4;
			this.thicknessAttenuation = 0.8;
			this.thicknessPower = 2.0;
			this.thicknessScale = 16.0;

			this.useSkinTransparent = useSkinTransparent;
			this.useFresnel = useFresnel;
			this.RefractionRatio = 1.02;
			this.FresnelBias = 0.1;
			this.FresnelPower = 2.0;
			this.FresnelScale = 1.0;

			//水面流动
			this.wave = false;
			//水面流动速度
			this.waveSpeedX = waveSpeedX;
			this.waveSpeedY = waveSpeedY;
			//围绕x轴移动
			this.is_wave_x = true;
			//围绕y轴移动
			this.is_wave_y = true;

			//rim 边缘发光
			this.useRim = useRim;
			this.coeficient = 1;
			this.glowPower = 5;
			this.glowColor = new THREE.Color('#2BFFFF');

			this.useRimOpaque = useRimOpaque;
			this.cancle = function() {};
			this.save = function() {
				var bbb = {

					modelname: mesh.name,
					renderOrderValue: mesh.renderOrder,
					castShadow : mesh.castShadow,
					receiveShadow : mesh.receiveShadow,
					isenvMap : true,
					envMapIntensity : material.envMapIntensity,

					materialName : material.name,
					defaultSide : defaultSide,
					mapColor : material.color,
					metalness : material.metalness,
					roughness : material.roughness,
					normalScale : material.normalScale.x,

					useMap : useMap,
					jpgPngTexture : material.map,
					useNormalsMap : useNormalsMap,
					jpgPngNormalMap : material.normalMap,
					useEmissiveMap : useEmissiveMap,
					jpgPngEmissiveMap : material.emissiveMap,
					useClearcoatMap : useClearcoatMap,
					jpgPngClearcoatMap : material.clearcoatMap,
					useclearcoatRoughnessMap : useclearcoatRoughnessMap,
					jpgPngClearcoatRoughnessMap : material.clearcoatRoughnessMap,
					useclearcoatNormalMap : useclearcoatNormalMap,
					jpgPngClearcoatNormalMap : material.clearcoatNormalMap,
					useAlphaMap : useAlphaMap,
					jpgPngAlphaMap : material.alphaMap,

					emissiveColor : material.emissive,
					emissiveIntensity : material.emissiveIntensity,
					transparent : useTransparent,
					opacity : material.opacity,
					alphaTest : material.alphaTest,
					transmission : material.transmission,
					ior : material.ior,

					clearcoat : material.clearcoat,
					clearcoatRoughness : material.clearcoatRoughness,
					clearcoatNormalScale : material.clearcoatNormalScale.x,
					reflectivity : material.reflectivity,
					sheen : material.sheen,

					useSkin : useSkin,
					skinColor : material.uniforms == null ? new THREE.Color(0xFFC495) : SkinUniforms[ 'diffuse' ].value,
					bloodColor : material.uniforms == null ? new THREE.Color(0x6b0602) : SkinUniforms[ 'thicknessColor' ].value,
					shininess : material.uniforms == null ? 500 : SkinUniforms[ 'shininess' ].value,
					thicknessDistortion : material.uniforms == null ? 0.1 : SkinUniforms[ 'thicknessDistortion' ].value,
					thicknessAmbient : material.uniforms == null ? 0.4 : SkinUniforms[ 'thicknessAmbient' ].value,
					thicknessAttenuation : material.uniforms == null ? 0.8 : SkinUniforms[ 'thicknessAttenuation' ].value,
					thicknessPower : material.uniforms == null ? 2.0 : SkinUniforms[ 'thicknessPower' ].value,
					thicknessScale : material.uniforms == null ? 16.0 : SkinUniforms[ 'thicknessScale' ].value,
					useSkinTransparent : useSkinTransparent,

					useFresnel : useFresnel,
					RefractionRatio : material.uniforms == null ? 1.02 : FresnelUniforms[ 'mRefractionRatio' ].value,
					FresnelBias : material.uniforms == null ? 0.1 : FresnelUniforms[ 'mFresnelBias' ].value,
					FresnelPower : material.uniforms == null ? 2.0 : FresnelUniforms[ 'mFresnelPower' ].value,
					FresnelScale : material.uniforms == null ? 1.0 : FresnelUniforms[ 'mFresnelScale' ].value,

					wave : is_wave,
					is_wave_x : is_wave_x,
					waveSpeedX : waveSpeedX,
					is_wave_y : is_wave_y,
					waveSpeedY : waveSpeedY,

					useRim : useRim,
					glowColor : material.uniforms == null ? new THREE.Color('#2BFFFF') : RimMaterial.uniforms.glowColor.value,
					coeficient : material.uniforms == null ? 1 : RimMaterial.uniforms.coeficient.value,
					glowPower : material.uniforms == null ? 5 : RimMaterial.uniforms.power.value,
					useRimOpaque : useRimOpaque


				}
				Ly_data.push(bbb);
				alert("修改数据已保存！");
			};

		};
		if (gui != null) {
			gui.destroy();
		}
		gui = new dat.GUI();
		var matGroup = gui.addFolder('模型材质调节');
		matGroup.open();
		//name
		matGroup.add(controls, 'modelName').name('网格名称').onChange(function(str) {
			mesh.name = str;
		});
		//渲染设置
		var rendererGroup = matGroup.addFolder('渲染设置');
		rendererGroup.close();
		rendererGroup.add(controls, 'renderOrderValue', 0, 100, 1).name('渲染序列').onChange(function(str) {
			mesh.renderOrder = str;
		})
		rendererGroup.add(controls, 'castShadow').name('产生投影').onChange(function(str) {
			mesh.castShadow = str; //开启投影
			material.needsUpdate = true;

		});
		rendererGroup.add(controls, 'receiveShadow').name('接收阴影').onChange(function(str) {
			mesh.receiveShadow = str; //接收阴影
			material.needsUpdate = true;
		});

		rendererGroup.add(controls, 'isenvMap').name('打开反射').onChange(function(val) {
			if (val) {
				material.envMap = envMap;
			} else {
				material.envMap = null;
			}
			material.needsUpdate = true;
		});
		rendererGroup.add(controls, 'envMapIntensity', 0, 2).name('反射强度').onChange(function(val) {
			material.envMapIntensity = val;
		});

		matGroup.add(controls, 'materialName').name('材质球名称').onChange(function(str) {
			material.name = str;
		});

		matGroup.add(controls, 'defaultSide', {FrontSide: 0, BackSide: 1, DoubleSide: 2}).name('面显示方式').onChange(function(str) {
			defaultSide = str;
			if (defaultSide == 0) {
				console.log("mesh-FrontSide");
				material.side = THREE.FrontSide;
			}
			else if (defaultSide == 1) {
				console.log("mesh-BackSide");
				material.side = THREE.BackSide;
			}
			else if (defaultSide == 2) {
				console.log("mesh-DoubleSide");
				material.side = THREE.DoubleSide;

			}
		});

		var SimulationShader = matGroup.addFolder('PBR属性');
		SimulationShader.open();

			//mapColor
		SimulationShader.addColor(controls, 'mapColor').name('基础色').onChange(function(str) {
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

		SimulationShader.add(controls, 'metalness', 0, 1, 0.1).name('金属度').onChange(function(val) {
			material.metalness = val;
			material.needsUpdate = true;
		});
		SimulationShader.add(controls, 'roughness', 0, 1, 0.1).name('粗糙度').onChange(function(val) {
			material.roughness = val;
			material.needsUpdate = true;
		});
		SimulationShader.add(controls, 'normalScale', 0, 1, 0.1).name('凹凸度').onChange(function(val) {
			if (material.normalMap != null) {
				material.normalScale.x = val;
				material.normalScale.y = -val;
				material.needsUpdate = true;
			}
		});
		var TextureGroup = matGroup.addFolder('纹理修改');
		TextureGroup.close();

		TextureGroup.add(controls, 'useMap').name('普通纹理').onChange(function(val) {
			useMap = val;
			updateMaterial();
		});
		if(useMap){
			var commonTexture;

			TextureGroup.add(controls, 'jpgPngTexture').name('普通纹理路径').onChange(function(str) {
				if (str != null) {
					commonTexture = new THREE.TextureLoader().load("model/GLTFModel/Assets/TempAssets/TextureFile/" +
						str);

					material.map = commonTexture;
					material.map.needsUpdate = true;
				}
			});
			TextureGroup.add(controls, 'loadTexture').name('普通纹理加载').onChange(function(str) {
				material.map = commonTexture;
				material.needsUpdate = true;
			});
		}

		TextureGroup.add(controls, 'useNormalsMap').name('凹凸纹理').onChange(function(val) {
			useNormalsMap = val;
			updateMaterial();
		});
		if(useNormalsMap){
			var normalTexture;
			TextureGroup.add(controls, 'jpgPngNormalMap').name('凹凸纹理路径').onChange(function(str) {
				if (str != null) {
					normalTexture = new THREE.TextureLoader().load("model/GLTFModel/Assets/TempAssets/TextureFile/" +
						str);
					material.needsUpdate = true;
				}
			});
			TextureGroup.add(controls, 'loadTexture').name('凹凸纹理加载').onChange(function(str) {

				material.normalMap = normalTexture;
				material.needsUpdate = true;

			});
		}

		TextureGroup.add(controls, 'useEmissiveMap').name('自发光纹理').onChange(function(val) {
			useEmissiveMap = val;
			updateMaterial();
		});
		if(useEmissiveMap){
			var emissiveTexture;
			TextureGroup.add(controls, 'jpgPngEmissiveMap').name('自发光纹理路径').onChange(function(str) {
				if (str != null) {
					emissiveTexture = new THREE.TextureLoader().load("model/GLTFModel/Assets/TempAssets/TextureFile/" +
						str);
					material.needsUpdate = true;
				}
			});
			TextureGroup.add(controls, 'loadTexture').name('自发光纹理加载').onChange(function(str) {

				material.emissiveMap = emissiveTexture;
				material.needsUpdate = true;

			});
		}

		TextureGroup.add(controls, 'useClearcoatMap').name('清漆层纹理').onChange(function(val) {
			useClearcoatMap = val;
			updateMaterial();
		});
		if(useClearcoatMap){
			var clearcoatTexture;
			TextureGroup.add(controls, 'jpgPngClearcoatMap').name('清漆层纹理路径').onChange(function(str) {
				if (str != null) {
					clearcoatTexture = new THREE.TextureLoader().load("model/GLTFModel/Assets/TempAssets/TextureFile/" +
						str);
					material.needsUpdate = true;
				}
			});
			TextureGroup.add(controls, 'loadTexture').name('清漆层纹理加载').onChange(function(str) {

				material.clearcoatMap = clearcoatTexture;
				material.needsUpdate = true;

			});
		}

		TextureGroup.add(controls, 'useclearcoatRoughnessMap').name('清漆粗糙度').onChange(function(val) {
			useclearcoatRoughnessMap = val;
			updateMaterial();
		});
		if(useclearcoatRoughnessMap){
			var clearcoatRoughnessTexture;
			TextureGroup.add(controls, 'jpgPngClearcoatRoughnessMap').name('清漆粗糙度路径').onChange(function(str) {
				if (str != null) {
					clearcoatRoughnessTexture = new THREE.TextureLoader().load("model/GLTFModel/Assets/TempAssets/TextureFile/" +
						str);
					material.needsUpdate = true;
				}
			});
			TextureGroup.add(controls, 'loadTexture').name('清漆粗糙度加载').onChange(function(str) {

				material.clearcoatRoughnessMap = clearcoatRoughnessTexture;
				material.needsUpdate = true;

			});
		}

		TextureGroup.add(controls, 'useclearcoatNormalMap').name('清漆凹凸度').onChange(function(val) {
			useclearcoatNormalMap = val;
			updateMaterial();
		});
		if(useclearcoatNormalMap){
			var clearcoatNormalTexture;
			TextureGroup.add(controls, 'jpgPngClearcoatNormalMap').name('清漆凹凸度路径').onChange(function(str) {
				if (str != null) {
					clearcoatNormalTexture = new THREE.TextureLoader().load("model/GLTFModel/Assets/TempAssets/TextureFile/" +
						str);
					material.needsUpdate = true;
				}
			});
			TextureGroup.add(controls, 'loadTexture').name('清漆凹凸度加载').onChange(function(str) {

				material.clearcoatNormalMap = clearcoatNormalTexture;
				material.needsUpdate = true;

			});
		}

		TextureGroup.add(controls, 'useAlphaMap').name('透明度纹理').onChange(function(val) {
			useAlphaMap = val;
			updateMaterial();
		});
		if(useAlphaMap){
			var alphaTexture;
			TextureGroup.add(controls, 'jpgPngAlphaMap').name('透明度纹理路径').onChange(function(str) {
				if (str != null) {
					alphaTexture = new THREE.TextureLoader().load("model/GLTFModel/Assets/TempAssets/TextureFile/" +
						str);
					material.needsUpdate = true;
				}
			});
			TextureGroup.add(controls, 'loadTexture').name('透明度纹理加载').onChange(function(str) {

				material.alphaMap = alphaTexture;
				material.needsUpdate = true;

			});
		}

		var EmissiveGroup = matGroup.addFolder('自发光调整');
		EmissiveGroup.close();
		EmissiveGroup.addColor(controls, 'emissiveColor').name('自发光颜色').onChange(function(str) {
			var r = str.r / 255;
			var g = str.g / 255;
			var b = str.b / 255;
			material.emissive = {
				r,
				g,
				b
			};
			material.needsUpdate = true;
		});
		//自发光强度
		EmissiveGroup.add(controls, 'emissiveIntensity', 0, 10, 0.1).name('自发光强度').onChange(function(str) {
			material.emissiveIntensity = str;
			material.needsUpdate = true;
		});

		var transparentGroup = matGroup.addFolder('玻璃质感');
		transparentGroup.open();
		transparentGroup.add(controls, 'transparent').name('打开透明').onChange(function(str) {
			useTransparent = str;
			updateMaterial();

		});
		if(useTransparent){
			material.transparent = true;
			transparentGroup.add(controls, 'opacity', 0, 1, 0.1).name('不透明度').onChange(function(str) {
				material.opacity = str;
				material.needsUpdate = true;
			});
			transparentGroup.add(controls, 'alphaTest', 0, 1, 0.1).name('透明阈值').onChange(function(str) {
				material.alphaTest = str;
				material.needsUpdate = true;
			});
			transparentGroup.add(controls, 'transmission', 0, 1, 0.1).name('玻璃透射度').onChange(function(str) {
				material.transmission = str;
				material.needsUpdate = true;
			});
			transparentGroup.add(controls, 'ior', 1.0, 2.333, 0.1).name('玻璃折射率').onChange(function(str) {
				material.ior = str;
				material.needsUpdate = true;
			});

		}else{
			material.transparent = false;
			material.opacity = 1;
			material.needsUpdate = true;

		}

		var clearcoatGroup = matGroup.addFolder('清漆质感');
		clearcoatGroup.open();
		clearcoatGroup.add(controls, 'clearcoat', 0, 1, 0.1).name('透明涂层').onChange(function(str) {
			material.clearcoat = str;
			material.needsUpdate = true;
		});
		clearcoatGroup.add(controls, 'clearcoatRoughness', 0, 1, 0.1).name('涂层粗糙度').onChange(function(str) {
			material.clearcoatRoughness = str;
			material.needsUpdate = true;
		});
		clearcoatGroup.add(controls, 'clearcoatNormalScale', 0, 1, 0.1).name('涂层凹凸度').onChange(function(val) {
			if (material.clearcoatNormalMap != null) {
				material.clearcoatNormalScale.x = val;
				material.clearcoatNormalScale.y = -val;
				material.needsUpdate = true;
			}
		});
		clearcoatGroup.add(controls, 'reflectivity', 0, 1, 0.1).name('非金属反射率').onChange(function(val) {
			material.reflectivity = val;
			material.needsUpdate = true;
		});

		var subsurfaceGroup = matGroup.addFolder('次表面质感');
		subsurfaceGroup.open();
		subsurfaceGroup.addColor(controls, 'sheen').name('光泽度颜色').onChange(function(str) {
			var r = str.r / 255;
			var g = str.g / 255;
			var b = str.b / 255;
			material.sheen = {
				r,
				g,
				b
			};
			material.needsUpdate = true;
		});

		subsurfaceGroup.add(controls, 'useSkin').name('次表面散射').onChange(function(val) {
			useSkin = val;
			updateMaterial();
		});
		if(useSkin){
			const shader = SubsurfaceScatteringShader;
			SkinUniforms = ThreeModule.UniformsUtils.clone( shader.uniforms );
			SkinUniforms[ 'map' ].value = material.map;

			SkinUniforms[ 'diffuse' ].value = new THREE.Vector3( 1.0, 0.2, 0.2 );
			SkinUniforms[ 'shininess' ].value = 500;

			SkinUniforms[ 'thicknessMap' ].value = material.map;
			SkinUniforms[ 'thicknessColor' ].value = new THREE.Vector3( 0.5, 0.3, 0.0 );
			SkinUniforms[ 'thicknessDistortion' ].value = 0.1;
			SkinUniforms[ 'thicknessAmbient' ].value = 0.4;
			SkinUniforms[ 'thicknessAttenuation' ].value = 0.8;
			SkinUniforms[ 'thicknessPower' ].value = 2.0;
			SkinUniforms[ 'thicknessScale' ].value = 16.0;
			SkinMaterial = new THREE.ShaderMaterial( {
				uniforms: SkinUniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader,
				lights: true
			} );
			SkinMaterial.extensions.derivatives = true;
			if (mesh.material.length != undefined) {
				mesh.material[index] = SkinMaterial;
			} else {
				matIndex = 0;
				mesh.material = SkinMaterial;
			}
			subsurfaceGroup.addColor(controls, 'skinColor').name('皮肤色').onChange(function(str) {
				var r = str.r / 255;
				var g = str.g / 255;
				var b = str.b / 255;
				SkinUniforms[ 'diffuse' ].value = new THREE.Vector3( r, g, b);
				SkinMaterial.needsUpdate = true;
			});
			subsurfaceGroup.addColor(controls, 'bloodColor').name('血液色').onChange(function(str) {
				var r = str.r / 255;
				var g = str.g / 255;
				var b = str.b / 255;
				SkinUniforms[ 'thicknessColor' ].value = new THREE.Vector3( r, g, b);
				SkinMaterial.needsUpdate = true;
			});

			subsurfaceGroup.add(controls, 'shininess', 0, 600, 1).name('光泽度').onChange(function(str) {
				SkinUniforms[ 'shininess' ].value = str;
				SkinMaterial.needsUpdate = true;
			});
			subsurfaceGroup.add(controls, 'thicknessDistortion', 0.01, 1, 0.01).name('厚度变形').onChange(function(str) {
				SkinUniforms[ 'thicknessDistortion' ].value = str;
				SkinMaterial.needsUpdate = true;
			});
			subsurfaceGroup.add(controls, 'thicknessAmbient', 0.01, 5.0, 0.05).name('厚度环境').onChange(function(str) {
				SkinUniforms[ 'thicknessAmbient' ].value = str;
				SkinMaterial.needsUpdate = true;
			});
			subsurfaceGroup.add(controls, 'thicknessAttenuation', 0.01, 5.0, 0.05).name('厚度衰减').onChange(function(str) {
				SkinUniforms[ 'thicknessAttenuation' ].value = str;
				SkinMaterial.needsUpdate = true;
			});
			subsurfaceGroup.add(controls, 'thicknessPower', 0.01, 16.0, 0.1).name('厚度功率').onChange(function(str) {
				SkinUniforms[ 'thicknessPower' ].value = str;
				SkinMaterial.needsUpdate = true;
			});
			subsurfaceGroup.add(controls, 'thicknessScale', 0.01, 16.0, 0.1).name('厚度比例').onChange(function(str) {
				SkinUniforms[ 'thicknessScale' ].value = str;
				SkinMaterial.needsUpdate = true;
			});
			subsurfaceGroup.add(controls, 'useSkinTransparent').name('半透明').onChange(function(str) {
				SkinMaterial.transparent = str;
				SkinUniforms[ 'opacity' ].value= 0.5;
			});

		}
		//useFresnel
		var waterGroup = matGroup.addFolder('镜面质感');
		waterGroup.open();
		waterGroup.add(controls, 'useFresnel').name('菲涅尔反射').onChange(function(val) {
			useFresnel = val;
			updateMaterial();
		});
		if(useFresnel){
			const shader = FresnelShader;
			FresnelUniforms = THREE.UniformsUtils.clone( shader.uniforms );
			FresnelUniforms[ 'mRefractionRatio' ].value = 1.02;
			FresnelUniforms[ 'mFresnelBias' ].value = 0.1;
			FresnelUniforms[ 'mFresnelPower' ].value = 2.0;
			FresnelUniforms[ 'mFresnelScale' ].value = 1.0;
			FresnelUniforms[ "tCube" ].value = envMap;
			FresnelMaterial = new THREE.ShaderMaterial( {
				uniforms: FresnelUniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader
			} );
			if (mesh.material.length != undefined) {
				mesh.material[index] = FresnelMaterial;
			} else {
				matIndex = 0;
				mesh.material = FresnelMaterial;
			}
			waterGroup.add(controls, 'RefractionRatio', 0.0, 3.0, 0.01).name('折射率').onChange(function(str) {
				FresnelUniforms[ 'mRefractionRatio' ].value = str;
				FresnelMaterial.needsUpdate = true;
			});
			waterGroup.add(controls, 'FresnelBias', 0.0, 1.0, 0.1).name('偏离率').onChange(function(str) {
				FresnelUniforms[ 'mFresnelBias' ].value = str;
				FresnelMaterial.needsUpdate = true;
			});
			waterGroup.add(controls, 'FresnelPower', 0.0, 1.0, 0.1).name('反射力').onChange(function(str) {
				FresnelUniforms[ 'mFresnelPower' ].value = str;
				FresnelMaterial.needsUpdate = true;
			});
			waterGroup.add(controls, 'FresnelScale', 0.0, 1.0, 0.1).name('范围值').onChange(function(str) {
				FresnelUniforms[ 'mFresnelScale' ].value = str;
				FresnelMaterial.needsUpdate = true;
			});

		}
		//流动
		var waveGroup = matGroup.addFolder('UV动画');
		waveGroup.close();
		waveGroup.add(controls, 'wave').name('流动动画').onChange(function(str) {
			// 纹理偏移
			if (str) {
				wave_texture = material.map //new THREE.TextureLoader().load(material.map.image.src);
				wave_texture.wrapS = THREE.RepeatWrapping;
				wave_texture.wrapT = THREE.RepeatWrapping;
				material.map = wave_texture;
				is_wave = true;

			} else {
				is_wave = false;
			}
			material.needsUpdate = true;
		})
		waveGroup.add(controls, 'is_wave_x').name('流动方向X轴').onChange(function(str) {
			is_wave_x = str;
		});
		waveGroup.add(controls, 'waveSpeedX', 0.01, 0.1, 0.01).name('流动速度X').onChange(function(str) {
			waveSpeedX = str;
		});
		waveGroup.add(controls, 'is_wave_y').name('流动方向Y轴').onChange(function(str) {
			is_wave_y = str;
		});
		waveGroup.add(controls, 'waveSpeedY', 0.01, 0.1, 0.01).name('流动速度Y').onChange(function(str) {
			waveSpeedY = str;
		});

		var RimGroup = matGroup.addFolder('边缘发光');
		RimGroup.open();
		RimGroup.add(controls, 'useRim').name('半透边缘光').onChange(function(val) {
			useRim = val;
			updateMaterial();
		});
		if(useRim){
			RimMaterial = glassShader();
			RimMaterial.skinning = true;
			if (mesh.material.length != undefined) {
				mesh.material[index] = RimMaterial;
			} else {
				matIndex = 0;
				mesh.material = RimMaterial;
			}
			RimGroup.addColor(controls, 'glowColor').name('发光颜色').onChange(function(str) {
				var r = str.r / 255;
				var g = str.g / 255;
				var b = str.b / 255;
				RimMaterial.uniforms.glowColor.value = {
					r,
					g,
					b
				};
				RimMaterial.needsUpdate = true;
			});
			RimGroup.add(controls, 'coeficient', 0, 20, 0.01).name('边缘度').onChange(function(str) {
				RimMaterial.uniforms.coeficient.value = str;
				RimMaterial.needsUpdate = true;
			});
			RimGroup.add(controls, 'glowPower', 0, 20, 0.01).name('光强度').onChange(function(str) {
				RimMaterial.uniforms.power.value = str;
				RimMaterial.needsUpdate = true;
			});
		}
		RimGroup.add(controls, 'useRimOpaque').name('不透边缘光').onChange(function(val) {
			useRimOpaque = val;
			updateMaterial();
		});
		if(useRimOpaque){
			RimMaterial = RimOpaqueShader();
			//baseTexture
			RimMaterial.uniforms.baseTexture.value = material.map;
			RimMaterial.uniforms.baseTexture.value.wrapS = RimMaterial.uniforms.baseTexture.value.wrapT = THREE.RepeatWrapping;
			console.log(RimMaterial.uniforms.baseTexture.value);
			RimMaterial.skinning = true;
			if (mesh.material.length != undefined) {
				mesh.material[index] = RimMaterial;
			} else {
				matIndex = 0;
				mesh.material = RimMaterial;
			}
			RimGroup.addColor(controls, 'glowColor').name('发光颜色').onChange(function(str) {
				var r = str.r / 255;
				var g = str.g / 255;
				var b = str.b / 255;
				RimMaterial.uniforms.glowColor.value = {
					r,
					g,
					b
				};
				RimMaterial.needsUpdate = true;
			});
			RimGroup.add(controls, 'coeficient', 0, 20, 0.01).name('边缘度').onChange(function(str) {
				RimMaterial.uniforms.coeficient.value = str;
				RimMaterial.needsUpdate = true;
			});
			RimGroup.add(controls, 'glowPower', 0, 20, 0.01).name('光强度').onChange(function(str) {
				RimMaterial.uniforms.power.value = str;
				RimMaterial.needsUpdate = true;
			});
		}

		//end
		var  FileGroup=matGroup.addFolder('材质数据');
		FileGroup.open();
		FileGroup.add(controls, 'cancle').name('重置').onChange(function() {

			material.metalness = 0;
			material.roughness = 1;
			if (material.normalMap != null) {
				material.normalScale.x = 1;
			}
			material.alphaTest = 0;
			material.transparent = false;
			material.envMapIntensity = 1;

			alert("数据已重置！");
			updateMaterial();
		});
		FileGroup.add(controls, 'save').name('保存');

		gui.domElement.style = 'position:absolute;top:0px;left:15px';
		console.log(mesh.material);

	}
	updateMaterial();
}

var content;
var FizzyText = function() {
	this.Save = function() {

		//数据保存类
		Ly_content.Property = Ly_data;
		Ly_content.LightProperty = Ly_LightData;
		//Ly_ParticleData
		Ly_content.ParticleProperty = Ly_ParticleData;

		Ly_content.Distance = xinzangModel.scene.scale.x;
		Ly_content.Rotate = xinzangModel.scene.rotation.y;
		Ly_content.LightIntensity = light1.intensity;
		Ly_content.X = xinzangModel.scene.position.x;
		Ly_content.Y = xinzangModel.scene.position.y;
		Ly_content.Z = xinzangModel.scene.position.z;
		//是否斑化
		Ly_content.DepthTest = isDepthTest;
		var blob = new Blob([JSON.stringify(Ly_content)], {
			type: "text/plain;charset=utf-8"
		});
		//下载json
		saveAs(blob, "properties.json");
	}
	this.isPlay = isPlay;

	this.color1 = "#ffae23";

	this.Read = function() {
		ReadJson();
	}
	this.ReadCandlelight = function() {
		ReadCandlelightJson();
	}
	this.ReadFire = function() {
		ReadFireJson();
	}
	this.ReadExplosion = function() {
		ReadExplosionJson();
	}
	this.ReadSmoke = function() {
		ReadSmokeJson();
	}
	this.ReadWater = function() {
		ReadWaterJson();
	}
	this.ReadThunder = function() {
		ReadThunderJson();
	}
	this.ReadTrail = function() {
		ReadTrailJson();
	}
	this.readEmitterTemplate = readEmitterTemplate;

	//LY_灯光
	this.LightIntensity = light1.intensity;

	this.Next = function() {};
	this.Up = function() {};
	//动画的名称
	this.animateName = "";
	//是否开启骨骼选择
	this.isChangeBone = true;
	//控制物体显示
	this.visible = true;
	//控制物体大小
	//	this.distance = 1;
	this.distance = 1;
	//控制物体旋转
	this.rotationY = 0; //xinzangModel.scene.rotation.y;
	this.X = 0;
	this.Y = 0;
	this.Z = 0;
	this.depthTest = false;

	this.NomalScale = function () {
		xinzangModel.scene.scale.x = xinzangModel.scene.scale.x * 10;
		xinzangModel.scene.scale.y = xinzangModel.scene.scale.y * 10;
		xinzangModel.scene.scale.z = xinzangModel.scene.scale.z * 10;
		tempScale = xinzangModel.scene.scale.x
	};
	this.NegativeScale = function () {
		xinzangModel.scene.scale.x = xinzangModel.scene.scale.x * 0.1;
		xinzangModel.scene.scale.y = xinzangModel.scene.scale.y * 0.1;
		xinzangModel.scene.scale.z = xinzangModel.scene.scale.z * 0.1;
		tempScale = xinzangModel.scene.scale.x
	};
	this.OneNomalScale = function () {
		xinzangModel.scene.scale.x = 1;
		xinzangModel.scene.scale.y = 1;
		xinzangModel.scene.scale.z = 1;
		tempScale = 1
	};
	//灯光亮宇
	this.addLight = function() {};
	this.addEmitter = function() {};
};
var text;
var texture;
//全局操作面板
window.onload = function()
{
	text = new FizzyText();
	var gui1 = new dat.GUI();
	var fileGroup = gui1.addFolder('文件操作');
	fileGroup.close();
	{
			fileGroup.add(text, 'Save').name('保存');
			fileGroup.add(text, 'Read').name('读取');
			//readEmitterTemplate
			fileGroup.add(text, 'ReadCandlelight').name('读取烛光');
			fileGroup.add(text, 'ReadFire').name('读取火焰');
			fileGroup.add(text, 'ReadExplosion').name('读取爆炸');
			fileGroup.add(text, 'ReadSmoke').name('读取烟雾');
			fileGroup.add(text, 'ReadWater').name('读取水流');
			fileGroup.add(text, 'ReadThunder').name('读取雷电');
			fileGroup.add(text, 'ReadTrail').name('读取尾迹');

		}
	//模型操作组
	var operatemodelGroup = gui1.addFolder('模型操作');
	operatemodelGroup.close();
	{
			operatemodelGroup.add(text, 'NomalScale').name('标准大小正');
			operatemodelGroup.add(text, 'OneNomalScale').name('标准大小');
			operatemodelGroup.add(text, 'NegativeScale').name('标准大小负');
			operatemodelGroup.add(text, 'depthTest').name('是否斑化或消失').onChange(function(str) {
				isDepthTest = str;
			});
			//是否打卡骨骼控制器
			operatemodelGroup.add(text, 'isChangeBone').name('打开骨骼辅助').onChange(function(str) {
				if (str) {
					meshHelper = new THREE.SkeletonHelper(xinzangModel.scene);
					scene.add(meshHelper);

				} else {
					meshHelper = new THREE.SkeletonHelper(xinzangModel.scene);
					scene.remove(meshHelper);
				}

			});
			//显示隐藏物体
			operatemodelGroup.add(text, 'visible').name('显示模型').onChange(function(str) {
				pickObj.visible = str;

			});
			operatemodelGroup.add(text, 'Next').name('下一个模型').onChange(function() {
				if (meshList.length > 0) {
					operateModelIndex++;
					if (operateModelIndex < meshList.length) {
						selectedObjectChanged(meshList[operateModelIndex]);
						UseGUI(meshList[operateModelIndex]);
						pickObj = meshList[operateModelIndex];
					} else {
						operateModelIndex--;
						selectedObjectChanged(meshList[operateModelIndex]);
						UseGUI(meshList[operateModelIndex]);
						pickObj = meshList[operateModelIndex];
					}
				}
			});
			operatemodelGroup.add(text, 'Up').name('上一个模型').onChange(function() {
				if (meshList.length > 0) {
					operateModelIndex--;
					if (operateModelIndex >= 0) {
						selectedObjectChanged(meshList[operateModelIndex]);
						UseGUI(meshList[operateModelIndex]);
						pickObj = meshList[operateModelIndex];
					} else {
						operateModelIndex++;
						selectedObjectChanged(meshList[operateModelIndex]);
						UseGUI(meshList[operateModelIndex]);
						pickObj = meshList[operateModelIndex];
					}

				}
			});
			var SingleMatGroup = operatemodelGroup.addFolder('多维自材质');
			SingleMatGroup.open();
			SingleMatGroup.add(text, 'Next').name('下一个材质').onChange(function() {
				if (pickObj == null) {
					return;
				}
				if (matIndex < pickObj.material.length - 1) {
					matIndex++;
					UseGUI(pickObj, matIndex);

				}

			});
			SingleMatGroup.add(text, 'Up').name('上一个材质').onChange(function() {
				if (pickObj == null) {
					return;
				}
				if (matIndex > 0) {
					matIndex--;
					UseGUI(pickObj, matIndex);

					console.log(pickObj.material[matIndex]);
				}

			});

		}
	//场景操作组
	var matGroup = gui1.addFolder('场景操作');
	matGroup.close();
	{

		var cameraGroup = matGroup.addFolder('相机类');
		cameraGroup.open(); {
			cameraGroup.add(text, 'distance', 0, 10, 0.1).name('模型大小').onChange(function(str) {
				xinzangModel.scene.scale.x = tempScale * str;
				xinzangModel.scene.scale.y = tempScale * str;
				xinzangModel.scene.scale.z = tempScale * str;
			});
			cameraGroup.add(text, 'rotationY', 0, 6.5, 0.05).name('Y轴旋转').onChange(function(str) {
				xinzangModel.scene.rotation.y = str;
			});
			var positionGroup = cameraGroup.addFolder('位置调整'); {
				positionGroup.open();
				positionGroup.add(text, 'X', -20, 20, 0.1).name('X轴').onChange(function(str) {
					//xinzangModel.scene.scale.x = str
					xinzangModel.scene.position.x = str;
				});
				positionGroup.add(text, 'Y', -20, 20, 0.1).name('Y轴').onChange(function(str) {
					//xinzangModel.scene.scale.x = str
					xinzangModel.scene.position.y = str;
				});
				positionGroup.add(text, 'Z', -20, 20, 0.1).name('Z轴').onChange(function(str) {
					//xinzangModel.scene.scale.x = str
					xinzangModel.scene.position.z = str;
				});
			}
		}
		//动画类
		//切换动画
		var AnimationGroup = matGroup.addFolder('动画类操作'); {
			AnimationGroup.open();
			AnimationGroup.add(text, 'animateName');
			AnimationGroup.add(text, 'isPlay').name('播放动画').onChange(function(str) {
				isPlay = str;
			});

			AnimationGroup.add(text, 'Next').name('下一段动画').onChange(function() {
				if (AnimationIndex < AnimtionsList.length - 1) {
					AnimationIndex += 1;
				}
				console.log(AnimtionsList);
				if (AnimtionsList[AnimationIndex] != null) {
					IdleManager.stop();
					IdleManager = mixer.clipAction(AnimtionsList[AnimationIndex]);
					IdleManager.play();
				}
			});
			AnimationGroup.add(text, 'Up').name('上一段动画').onChange(function() {
				if (AnimationIndex > 0) {
					AnimationIndex -= 1;
				}
				if (AnimtionsList[AnimationIndex] != null) {
					IdleManager.stop();
					IdleManager = mixer.clipAction(AnimtionsList[AnimationIndex]);

					IdleManager.play();
				}
			});
		}


		//LY_灯光强度调整
		matGroup.add(text, 'LightIntensity', 0, 10).name('灯光强度').onChange(function(str1) {
			light1.intensity = str1;

		});
		//灯光亮宇
		var lightGroup = matGroup.addFolder('灯光类操作'); {
			lightGroup.open();

			lightGroup.add(text, 'addLight').name('添加灯光').onChange(function() {
				var s = new THREE.SpotLight(0xffffff, 2);
				s.position.set(0, 2, 0);

				lightlist.push(s);
				scene.add(s);
				s.name = lightlist.length.toString();

				if (lightIndex == -1) {
					lightIndex = 0;

				}
				LightControl();
			});
			lightGroup.add(text, 'Next').name('下一个灯光').onChange(function() {
					if (lightIndex < lightlist.length - 1) {
						lightIndex++;
					}
					LightControl();

			});
			lightGroup.add(text, 'Up').name('上一个灯光').onChange(function() {
					if (lightIndex > 0) {
						lightIndex--;
					}
					LightControl();

			});
		}

	}
	//粒子系统
	var emitterGroup = gui1.addFolder('粒子系统'); {
			emitterGroup.close();

			emitterGroup.add(text, 'addEmitter').name('添加粒子').onChange(function() {
				var emitter = new Proton.Emitter();
				emitter.rate = new Proton.Rate(CONFIG.EmissionRate.numPan, CONFIG.EmissionRate.timePan);
				emitter.addInitialize(new Proton.Mass(CONFIG.mass));
				emitter.addInitialize(new Proton.Body(CONFIG.Body));
				emitter.addInitialize(new Proton.V(CONFIG.velocity.radiusPan, CONFIG.velocity.dir, CONFIG.velocity.tha));
				emitter.addInitialize(new Proton.Life(CONFIG.startLife));
				//Shape
				ShapeZone = new Proton.PointZone(CONFIG.Shape.PointZone.LocalX,
					CONFIG.Shape.PointZone.LocalY,CONFIG.Shape.PointZone.LocalZ);
				emitter.addInitialize(new Proton.Position(ShapeZone));
				/*Behaiviors*/
				emitter.addBehaviour(new Proton.Alpha(CONFIG.alpha.alphaFrom, CONFIG.alpha.alphaTo));
				emitter.addBehaviour(new Proton.Scale(CONFIG.size.sizeFrom,CONFIG.size.sizeTo));
				emitter.addBehaviour(new Proton.G(CONFIG.gravity));

				emitter.addBehaviour(new Proton.Rotate(CONFIG.rotate.rotateFrom, CONFIG.rotate.rotateTo));
				if (CONFIG.Looping)
				{
					emitter.emit();
				}else {
					emitter.emit('once');
				}
				textureRotate = true;
				proton.addEmitter(emitter);
				emitterlist.push(emitter);
				if (emitterIndex == -1) {
					emitterIndex = 0;
				}else {
					if (emitterIndex < emitterlist.length - 1) {
						emitterIndex++;
					}
				}
				emitterlist[emitterIndex].name = emitterIndex.toString();
				EmitterControl();
			});
			emitterGroup.add(text, 'Next').name('下一个粒子').onChange(function() {

					if (emitterIndex < emitterlist.length - 1) {
						emitterIndex++;
					}
					EmitterControl();
					console.log("下一个粒子 emitter.name  "+ emitterlist[emitterIndex].name);

			});
			emitterGroup.add(text, 'Up').name('上一个粒子').onChange(function() {
					if (emitterIndex < 0)
						return;

					if (emitterIndex > 0) {
						emitterIndex--;
					}
					EmitterControl();
					console.log("上一个粒子 emitter.name  "+ emitterlist[emitterIndex].name);

			});

		}
}
function createSprite() {
	var map = new THREE.TextureLoader().load("img/dot.png");
	var material = new THREE.SpriteMaterial({
		map: map,
		color: 0xFFFFFF,
		blending: THREE.AdditiveBlending,
		needsUpdate : true,
		rotation : 0,
		fog: true
	});
	return new THREE.Sprite(material);
}
function ReadParticleProperty(_jsondata) {
	var emitter = new Proton.Emitter();
	emitter.rate = new Proton.Rate(_jsondata.numPan, _jsondata.timePan);
	emitter.addInitialize(new Proton.Mass(_jsondata.mass));

	var newBody = CONFIG.Body;
	newBody.material.map.image.src = _jsondata.bodyTextureSrc;
	emitter.addInitialize(new Proton.Body(newBody));

	if(_jsondata.isTexAnimator == true){
		CONFIG.isTexAnimator = _jsondata.isTexAnimator;
		texAnimatorObj = new TextureAnimator( newBody.material.map, _jsondata.texHoriz, _jsondata.texvert, _jsondata.texTotal, _jsondata.texDuration );
		CONFIG.TexAnimator.texHoriz = _jsondata.texHoriz;
		CONFIG.TexAnimator.texvert = _jsondata.texvert;
		CONFIG.TexAnimator.texTotal = _jsondata.texTotal;
		CONFIG.TexAnimator.texDuration = _jsondata.texDuration;

	}
	else {
		texAnimatorObj = null;
		CONFIG.isTexAnimator = _jsondata.isTexAnimator;
	}
	emitter.addInitialize(new Proton.V(_jsondata.radiusPan, new Proton.Vector3D(_jsondata.dirX, _jsondata.dirY,  _jsondata.dirZ), _jsondata.tha));
	emitter.addInitialize(new Proton.Life(_jsondata.startLife));
	console.log(_jsondata.ZoneType);
	if (_jsondata.ZoneType == 1) {
		console.log(" _jsondata PointZone");
		ShapeZone = new Proton.PointZone(_jsondata.LocalX, _jsondata.LocalY,_jsondata.LocalZ);
		emitter.addInitialize(new Proton.Position(ShapeZone));
		ZoneType = _jsondata.ZoneType;
		CONFIG.Shape.PointZone.LocalX =_jsondata.LocalX;
		CONFIG.Shape.PointZone.LocalY =_jsondata.LocalY;
		CONFIG.Shape.PointZone.LocalZ =_jsondata.LocalZ;

	}
	else if (_jsondata.ZoneType == 2) {
		console.log(" _jsondata BoxZone");
		ShapeZone = new Proton.BoxZone(_jsondata.BoxZoneX, _jsondata.BoxZoneY,_jsondata.BoxZoneZ,
			_jsondata.BoxZoneWidth,_jsondata.BoxZoneHeight,_jsondata.BoxZoneDepth);
		emitter.addInitialize(new Proton.Position(ShapeZone));
		ZoneType = _jsondata.ZoneType;
		CONFIG.Shape.BoxZone.BoxZoneX = _jsondata.BoxZoneX;
		CONFIG.Shape.BoxZone.BoxZoneY = _jsondata.BoxZoneY;
		CONFIG.Shape.BoxZone.BoxZoneZ = _jsondata.BoxZoneZ;
		CONFIG.Shape.BoxZone.BoxZoneWidth = _jsondata.BoxZoneWidth;
		CONFIG.Shape.BoxZone.BoxZoneHeight = _jsondata.BoxZoneHeight;
		CONFIG.Shape.BoxZone.BoxZoneDepth = _jsondata.BoxZoneDepth;

	}else if (_jsondata.ZoneType == 3) {
		console.log(" _jsondata SphereZone");
		ShapeZone = new Proton.SphereZone(_jsondata.SphereZoneX, _jsondata.SphereZoneY,_jsondata.SphereZoneZ, _jsondata.SphereZoneRadius);
		emitter.addInitialize(new Proton.Position(ShapeZone));
		ZoneType = _jsondata.ZoneType;
		CONFIG.Shape.SphereZone.SphereZoneX = _jsondata.SphereZoneX;
		CONFIG.Shape.SphereZone.SphereZoneY = _jsondata.SphereZoneY;
		CONFIG.Shape.SphereZone.SphereZoneZ = _jsondata.SphereZoneZ;
		CONFIG.Shape.SphereZone.SphereZoneRadius = _jsondata.SphereZoneRadius;
	}
	else if (_jsondata.ZoneType == 4) {
		console.log(" _jsondata MeshZone");
		ZoneType = _jsondata.ZoneType;

		var objectLoader = new THREE.ObjectLoader();
		objectLoader.load(_jsondata.meshSrc, function(obj) {
			mesh = obj;
			ShapeZone = new Proton.MeshZone(mesh, _jsondata.meshScale);
			emitterlist[emitterIndex].addInitialize(new Proton.Position(ShapeZone));
		});

	}
	emitter.addBehaviour(new Proton.Alpha(_jsondata.alphaFrom, _jsondata.alphaTo));
	emitter.addBehaviour(new Proton.Scale(_jsondata.sizeFrom,_jsondata.sizeTo));
	if(_jsondata.PhysicsOpen == true) {
		emitter.addBehaviour(new Proton.G(_jsondata.gravity));
		CONFIG.PhysicsOpen = _jsondata.PhysicsOpen;
	}else{
		emitter.addBehaviour(new Proton.G(CONFIG.gravity));
	}
	emitter.addBehaviour(new Proton.Rotate(CONFIG.rotate.rotateFrom, CONFIG.rotate.rotateTo));
	if(_jsondata.colorChange == true){
		CONFIG.colorChange = _jsondata.colorChange;
		emitter.addBehaviour(new Proton.Color(_jsondata.colorFrom, _jsondata.colorTo));
		CONFIG.color.colorFrom = _jsondata.colorFrom;
		CONFIG.color.colorTo = _jsondata.colorTo;
	}else{
		CONFIG.colorChange = _jsondata.colorChange;
	}
	emitter.p.x = _jsondata.WorldX;
	emitter.p.y = _jsondata.WorldY;
	emitter.p.z = _jsondata.WorldZ;
	//emitter.name = _jsondata.EmitterName;
	if(_jsondata.Looping == true){
		emitter.emit();
		CONFIG.Looping = _jsondata.Looping;
	}else {
		emitter.emit('once');
		CONFIG.Looping = _jsondata.Looping;
	}
	if(_jsondata.textureRotate){
		textureRotate = _jsondata.textureRotate;
	}
	proton.addEmitter(emitter);
	emitterlist.push(emitter);
	//console.log(emitterlist[0]);
	if (emitterIndex == -1) {
		emitterIndex = 0;
	}else {
		if (emitterIndex < emitterlist.length - 1) {
			emitterIndex++;
		}
	}
	emitterlist[emitterIndex].name = _jsondata.EmitterName;
	EmitterControl();

}
function EmitterControl() {
	if (emittergui != null) {
		emittergui.destroy();
	}
	emittergui = new dat.GUI();

	var controls = new function() {
		this.EmitterName = emitterlist[emitterIndex].name;
		this.Looping = CONFIG.Looping;
		this.ZoneType = ZoneType;

		this.LocalX = CONFIG.Shape.PointZone.LocalX;
		this.LocalY = CONFIG.Shape.PointZone.LocalY;
		this.LocalZ = CONFIG.Shape.PointZone.LocalZ;

		this.WorldX = emitterlist[emitterIndex].p.x;
		this.WorldY = emitterlist[emitterIndex].p.y;
		this.WorldZ = emitterlist[emitterIndex].p.z;

		this.BoxZoneX = CONFIG.Shape.BoxZone.BoxZoneX;
		this.BoxZoneY = CONFIG.Shape.BoxZone.BoxZoneY;
		this.BoxZoneZ = CONFIG.Shape.BoxZone.BoxZoneZ;
		this.BoxZoneWidth = CONFIG.Shape.BoxZone.BoxZoneWidth;
		this.BoxZoneHeight = CONFIG.Shape.BoxZone.BoxZoneHeight;
		this.BoxZoneDepth = CONFIG.Shape.BoxZone.BoxZoneDepth;

		this.SphereZoneX = CONFIG.Shape.SphereZone.SphereZoneX;
		this.SphereZoneY = CONFIG.Shape.SphereZone.SphereZoneY;
		this.SphereZoneZ = CONFIG.Shape.SphereZone.SphereZoneZ;
		this.SphereZoneRadius = CONFIG.Shape.SphereZone.SphereZoneRadius;

		this.meshSrc = meshSrc;
		this.meshScale = meshScale;
		this.loadMesh = function() {};

		this.numPan = emitterlist[emitterIndex].rate.numPan.a;
		this.timePan = emitterlist[emitterIndex].rate.timePan.a;

		this.PhysicsOpen = CONFIG.PhysicsOpen;
		this.mass =  emitterlist[emitterIndex].initializes[0].massPan.a;
		this.gravity = emitterlist[emitterIndex].behaviours[2].force.y/100 *-1;

		this.isTexAnimator = CONFIG.isTexAnimator;
		var tempArray = emitterlist[emitterIndex].initializes[1].body._arr[0].material.map.image.src.split('/');
		this.bodyTexture = tempArray[tempArray.length - 1];
		this.loadTexture = function() {};

		this.texHoriz = CONFIG.TexAnimator.texHoriz;
		this.texvert = CONFIG.TexAnimator.texvert;
		this.texTotal = CONFIG.TexAnimator.texTotal;
		this.texDuration = CONFIG.TexAnimator.texDuration;

		this.startLife = emitterlist[emitterIndex].initializes[3].lifePan.a;
		//Velocity
		this.radiusPan = emitterlist[emitterIndex].initializes[2].radiusPan.a,
		this.dirX = emitterlist[emitterIndex].initializes[2].dir.x,
		this.dirY = emitterlist[emitterIndex].initializes[2].dir.y,
		this.dirZ = emitterlist[emitterIndex].initializes[2].dir.z,
		this.tha = emitterlist[emitterIndex].initializes[2].tha/(Proton.PI / 180),

		//alpha
		this.alphaFrom = emitterlist[emitterIndex].behaviours[0].a.a;
		this.alphaTo = emitterlist[emitterIndex].behaviours[0].b.a;

		//size
		this.sizeFrom  = emitterlist[emitterIndex].behaviours[1].a.a;
		this.sizeTo  = emitterlist[emitterIndex].behaviours[1].b.a;

		//this.rotateFrom  = emitterlist[emitterIndex].behaviours[3].a;
		//this.rotateTo  = emitterlist[emitterIndex].behaviours[3].b;
		this.textureRotate = textureRotate;

		this.colorChange = CONFIG.colorChange;
		this.colorFrom = CONFIG.color.colorFrom;
		this.colorTo = CONFIG.color.colorTo;

		this.remove = function() {};
		this.save = function() {
			var eee = {
				EmitterName: emitterlist[emitterIndex].name,
				Looping :  CONFIG.Looping,
				ZoneType : ZoneType,

				LocalX : CONFIG.Shape.PointZone.LocalX,
				LocalY : CONFIG.Shape.PointZone.LocalY,
				LocalZ : CONFIG.Shape.PointZone.LocalZ,

				WorldX : emitterlist[emitterIndex].p.x,
				WorldY : emitterlist[emitterIndex].p.y,
				WorldZ : emitterlist[emitterIndex].p.z,

				BoxZoneX : CONFIG.Shape.BoxZone.BoxZoneX,
				BoxZoneY : CONFIG.Shape.BoxZone.BoxZoneY,
				BoxZoneZ : CONFIG.Shape.BoxZone.BoxZoneZ,
				BoxZoneWidth : CONFIG.Shape.BoxZone.BoxZoneWidth,
				BoxZoneHeight : CONFIG.Shape.BoxZone.BoxZoneHeight,
				BoxZoneDepth : CONFIG.Shape.BoxZone.BoxZoneDepth,

				SphereZoneX : CONFIG.Shape.SphereZone.SphereZoneX,
				SphereZoneY : CONFIG.Shape.SphereZone.SphereZoneY,
				SphereZoneZ : CONFIG.Shape.SphereZone.SphereZoneZ,
				SphereZoneRadius : CONFIG.Shape.SphereZone.SphereZoneRadius,

				meshSrc : meshSrc,
				meshScale : meshScale,

				numPan : emitterlist[emitterIndex].rate.numPan.a,
				timePan : emitterlist[emitterIndex].rate.timePan.a,

				PhysicsOpen : CONFIG.PhysicsOpen,
				mass :  emitterlist[emitterIndex].initializes[0].massPan.a,
				gravity : emitterlist[emitterIndex].behaviours[2].force.y/100 *-1,

				isTexAnimator :  CONFIG.isTexAnimator,
				bodyTextureSrc :  emitterlist[emitterIndex].initializes[1].body._arr[0].material.map.image.src,
				textureRotate : textureRotate,

				texHoriz : CONFIG.TexAnimator.texHoriz,
				texvert : CONFIG.TexAnimator.texvert,
				texTotal : CONFIG.TexAnimator.texTotal,
				texDuration : CONFIG.TexAnimator.texDuration,

				startLife : emitterlist[emitterIndex].initializes[3].lifePan.a,
				//Velocity
				radiusPan : emitterlist[emitterIndex].initializes[2].radiusPan.a,
				dirX : emitterlist[emitterIndex].initializes[2].dir.x,
				dirY : emitterlist[emitterIndex].initializes[2].dir.y,
				dirZ : emitterlist[emitterIndex].initializes[2].dir.z,
				tha : emitterlist[emitterIndex].initializes[2].tha/(Proton.PI / 180),

				//alpha
				alphaFrom : emitterlist[emitterIndex].behaviours[0].a.a,
				alphaTo : emitterlist[emitterIndex].behaviours[0].b.a,

				//size
				sizeFrom  : emitterlist[emitterIndex].behaviours[1].a.a,
				sizeTo  : emitterlist[emitterIndex].behaviours[1].b.a,

				colorChange : CONFIG.colorChange,
				colorFrom : CONFIG.color.colorFrom,
				colorTo : CONFIG.color.colorTo,

			}
			Ly_ParticleData.push(eee);
			alert("粒子数据已保存！");
		};
	}
	console.log(emitterlist[emitterIndex]);

	var emitterTempGroup = emittergui.addFolder('粒子调节');
	emitterTempGroup.open();
	emitterTempGroup.add(controls, 'EmitterName').name('粒子名称').onChange(function(str) {
		emitterlist[emitterIndex].name = str;
	});


	emitterTempGroup.add(controls, 'Looping').name('是否循环').onChange(function(str) {
		if(str == true){
			CONFIG.Looping = true;
			emitterlist[emitterIndex].emit();
		}
		else {
			CONFIG.Looping = false;
			emitterlist[emitterIndex].emit('once');
		}
	});
	var worldSpace = emitterTempGroup.addFolder('世界坐标调整');
	worldSpace.add(controls, 'WorldX', -10, 10, 0.1).name('World坐标X').onChange(function(str) {
		emitterlist[emitterIndex].p.x = str;
	});
	worldSpace.add(controls, 'WorldY', -10, 10, 0.1).name('World坐标Y').onChange(function(str) {
		emitterlist[emitterIndex].p.y = str;
	});
	worldSpace.add(controls, 'WorldZ', -10, 10, 0.1).name('World坐标Z').onChange(function(str) {
		emitterlist[emitterIndex].p.z = str;
	});

	emitterTempGroup.add(controls, 'ZoneType', {PointZone: 1, BoxZone: 2, SphereZone: 3,MeshZone : 4}).name('形状区域').onChange(function(str) {
		ZoneType = str;
		if (ZoneType == 1) {

			emitterlist[emitterIndex].removeInitialize(emitterlist[emitterIndex].initializes[4]);
			console.log("PointZone "+str);
			ShapeZone = new Proton.PointZone(CONFIG.Shape.PointZone.LocalX,
				CONFIG.Shape.PointZone.LocalY,CONFIG.Shape.PointZone.LocalZ);
			emitterlist[emitterIndex].addInitialize(new Proton.Position(ShapeZone));
		}
		else if (ZoneType == 2) {

			emitterlist[emitterIndex].removeInitialize(emitterlist[emitterIndex].initializes[4]);
			console.log("BoxZone "+str);
			ShapeZone = new Proton.BoxZone(CONFIG.Shape.BoxZone.BoxZoneX, CONFIG.Shape.BoxZone.BoxZoneY,CONFIG.Shape.BoxZone.BoxZoneZ,
				CONFIG.Shape.BoxZone.BoxZoneWidth,CONFIG.Shape.BoxZone.BoxZoneHeight,CONFIG.Shape.BoxZone.BoxZoneDepth);
			emitterlist[emitterIndex].addInitialize(new Proton.Position(ShapeZone));
			//Proton.Debug.drawZone(proton, scene, ShapeZone);
		}
		else if (ZoneType == 3) {

			emitterlist[emitterIndex].removeInitialize(emitterlist[emitterIndex].initializes[4]);
			console.log("SphereZone "+str);
			ShapeZone = new Proton.SphereZone(CONFIG.Shape.SphereZone.SphereZoneX, CONFIG.Shape.SphereZone.SphereZoneY,CONFIG.Shape.SphereZone.SphereZoneZ,
				CONFIG.Shape.SphereZone.SphereZoneRadius);
			emitterlist[emitterIndex].addInitialize(new Proton.Position(ShapeZone));
		}
		else if (ZoneType == 4) {
			emitterlist[emitterIndex].removeInitialize(emitterlist[emitterIndex].initializes[4]);
			console.log("MeshZone "+str);
			console.log("meshSrc "+meshSrc);
			var objectLoader = new THREE.ObjectLoader();
			objectLoader.load(meshSrc, function(obj) {
				mesh = obj;
				ShapeZone = new Proton.MeshZone(mesh, meshScale);
				emitterlist[emitterIndex].addInitialize(new Proton.Position(ShapeZone));
			});

		}
		EmitterControl();
	});
	var SimulationSpace = emitterTempGroup.addFolder('区域坐标调整');
	if (ZoneType == 1){
		//Local坐标
		SimulationSpace.add(controls, 'LocalX', -10, 10, 0.1).name('坐标X').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].x = str;
			CONFIG.Shape.PointZone.LocalX = str;
		});
		SimulationSpace.add(controls, 'LocalY', -10, 10, 0.1).name('坐标Y').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].y = str;
			CONFIG.Shape.PointZone.LocalY = str;
		});
		SimulationSpace.add(controls, 'LocalZ', -10, 10, 0.1).name('坐标Z').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].z = str;
			CONFIG.Shape.PointZone.LocalZ = str;
		});
	}
	else if (ZoneType == 2) {
		//Local坐标
		SimulationSpace.add(controls, 'BoxZoneX', -10, 10, 0.1).name('坐标X').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].x = str;
			CONFIG.Shape.BoxZone.BoxZoneX = str;

		});
		SimulationSpace.add(controls, 'BoxZoneY', -10, 10, 0.1).name('坐标Y').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].y = str;
			CONFIG.Shape.BoxZone.BoxZoneY = str;

		});
		SimulationSpace.add(controls, 'BoxZoneZ', -10, 10, 0.1).name('坐标Z').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].z = str;
			CONFIG.Shape.BoxZone.BoxZoneZ = str;

		});
		SimulationSpace.add(controls, 'BoxZoneWidth', 0, 10, 0.1).name('长').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].width = str;
			CONFIG.Shape.BoxZone.BoxZoneWidth = str;


		});
		SimulationSpace.add(controls, 'BoxZoneHeight', 0, 10, 0.1).name('高').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].height = str;
			CONFIG.Shape.BoxZone.BoxZoneHeight = str;

		});
		SimulationSpace.add(controls, 'BoxZoneDepth', 0, 10, 0.1).name('宽').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].depth = str;
			CONFIG.Shape.BoxZone.BoxZoneDepth = str;

		});

	}
	else if (ZoneType == 3) {
		//Local坐标
		SimulationSpace.add(controls, 'SphereZoneX', -10, 10, 0.1).name('坐标X').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].x = str;
			CONFIG.Shape.SphereZone.SphereZoneX = str;


		});
		SimulationSpace.add(controls, 'SphereZoneY', -10, 10, 0.1).name('坐标Y').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].y = str;
			CONFIG.Shape.SphereZone.SphereZoneY = str;

		});
		SimulationSpace.add(controls, 'SphereZoneZ', -10, 10, 0.1).name('坐标Z').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].z = str;
			CONFIG.Shape.SphereZone.SphereZoneZ = str;

		});
		SimulationSpace.add(controls, 'SphereZoneRadius', 0, 10, 0.1).name('半径').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].radius = str;
			CONFIG.Shape.SphereZone.SphereZoneRadius = str;

		});
	}
	else if (ZoneType == 4) {
		SimulationSpace.add(controls, 'meshSrc', ).name('网格路径').onChange(function(str) {
			meshSrc = str;
			console.log("meshSrc "+meshSrc);
		});
		SimulationSpace.add(controls, 'meshScale', ).name('网格大小').onChange(function(str) {
			emitterlist[emitterIndex].initializes[4].zones[0].scale = str;
		});
		SimulationSpace.add(controls, 'loadMesh').name('加载网格').onChange(function(str) {
			var objectLoader = new THREE.ObjectLoader();
			objectLoader.load(meshSrc, function(obj) {
				mesh = obj;
				emitterlist[emitterIndex].removeInitialize(emitterlist[emitterIndex].initializes[4]);
				ShapeZone = new Proton.MeshZone(mesh, meshScale);
				emitterlist[emitterIndex].addInitialize(new Proton.Position(ShapeZone));
			});
		});

	}
	var SpwnGroup = emitterTempGroup.addFolder('发射速率');
	SpwnGroup.open();
	SpwnGroup.add(controls, 'numPan', 0, 200, 1).name('发射数量').onChange(function(str) {
		emitterlist[emitterIndex].rate.numPan.a = str;
		emitterlist[emitterIndex].rate.numPan.b = str;

	});
	SpwnGroup.add(controls, 'timePan', 0, 10, 0.01).name('发射间隔').onChange(function(str) {
		emitterlist[emitterIndex].rate.timePan.a = str;
		emitterlist[emitterIndex].rate.timePan.b = str;

	});

	var InitializeGroup = emitterTempGroup.addFolder('粒子初始化');
	InitializeGroup.open();
	InitializeGroup.add(controls, 'PhysicsOpen').name('物理设置').onChange(function(str) {
		if(str == true){
			CONFIG.PhysicsOpen = true;
		}
		else {
			CONFIG.PhysicsOpen = false;
		}
		EmitterControl();
	});
	if(CONFIG.PhysicsOpen){
		InitializeGroup.add(controls, 'mass', 0, 20, 1).name('粒子质量').onChange(function(str) {
			emitterlist[emitterIndex].initializes[0].massPan.a = str;
		});
		InitializeGroup.add(controls, 'gravity', 0, 10, 1).name('物理重力').onChange(function(str) {
			emitterlist[emitterIndex].behaviours[2].force.y = str*-100;
		});
	}

	InitializeGroup.add(controls, 'bodyTexture').name('贴图路径').onChange(function(str) {
		if (str != null) {
			var temp = emitterlist[emitterIndex].initializes[1].body._arr[0].material.map.image.src;
			bodyTextureSrc= temp.substring(0, temp.lastIndexOf('/'))+ '/'+str;
		}

	});
	InitializeGroup.add(controls, 'loadTexture').name('加载贴图').onChange(function(str) {
		emitterlist[emitterIndex].initializes[1].body._arr[0].material.map.image.src = bodyTextureSrc;
		console.log("emitterIndex "+emitterIndex+" bodyTextureSrc " + bodyTextureSrc);
		//var tempArray = emitterlist[emitterIndex].initializes[1].body._arr[0].material.map.image.src.split('.');
		//if(tempArray[tempArray.length - 1] == "png"){
			//emitterlist[emitterIndex].initializes[1].body._arr[0].material.map.image.src = bodyTextureSrc;
			//console.log("emitterIndex "+emitterIndex+" bodyTextureSrc " + bodyTextureSrc);
			//emitterlist[emitterIndex].update();
		//}
		//else if(tempArray[tempArray.length - 1] == "tga"){
			//var loader = new THREE.TGALoader();
			//var explosionTexture = loader.load("textures/Explosion_002.tga");
			//emitterlist[emitterIndex].initializes[1].body._arr[0].material.map= explosionTexture;
			//emitterlist[emitterIndex].update();
		//}

	});
	InitializeGroup.add(controls, 'isTexAnimator').name('贴图序列帧动画').onChange(function(str) {
		if(str == true){
			CONFIG.isTexAnimator = true;
			texAnimatorObj = new TextureAnimator( emitterlist[emitterIndex].initializes[1].body._arr[0].material.map, CONFIG.TexAnimator.texHoriz,
				CONFIG.TexAnimator.texvert, CONFIG.TexAnimator.texTotal, CONFIG.TexAnimator.texDuration );
		}
		else {
			CONFIG.isTexAnimator = false;
			texAnimatorObj = null;
		}
		EmitterControl();
	});
	if(CONFIG.isTexAnimator){
		InitializeGroup.add(controls, 'texHoriz', 1, 15, 1).name('序列横列').onChange(function(str) {
			CONFIG.TexAnimator.texHoriz = str;
			console.log(CONFIG.TexAnimator.texHoriz);
		});
		InitializeGroup.add(controls, 'texvert', 1, 15, 1).name('序列竖列').onChange(function(str) {
			CONFIG.TexAnimator.texvert = str;
		});
		InitializeGroup.add(controls, 'texTotal', 1, 225, 1).name('序列总数').onChange(function(str) {
			CONFIG.TexAnimator.texTotal = str;
		});
		InitializeGroup.add(controls, 'texDuration', 1, 225, 0.1).name('动画时长').onChange(function(str) {
			CONFIG.TexAnimator.texDuration = str;
		});
	}
	InitializeGroup.add(controls, 'startLife', 0, 10, 0.1).name('粒子生命周期').onChange(function(str) {
		emitterlist[emitterIndex].initializes[3].lifePan.a = str;
	});
	var VelocityGroup = InitializeGroup.addFolder('粒子加速度');
	VelocityGroup.add(controls, 'radiusPan', 0, 50, 0.1).name('径向加速度').onChange(function(str) {
		emitterlist[emitterIndex].initializes[2].radiusPan.a = str;
	});
	VelocityGroup.add(controls, 'dirX', -10, 10, 0.1).name('发射方向 X').onChange(function(str) {
		emitterlist[emitterIndex].initializes[2].dir.x = str;
	});
	VelocityGroup.add(controls, 'dirY', -10, 10, 0.1).name('发射方向 Y').onChange(function(str) {
		emitterlist[emitterIndex].initializes[2].dir.y = str;
	});
	VelocityGroup.add(controls, 'dirZ', -10, 10, 0.1).name('发射方向 Z').onChange(function(str) {
		emitterlist[emitterIndex].initializes[2].dir.z = str;
	});
	VelocityGroup.add(controls, 'tha', 0, 180, 0.1).name('发射角度').onChange(function(str) {
		emitterlist[emitterIndex].initializes[2].tha = str * (Proton.PI / 180);
	});

	var BehaiviorsGroup = emitterTempGroup.addFolder('粒子脚本行为');
	BehaiviorsGroup.open();
	var alphaGroup =  BehaiviorsGroup.addFolder('粒子透明');
	alphaGroup.add(controls, 'alphaFrom', 0, 1, 0.1).name('初始透明').onChange(function(str) {
		emitterlist[emitterIndex].behaviours[0].a.a = str;
		emitterlist[emitterIndex].behaviours[0].a.b = str;
	});
	alphaGroup.add(controls, 'alphaTo', 0, 1, 0.1).name('结束透明').onChange(function(str) {
		emitterlist[emitterIndex].behaviours[0].b.a = str;
		emitterlist[emitterIndex].behaviours[0].b.b = str;
	});

	var sizeGroup =  BehaiviorsGroup.addFolder('粒子大小');
	sizeGroup.add(controls, 'sizeFrom', 0, 1, 0.01).name('初始值').onChange(function(str) {
		emitterlist[emitterIndex].behaviours[1].a.a = str;
		emitterlist[emitterIndex].behaviours[1].a.b = str;

	});
	sizeGroup.add(controls, 'sizeTo', 0, 1, 0.01).name('结束值').onChange(function(str) {
		emitterlist[emitterIndex].behaviours[1].b.a = str;
		emitterlist[emitterIndex].behaviours[1].b.b = str;

	});
	//var rotateGroup =  BehaiviorsGroup.addFolder('粒子旋转');
	/*
	rotateGroup.add(controls, 'rotateFrom', -90, 90, 1).name('初始值').onChange(function(str) {
		emitterlist[emitterIndex].behaviours[3].a = str;
		CONFIG.rotate.rotateFrom =str;

	});
	rotateGroup.add(controls, 'rotateTo', -90, 90, 1).name('结束值').onChange(function(str) {
		emitterlist[emitterIndex].behaviours[3].b = str;
		CONFIG.rotate.rotateTo =str;

	});
	*/
	//textureRotate
	BehaiviorsGroup.add(controls, 'textureRotate').name('是否随机旋转').onChange(function(str) {
		textureRotate = str;
		console.log("textureRotate "+str);
	});


	BehaiviorsGroup.add(controls, 'colorChange').name('改变粒子颜色').onChange(function(str) {
		if(str == true){
			CONFIG.colorChange = true;
			emitterlist[emitterIndex].addBehaviour(new Proton.Color(CONFIG.color.colorFrom, CONFIG.color.colorTo));
		}
		else {
			CONFIG.colorChange = false;
			emitterlist[emitterIndex].removeBehaviour(emitterlist[emitterIndex].behaviours[4]);

		}
		EmitterControl();
	});
	if(CONFIG.colorChange){
		BehaiviorsGroup.addColor(controls, 'colorFrom').name('初始颜色').onChange(function(str) {
			emitterlist[emitterIndex].behaviours[4].a._arr[0] = str;
			CONFIG.color.colorFrom = str;
		});
		BehaiviorsGroup.addColor(controls, 'colorTo').name('结束颜色').onChange(function(str) {
			emitterlist[emitterIndex].behaviours[4].b._arr[0] = str;
			CONFIG.color.colorTo = str;
		});
	}
	var  FileGroup=emitterTempGroup.addFolder('粒子数据');
	FileGroup.open();
	FileGroup.add(controls, 'remove').name('删除').onChange(function() {
		emitterlist[emitterIndex].destroy();
		emitterlist[emitterIndex].update();
		proton.removeEmitter(emitterlist[emitterIndex]);
		emitterlist[emitterIndex].update();

		emitterlist.splice(emitterIndex, 1);
		emittergui.destroy();
		emittergui = null;
		console.log("proton.getCount "+ proton.getCount());
		console.log("删除后 emitterlist.length  "+ emitterlist.length);

	});
	FileGroup.add(controls, 'save').name('保存');
}
//json解析
function ReadJson() {

	$.getJSON("model/GLTFModel/Assets/properties.json", function(_jsondata) {
		if (_jsondata != null) {
			//	console.log(444);
			//读取保存当前数据
			ReadAndSave_Json(_jsondata);
			//console.log(_jsondata);	
			//场景大小
			xinzangModel.scene.scale.x = _jsondata.Distance;
			xinzangModel.scene.scale.y = _jsondata.Distance;
			xinzangModel.scene.scale.z = _jsondata.Distance;
			//旋转
			xinzangModel.scene.rotation.y = _jsondata.Rotate;
			//灯光强度
			light1.intensity = _jsondata.LightIntensity;
			//	Ly_content.X = xinzangModel.scene.position.x;
			xinzangModel.scene.position.x = _jsondata.X;
			//	Ly_content.Y = xinzangModel.scene.position.y;
			xinzangModel.scene.position.y = _jsondata.Y;
			//	Ly_content.Z = xinzangModel.scene.position.z;
			xinzangModel.scene.position.z = _jsondata.Z;
			//属性读取 Property 
			if (_jsondata.Property != null) {
				var objParet = xinzangModel.scene;
				for (var i = 0; i < _jsondata.Property.length; i++) {
					objParet.traverse(function(child) {
						//获取所有mesh
						if (child instanceof THREE.Mesh) {
							//找到对应的模型
							if (child.name == _jsondata.Property[i].modelname) {
								//	console.log(2222);
								//临时存储材质
								//模型是多维子材质
								if (child.material.length != undefined) {
									//console.log(4444);
									//循环材质
									for (var j = 0; j < child.material.length; j++) {
										//console.log(4444);
										//根据材质名读取
										if (child.material[j].name == _jsondata.Property[i].material) {
											//	console.log(_jsondata.Property[i].material);
											if (_jsondata.DepthTest) { //读取材质属性
												ReadMaterial(_jsondata.Property[i], child.material[j], child, true);
											} else {
												ReadMaterial(_jsondata.Property[i], child.material[j], child, false);
											}

										}
									}
								}
								//模型只有一个材质
								else {
									//console.log(3333);
									//读取材质属性
									//	ReadMaterial(_jsondata.Property[i], child.material, child);
									if (_jsondata.DepthTest) { //读取材质属性
										ReadMaterial(_jsondata.Property[i], child.material, child, true);
									} else {
										ReadMaterial(_jsondata.Property[i], child.material, child, false);
									}
								}
							}
						}
					});
				}
			}
			//灯光属性
			if (_jsondata.LightProperty != null) {
				for (var i = 0; i < _jsondata.LightProperty.length; i++) {
					ReadLightProperty(_jsondata.LightProperty[i]);
				}
			}
			//ParticleProperty
			if (_jsondata.ParticleProperty != null) {
				for (var i = 0; i < _jsondata.ParticleProperty.length; i++) {
					ReadParticleProperty(_jsondata.ParticleProperty[i]);
					console.log("ReadParticleProperty");
				}
			}

		}
	});
}
function ReadCandlelightJson() {

	$.getJSON("model/GLTFModel/Assets/Candlelight.json", function(_jsondata) {
		if (_jsondata != null) {
			//	console.log(444);
			//读取保存当前数据
			ReadAndSave_Json(_jsondata);
			//console.log(_jsondata);
			//场景大小
			xinzangModel.scene.scale.x = _jsondata.Distance;
			xinzangModel.scene.scale.y = _jsondata.Distance;
			xinzangModel.scene.scale.z = _jsondata.Distance;
			//旋转
			xinzangModel.scene.rotation.y = _jsondata.Rotate;
			//灯光强度
			light1.intensity = _jsondata.LightIntensity;
			//	Ly_content.X = xinzangModel.scene.position.x;
			xinzangModel.scene.position.x = _jsondata.X;
			//	Ly_content.Y = xinzangModel.scene.position.y;
			xinzangModel.scene.position.y = _jsondata.Y;
			//	Ly_content.Z = xinzangModel.scene.position.z;
			xinzangModel.scene.position.z = _jsondata.Z;
			//属性读取 Property
			if (_jsondata.Property != null) {
				var objParet = xinzangModel.scene;
				for (var i = 0; i < _jsondata.Property.length; i++) {
					objParet.traverse(function(child) {
						//获取所有mesh
						if (child instanceof THREE.Mesh) {
							//找到对应的模型
							if (child.name == _jsondata.Property[i].modelname) {
								//	console.log(2222);
								//临时存储材质
								//模型是多维子材质
								if (child.material.length != undefined) {
									//console.log(4444);
									//循环材质
									for (var j = 0; j < child.material.length; j++) {
										//console.log(4444);
										//根据材质名读取
										if (child.material[j].name == _jsondata.Property[i].material) {
											//	console.log(_jsondata.Property[i].material);
											if (_jsondata.DepthTest) { //读取材质属性
												ReadMaterial(_jsondata.Property[i], child.material[j], child, true);
											} else {
												ReadMaterial(_jsondata.Property[i], child.material[j], child, false);
											}

										}
									}
								}
								//模型只有一个材质
								else {
									//console.log(3333);
									//读取材质属性
									//	ReadMaterial(_jsondata.Property[i], child.material, child);
									if (_jsondata.DepthTest) { //读取材质属性
										ReadMaterial(_jsondata.Property[i], child.material, child, true);
									} else {
										ReadMaterial(_jsondata.Property[i], child.material, child, false);
									}
								}
							}
						}
					});
				}
			}
			//灯光属性
			if (_jsondata.LightProperty != null) {
				for (var i = 0; i < _jsondata.LightProperty.length; i++) {
					ReadLightProperty(_jsondata.LightProperty[i]);
				}
			}
			//ParticleProperty
			if (_jsondata.ParticleProperty != null) {
				for (var i = 0; i < _jsondata.ParticleProperty.length; i++) {
					ReadParticleProperty(_jsondata.ParticleProperty[i]);
					console.log("ReadParticleProperty");
				}
			}

		}
	});
}
function ReadFireJson() {

	$.getJSON("model/GLTFModel/Assets/Fire.json", function(_jsondata) {
		if (_jsondata != null) {
			//	console.log(444);
			//读取保存当前数据
			ReadAndSave_Json(_jsondata);
			//console.log(_jsondata);
			//场景大小
			xinzangModel.scene.scale.x = _jsondata.Distance;
			xinzangModel.scene.scale.y = _jsondata.Distance;
			xinzangModel.scene.scale.z = _jsondata.Distance;
			//旋转
			xinzangModel.scene.rotation.y = _jsondata.Rotate;
			//灯光强度
			light1.intensity = _jsondata.LightIntensity;
			//	Ly_content.X = xinzangModel.scene.position.x;
			xinzangModel.scene.position.x = _jsondata.X;
			//	Ly_content.Y = xinzangModel.scene.position.y;
			xinzangModel.scene.position.y = _jsondata.Y;
			//	Ly_content.Z = xinzangModel.scene.position.z;
			xinzangModel.scene.position.z = _jsondata.Z;
			//属性读取 Property
			if (_jsondata.Property != null) {
				var objParet = xinzangModel.scene;
				for (var i = 0; i < _jsondata.Property.length; i++) {
					objParet.traverse(function(child) {
						//获取所有mesh
						if (child instanceof THREE.Mesh) {
							//找到对应的模型
							if (child.name == _jsondata.Property[i].modelname) {
								//	console.log(2222);
								//临时存储材质
								//模型是多维子材质
								if (child.material.length != undefined) {
									//console.log(4444);
									//循环材质
									for (var j = 0; j < child.material.length; j++) {
										//console.log(4444);
										//根据材质名读取
										if (child.material[j].name == _jsondata.Property[i].material) {
											//	console.log(_jsondata.Property[i].material);
											if (_jsondata.DepthTest) { //读取材质属性
												ReadMaterial(_jsondata.Property[i], child.material[j], child, true);
											} else {
												ReadMaterial(_jsondata.Property[i], child.material[j], child, false);
											}

										}
									}
								}
								//模型只有一个材质
								else {
									//console.log(3333);
									//读取材质属性
									//	ReadMaterial(_jsondata.Property[i], child.material, child);
									if (_jsondata.DepthTest) { //读取材质属性
										ReadMaterial(_jsondata.Property[i], child.material, child, true);
									} else {
										ReadMaterial(_jsondata.Property[i], child.material, child, false);
									}
								}
							}
						}
					});
				}
			}
			//灯光属性
			if (_jsondata.LightProperty != null) {
				for (var i = 0; i < _jsondata.LightProperty.length; i++) {
					ReadLightProperty(_jsondata.LightProperty[i]);
				}
			}
			//ParticleProperty
			if (_jsondata.ParticleProperty != null) {
				for (var i = 0; i < _jsondata.ParticleProperty.length; i++) {
					ReadParticleProperty(_jsondata.ParticleProperty[i]);
					console.log("ReadParticleProperty");
				}
			}

		}
	});
}
function ReadExplosionJson() {

	$.getJSON("model/GLTFModel/Assets/Explosion.json", function(_jsondata) {
		if (_jsondata != null) {
			//	console.log(444);
			//读取保存当前数据
			ReadAndSave_Json(_jsondata);
			//console.log(_jsondata);
			//场景大小
			xinzangModel.scene.scale.x = _jsondata.Distance;
			xinzangModel.scene.scale.y = _jsondata.Distance;
			xinzangModel.scene.scale.z = _jsondata.Distance;
			//旋转
			xinzangModel.scene.rotation.y = _jsondata.Rotate;
			//灯光强度
			light1.intensity = _jsondata.LightIntensity;
			//	Ly_content.X = xinzangModel.scene.position.x;
			xinzangModel.scene.position.x = _jsondata.X;
			//	Ly_content.Y = xinzangModel.scene.position.y;
			xinzangModel.scene.position.y = _jsondata.Y;
			//	Ly_content.Z = xinzangModel.scene.position.z;
			xinzangModel.scene.position.z = _jsondata.Z;
			//属性读取 Property
			if (_jsondata.Property != null) {
				var objParet = xinzangModel.scene;
				for (var i = 0; i < _jsondata.Property.length; i++) {
					objParet.traverse(function(child) {
						//获取所有mesh
						if (child instanceof THREE.Mesh) {
							//找到对应的模型
							if (child.name == _jsondata.Property[i].modelname) {
								//	console.log(2222);
								//临时存储材质
								//模型是多维子材质
								if (child.material.length != undefined) {
									//console.log(4444);
									//循环材质
									for (var j = 0; j < child.material.length; j++) {
										//console.log(4444);
										//根据材质名读取
										if (child.material[j].name == _jsondata.Property[i].material) {
											//	console.log(_jsondata.Property[i].material);
											if (_jsondata.DepthTest) { //读取材质属性
												ReadMaterial(_jsondata.Property[i], child.material[j], child, true);
											} else {
												ReadMaterial(_jsondata.Property[i], child.material[j], child, false);
											}

										}
									}
								}
								//模型只有一个材质
								else {
									//console.log(3333);
									//读取材质属性
									//	ReadMaterial(_jsondata.Property[i], child.material, child);
									if (_jsondata.DepthTest) { //读取材质属性
										ReadMaterial(_jsondata.Property[i], child.material, child, true);
									} else {
										ReadMaterial(_jsondata.Property[i], child.material, child, false);
									}
								}
							}
						}
					});
				}
			}
			//灯光属性
			if (_jsondata.LightProperty != null) {
				for (var i = 0; i < _jsondata.LightProperty.length; i++) {
					ReadLightProperty(_jsondata.LightProperty[i]);
				}
			}
			//ParticleProperty
			if (_jsondata.ParticleProperty != null) {
				for (var i = 0; i < _jsondata.ParticleProperty.length; i++) {
					ReadParticleProperty(_jsondata.ParticleProperty[i]);
					console.log("ReadParticleProperty");
				}
			}

		}
	});
}
function ReadSmokeJson() {

	$.getJSON("model/GLTFModel/Assets/Smoke.json", function(_jsondata) {
		if (_jsondata != null) {
			//	console.log(444);
			//读取保存当前数据
			ReadAndSave_Json(_jsondata);
			//console.log(_jsondata);
			//场景大小
			xinzangModel.scene.scale.x = _jsondata.Distance;
			xinzangModel.scene.scale.y = _jsondata.Distance;
			xinzangModel.scene.scale.z = _jsondata.Distance;
			//旋转
			xinzangModel.scene.rotation.y = _jsondata.Rotate;
			//灯光强度
			light1.intensity = _jsondata.LightIntensity;
			//	Ly_content.X = xinzangModel.scene.position.x;
			xinzangModel.scene.position.x = _jsondata.X;
			//	Ly_content.Y = xinzangModel.scene.position.y;
			xinzangModel.scene.position.y = _jsondata.Y;
			//	Ly_content.Z = xinzangModel.scene.position.z;
			xinzangModel.scene.position.z = _jsondata.Z;
			//属性读取 Property
			if (_jsondata.Property != null) {
				var objParet = xinzangModel.scene;
				for (var i = 0; i < _jsondata.Property.length; i++) {
					objParet.traverse(function(child) {
						//获取所有mesh
						if (child instanceof THREE.Mesh) {
							//找到对应的模型
							if (child.name == _jsondata.Property[i].modelname) {
								//	console.log(2222);
								//临时存储材质
								//模型是多维子材质
								if (child.material.length != undefined) {
									//console.log(4444);
									//循环材质
									for (var j = 0; j < child.material.length; j++) {
										//console.log(4444);
										//根据材质名读取
										if (child.material[j].name == _jsondata.Property[i].material) {
											//	console.log(_jsondata.Property[i].material);
											if (_jsondata.DepthTest) { //读取材质属性
												ReadMaterial(_jsondata.Property[i], child.material[j], child, true);
											} else {
												ReadMaterial(_jsondata.Property[i], child.material[j], child, false);
											}

										}
									}
								}
								//模型只有一个材质
								else {
									//console.log(3333);
									//读取材质属性
									//	ReadMaterial(_jsondata.Property[i], child.material, child);
									if (_jsondata.DepthTest) { //读取材质属性
										ReadMaterial(_jsondata.Property[i], child.material, child, true);
									} else {
										ReadMaterial(_jsondata.Property[i], child.material, child, false);
									}
								}
							}
						}
					});
				}
			}
			//灯光属性
			if (_jsondata.LightProperty != null) {
				for (var i = 0; i < _jsondata.LightProperty.length; i++) {
					ReadLightProperty(_jsondata.LightProperty[i]);
				}
			}
			//ParticleProperty
			if (_jsondata.ParticleProperty != null) {
				for (var i = 0; i < _jsondata.ParticleProperty.length; i++) {
					ReadParticleProperty(_jsondata.ParticleProperty[i]);
					console.log("ReadParticleProperty");
				}
			}

		}
	});
}
function ReadWaterJson() {

	$.getJSON("model/GLTFModel/Assets/Water.json", function(_jsondata) {
		if (_jsondata != null) {
			//	console.log(444);
			//读取保存当前数据
			ReadAndSave_Json(_jsondata);
			//console.log(_jsondata);
			//场景大小
			xinzangModel.scene.scale.x = _jsondata.Distance;
			xinzangModel.scene.scale.y = _jsondata.Distance;
			xinzangModel.scene.scale.z = _jsondata.Distance;
			//旋转
			xinzangModel.scene.rotation.y = _jsondata.Rotate;
			//灯光强度
			light1.intensity = _jsondata.LightIntensity;
			//	Ly_content.X = xinzangModel.scene.position.x;
			xinzangModel.scene.position.x = _jsondata.X;
			//	Ly_content.Y = xinzangModel.scene.position.y;
			xinzangModel.scene.position.y = _jsondata.Y;
			//	Ly_content.Z = xinzangModel.scene.position.z;
			xinzangModel.scene.position.z = _jsondata.Z;
			//属性读取 Property
			if (_jsondata.Property != null) {
				var objParet = xinzangModel.scene;
				for (var i = 0; i < _jsondata.Property.length; i++) {
					objParet.traverse(function(child) {
						//获取所有mesh
						if (child instanceof THREE.Mesh) {
							//找到对应的模型
							if (child.name == _jsondata.Property[i].modelname) {
								//	console.log(2222);
								//临时存储材质
								//模型是多维子材质
								if (child.material.length != undefined) {
									//console.log(4444);
									//循环材质
									for (var j = 0; j < child.material.length; j++) {
										//console.log(4444);
										//根据材质名读取
										if (child.material[j].name == _jsondata.Property[i].material) {
											//	console.log(_jsondata.Property[i].material);
											if (_jsondata.DepthTest) { //读取材质属性
												ReadMaterial(_jsondata.Property[i], child.material[j], child, true);
											} else {
												ReadMaterial(_jsondata.Property[i], child.material[j], child, false);
											}

										}
									}
								}
								//模型只有一个材质
								else {
									//console.log(3333);
									//读取材质属性
									//	ReadMaterial(_jsondata.Property[i], child.material, child);
									if (_jsondata.DepthTest) { //读取材质属性
										ReadMaterial(_jsondata.Property[i], child.material, child, true);
									} else {
										ReadMaterial(_jsondata.Property[i], child.material, child, false);
									}
								}
							}
						}
					});
				}
			}
			//灯光属性
			if (_jsondata.LightProperty != null) {
				for (var i = 0; i < _jsondata.LightProperty.length; i++) {
					ReadLightProperty(_jsondata.LightProperty[i]);
				}
			}
			//ParticleProperty
			if (_jsondata.ParticleProperty != null) {
				for (var i = 0; i < _jsondata.ParticleProperty.length; i++) {
					ReadParticleProperty(_jsondata.ParticleProperty[i]);
					console.log("ReadParticleProperty");
				}
			}

		}
	});
}
function ReadThunderJson() {

	$.getJSON("model/GLTFModel/Assets/Thunder.json", function(_jsondata) {
		if (_jsondata != null) {
			//	console.log(444);
			//读取保存当前数据
			ReadAndSave_Json(_jsondata);
			//console.log(_jsondata);
			//场景大小
			xinzangModel.scene.scale.x = _jsondata.Distance;
			xinzangModel.scene.scale.y = _jsondata.Distance;
			xinzangModel.scene.scale.z = _jsondata.Distance;
			//旋转
			xinzangModel.scene.rotation.y = _jsondata.Rotate;
			//灯光强度
			light1.intensity = _jsondata.LightIntensity;
			//	Ly_content.X = xinzangModel.scene.position.x;
			xinzangModel.scene.position.x = _jsondata.X;
			//	Ly_content.Y = xinzangModel.scene.position.y;
			xinzangModel.scene.position.y = _jsondata.Y;
			//	Ly_content.Z = xinzangModel.scene.position.z;
			xinzangModel.scene.position.z = _jsondata.Z;
			//属性读取 Property
			if (_jsondata.Property != null) {
				var objParet = xinzangModel.scene;
				for (var i = 0; i < _jsondata.Property.length; i++) {
					objParet.traverse(function(child) {
						//获取所有mesh
						if (child instanceof THREE.Mesh) {
							//找到对应的模型
							if (child.name == _jsondata.Property[i].modelname) {
								//	console.log(2222);
								//临时存储材质
								//模型是多维子材质
								if (child.material.length != undefined) {
									//console.log(4444);
									//循环材质
									for (var j = 0; j < child.material.length; j++) {
										//console.log(4444);
										//根据材质名读取
										if (child.material[j].name == _jsondata.Property[i].material) {
											//	console.log(_jsondata.Property[i].material);
											if (_jsondata.DepthTest) { //读取材质属性
												ReadMaterial(_jsondata.Property[i], child.material[j], child, true);
											} else {
												ReadMaterial(_jsondata.Property[i], child.material[j], child, false);
											}

										}
									}
								}
								//模型只有一个材质
								else {
									//console.log(3333);
									//读取材质属性
									//	ReadMaterial(_jsondata.Property[i], child.material, child);
									if (_jsondata.DepthTest) { //读取材质属性
										ReadMaterial(_jsondata.Property[i], child.material, child, true);
									} else {
										ReadMaterial(_jsondata.Property[i], child.material, child, false);
									}
								}
							}
						}
					});
				}
			}
			//灯光属性
			if (_jsondata.LightProperty != null) {
				for (var i = 0; i < _jsondata.LightProperty.length; i++) {
					ReadLightProperty(_jsondata.LightProperty[i]);
				}
			}
			//ParticleProperty
			if (_jsondata.ParticleProperty != null) {
				for (var i = 0; i < _jsondata.ParticleProperty.length; i++) {
					ReadParticleProperty(_jsondata.ParticleProperty[i]);
					console.log("ReadParticleProperty");
				}
			}

		}
	});
}
function ReadTrailJson() {

	$.getJSON("model/GLTFModel/Assets/Trail.json", function(_jsondata) {
		if (_jsondata != null) {
			//	console.log(444);
			//读取保存当前数据
			ReadAndSave_Json(_jsondata);
			//console.log(_jsondata);
			//场景大小
			xinzangModel.scene.scale.x = _jsondata.Distance;
			xinzangModel.scene.scale.y = _jsondata.Distance;
			xinzangModel.scene.scale.z = _jsondata.Distance;
			//旋转
			xinzangModel.scene.rotation.y = _jsondata.Rotate;
			//灯光强度
			light1.intensity = _jsondata.LightIntensity;
			//	Ly_content.X = xinzangModel.scene.position.x;
			xinzangModel.scene.position.x = _jsondata.X;
			//	Ly_content.Y = xinzangModel.scene.position.y;
			xinzangModel.scene.position.y = _jsondata.Y;
			//	Ly_content.Z = xinzangModel.scene.position.z;
			xinzangModel.scene.position.z = _jsondata.Z;
			//属性读取 Property
			if (_jsondata.Property != null) {
				var objParet = xinzangModel.scene;
				for (var i = 0; i < _jsondata.Property.length; i++) {
					objParet.traverse(function(child) {
						//获取所有mesh
						if (child instanceof THREE.Mesh) {
							//找到对应的模型
							if (child.name == _jsondata.Property[i].modelname) {
								//	console.log(2222);
								//临时存储材质
								//模型是多维子材质
								if (child.material.length != undefined) {
									//console.log(4444);
									//循环材质
									for (var j = 0; j < child.material.length; j++) {
										//console.log(4444);
										//根据材质名读取
										if (child.material[j].name == _jsondata.Property[i].material) {
											//	console.log(_jsondata.Property[i].material);
											if (_jsondata.DepthTest) { //读取材质属性
												ReadMaterial(_jsondata.Property[i], child.material[j], child, true);
											} else {
												ReadMaterial(_jsondata.Property[i], child.material[j], child, false);
											}

										}
									}
								}
								//模型只有一个材质
								else {
									//console.log(3333);
									//读取材质属性
									//	ReadMaterial(_jsondata.Property[i], child.material, child);
									if (_jsondata.DepthTest) { //读取材质属性
										ReadMaterial(_jsondata.Property[i], child.material, child, true);
									} else {
										ReadMaterial(_jsondata.Property[i], child.material, child, false);
									}
								}
							}
						}
					});
				}
			}
			//灯光属性
			if (_jsondata.LightProperty != null) {
				for (var i = 0; i < _jsondata.LightProperty.length; i++) {
					ReadLightProperty(_jsondata.LightProperty[i]);
				}
			}
			//ParticleProperty
			if (_jsondata.ParticleProperty != null) {
				for (var i = 0; i < _jsondata.ParticleProperty.length; i++) {
					ReadParticleProperty(_jsondata.ParticleProperty[i]);
					console.log("ReadParticleProperty");
				}
			}

		}
	});
}
//读取灯光属性
function ReadLightProperty(_jsondata) {
	var s = new THREE.SpotLight(0xffffff, _jsondata.intensity);
	s.position.set(_jsondata.X, _jsondata.Y, _jsondata.Z);
	lightlist.push(s);
	scene.add(s);
	s.name = lightlist.length.toString();
}
//读取材质属性
function ReadMaterial(_jsondata, material, mesh, isDepthTest) {
	mesh.name = _jsondata.modelname;
	mesh.renderOrder = _jsondata.renderOrderValue;
	mesh.castShadow = _jsondata.castShadow;
	mesh.receiveShadow = _jsondata.receiveShadow;

	material.envMapIntensity = _jsondata.envMapIntensity;
	material.name = _jsondata.materialName;
	if (_jsondata.defaultSide == 0) {
		material.side = THREE.FrontSide;
	}
	else if (_jsondata.defaultSide == 1) {
		material.side = THREE.BackSide;
	}
	else if (_jsondata.defaultSide == 2) {
		material.side = THREE.DoubleSide;
	}

	material.color = _jsondata.mapColor;
	material.metalness = _jsondata.metalness;
	material.roughness = _jsondata.roughness;

	if (material.normalMap != null) {
		if (_jsondata.normalScale != undefined) {
			material.normalScale.x = _jsondata.normalScale;
			material.normalScale.y = -_jsondata.normalScale;

		}
	}

	if(_jsondata.useMap){
		var commonTexture = new THREE.TextureLoader().load(_jsondata.jpgPngTexture);
		material.map = commonTexture;
	}
	if(_jsondata.useNormalsMap){
		var commonTexture = new THREE.TextureLoader().load(_jsondata.jpgPngNormalMap);
		material.normalMap = commonTexture;
	}
	if(_jsondata.useEmissiveMap){
		var commonTexture = new THREE.TextureLoader().load(_jsondata.jpgPngEmissiveMap);
		material.emissiveMap = commonTexture;
	}
	if(_jsondata.useClearcoatMap){
		var commonTexture = new THREE.TextureLoader().load(_jsondata.jpgPngClearcoatMap);
		material.clearcoatMap = commonTexture;
	}
	if(_jsondata.useclearcoatRoughnessMap){
		var commonTexture = new THREE.TextureLoader().load(_jsondata.jpgPngClearcoatRoughnessMap);
		material.clearcoatRoughnessMap = commonTexture;
	}
	if(_jsondata.useclearcoatNormalMap){
		var commonTexture = new THREE.TextureLoader().load(_jsondata.jpgPngClearcoatNormalMap);
		material.clearcoatNormalMap = commonTexture;
	}
	if(_jsondata.useAlphaMap){
		var commonTexture = new THREE.TextureLoader().load(_jsondata.jpgPngAlphaMap);
		material.alphaMap = commonTexture;
	}

	material.emissive = _jsondata.emissiveColor;
	material.emissiveIntensity = _jsondata.emissiveIntensity;
	if(_jsondata.useTransparent){
		material.opacity = _jsondata.opacity;
		material.alphaTest = _jsondata.alphaTest;
		material.transmission = _jsondata.transmission;
		material.ior = _jsondata.ior;
	}

	material.clearcoat = _jsondata.clearcoat;
	material.clearcoatRoughness = _jsondata.clearcoatRoughness;
	material.clearcoatNormalScale.x = _jsondata.clearcoatRoughness;
	material.clearcoatNormalScale.y = -_jsondata.clearcoatRoughness;
	material.reflectivity = _jsondata.reflectivity;

	material.sheen = _jsondata.sheen;
	if(_jsondata.useSkin){
		const shader = SubsurfaceScatteringShader;
		var SkinUniforms = ThreeModule.UniformsUtils.clone( shader.uniforms );
		SkinUniforms[ 'map' ].value = material.map;

		SkinUniforms[ 'diffuse' ].value = _jsondata.skinColor;
		SkinUniforms[ 'shininess' ].value = _jsondata.shininess;

		SkinUniforms[ 'thicknessMap' ].value = material.map;
		SkinUniforms[ 'thicknessColor' ].value =  _jsondata.bloodColor;
		SkinUniforms[ 'thicknessDistortion' ].value = _jsondata.thicknessDistortion;
		SkinUniforms[ 'thicknessAmbient' ].value = _jsondata.thicknessAmbient;
		SkinUniforms[ 'thicknessAttenuation' ].value = _jsondata.thicknessAttenuation;
		SkinUniforms[ 'thicknessPower' ].value = _jsondata.thicknessPower;
		SkinUniforms[ 'thicknessScale' ].value = _jsondata.thicknessScale;

		material = new THREE.ShaderMaterial( {
			uniforms: SkinUniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
			lights: true
		} );

		material.extensions.derivatives = true;
		mesh.material = material;
		if(_jsondata.useSkinTransparent){
			material.transparent = true;
			material.uniforms.opacity.value = 0.5;
		}

	}
	if(_jsondata.useFresnel){
		const shader = FresnelShader;
		var FresnelUniforms = THREE.UniformsUtils.clone( shader.uniforms );
		FresnelUniforms[ 'mRefractionRatio' ].value = _jsondata.RefractionRatio;
		FresnelUniforms[ 'mFresnelBias' ].value = _jsondata.FresnelBias;
		FresnelUniforms[ 'mFresnelPower' ].value = _jsondata.FresnelPower;
		FresnelUniforms[ 'mFresnelScale' ].value = _jsondata.FresnelScale;
		FresnelUniforms[ "tCube" ].value = envMap;
		material = new THREE.ShaderMaterial( {
			uniforms: FresnelUniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader
		} );
		mesh.material = material;
	}
	if (_jsondata.is_wave) {
		is_wave = _jsondata.is_wave;
		wave_texture = material.map;
		wave_texture.wrapS = THREE.RepeatWrapping;
		wave_texture.wrapT = THREE.RepeatWrapping;
		material.map = wave_texture;
	}
	if (_jsondata.is_wave_x) {
		is_wave_x = _jsondata.is_wave_x;
	}
	if (_jsondata.waveSpeedX) {
		waveSpeedX = _jsondata.waveSpeedX;
	}
	if (_jsondata.is_wave_y) {
		is_wave_y = _jsondata.is_wave_y;
	}
	if (_jsondata.waveSpeedY) {
		waveSpeedY = _jsondata.waveSpeedY;
	}
	if (_jsondata.useRim) {
		var glassMaterial = glassShader();
		glassMaterial.uniforms.glowColor.value = _jsondata.glowColor;
		glassMaterial.uniforms.coeficient.value = _jsondata.coeficient;
		glassMaterial.uniforms.power.value = _jsondata.glowPower;
		mesh.material = glassMaterial;
	}
	if (_jsondata.useRimOpaque) {
		var RimOpaqueMaterial = RimOpaqueShader();
		RimOpaqueMaterial.uniforms.glowColor.value = _jsondata.glowColor;
		RimOpaqueMaterial.uniforms.coeficient.value = _jsondata.coeficient;
		RimOpaqueMaterial.uniforms.power.value = _jsondata.glowPower;
		mesh.material = RimOpaqueMaterial;
	}
	material.needsUpdate = true;
}
//递归选择所有物体的列表
function controlObj_Recursive() {
	if (xinzangModel != null) {
		var objParet = xinzangModel.scene;
		objParet.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				meshList.push(child);
				var mtl = new THREE.MeshPhysicalMaterial();
				mtl.copy(child.material);
				mtl.envMap = envMap;
				child.material = mtl;
				//console.log(child.material);
			}
		});
	}

}
//存儲場景所有模型数据
function ReadAndSave_Json(_jsondata) {
		for (var i = 0; i < _jsondata.Property.length; i++) {
			Ly_data.push(_jsondata.Property[i]);
		}
}
//玻璃类效果
function glassShader() {
	//LYTest3.8
	var vertexShader = [
		'varying vec3	vVertexWorldPosition;',
		'varying vec3	vVertexNormal;',
		'varying vec4	vFragColor;',
		'void main(){',
		'	vVertexNormal	= normalize(normalMatrix * normal);', //将法线转换到视图坐标系中
		'	vVertexWorldPosition	= (modelMatrix * vec4(position, 1.0)).xyz;', //将顶点转换到世界坐标系中
		'	// set gl_Position',
		'	gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
		'}'

	].join('\n');
	var fragmentShader1 = [
		'uniform vec3	glowColor;',
		'uniform float	coeficient;',
		'uniform float	power;',
		'varying vec3	vVertexNormal;',
		'varying vec3	vVertexWorldPosition;',
		'varying vec4	vFragColor;',
		'void main(){',
		'	vec3 worldCameraToVertex= vVertexWorldPosition - cameraPosition;', //世界坐标系中从相机位置到顶点位置的距离
		'	vec3 viewCameraToVertex	= (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;', //视图坐标系中从相机位置到顶点位置的距离
		'	viewCameraToVertex	= normalize(viewCameraToVertex);', //规一化
		'	float intensity		= pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);', //、0.3系数控制物体的透明度
		'	gl_FragColor		= vec4(glowColor, intensity);',
		'}'
	].join('\n');

	var meshMaterial = new THREE.ShaderMaterial({
		uniforms: {
			coeficient: {
				type: "f",
				value: 1
			},
			power: {
				type: "f",
				value: 0.3 //控制物体透明度0-1，默认0.3
			},
			glowColor: {
				type: "c",
				value: new THREE.Color('#2BFFFF')
				//value: new THREE.Color('#FFFFFF')
			}
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader1,
		blending: THREE.NormalBlending,
		transparent: true

	});
	return meshMaterial;
}
//玻璃类效果-End
function RimOpaqueShader() {
	var vertexShader	= [
		'varying vec3	vVertexWorldPosition;',
		'varying vec3	vVertexNormal;',
		'varying vec2 vUv;',


		'void main(){',
		'	vVertexNormal	= normalize(normalMatrix * normal);',
		'   vUv = uv;',
		'	vVertexWorldPosition	= (modelMatrix * vec4(position, 1.0)).xyz;',

		'	// set gl_Position',
		'	gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
		'}'

	].join('\n');
	var fragmentShader	= [
		'uniform vec3	glowColor;',
		'uniform float	coeficient;',
		'uniform float	power;',
		'varying vec2 vUv;',
		'uniform sampler2D baseTexture;',
		'varying vec3	vVertexNormal;',
		'varying vec3	vVertexWorldPosition;',


		'void main(){',
		'	vec3 worldCameraToVertex= vVertexWorldPosition - cameraPosition;',
		'	vec3 viewCameraToVertex	= (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;',
		'	viewCameraToVertex	= normalize(viewCameraToVertex);',
		'	float intensity		= pow(coeficient+ dot(vVertexNormal, viewCameraToVertex), power);',
		'   vec3 blendColor  =  texture2D( baseTexture, vUv ).rgb + glowColor * intensity;',
		'	gl_FragColor		= vec4(blendColor, 1);',
		'}'
	].join('\n');

	var meshMaterial = new THREE.ShaderMaterial({
		uniforms: {
			baseTexture	: {
				type	: "t",
				value	: null
			},
			coeficient	: {
				type	: "f",
				value	: 1
			},
			power		: {
				type	: "f",
				value	: 5
			},
			glowColor	: {
				type	: "c",
				value	: new THREE.Color(0xffff00)
			}
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		blending: THREE.NormalBlending,
		transparent: true

	});
	return meshMaterial;
}


//灯光亮宇
function LightControl() {
	if (lightgui != null) {
		lightgui.destroy();
	}
	lightgui = new dat.GUI();
	var controls = new function() {
		this.lightName = lightlist[lightIndex].name;
		this.X = lightlist[lightIndex].position.x;
		this.Y = lightlist[lightIndex].position.y;
		this.Z = lightlist[lightIndex].position.z;
		this.intensity = lightlist[lightIndex].intensity;
		this.remove = function() {};
		this.save = function() {
			var bbb = {
				//1、模型的名称
				lightName: lightlist[lightIndex].name,
				//2、material名称				
				X: lightlist[lightIndex].position.x,
				//3、金属度
				Y: lightlist[lightIndex].position.y,
				Z: lightlist[lightIndex].position.z,
				intensity: lightlist[lightIndex].intensity,

			}
			Ly_LightData.push(bbb);
			//if(mesh.material.length==undefined)
			{
				console.log(bbb);
			}
			// Ly_content = JSON.stringify(Ly_data);
			alert("修改数据已保存！");
		};
	}
	var lightTempGroup = lightgui.addFolder('灯光调节');

	lightTempGroup.open();
	//var  lightGroup=lightTempGroup.addFolder('灯光名');
	lightTempGroup.add(controls, 'lightName');
	lightTempGroup.add(controls, 'X', -20, 20, 0.1).name('X轴').onChange(function(str) {
		//xinzangModel.scene.scale.x = str
		lightlist[lightIndex].position.x = str;
	});
	lightTempGroup.add(controls, 'Y', -20, 20, 0.1).name('Y轴').onChange(function(str) {
		//xinzangModel.scene.scale.x = str
		lightlist[lightIndex].position.y = str;
	});
	lightTempGroup.add(controls, 'Z', -20, 20, 0.1).name('Z轴').onChange(function(str) {
		//xinzangModel.scene.scale.x = str
		lightlist[lightIndex].z = str;
	});
	lightTempGroup.add(controls, 'intensity', 0, 10, 0.1).name('强度').onChange(function(str) {
		//xinzangModel.scene.scale.x = str
		lightlist[lightIndex].intensity = str;
	});
	lightTempGroup.add(controls, 'remove').name('删除').onChange(function() {
		scene.remove(lightlist[lightIndex]);
		lightlist.splice(lightIndex, 1);
		lightgui.destroy();
		lightgui = null;
		lightIndex == -1;
	});
	lightTempGroup.add(controls, 'save').name('确认');
}
//灯光亮宇

//END

