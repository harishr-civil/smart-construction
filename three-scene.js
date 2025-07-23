import * as THREE from 'https://cdn.skypack.dev/three@0.148.0';
import { gsap } from 'https://cdn.skypack.dev/gsap';

class ConstructionScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.elements = {
      ground: null,
      footings: [],
      gradeBeams: [],
      floorSlabs: [],
      walls: [],
      doors: [],
      windows: [],
      roof: null,
      machines: [],
      sky: null
      
    };

    this.textureLoader = new THREE.TextureLoader();
    this.setupLights();
    this.setupSky();
    this.setupEventListeners();
    this.animate();
    
    
        // Camera control variables
        this.cameraState = {
          target: new THREE.Vector3(0, 0, 0),
          distance: 15,
          minDistance: 5,
          maxDistance: 50,
          panSpeed: 0.5,
          zoomSpeed: 0.5
        };
    
        // Mouse/touch state
        this.pointerState = {
          isDragging: false,
          prevX: 0,
          prevY: 0
        };
    
        this.setupControls();
      }
    
      setupControls() {
        // Mouse/touch event listeners
        this.canvas.addEventListener('mousedown', this.onPointerDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onPointerUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onPointerUp.bind(this));
        this.canvas.addEventListener('wheel', this.onMouseWheel.bind(this));
    
        // Touch support
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
      }
    
      // Mouse event handlers
      onPointerDown(event) {
        this.pointerState.isDragging = true;
        this.pointerState.prevX = event.clientX;
        this.pointerState.prevY = event.clientY;
      }
    
      onPointerMove(event) {
        if (!this.pointerState.isDragging) return;
        
        const dx = event.clientX - this.pointerState.prevX;
        const dy = event.clientY - this.pointerState.prevY;
        
        // Pan the camera
        const panX = -dx * this.cameraState.panSpeed * 0.01;
        const panY = dy * this.cameraState.panSpeed * 0.01;
        
        this.camera.position.x += panX;
        this.camera.position.z += panY;
        this.cameraState.target.x += panX;
        this.cameraState.target.z += panY;
        
        this.pointerState.prevX = event.clientX;
        this.pointerState.prevY = event.clientY;
        
        this.camera.lookAt(this.cameraState.target);
      }
    
      onPointerUp() {
        this.pointerState.isDragging = false;
      }
    
      // Mouse wheel zoom
      onMouseWheel(event) {
        event.preventDefault();
        const delta = Math.sign(event.deltaY);
        this.zoomCamera(delta);
      }
    
      // Touch event handlers
      onTouchStart(event) {
        if (event.touches.length === 1) {
          this.pointerState.isDragging = true;
          this.pointerState.prevX = event.touches[0].clientX;
          this.pointerState.prevY = event.touches[0].clientY;
        }
      }
    
      onTouchMove(event) {
        if (!this.pointerState.isDragging || event.touches.length !== 1) return;
        
        const dx = event.touches[0].clientX - this.pointerState.prevX;
        const dy = event.touches[0].clientY - this.pointerState.prevY;
        
        // Pan the camera
        const panX = -dx * this.cameraState.panSpeed * 0.02;
        const panY = dy * this.cameraState.panSpeed * 0.02;
        
        this.camera.position.x += panX;
        this.camera.position.z += panY;
        this.cameraState.target.x += panX;
        this.cameraState.target.z += panY;
        
        this.pointerState.prevX = event.touches[0].clientX;
        this.pointerState.prevY = event.touches[0].clientY;
        
        this.camera.lookAt(this.cameraState.target);
      }
    
      onTouchEnd() {
        this.pointerState.isDragging = false;
      }
    
      // Zoom functionality
      zoomCamera(delta) {
        // Calculate new distance
        let newDistance = this.cameraState.distance + (delta * this.cameraState.zoomSpeed);
        
        // Clamp the distance
        newDistance = Math.max(
          this.cameraState.minDistance,
          Math.min(this.cameraState.maxDistance, newDistance)
        );
        
        // Only update if changed
        if (newDistance !== this.cameraState.distance) {
          this.cameraState.distance = newDistance;
          
          // Smooth zoom animation
          gsap.to(this.camera.position, {
            x: this.cameraState.target.x + (this.camera.position.x - this.cameraState.target.x) * (newDistance / this.cameraState.distance),
            y: this.cameraState.target.y + (this.camera.position.y - this.cameraState.target.y) * (newDistance / this.cameraState.distance),
            z: this.cameraState.target.z + (this.camera.position.z - this.cameraState.target.z) * (newDistance / this.cameraState.distance),
            duration: 0.3,
            ease: "power2.out",
            onUpdate: () => {
              this.camera.lookAt(this.cameraState.target);
            }
          });
        }
      }
    
      // Update positionCamera to use the target system
      positionCamera(height, floors) {
        const width = 6 + (floors * 0.5);
        this.camera.position.set(width * 2, height * 1.5, width * 2);
        this.cameraState.target.set(0, height / 2, 0);
        this.cameraState.distance = this.camera.position.distanceTo(this.cameraState.target);
        this.camera.lookAt(this.cameraState.target);
      }
    
      

  setupLights() {
    // Warmer ambient light
    const ambient = new THREE.AmbientLight(0xF5F5DC, 0.6); // Soft beige ambient
    this.scene.add(ambient);

    // Main directional light (sun)
    const directional = new THREE.DirectionalLight(0xFFF4E5, 1.2); // Warm white
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    directional.shadow.mapSize.set(2048, 2048);
    
    // Add subtle shadow softening
    directional.shadow.radius = 2;
    directional.shadow.bias = -0.001;
    
    this.scene.add(directional);

    // Fill light to reduce harsh shadows
    const fillLight = new THREE.DirectionalLight(0xE0F7FA, 0.4);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);
  }

  setupSky() {
   // If you need immediate color change:
this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }


  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
    
  }

  initConstruction(height = 3, floors = 1) {
    const planImage = document.getElementById('plan-overlay');
  if (planImage) planImage.style.display = 'block';

  // Existing construction code
  this.clearScene();
  this.createSite();
  this.createFoundation(height, floors);
    this.clearScene();
    this.createSite();
    this.createFoundation(height, floors);
    this.createStructure(height, floors);
    this.addDoorsAndWindows(height, floors);
    this.addConstructionMachines(height, floors);
    this.positionCamera(height, floors);

    setTimeout(() => this.animateConstruction(), 500);
  }

  clearScene() {
    for (const key in this.elements) {
      const obj = this.elements[key];
      if (Array.isArray(obj)) {
        obj.forEach(mesh => this.scene.remove(mesh));
        obj.length = 0;
      } else if (obj) {
        this.scene.remove(obj);
        this.elements[key] = null;
      }
    }
    this.setupSky(); // Re-add sky after clearing
    
  }

  createSite() {
    const tex = this.textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(25, 25);

    const mat = new THREE.MeshStandardMaterial({ map: tex });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = 0;
    this.scene.add(ground);
    this.elements.ground = ground;
  }

  createFoundation(height, floors) {
    const size = 6 + floors * 0.5;
    const layout = this.calculateFootingLayout({ width: size, depth: size });

    const mat = new THREE.MeshStandardMaterial({ color: 0x777777 });

    layout.pads.forEach(pos => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16), mat);
      pad.position.set(pos.x, -0.25, pos.z);
      pad.castShadow = true;
      pad.visible = false;
      this.scene.add(pad);
      this.elements.footings.push(pad);
    });

    layout.beams.forEach(beam => {
      const len = Math.hypot(beam.to.x - beam.from.x, beam.to.z - beam.from.z);
      const geom = new THREE.BoxGeometry(len, 0.3, 0.3);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set((beam.from.x + beam.to.x) / 2, 0, (beam.from.z + beam.to.z) / 2);
      mesh.rotation.y = -Math.atan2(beam.to.z - beam.from.z, beam.to.x - beam.from.x);
      mesh.castShadow = true;
      mesh.visible = false;
      this.scene.add(mesh);
      this.elements.gradeBeams.push(mesh);
    });
  }

  createStructure(height, floors) {
    const width = 6 + floors * 0.5;
    const depth = 6 + floors * 0.5;
    const floorHeight = height / floors;

    const brickTex = this.textureLoader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
    brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping;
    brickTex.repeat.set(2, 2);
    const brickMat = new THREE.MeshStandardMaterial({ map: brickTex });

    for (let i = 0; i < floors; i++) {
      const y = i * floorHeight + floorHeight / 2;

      const walls = [
        { size: [width, floorHeight, 0.2], pos: [0, y, depth / 2] },
        { size: [width, floorHeight, 0.2], pos: [0, y, -depth / 2] },
        { size: [0.2, floorHeight, depth], pos: [-width / 2, y, 0] },
        { size: [0.2, floorHeight, depth], pos: [width / 2, y, 0] },
      ];

      walls.forEach(({ size, pos }) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(...size), brickMat);
        wall.position.set(...pos);
        wall.castShadow = true;
        wall.visible = false;
        this.scene.add(wall);
        this.elements.walls.push(wall);
      });

      const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, depth), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
      slab.position.set(0, i * floorHeight, 0);
      slab.receiveShadow = true;
      slab.visible = false;
      this.scene.add(slab);
      this.elements.floorSlabs.push(slab);
    }

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(width * 0.7, 2, 4),
      new THREE.MeshStandardMaterial({ color: 0x996633 })
    );
    roof.position.set(0, height + 1, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.visible = false;
    this.scene.add(roof);
    this.elements.roof = roof;
  }

  addDoorsAndWindows(height, floors) {
    const floorHeight = height / floors;
    const width = 6 + floors * 0.5;
    const depth = 6 + floors * 0.5;
    
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Wooden door
    const windowMat = new THREE.MeshStandardMaterial({ 
      color: 0xADD8E6, 
      transparent: true, 
      opacity: 0.7 
    });

    for (let i = 0; i < floors; i++) {
      const y = i * floorHeight + floorHeight / 2;
      
      // Front door (only on ground floor)
      if (i === 0) {
        const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.05), doorMat);
        door.position.set(0, y - floorHeight/2 + 1, depth/2 + 0.1);
        door.castShadow = true;
        door.visible = false;
        this.scene.add(door);
        this.elements.doors.push(door);
        
        // Add door animation
        door.userData = {
          open: false,
          originalPos: door.position.z,
          openPos: door.position.z - 1
        };
      }
      
      // Windows on each floor
      const windowWidth = 1;
      const windowHeight = 0.8;
      
      // Front windows
      const frontWindows = [
        { x: -width/3, z: depth/2 + 0.1 },
        { x: width/3, z: depth/2 + 0.1 }
      ];
      
      frontWindows.forEach(pos => {
        const window = new THREE.Mesh(
          new THREE.BoxGeometry(windowWidth, windowHeight, 0.05), 
          windowMat
        );
        window.position.set(pos.x, y, pos.z);
        window.castShadow = true;
        window.visible = false;
        this.scene.add(window);
        this.elements.windows.push(window);
      });
      
      // Side windows
      const sideWindows = [
        { x: width/2 + 0.1, z: -depth/3 },
        { x: width/2 + 0.1, z: depth/3 },
        { x: -width/2 - 0.1, z: -depth/3 },
        { x: -width/2 - 0.1, z: depth/3 }
      ];
      
      sideWindows.forEach(pos => {
        const window = new THREE.Mesh(
          new THREE.BoxGeometry(windowHeight, windowWidth, 0.05), 
          windowMat
        );
        window.position.set(pos.x, y, pos.z);
        window.rotation.y = Math.PI/2;
        window.castShadow = true;
        window.visible = false;
        this.scene.add(window);
        this.elements.windows.push(window);
      });
    }
  }

  addConstructionMachines(height, floors) {
    const width = 6 + floors * 0.5;
    
    // Crane
    const craneBase = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xFF0000 })
    );
    craneBase.position.set(width + 3, 0.5, -width - 3);
    craneBase.castShadow = true;
    this.scene.add(craneBase);
    this.elements.machines.push(craneBase);
    
    const craneTower = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, height * 1.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xCCCCCC })
    );
    craneTower.position.set(width + 3, height * 0.75, -width - 3);
    craneTower.castShadow = true;
    this.scene.add(craneTower);
    this.elements.machines.push(craneTower);
    
    const craneArm = new THREE.Mesh(
      new THREE.BoxGeometry(width * 1.5, 0.2, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    craneArm.position.set(width + 3 - width * 0.75, height * 1.5 - 0.5, -width - 3);
    craneArm.castShadow = true;
    this.scene.add(craneArm);
    this.elements.machines.push(craneArm);
    
    // Cement mixer
    const mixerBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.5, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    mixerBase.position.set(-width - 3, 0.25, width + 3);
    mixerBase.castShadow = true;
    this.scene.add(mixerBase);
    this.elements.machines.push(mixerBase);
    
    const mixerDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x999999 })
    );
    mixerDrum.position.set(-width - 3, 1.25, width + 3);
    mixerDrum.rotation.z = Math.PI/4;
    mixerDrum.castShadow = true;
    this.scene.add(mixerDrum);
    this.elements.machines.push(mixerDrum);
    
    // Animate the mixer drum
    mixerDrum.userData = { rotationSpeed: 0.01 };
    
    // Excavator
    const excavatorBase = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 3),
      new THREE.MeshStandardMaterial({ color: 0x3366CC })
    );
    excavatorBase.position.set(width + 5, 0.4, width + 5);
    excavatorBase.castShadow = true;
    this.scene.add(excavatorBase);
    this.elements.machines.push(excavatorBase);
    
    const excavatorArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    excavatorArm.position.set(width + 5, 1, width + 5 + 1);
    excavatorArm.castShadow = true;
    this.scene.add(excavatorArm);
    this.elements.machines.push(excavatorArm);
    
    const excavatorBucket = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.4, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x777777 })
    );
    excavatorBucket.position.set(width + 5, 1, width + 5 + 2.5);
    excavatorBucket.castShadow = true;
    this.scene.add(excavatorBucket);
    this.elements.machines.push(excavatorBucket);
    
    // Animate the excavator
    excavatorArm.userData = { angle: 0, direction: 1 };
    excavatorBucket.userData = { angle: 0 };
  }

  calculateFootingLayout(size) {
    const pads = [], beams = [];
    const spacing = 3;
    const xCount = Math.max(2, Math.ceil(size.width / spacing));
    const zCount = Math.max(2, Math.ceil(size.depth / spacing));
    for (let x = 0; x < xCount; x++) {
      for (let z = 0; z < zCount; z++) {
        const px = -size.width / 2 + (x * size.width / (xCount - 1));
        const pz = -size.depth / 2 + (z * size.depth / (zCount - 1));
        pads.push({ x: px, z: pz });
        if (x > 0) beams.push({ from: { x: px, z: pz }, to: { x: px - spacing, z: pz } });
        if (z > 0) beams.push({ from: { x: px, z: pz }, to: { x: px, z: pz - spacing } });
      }
    }
    return { pads, beams };
  }

  positionCamera(height, floors) {
    const width = 6 + (floors * 0.5);
    this.camera.position.set(width * 2, height * 1.5, width * 2);
    this.camera.lookAt(0, height / 2, 0);
  }

  animateConstruction() {
    const tl = gsap.timeline();

    tl.to(this.elements.ground.position, { y: -0.5, duration: 0.5, ease: "power1.inOut" })
      .to(this.elements.ground.position, { y: 0, duration: 0.5, ease: "power1.inOut" });

    this.elements.footings.forEach(f => {
      f.scale.set(1, 0.01, 1);
      tl.to(f.scale, {
        y: 1,
        duration: 0.3,
        ease: "bounce.out",
        onStart: () => f.visible = true
      }, '+=0.2');
    });

    this.elements.gradeBeams.forEach(beam => {
      beam.scale.set(0.01, 1, 1);
      tl.to(beam.scale, {
        x: 1,
        duration: 0.3,
        ease: "power1.out",
        onStart: () => beam.visible = true
      }, '+=0.1');
    });

    this.elements.floorSlabs.forEach(slab => {
      slab.scale.set(1, 0.01, 1);
      tl.to(slab.scale, {
        y: 1,
        duration: 0.4,
        ease: "power2.out",
        onStart: () => slab.visible = true
      }, '+=0.2');
    });

    this.elements.walls.forEach(wall => {
      wall.scale.set(1, 0.01, 1);
      tl.to(wall.scale, {
        y: 1,
        duration: 0.4,
        ease: "back.out(1.7)",
        onStart: () => wall.visible = true
      }, '+=0.1');
    });

    this.elements.windows.forEach(window => {
      window.scale.set(1, 0.01, 1);
      tl.to(window.scale, {
        y: 1,
        duration: 0.3,
        ease: "power2.out",
        onStart: () => window.visible = true
      }, '+=0.1');
    });

    this.elements.doors.forEach(door => {
      door.scale.set(1, 0.01, 1);
      tl.to(door.scale, {
        y: 1,
        duration: 0.4,
        ease: "back.out(1.7)",
        onStart: () => door.visible = true,
        onComplete: () => this.animateDoor(door)
      }, '+=0.1');
    });

    if (this.elements.roof) {
      this.elements.roof.scale.set(0.01, 0.01, 0.01);
      tl.to(this.elements.roof.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.7,
        ease: "elastic.out(1, 0.5)",
        onStart: () => this.elements.roof.visible = true
      }, '+=0.2');
    }

    // Animate machines
    this.animateMachines();
  }

  animateDoor(door) {
    // Toggle door open/close every 3 seconds
    setInterval(() => {
      const targetZ = door.userData.open ? door.userData.originalPos : door.userData.openPos;
      gsap.to(door.position, {
        z: targetZ,
        duration: 1,
        ease: "power2.inOut"
      });
      door.userData.open = !door.userData.open;
    }, 3000);
  }

  animateMachines() {
    // Animate the cement mixer drum
    const mixer = this.elements.machines.find(m => m.geometry.type === 'CylinderGeometry');
    if (mixer) {
      const animateMixer = () => {
        mixer.rotation.x += mixer.userData.rotationSpeed;
        requestAnimationFrame(animateMixer);
      };
      animateMixer();
    }
    
    // Animate the excavator
    const excavatorArm = this.elements.machines.find(m => 
      m.geometry.type === 'BoxGeometry' && 
      m.position.y === 1 && 
      Math.abs(m.position.x) > 5
    );
    
    const excavatorBucket = this.elements.machines.find(m => 
      m.geometry.type === 'BoxGeometry' && 
      m.position.y === 1 && 
      Math.abs(m.position.z) > 7.5
    );
    
    if (excavatorArm && excavatorBucket) {
      const animateExcavator = () => {
        excavatorArm.userData.angle += 0.005 * excavatorArm.userData.direction;
        excavatorBucket.userData.angle += 0.01 * excavatorArm.userData.direction;
        
        if (excavatorArm.userData.angle > 0.5 || excavatorArm.userData.angle < -0.5) {
          excavatorArm.userData.direction *= -1;
        }
        
        excavatorArm.rotation.x = excavatorArm.userData.angle;
        excavatorBucket.rotation.x = excavatorBucket.userData.angle;
        
        requestAnimationFrame(animateExcavator);
      };
      animateExcavator();
    }
  }
}

if (document.getElementById('three-canvas')) {
  const canvas = document.getElementById('three-canvas');
  window.constructionScene = new ConstructionScene(canvas);
}


export { ConstructionScene };
