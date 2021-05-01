if (!Detector.webgl) Detector.addGetWebGLMessage();

var clickTime = 0;

var Isonclick = false;

var container, stats, controlsa;
var camera, scene, renderer, light1, light2;
var ani;
var clock = new THREE.Clock();

var mixers = [];

var isrun = false;

var YinXiao1, PeiYin1, YinXiao2, PeiYin2, PeiYin3, IsPeiYin1, PeiYin4, PeiYin5, BGM;
var audioLoader, listener, Dub1, Dub2, Dub3, Dub4, Dub5;
var isFirstPlay = true;
var childmat;
var xinzangModel;
var GetDataIs;
var clearTxt;
var matIndex = 0; //当前材质索引
var plane1, plane2, plane3, plane4;

var clickcount;

//渲染组合器定义变量
var composer;
var renderPass;
//选中的模型
var choseMesh;
var meshParent;
var tgaTexture;
//是否暂停动画
var isPlay = false;
GetDataIs = true;
var envMap;



//animate();
var mixer;

var AnimManager;
var AnimtionsList;

var raycaster, mouse;
var projectObj;
var sceneHelpers;
var helper;

var gui;

var changeMaterial;
var AnimationIndex = 0; //当前动画索引
var vShader;
var fShader;
var plight1;
var operateModelIndex = 0;
var aa = [];
init();
var meshHelper;
//被选中的物体
var pickObj;



function init() {
	//	ReadJson();
	changeMaterial = createShader();


	rayRaster = new THREE.Raycaster(); //光线投射器;	
	mouse = new THREE.Vector2();
	sceneHelpers = new THREE.Scene();
	helper = new THREE.BoxHelper();
	sceneHelpers.add(helper);
	Isonclick = false;
	clearTxt = true;
	clickcount = 0;
	// 容器
	container = document.createElement('div');
	document.body.appendChild(container);

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 2000);
	//camera.position.set(658, -167, 450);
	camera.position.set(0, 1, -8);

	controlsa = new THREE.OrbitControls(camera);
	controlsa.target.set(0, 0, 0);
	controlsa.update();
	//console.log(camera);
	scene = new THREE.Scene();

	plight1 = new THREE.AmbientLight(0xffffff, 1);
	scene.add(plight1);
	plight1.position.set(1, 1, 0);
	plight1.intensity = 4;
	light1 = new THREE.SpotLight(0xffffff, 0.8);
	scene.add(light1);
	//  light1.position.set(1, 3, 0);
	light1.position.set(0, 4, 0);
	light1.castShadow = true; //开启灯光投射阴影
	//console.log(plight1);




	//var debugcamera1=new THREE.SpotLightHelper(light2);
	//scene.add(debugcamera1);
	//var ambientLight = new THREE.AmbientLight( 0xffffff ,0.5);
	//scene.add(ambientLight)

	//天空盒子
	scene.background = new THREE.CubeTextureLoader()
		.setPath('sky/')
		.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

	//var loaders = new THREE.image();

	envMap = //THREE.ImageUtils.loadTexture('model/envMap.jpg')
		new THREE.CubeTextureLoader()
		.setPath('sky/')
		.load(['right.jpg', 'left.jpg', 'top.jpg', 'bottom.jpg', 'front.jpg', 'back.jpg']);


	//配音
	// audioLoader = new THREE.AudioLoader();
	// listener = new THREE.AudioListener();

	// BGM = new THREE.Audio(listener);
	// audioLoader.load('sounds/BGM.mp3', function (buffer) {
	// 	BGM.setBuffer(buffer);
	// 	BGM.setLoop(false);BGM.play();
	// });



	//SaveJson();
	var ly;
	//GLTF加载
	var loader = new THREE.GLTFLoader();
	loader.load('model/GLTFModel/model.gltf', function(object) {
		xinzangModel = object;
		var geometry = new THREE.PlaneGeometry(20, 20, 30, 30);
		var material = new THREE.MeshLambertMaterial({
			color: 0xD2D2D2
		});
		//  console.log(material);   


		ly = xinzangModel.scene.children;
		object.scene.rotation.y = Math.PI * 0.4;
		//console.log	(object.scene);
		scene.add(object.scene);

		controlObj_Recursive();

		AnimtionsList = object.animations;

		mixer = new THREE.AnimationMixer(object.scene);

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

		meshParent = xinzangModel.scene.children[0].children[0].children[0].children;
		//克隆地球
		//cloneEarth();
		if (AnimtionsList[0] != null) {
			IdleManager = mixer.clipAction(AnimtionsList[0]);
			//console.log(IdleManager);
			IdleManager.play();
		}
		//OutLight();
		//CollectMesh(rayRaster,scene,camera,mouse);
		//document.head.removeChild(loadCSS);
		//document.getElementById('table').innerText = '鼠标左键旋转镜头，鼠标右键拖拽物体，滚轮拉动镜头';
		document.getElementById('table').innerText = '';
		//new THREE.SkeletonHelper
		meshHelper = new THREE.SkeletonHelper(xinzangModel.scene);
		scene.add(meshHelper);


	}, undefined, function(e) {
		console.error(e);
	});
	//antialias:true增加抗锯齿效果
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.type = 2;
	renderer.shadowMap.enabled = true;
	renderer.gammaOutput = true;

	renderer.autoClear = false;
	console.log(renderer);
	var animate = function() {
		requestAnimationFrame(animate);
		var mixerUpdateDelta = clock.getDelta();
		if (mixers.length > 0) {
			if (isPlay) {
				update(mixerUpdateDelta);
			}

		}

		//cube.rotation.x += 0.01;
		// cube.rotation.y += 0.01;
		//console	.log(123);
		renderer.render(scene, camera);
		renderer.render(sceneHelpers, camera);
	};
	animate();

	container.appendChild(renderer.domElement);

	/*	window.addEventListener("mousemove", MoveTime);

		window.addEventListener("mouseup", UpTime);

		window.addEventListener("mousedown", DownTime);

		window.addEventListener('resize', onWindowResize, false);*/
	//选择物体
	container.addEventListener('click', onDocumentMouseDown);

	document.body.addEventListener('touchmove', function(e) {

		e.preventDefault(); //阻止默认的处理方式(阻止下拉滑动的效果)
	}, {
		passive: false
	}); //passive 参数不能省略，用来兼容ios和android



}
/*
function DownTime() {
	Isonclick = true;
	clickcount++;
	if (clearTxt == true && clickcount == 3) {
		document.getElementById('table').innerText = '';
		clearTxt = false;
	}
}

function MoveTime() {
	if (Isonclick == true) {
		clickTime += 0.02;
	}
}

function UpTime() {
	if (clickTime <= 0.04) {
		playSound();
	}

	Isonclick = false;
	clickTime = 0;
}

function playSound() {


}
*/
function onWindowResize() {
	camera.aspect = document.body.clientWidth / document.body.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(document.body.clientWidth, document.body.clientHeight);
	//concig
	//Camera
	//Animation
	//render
	//aspect
}


function replay() {
	ani.clampWhenFinished = true;

	ani.play();
}

function update(mixerUpdateDelta) {

	//每帧动画渲染
	for (var i = 0; i < mixers.length; i++) {
		mixers[i].update(mixerUpdateDelta);
	}
}
//渲染组合器
function OutLight() {
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.type = 2;
	renderer.shadowMap.enabled = true;
	renderer.gammaOutput = true;
	document.body.appendChild(renderer.domElement);

	var composer = new THREE.EffectComposer(renderer);

	var renderPass = new THREE.RenderPass(scene, camera);
	renderPass.clear = true;
	renderPass.renderToScreen = false;
	composer.addPass(renderPass);
	var OBJ;
	for (var i = 0; i < xinzangModel.scene.children[0].children[0].children[0].children.length; i++) {
		if (xinzangModel.scene.children[0].children[0].children[0].children[i].name == "node_earth_a100_-12672") {
			OBJ = xinzangModel.scene.children[0].children[0].children[0].children[i];
			//004CFFFF   emissive   emissiveIntensity
			//
			var lymap = xinzangModel.scene.children[0].children[0].children[0].children[i].material.map;
			//	xinzangModel.scene.children[0].children[0].children[0].children[i].material=new THREE.MeshLambertMaterial({colo: 0X004CFF,map:lymap});
			//	OBJ.material.emissive=new THREE.Color(0X004CFF);
			//OBJ.material.emissiveIntensity=0.3;
			OBJ.material.map = lymap; //xinzangModel.scene.children[0].children[0].children[0].children[2].material.map;
			var shaderMat = new THREE.ShaderMaterial({
				vertexShader: document.getElementById('phongvertex-shader').innerHTML,
				fragmentShader: document.getElementById('phongfragment-shader').innerHTML,
			});
			//OBJ.material=shaderMat;
			OBJ.material.map = lymap;
			//console.log("我丢你老母！");
			console.log(OBJ);
			THREE.LYShader = {
				vertexShader: document.getElementById('lambertvertex-shader').innerHTML,
				fragmentShader: document.getElementById('lambertfragment-shader').innerHTML,
			}
			var shaderPass = new THREE.ShaderPass(THREE.LYShader, [OBJ]);
			shaderPass.enabled = false;
			shaderPass.renderToScreen = true;
			//composer.addPass(shaderPass);
			//var aamaterial=createShader();
			//console.log(material);
			//OBJ.material=aamaterial;
			//end		
			//	console.log	(OBJ);
			OBJ.material.emissive = new THREE.Color(0X004CFF);
			OBJ.material.emissiveIntensity = 0.3;
		}
	}
	var outlinePass = new THREE.OutlinePass(new THREE.Vector2(renderer.domElement.width, renderer.domElement.height),
		scene, camera, [OBJ]);

	outlinePass.edgeStrength = 5; //强度
	outlinePass.edgeGlow = 0.5; //强度
	outlinePass.edgeThickness = 1; //边缘浓度
	outlinePass.pulsePeriod = 0; //闪烁频率
	outlinePass.visibleEdgeColor.set('#2BFFFF'); //边缘课件部分法光颜色
	outlinePass.hiddenEdgeColor.set('#190a05'); //边缘遮挡部分发光颜色
	outlinePass.clear = false;
	outlinePass.renderToScreen = true;
	//composer.addPass(outlinePass);
	var animate = function() {
		requestAnimationFrame(animate);
		var mixerUpdateDelta = clock.getDelta();
		if (mixers.length > 0) {
			update(mixerUpdateDelta);
		}
		//cube.rotation.x += 0.01;
		// cube.rotation.y += 0.01;
		//console	.log(123);
		renderer.render(scene, camera);
		renderer.render(sceneHelpers, camera);
	};
	animate();


}

//光晕shader
function createShader() {
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
		'	float intensity		= pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);',
		'	gl_FragColor		= vec4(glowColor, intensity);',
		'}'
	].join('\n');

	var meshMaterial = new THREE.ShaderMaterial({
		uniforms: {
			coeficient: {
				type: "f",
				value: 1.0
			},
			power: {
				type: "f",
				value: 2
			},
			glowColor: {
				type: "c",
				value: new THREE.Color('#2BFFFF')
			}
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader1,
		blending: THREE.NormalBlending,
		transparent: true

	});
	return meshMaterial;
}
//克隆地球做出光晕效果	
function cloneEarth() {
	for (var i = 0; i < meshParent.length; i++) {
		if (meshParent[i].name == "node_earth_a100_-12672") {
			OBJ = xinzangModel.scene.children[0].children[0].children[0].children[i];
			//004CFFFF   emissive   emissiveIntensity
			//
			var lymap = meshParent[i].material.map;
			//OBJ.visible  =false;     		
			var cloneearth = OBJ.clone();
			var cloneearthMaterial = createShader();
			cloneearth.material = cloneearthMaterial;
			// var LYmesh=new THREE.Mesh(cloneearth,cloneearthMaterial);
			//console.log	(OBJ.position);
			//cloneearth.material=createShader();
			cloneearth.scale.set(9.5, 9.5, 9.5);
			//cloneearth.position
			//cloneearth.material=new THREE.MeshStandardMaterial();
			cloneearth.visible = true;
			scene.add(cloneearth);

			//	xinzangModel.scene.children[0].children[0].children[0].children[i].material=new THREE.MeshLambertMaterial({colo: 0X004CFF,map:lymap});
			//	OBJ.material.emissive=new THREE.Color(0X004CFF);
			//OBJ.material.emissiveIntensity=0.3;

			//OBJ.material.map=lymap;//xinzangModel.scene.children[0].children[0].children[0].children[2].material.map;
		}
		if (meshParent[i].name == "node_sun_a_-12676") {
			meshParent[i].children[0].material.transparent = true;
		}
	}
}
//



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
	//console.log(xinzangModel.scene.children.geometry.vertices.length);

	if (intersects.length > 0) {

		//选中第一个射线相交的物体
		SELECTED = intersects[0].object;
		var intersected = intersects[0].object;
		selectedObjectChanged(intersects[0].object);
		ChangeMat(intersects[0].object);
		choseMesh = intersects[0].object;
		//console.log(intersects[0].object);
		//gui=null;
		//寄存选中的物体
		pickObj = intersects[0].object;

		UseGUI(intersects[0].object);
	}

	/*
 // 循环碰撞检测
    for (var i = 0; i < cube.geometry.vertices.length; i++) {
        // 顶点原始坐标
        var localVertex = cube.geometry.vertices[i].clone();
        // 顶点经过变换后的坐标
        //  matrix 局部变换矩阵。   applyMatrix4 并返回新Matrix4(4x4矩阵)对象.
        var globalVertex = localVertex.applyMatrix4(cube.matrix);
        // 获得由中心指向顶点的向量
        var directionVector = globalVertex.sub(cube.position);
        // 将方向向量初始化
        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        // 检测射线与多个物体的相交情况
        var collisionResults = ray.intersectObjects(objects);
        // 如果返回结果不为空，且交点与射线起点的距离小于物体中心至顶点的距离，则发生了碰撞
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            console.log('碰撞！');
        }
    }   

*/

}
//修改物体材质
function ChangeMat(changeBoj) {
	var _changemat = new THREE.MeshStandardMaterial({
		color: 0xffccff
	});
	//changeBoj.material=_changemat;
}

//添加选中效果
function selectedObjectChanged(object) {
	//console.log(222);
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

function UseGUI(mesh, index = 0) {
	var material;
	if (mesh.material.length != undefined) {
		material = mesh.material[index];
	} else {
		matIndex = 0;
		material = mesh.material;
	}
	console.log(material);
	//存放有所有需要改变的属性的对象
	var controls = new function() {
		this.Save = function() {
			let data = {
				//name:"hanmeimei",
				//age:88,
				vertexShader: ['varying vec3	vVertexWorldPosition;',
					'varying vec3	vVertexNormal;',
					'varying vec4	vFragColor;',
					'void main(){',
					'	vVertexNormal	= normalize(normalMatrix * normal);', //将法线转换到视图坐标系中
					'	vVertexWorldPosition	= (modelMatrix * vec4(position, 1.0)).xyz;', //将顶点转换到世界坐标系中
					'	// set gl_Position',
					'	gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
					'}'
				],
				fragmentShader: [
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
					'	float intensity		= pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);',
					'	gl_FragColor		= vec4(glowColor, intensity);',
					'}'
				],
				TGAName: tgaTexture.name

			}
			var content = JSON.stringify(data);
			var blob = new Blob([content], {
				type: "text/plain;charset=utf-8"
			});
			saveAs(blob, "Save");
		};
		//tga图片名
		this.LoadTGAName = "";
		//tga确认按钮
		this.tgaButton = function() {
			LoadTGA(LoadTGAName);
		};

		//材质名
		this.materialName = material.name;
		//模型名
		this.modelName = mesh.name;
		//金属度
		this.metalness = material.metalness;
		//平滑度
		this.roughness = material.roughness;
		//法线程度
		this.normalScale = material.normalScale.x;
		this.alphacutoff = material.alphaTest;
		//console.log(material);
		this.color = material.color;
		//material.color;
		this.transparent = material.transparent;
		//envMap
		//this.isEnvMap=false;
		if (material.envMap != null) {
			this.isenvMap = true;
		} else {
			this.isenvMap = false;
		}
		this.envMapIntensity = material.envMapIntensity;
		//确认按钮，暂存数据
		this.ok = function() {

			var bbb = {
				//	modelname: mesh.name,
				//	metalness: material.metalness,
				//	roughness: material.roughness,
				//normalScale: material.normalMap == null ? 0 : material.normalScale.x,
				//alphacutoff: material.alphaTest,
				//transparent: material.transparent,
				//	isenvMap: material.envMap == null ? false : true,
				//	envMapIntensity: material.envMapIntensity,
				//New 3.19:21.11
				//1、模型的名称
				modelname: mesh.name,
				//2、material名称				
				material: material.name,
				//3、金属度
				metalness: material.metalness,
				//3、平滑度
				roughness: material.roughness,
				//4、法线值
				normalScale: material.normalScale,
				//5、普通贴图路径
				jpgPngTexture: material.map.image.src,
				//6、texture贴图路径
				tgaTexture: material.map.image.src,
				//7、是否透明				
				transparent: material.transparent,
				//8、透明值	
				opacity: material.opacity,
				//9、透明显示值
				alphacutoff: material.alphaTest,
				//10、是否纯色thisthis
				solidColor: this.solidColor,
				//11、透明颜色
				transparentColor: material.transparentColor,
				//12、环境反射
				isenvMap: this.isenvMap,
				//13、环境反射强度
				envMapIntensity: material.envMapIntensity,
				//14、投影
				castShadow: mesh.castShadow,
				//15、接收阴影
				receiveShadow: mesh.receiveShadow,
				//16、自发光颜色
				emissive: material.emissive.r+","+material.emissive.g+","+material.emissive.b,
				
				//17、自发光强度
				emissiveIntensity: material.emissiveIntensity,
			}
			console.log(bbb.emissive);
			Ly_data.push(bbb);
			//if(mesh.material.length==undefined)
			{
				console.log(bbb);
			}
			// Ly_content = JSON.stringify(Ly_data);
			alert("修改数据已保存！");
		};


		//取消按钮，重置数据
		this.cancle = function() {
			var oldmetalness = 0;
			var oldroughness = 1;
			var oldnormalScale = 1;
			var oldalphacutoff = 0;
			var oldtransparent = false;
			var oldisenvMap = false;
			var envMapIntensity = 1;
			material.metalness = 0;
			material.roughness = 1;
			if (material.normalMap != null) {
				material.normalScale.x = 1;
			}
			material.alphaTest = 0;
			material.transparent = false;
			material.envMap = null;
			material.envMapIntensity = 1;

			//金属度
			/*	metalness =0;
				//平滑度
				roughness =1;
				//平滑度
				roughness = material.roughness;
				//法线程度
				normalScale =1;
				alphacutoff = 0;		
				//material.color;
				transparent=false;
				isenvMap=false;
				envMapIntensity=1;*/
			alert("数据已重置！");
		};
		//是否开启阴影
		this.castShadow = false;
		//是否接收阴影
		this.receiveShadow = false;
		//是否发光
		this.isGlow = false;
		//内发光
		this.innerOrOutGlow = true;
		//透明值
		this.opacity = material.opacity;
		//自发光
		this.emissive = material.emissive;
		//	console.log(material.emissive);
		this.emissiveIntensity = material.emissiveIntensity;
		//	console.log(material.color);
		//var lycolor=material.color;
		//透明的颜色
		this.transparentColor = material.color;
		//纯色
		this.solidColor = false;
		//贴图类
		//console.log(material.map.image.src);
		if (material.map != null) {
			var tempArray = material.map.image.src.split('/');
			this.jpgPngTexture = tempArray[tempArray.length - 1];
		} else {
			this.jpgPngTexture = "";
		}

		//贴图类TGA
		this.tgaTexture = "";
		//加载
		this.loadTexture = function() {};
		//法线贴图
		this.normalTexture
	};
	if (gui != null) {
		gui.destroy();
	}

	gui = new dat.GUI();

	var matGroup = gui.addFolder('Material');
	var LoadTGAName;
	//普通贴图
	var commonTexture;
	//tga贴图
	var tgaTexture;

	matGroup.add(controls, 'modelName');

	matGroup.add(controls, 'materialName');
	matGroup.add(controls, 'metalness', 0, 1, 0.1).onChange(function(str) {
		material.metalness = str;
		material.needsUpdate = true;
	});
	matGroup.add(controls, 'roughness', 0, 1, 0.1).onChange(function(str1) {
		material.roughness = str1;
		material.needsUpdate = true;
	});

	matGroup.add(controls, 'normalScale', 0, 5).onChange(function(str2) {
		if (material.normalMap != null) {
			material.normalScale.x = str2;
			material.normalScale.y = -str2;
			material.needsUpdate = true;
		}
	});
	//贴图相关
	var textureGroup = matGroup.addFolder('Texture'); {
		textureGroup.add(controls, 'jpgPngTexture').onChange(function(str) {
			if (str != null) {
				commonTexture = new THREE.TextureLoader().load("model/GLTFModel/Assets/TempAssets/1/" + str);
				//console.log("可以了");
				material.needsUpdate = true;
			}
		});
		textureGroup.add(controls, 'loadTexture').onChange(function(str) {
			//	if(str!=null)
			{
				material.map = commonTexture;
				material.needsUpdate = true;
				//console.log("可加载了");
			}
		});

	}

	//透明相关
	var transparentGroup = matGroup.addFolder('Transparent'); {
		//transparentGroup.open();
		transparentGroup.add(controls, 'transparent').onChange(function(str5) {
			material.transparent = str5;
			material.needsUpdate = true;
		});
		transparentGroup.add(controls, 'opacity', 0, 1, 0.1).onChange(function(str) {
			material.opacity = str;
		});
		transparentGroup.add(controls, 'alphacutoff', 0, 1, 0.1).onChange(function(str3) {
			material.alphaTest = str3;
			material.needsUpdate = true;
		});
		//纯色设置	  	
		transparentGroup.add(controls, 'solidColor', ).onChange(function(str) {
			if (str) {
				var tempMaterial = new THREE.MeshStandardMaterial({
					color: 0xEFF861
				});
				//material=new THREE.MeshStandardMaterial({color:0xEFF861});
				pickObj.material = tempMaterial;
				pickObj.material.skinning = true;
				pickObj.material.transparent = true;
				material = pickObj.material;
				material.needsUpdate = true;
			}
		});
		//改变透明颜色
		transparentGroup.addColor(controls, 'transparentColor', ).onChange(function(str) {
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
	}
	//环境反射 Environmental reflection
	var envReflectionGroup = matGroup.addFolder('EnvReflection'); {
		//  envReflectionGroup.open();
		envReflectionGroup.add(controls, 'isenvMap').onChange(function(str6) {
			if (str6) {
				material.envMap = envMap;
			} else {
				material.envMap = null;
			}
			material.needsUpdate = true;
		});
		//matGroup.addColor(controls, 'color1');
		envReflectionGroup.add(controls, 'envMapIntensity', -5, 5).onChange(function(str7) {
			material.envMapIntensity = str7;
		});
	}
	//投影类
	var ShadowGroup = matGroup.addFolder('Shadow'); {
		//ShadowGroup.open();
		ShadowGroup.add(controls, 'castShadow').onChange(function(str) {
			mesh.castShadow = str; //开启投影			
			material.needsUpdate = true;

		});
		ShadowGroup.add(controls, 'receiveShadow').onChange(function(str) {
			mesh.receiveShadow = str; //接收阴影		
			material.needsUpdate = true;

		});
	}
	//自发光组 Self-luminous
	var SelfGroup = matGroup.addFolder('SelfLuminous'); {
		//	SelfGroup.open();
		SelfGroup.addColor(controls, 'emissive').onChange(function(str) {
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
		SelfGroup.add(controls, 'emissiveIntensity', 0, 1, 0.1).onChange(function(str) {
			material.emissiveIntensity = str;
			material.needsUpdate = true;
		});
	}
	//发光组
	/*
	var GlowGroup = matGroup.addFolder('Glow');
	{	
		//克隆物体
		var cloneObj ;
		var group;
		GlowGroup.add(controls, 'isGlow').onChange(function(str7) {
		
			if(str7)
			{	
				group=new THREE.Group();		
			    cloneObj = pickObj.clone();				
				cloneObj.scale.set(1.01, 1.01, 1.01);
				cloneObj.visible = true;
				cloneObj.parent=pickObj;
				cloneObj.position.set(0,0,0);				
				cloneObj.rotation.set(pickObj.rotation.x,pickObj.rotation.y,pickObj.rotation.z);
				group.add(cloneObj);
				scene.add(group);			
			}
			else
			{				
				scene.remove(group);				
			}
			
		});
		GlowGroup.add(controls, 'innerOrOutGlow').onChange(function(str7) {
		
			if(str7)
			{
				var cloneearthMaterial = createShader();
				cloneObj.material = cloneearthMaterial;
				
			}
			else
			{
				var cloneearthMaterial = createShader();
				cloneObj.material = cloneearthMaterial;
				
				
			}
			
		});
		
	}
	*/
	matGroup.add(controls, 'ok');
	matGroup.add(controls, 'cancle');
	matGroup.open();
}


var content;
var data_save;
//var aa = [];
var FizzyText = function() {
	//	this.message = message;
	this.Save = function() {
		//var bbb = {
		//		LightIntensity: plight1.intensity,				
		//	}
		//Ly_data.push(bbb);
		//数据保存类
		Ly_content.Property = Ly_data;
		Ly_content.Distance = xinzangModel.scene.scale.x;
		Ly_content.Rotate = xinzangModel.scene.rotation.y;
		Ly_content.LightIntensity = plight1.intensity;
		Ly_content.X = xinzangModel.scene.position.x;
		Ly_content.Y = xinzangModel.scene.position.y;
		Ly_content.Z = xinzangModel.scene.position.z;
		//Ly_content = JSON.stringify(Ly_data);
		//content = content + '\n' + JSON.stringify(data_save);
		var blob = new Blob([JSON.stringify(Ly_content)], {
			type: "text/plain;charset=utf-8"
		});
		//下载json
		saveAs(blob, "properties.json");
	}
	this.isPlay = isPlay;
	//	var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
	//	saveAs(blob, "Save"); 
	this.color1 = "#ffae23";

	this.Read = function() {
		ReadJson();
	}

	//this.scale=xinzangModel.scene.children[0].scale.x;
	//console.log(Ly_Model);
	//LY_灯光
	this.LightIntensity = plight1.intensity;
	//LY_相机
	//this.PositionX=camera.position.x.get();
	//this.PositionY=camera.position.y.get();
	//this.PositionZ=camera.position.z.get();
	//this.List="a";
	//this.OperateModel=function(){};
	this.Next = function() {};
	this.Up = function() {};
	//动画的名称
	this.animateName = "";
	//是否开启骨骼选择
	this.isChangeBone = true;
	//控制物体显示
	this.visible = true;
	//控制物体大小
	this.distance = 1;
	//控制物体旋转
	this.rotationY = 0; //xinzangModel.scene.rotation.y;
	this.X = 0;
	this.Y = 0;
	this.Z = 0;
};
var text;
var texture;
var isOpenGUI = false;
//全局操作面板
window.onload = function() {
	//if(isOpenGUI)
	{
		text = new FizzyText();
		var gui1 = new dat.GUI();
		gui1.add(text, 'Save');

		gui1.add(text, 'Read');
		//模型操作组

		var operatemodelGroup = gui1.addFolder('OperateModel');

		var SingleMatGroup = operatemodelGroup.addFolder("Materialoperate");
		SingleMatGroup.add(this.text, 'Next').onChange(function() {
			if (pickObj == null) {
				return;
			}
			if (matIndex < pickObj.material.length - 1) {
				matIndex++;
				UseGUI(pickObj, matIndex);

				//console.log(pickObj.material[matIndex]);
			}

		});
		SingleMatGroup.add(this.text, 'Up').onChange(function() {
			if (pickObj == null) {
				return;
			}
			if (matIndex > 0) {
				matIndex--;
				UseGUI(pickObj, matIndex);

				console.log(pickObj.material[matIndex]);
			}

		});
		//operatemodelGroup.open();
		{
			//是否打卡骨骼控制器
			operatemodelGroup.add(text, 'isChangeBone').onChange(function(str) {
				if (str) {
					//console.log(xinzangModel.scene);
					// meshHelper = new THREE.SkeletonHelper(xinzangModel.scene);
					scene.add(meshHelper);

				} else {
					// meshHelper = new THREE.SkeletonHelper(xinzangModel.scene);
					scene.remove(meshHelper);
				}

			});
			//显示隐藏物体
			operatemodelGroup.add(text, 'visible').onChange(function(str) {
				// aa[operateModelIndex].visible=str;
				pickObj.visible = str;
				//  console.log(aa[operateModelIndex].visible);
			});
			operatemodelGroup.add(text, 'Next').onChange(function() {
				if (aa.length > 0) {
					//	console.log(1);
					operateModelIndex++;
					if (operateModelIndex < aa.length) {
						selectedObjectChanged(aa[operateModelIndex]);
						UseGUI(aa[operateModelIndex]);
						pickObj = aa[operateModelIndex];
						//operateModelIndex++;
					} else {
						operateModelIndex--;
						selectedObjectChanged(aa[operateModelIndex]);
						UseGUI(aa[operateModelIndex]);
						pickObj = aa[operateModelIndex];
					}
				}
				//	console.log(-1);
			});
			operatemodelGroup.add(text, 'Up').onChange(function() {
				if (aa.length > 0) {
					operateModelIndex--;
					if (operateModelIndex >= 0) {
						//	console.log(2);
						selectedObjectChanged(aa[operateModelIndex]);
						UseGUI(aa[operateModelIndex]);
						pickObj = aa[operateModelIndex];
						//operateModelIndex++;
					} else {
						operateModelIndex++;
						selectedObjectChanged(aa[operateModelIndex]);
						UseGUI(aa[operateModelIndex]);
						pickObj = aa[operateModelIndex];
					}

				}
				//	console.log(-2);
			});
		}
	}
	//场景操作组
	var matGroup = gui1.addFolder('SceneOperate');
	//matGroup.open();
	{

		var cameraGroup = matGroup.addFolder('Camera');
		//cameraGroup.open();
		{
			cameraGroup.add(this.text, 'distance', 0.1, 10, 0.1).onChange(function(str) {
				xinzangModel.scene.scale.x = str;
				xinzangModel.scene.scale.y = str;
				xinzangModel.scene.scale.z = str;
			});
			cameraGroup.add(text, 'rotationY', 0, 6.5, 0.05).onChange(function(str) {
				xinzangModel.scene.rotation.y = str;
			});
			var positionGroup = cameraGroup.addFolder('Position'); {
				positionGroup.add(this.text, 'X', 0.1, 10, 0.1).onChange(function(str) {
					//xinzangModel.scene.scale.x = str
					xinzangModel.scene.position.x = str;
				});
				positionGroup.add(this.text, 'Y', 0.1, 10, 0.1).onChange(function(str) {
					//xinzangModel.scene.scale.x = str
					xinzangModel.scene.position.y = str;
				});
				positionGroup.add(this.text, 'Y', 0.1, 10, 0.1).onChange(function(str) {
					//xinzangModel.scene.scale.x = str
					xinzangModel.scene.position.z = str;
				});
			}
		}
		//动画类
		//切换动画
		var AnimationGroup = matGroup.addFolder('Animations'); {
			AnimationGroup.add(text, 'animateName');
			AnimationGroup.add(text, 'isPlay').onChange(function(str) {
				isPlay = str;
			});

			AnimationGroup.add(text, 'Next').onChange(function() {
				//console.log(AnimtionsList.length);
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
			AnimationGroup.add(text, 'Up').onChange(function() {
				if (AnimationIndex > 0) {
					AnimationIndex -= 1;
				}
				//	console.log(AnimationIndex);
				if (AnimtionsList[AnimationIndex] != null) {
					IdleManager.stop();
					IdleManager = mixer.clipAction(AnimtionsList[AnimationIndex]);

					IdleManager.play();
				}
			});
		}


		//LY_灯光强度调整
		matGroup.add(text, 'LightIntensity', 0, 10).onChange(function(str1) {
			plight1.intensity = str1;

		});
	}

}

function Find_Mesh_Recursive(objParet, findName) {
	//  console.log(findName);
	for (var i = 0; i < objParet.length; i++) {
		for (var j = 0; j < objParet[i].children.length; j++) {
			if (objParet[i].children[j].name == findName) {
				console.log(objParet[i].children[j].name);
				return objParet[i].children[j];
			}

		}
		return Find_Mesh_Recursive(objParet[i].children, findName)
	}

}

/*//自定义shader的读取
function ReadJson() {
	$.getJSON("js/Save", function (_data) {	//console.log(xinzangModel.scene.children[0].children[0].children[0].children[2]);
		//	console.log(_data.material);
		//	var matt= THREE.ShaderMaterial.parse(JSON.parse(_data.material));
		//xinzangModel.scene.children[0].children[0].children[0].children[2].material=matt;
		//	console.log(xinzangModel.scene.children[0].children[0].children[0].children[2]);
		vShader = _data.vertexShader.join('\n');

		fShader = _data.fragmentShader.join('\n');

		var aameshMaterial = new THREE.ShaderMaterial({
			uniforms: {
				coeficient: {
					type: "f",
					value: 1.0
				},
				power: {
					type: "f",
					value: 2
				},
				glowColor: {
					type: "c",
					value: new THREE.Color('#2BFFFF')
				}
			},
			vertexShader: vShader,
			fragmentShader: fShader,
			blending: THREE.NormalBlending,
			transparent: true

		});
		//xinzangModel.scene.children[0].children[0].children[0].children[2].material=aameshMaterial;

	});
}*/
/*
//加载tga贴图
function LoadTGA(tgaName) {
	var tgaLoader = new THREE.TGALoader();
	tgaTexture = tgaLoader.load('model/GLTFModel/' + tgaName + '.tga', function (tgaTexture) {
		console.log("加载tga" + 'model/GLTFModel/' + tgaName + '.tga');
		if (choseMesh != null) {
			choseMesh.material.map = tgaTexture;
		} else {
			alert("请选择相应模型");
		}
	}, undefined, function (e) {
		console.error(e);
		alert("未找到该图片");
		return;
	});
	console.log(tgaTexture);
}
*/
//json解析
function ReadJson() {
	$.getJSON("model/properties.json", function(_jsondata) {
		if (_jsondata != null) {
			//console.log(_jsondata);	
			//场景大小
			xinzangModel.scene.scale.x = _jsondata.Distance;
			//旋转
			xinzangModel.scene.rotation.y = _jsondata.Rotate;
			//灯光强度
			plight1.intensity = _jsondata.LightIntensity;
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
											//读取材质属性
											ReadMaterial(_jsondata.Property[i], child.material[j], child);
										}
									}
								}
								//模型只有一个材质
								else {
									//console.log(3333);
									//读取材质属性
									ReadMaterial(_jsondata.Property[i], child.material, child);
								}
							}
						}
					});
				}
			}
		}
	});
}
//读取材质属性
function ReadMaterial(_jsondata, material, mesh) {
	//	console.log(5555);
	//2.金属度
	material.metalness=_jsondata.metalness;
	//3、平滑度
	//roughness: material.roughness,
	material.roughness = _jsondata.roughness;
	material.needsUpdate=true;
	//4、法线值
	//normalScale: material.normalScale,
	if (material.normalMap != null) {
		if (_jsondata.normalScale != undefined) {
			material.normalScale = _jsondata.normalScale;
		}
	}
	//5、普通贴图路径
	//jpgPngTexture: material.jpgPngTexture,
	if (_jsondata.jpgPngTexture != undefined) {
		var commonTexture = new THREE.TextureLoader().load(_jsondata.jpgPngTexture);
		material.map = commonTexture;
	}
	//6、texture贴图路径
	//tgaTexture: material.tgaTexture,
	if (_jsondata.tgaTexture != undefined) {
		var commonTexture = new THREE.TextureLoader().load(_jsondata.tgaTexture);
		material.map = commonTexture;
	}
	//7、是否透明				
	//transparent: material.transparent,
	material.transparent = _jsondata.transparent;
	//8、透明值	
	//opacity: material.opacity,
	material.opacity = _jsondata.opacity;
	//9、透明显示值
	//alphacutoff: material.alphaTest,
	material.alphaTest = _jsondata.alphacutoff;
	//10、是否纯色thisthis
	//solidColor: this.solidColor,
	var solidColor = _jsondata.solidColor;
	//11、透明颜色
	//transparentColor: material.transparentColor,
	if (solidColor) {
		material.transparentColor = _jsondata.transparentColor;
	}
	//12、环境反射
	//isenvMap: this.isenvMap,
	if (_jsondata.isenvMap) {
		material.envMap = envMap;
		//13、环境反射强度
		//envMapIntensity: material.envMapIntensity,
		material.envMapIntensity = _jsondata.envMapIntensity;

	} else {
		material.envMap = null;
	}

	//14、投影
	//castShadow: mesh.castShadow,	
	mesh.castShadow = _jsondata.castShadow;
	//15、接收阴影
	//receiveShadow: mesh.receiveShadow,
	mesh.receiveShadow = _jsondata.receiveShadow;
	//16、自发光颜色
	//emissive: material.emissive,
	material.emissive.setRGB(parseFloat (_jsondata.emissive.split(',')[0]),parseFloat(_jsondata.emissive.split(',')[1]),parseFloat(_jsondata.emissive.split(',')[2])) ;
	console.log(material.emissive);
	//17、自发光强度
	//emissiveIntensity: material.emissiveIntensity,
	//material.emissive = _jsondata.emissiveIntensity;
	material.needsUpdate=true;

}
//递归选择所有物体的列表
function controlObj_Recursive() {
	if (xinzangModel != null) {
		var objParet = xinzangModel.scene;
		objParet.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				//console.log(child);	
				//aa.push("'"+child.name+"'");
				aa.push(child);
			}
		});
		//	console.log(aa);
	}
	//	for(var i=0;i<aa.length;i++)
	//{console.log(aa[i]);}

}
/*
//组合键监听事件
//空格 32  enter 13  tab 9  esc 27  backspace 8  shift 16 control 17 alt 18 caps lock 20
document.onkeydown = function(e) {
            var keyCode = e.keyCode || e.which || e.charCode;
            var ctrKey = e.ctrlKey ;
			var shift=e.shiftKey;          
		 //  console.log(keyCode);
			 if(ctrKey&&shift&& keyCode ==67)
			{
				isOpenGUI=true;
                alert("组合键成功")
				//aaaaaaa();
            }
           e.preventDefault();
            return false;
        }
		
*/
