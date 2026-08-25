/**
 * court3d.js - High-Performance 3D Badminton Arena Background
 * Optimized for silky-smooth 60 FPS playback on all mobile devices and desktops.
 */

window.initCourt3D = function() {
    if (typeof THREE === 'undefined') {
        console.warn('Three.js library is not available.');
        return;
    }

    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    // Detect mobile device for GPU performance optimization
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth < 768);

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    if (!isMobile) {
        scene.fog = new THREE.FogExp2(0x070a12, 0.01);
    }

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 800);
    
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: !isMobile, // Disable MSAA on mobile for huge FPS boost
        alpha: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
    
    // Disable shadow maps on mobile to save GPU cycles
    renderer.shadowMap.enabled = !isMobile;
    if (!isMobile) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 0.85);
    mainSun.position.set(25, 45, 25);
    if (!isMobile) {
        mainSun.castShadow = true;
        mainSun.shadow.mapSize.width = 1024;
        mainSun.shadow.mapSize.height = 1024;
    }
    scene.add(mainSun);

    // 3. Gymnasium Hall Dimensions (75m x 75m x 20m high)
    const hallW = 75;
    const hallL = 75;
    const hallH = 20;

    // Polished Wooden Floor
    const floorGeo = new THREE.PlaneGeometry(hallW, hallL);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x18110a, roughness: 0.5, metalness: 0.05 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Arena Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(hallW, hallH), wallMat);
    backWall.position.set(0, hallH / 2, -hallL / 2);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(hallL, hallH), wallMat);
    leftWall.position.set(-hallW / 2, hallH / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(hallL, hallH), wallMat);
    rightWall.position.set(hallW / 2, hallH / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // Decorative Banner
    const bannerGeo = new THREE.PlaneGeometry(hallW, 2.5);
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 7.5, -hallL / 2 + 0.1);
    scene.add(banner);

    // Roof & Steel Trusses
    const ceilingGeo = new THREE.PlaneGeometry(hallW, hallL);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x070a10, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = hallH;
    scene.add(ceiling);

    const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    for (let z = -hallL / 2 + 12; z <= hallL / 2 - 12; z += 16) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(hallW, 0.4, 0.4), trussMat);
        beam.position.set(0, hallH - 1.2, z);
        scene.add(beam);
    }

    // 4. Stepped Spectator Grandstands (Optimized for Mobile)
    const crowdMembers = [];
    const shirtColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0xffffff, 0x06b6d4];

    function buildSteppedStadium(sideX, lengthZ) {
        const standGroup = new THREE.Group();
        const numTiers = isMobile ? 5 : 7; // Fewer tiers on mobile for performance
        const stepDepth = 1.2;
        const stepHeight = 0.9;

        const bleacherMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
        const bodyGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.5, 6);
        const headGeo = new THREE.SphereGeometry(0.14, 6, 6);
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });

        for (let t = 0; t < numTiers; t++) {
            const tierMesh = new THREE.Mesh(
                new THREE.BoxGeometry(stepDepth, stepHeight * (t + 1), lengthZ),
                bleacherMat
            );
            const tierX = sideX > 0 ? t * stepDepth + stepDepth / 2 : -(t * stepDepth + stepDepth / 2);
            tierMesh.position.set(tierX, (stepHeight * (t + 1)) / 2, 0);
            standGroup.add(tierMesh);

            const numSeats = isMobile ? 14 : 22;
            const zStep = lengthZ / numSeats;
            
            for (let s = 0; s < numSeats; s++) {
                const zPos = -lengthZ / 2 + s * zStep + zStep / 2;
                const spectator = new THREE.Group();

                const color = shirtColors[Math.floor(Math.random() * shirtColors.length)];
                const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 }));
                body.position.y = 0.25;
                spectator.add(body);

                const head = new THREE.Mesh(headGeo, skinMat);
                head.position.y = 0.6;
                spectator.add(head);

                spectator.position.set(tierX, (t + 1) * stepHeight + 0.1, zPos);
                spectator.rotation.y = sideX > 0 ? -Math.PI / 2 : Math.PI / 2;

                standGroup.add(spectator);

                crowdMembers.push({
                    group: spectator,
                    baseY: spectator.position.y,
                    animOffset: Math.random() * Math.PI * 2,
                    animSpeed: 2.0 + Math.random() * 2.5
                });
            }
        }

        const startX = sideX > 0 ? (hallW / 2 - (numTiers * stepDepth)) : -(hallW / 2 - (numTiers * stepDepth));
        standGroup.position.x = startX;
        scene.add(standGroup);
    }

    buildSteppedStadium(26, 58);
    buildSteppedStadium(-26, 58);

    // 5. Badminton Courts & Players
    const courtWidth = 6.8;
    const courtLength = 13.4;

    const lineCanvas = document.createElement('canvas');
    lineCanvas.width = 256; lineCanvas.height = 512;
    const ctx = lineCanvas.getContext('2d');
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 256 - 40, 512 - 40);
    ctx.beginPath(); ctx.moveTo(128, 20); ctx.lineTo(128, 512 - 20); ctx.stroke();
    const lineTex = new THREE.CanvasTexture(lineCanvas);

    const courtMat = new THREE.MeshStandardMaterial({ color: 0x0d8249, roughness: 0.4 });
    const lineMat = new THREE.MeshStandardMaterial({ map: lineTex, transparent: true, roughness: 0.3 });
    const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });

    function createPlayerFigure(jerseyColor) {
        const pGroup = new THREE.Group();
        const jerseyMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.4 });
        
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.7, 8), jerseyMat);
        torso.position.y = 0.8;
        pGroup.add(torso);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
        head.position.y = 1.3;
        pGroup.add(head);

        const racketArm = new THREE.Group();
        racketArm.position.set(0.3, 1.0, 0);
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
        handle.position.set(0.2, -0.2, 0.2);
        handle.rotation.z = Math.PI / 3;
        racketArm.add(handle);
        pGroup.add(racketArm);

        return { group: pGroup, racketArm: racketArm };
    }

    const animatedPlayers = [];
    const activeShuttlecocks = [];

    function buildCourtWithMatch(x, z, matchType, jerseyRed, jerseyBlue) {
        const courtGroup = new THREE.Group();
        courtGroup.position.set(x, 0, z);

        const mat = new THREE.Mesh(new THREE.PlaneGeometry(courtWidth + 0.8, courtLength + 0.8), courtMat);
        mat.rotation.x = -Math.PI / 2;
        mat.position.y = 0.01;
        courtGroup.add(mat);

        const lines = new THREE.Mesh(new THREE.PlaneGeometry(courtWidth + 0.8, courtLength + 0.8), lineMat);
        lines.rotation.x = -Math.PI / 2;
        lines.position.y = 0.015;
        courtGroup.add(lines);

        const netW = courtWidth + 0.3;
        const net = new THREE.Mesh(new THREE.PlaneGeometry(netW, 0.76), netMat);
        net.position.set(0, 1.17, 0);
        courtGroup.add(net);

        const spot = new THREE.SpotLight(0xffffff, isMobile ? 1.5 : 2.0);
        spot.position.set(x, hallH - 2, z);
        spot.angle = Math.PI / 3;
        spot.distance = 40;
        scene.add(spot);

        const shuttle = new THREE.Mesh(
            new THREE.ConeGeometry(0.16, 0.28, 8, 1, true),
            new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        );
        courtGroup.add(shuttle);

        if (matchType === 'singles') {
            const p1 = createPlayerFigure(jerseyRed);
            p1.group.position.set(0, 0, -3.8);
            courtGroup.add(p1.group);

            const p2 = createPlayerFigure(jerseyBlue);
            p2.group.position.set(0, 0, 3.8);
            p2.group.rotation.y = Math.PI;
            courtGroup.add(p2.group);

            animatedPlayers.push(
                { player: p1, origZ: -3.8 },
                { player: p2, origZ: 3.8 }
            );
        } else {
            const p1 = createPlayerFigure(jerseyRed);
            p1.group.position.set(-1.2, 0, -2.2);
            courtGroup.add(p1.group);

            const p2 = createPlayerFigure(jerseyBlue);
            p2.group.position.set(1.2, 0, 2.2);
            p2.group.rotation.y = Math.PI;
            courtGroup.add(p2.group);

            animatedPlayers.push(
                { player: p1, origZ: -2.2 },
                { player: p2, origZ: 2.2 }
            );
        }

        activeShuttlecocks.push({ mesh: shuttle });
        scene.add(courtGroup);
    }

    const courtSpacingX = 12.0;
    const courtSpacingZ = 19.0;

    buildCourtWithMatch(-courtSpacingX, -courtSpacingZ / 2, 'singles', 0xef4444, 0x3b82f6);
    buildCourtWithMatch(0, -courtSpacingZ / 2, 'doubles', 0x10b981, 0xf59e0b);
    buildCourtWithMatch(courtSpacingX, -courtSpacingZ / 2, 'singles', 0x8b5cf6, 0xec4899);

    buildCourtWithMatch(-courtSpacingX, courtSpacingZ / 2, 'doubles', 0x06b6d4, 0xef4444);
    buildCourtWithMatch(0, courtSpacingZ / 2, 'singles', 0x3b82f6, 0x10b981);
    buildCourtWithMatch(courtSpacingX, courtSpacingZ / 2, 'doubles', 0xf59e0b, 0x8b5cf6);

    // 6. Shimmer Particles (Reduced for Mobile)
    const particleCount = isMobile ? 80 : 250;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 55;
        posArray[i + 1] = Math.random() * 15 + 0.5;
        posArray[i + 2] = (Math.random() - 0.5) * 55;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: 0xffd700, size: 0.3, transparent: true, opacity: 0.6 }));
    scene.add(particles);

    // 7. Optimized Animation Loop with Delta Frame Throttling
    let lastTime = 0;
    const targetInterval = isMobile ? 1000 / 45 : 1000 / 60; // Smooth 45 FPS on mobile, 60 FPS on desktop

    function animate(currentTime) {
        requestAnimationFrame(animate);

        const delta = currentTime - lastTime;
        if (delta < targetInterval) return;
        lastTime = currentTime - (delta % targetInterval);

        const elapsedTime = currentTime * 0.001;

        // A. Crowd animation
        crowdMembers.forEach(c => {
            const wave = Math.sin(elapsedTime * c.animSpeed + c.animOffset);
            c.group.position.y = c.baseY + Math.max(0, wave * 0.12);
        });

        // B. Player animation
        animatedPlayers.forEach((ap, idx) => {
            const p = ap.player;
            const swingTime = elapsedTime * 3.2 + idx;
            p.group.position.x = Math.sin(swingTime * 0.8) * 1.2;
            p.racketArm.rotation.x = Math.sin(swingTime) * 0.8;
        });

        // C. Shuttlecock volleys
        activeShuttlecocks.forEach((sc, idx) => {
            const rallyTime = elapsedTime * 2.2 + idx * 1.5;
            sc.mesh.position.z = Math.sin(rallyTime) * 4.0;
            sc.mesh.position.y = 1.2 + Math.abs(Math.cos(rallyTime)) * 2.0;
        });

        // D. Smooth Camera Orbit Cutscene
        const radius = 28 + Math.sin(elapsedTime * 0.15) * 4;
        const angle = elapsedTime * 0.14;
        const camX = Math.cos(angle) * radius;
        const camZ = Math.sin(angle) * radius;
        const camY = 9.5 + Math.sin(elapsedTime * 0.2) * 3.5;

        camera.position.set(camX, camY, camZ);
        camera.lookAt(Math.sin(elapsedTime * 0.1) * 3, 2.5, Math.cos(elapsedTime * 0.1) * 3);

        particles.rotation.y = elapsedTime * 0.02;

        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    // 8. Resize Listener
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};
