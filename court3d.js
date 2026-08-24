/**
 * court3d.js - Dynamic 3D Badminton Arena Cutscene with Giant Stepped Spectator Stadiums
 * Features:
 * - 6-Court Indoor Arena with LED floodlights, steel trusses, perimeter walls
 * - High-capacity 8-tier Stepped Stadium Bleachers packed with 400+ cheering spectators
 * - 3D Badminton Players competing in Singles (1v1) and Doubles (2v2) matches with active shuttlecock volleys
 * - Infinite sweeping 360-degree camera cutscenes
 */

window.initCourt3D = function() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    scene.fog = new THREE.FogExp2(0x070a12, 0.01);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 0.95);
    mainSun.position.set(25, 45, 25);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    scene.add(mainSun);

    // 3. Gymnasium Hall Dimensions (80m x 80m x 22m high)
    const hallW = 82;
    const hallL = 82;
    const hallH = 22;

    // Polished Wooden Floor
    const floorGeo = new THREE.PlaneGeometry(hallW, hallL);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x18110a, roughness: 0.5, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
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

    // Decorative Wall Banners (คาดป้ายสนามแบดมินตัน)
    const bannerGeo = new THREE.PlaneGeometry(hallW, 3.0);
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 8.0, -hallL / 2 + 0.1);
    scene.add(banner);

    // Roof & Steel Trusses
    const ceilingGeo = new THREE.PlaneGeometry(hallW, hallL);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x070a10, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = hallH;
    scene.add(ceiling);

    const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    for (let z = -hallL / 2 + 10; z <= hallL / 2 - 10; z += 14) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(hallW, 0.4, 0.4), trussMat);
        beam.position.set(0, hallH - 1.2, z);
        scene.add(beam);
    }

    // 4. GIANT STEPPED SPECTATOR STADIUMS (อัฒจันทร์ขั้นบันไดทรงสูง 8 ชั้น นั่งกันแน่นๆ)
    const crowdMembers = [];
    const shirtColors = [
        0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899,
        0xffffff, 0x06b6d4, 0xf97316, 0x84cc16, 0x06b6d4, 0xe11d48
    ];

    function buildMassiveSteppedStadium(sideX, lengthZ) {
        const standGroup = new THREE.Group();
        const numTiers = 8; // 8-tier high stepped bleacher stairs!
        const stepDepth = 1.1;
        const stepHeight = 0.85;

        const bleacherMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4 });

        for (let t = 0; t < numTiers; t++) {
            // Stepped stair tier structure
            const tierGeo = new THREE.BoxGeometry(stepDepth, stepHeight * (t + 1), lengthZ);
            const tierMesh = new THREE.Mesh(tierGeo, bleacherMat);
            
            const tierX = sideX > 0 ? t * stepDepth + stepDepth / 2 : -(t * stepDepth + stepDepth / 2);
            const tierY = (stepHeight * (t + 1)) / 2;
            tierMesh.position.set(tierX, tierY, 0);
            standGroup.add(tierMesh);

            // Seats on this tier step
            const numSeats = 28; // 28 spectators per tier row
            const zStep = lengthZ / numSeats;
            
            for (let s = 0; s < numSeats; s++) {
                const zPos = -lengthZ / 2 + s * zStep + zStep / 2;

                // Seat Cushion
                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), seatMat);
                seat.position.set(tierX, (t + 1) * stepHeight + 0.05, zPos);
                standGroup.add(seat);

                // Spectator Figure sitting on seat
                const spectator = new THREE.Group();

                const color = shirtColors[Math.floor(Math.random() * shirtColors.length)];
                const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
                
                // Sitting Torso
                const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.55, 8), bodyMat);
                body.position.y = 0.28;
                spectator.add(body);

                // Head
                const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
                const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), headMat);
                head.position.y = 0.65;
                spectator.add(head);

                // Arms (Cheering & Waving)
                const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.38), bodyMat);
                armL.position.set(-0.22, 0.4, 0);
                armL.rotation.z = Math.PI / 3;
                spectator.add(armL);

                const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.38), bodyMat);
                armR.position.set(0.22, 0.4, 0);
                armR.rotation.z = -Math.PI / 3;
                spectator.add(armR);

                spectator.position.set(tierX, (t + 1) * stepHeight + 0.1, zPos);
                
                // Face towards court center
                spectator.rotation.y = sideX > 0 ? -Math.PI / 2 : Math.PI / 2;

                standGroup.add(spectator);

                crowdMembers.push({
                    group: spectator,
                    armL: armL,
                    armR: armR,
                    baseY: spectator.position.y,
                    animOffset: Math.random() * Math.PI * 2,
                    animSpeed: 2.2 + Math.random() * 3.5
                });
            }
        }

        const startX = sideX > 0 ? (hallW / 2 - (numTiers * stepDepth)) : -(hallW / 2 - (numTiers * stepDepth));
        standGroup.position.x = startX;
        scene.add(standGroup);
    }

    // Build Giant 8-Tier Stepped Spectator Stadiums on Left and Right sides! (Over 440 spectators!)
    buildMassiveSteppedStadium(28, 62);
    buildMassiveSteppedStadium(-28, 62);

    // 5. Badminton Court & Player Generator ( Singles 1v1 & Doubles 2v2 )
    const courtWidth = 6.8;
    const courtLength = 13.4;

    const lineCanvas = document.createElement('canvas');
    lineCanvas.width = 512; lineCanvas.height = 1024;
    const ctx = lineCanvas.getContext('2d');
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 512 - 80, 1024 - 80);
    ctx.beginPath(); ctx.moveTo(256, 40); ctx.lineTo(256, 1024 - 40); ctx.stroke();
    const lineTex = new THREE.CanvasTexture(lineCanvas);

    const courtMat = new THREE.MeshStandardMaterial({ color: 0x0d8249, roughness: 0.4 });
    const lineMat = new THREE.MeshStandardMaterial({ map: lineTex, transparent: true, roughness: 0.3 });
    const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });

    function createPlayerFigure(jerseyColor) {
        const pGroup = new THREE.Group();
        
        const jerseyMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.4 });
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.75, 10), jerseyMat);
        torso.position.y = 0.85;
        torso.castShadow = true;
        pGroup.add(torso);

        const shortsMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
        const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.3, 10), shortsMat);
        shorts.position.y = 0.45;
        pGroup.add(shorts);

        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45), skinMat);
        legL.position.set(-0.12, 0.22, 0);
        pGroup.add(legL);

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45), skinMat);
        legR.position.set(0.12, 0.22, 0);
        pGroup.add(legR);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
        head.position.y = 1.38;
        pGroup.add(head);

        const racketArm = new THREE.Group();
        racketArm.position.set(0.3, 1.1, 0);
        
        const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5), skinMat);
        armMesh.position.y = -0.2;
        armMesh.rotation.z = -Math.PI / 4;
        racketArm.add(armMesh);

        const racketFrameMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 });
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), racketFrameMat);
        handle.position.set(0.2, -0.3, 0.2);
        handle.rotation.z = Math.PI / 3;
        racketArm.add(handle);

        const racketHead = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.015, 8, 16), racketFrameMat);
        racketHead.position.set(0.45, -0.2, 0.3);
        racketArm.add(racketHead);

        pGroup.add(racketArm);

        return { group: pGroup, racketArm: racketArm };
    }

    const animatedPlayers = [];
    const activeShuttlecocks = [];

    function buildCourtWithMatch(x, z, matchType, jerseyRed, jerseyBlue) {
        const courtGroup = new THREE.Group();
        courtGroup.position.set(x, 0, z);

        const mat = new THREE.Mesh(new THREE.PlaneGeometry(courtWidth + 1.0, courtLength + 1.0), courtMat);
        mat.rotation.x = -Math.PI / 2;
        mat.position.y = 0.01;
        mat.receiveShadow = true;
        courtGroup.add(mat);

        const lines = new THREE.Mesh(new THREE.PlaneGeometry(courtWidth + 1.0, courtLength + 1.0), lineMat);
        lines.rotation.x = -Math.PI / 2;
        lines.position.y = 0.015;
        courtGroup.add(lines);

        const netW = courtWidth + 0.3;
        const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.55), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        pL.position.set(-netW / 2, 0.77, 0);
        courtGroup.add(pL);

        const pR = pL.clone();
        pR.position.x = netW / 2;
        courtGroup.add(pR);

        const net = new THREE.Mesh(new THREE.PlaneGeometry(netW, 0.76), netMat);
        net.position.set(0, 1.17, 0);
        courtGroup.add(net);

        const fixture = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.25, 1.2), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5 }));
        fixture.position.set(x, hallH - 1.8, z);
        scene.add(fixture);

        const spot = new THREE.SpotLight(0xffffff, 2.2);
        spot.position.set(x, hallH - 2, z);
        spot.angle = Math.PI / 3;
        scene.add(spot);

        const shuttle = new THREE.Mesh(
            new THREE.ConeGeometry(0.18, 0.3, 10, 1, true),
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
                { player: p1, courtX: x, courtZ: z, side: -1, origZ: -3.8, matchType: 'singles' },
                { player: p2, courtX: x, courtZ: z, side: 1, origZ: 3.8, matchType: 'singles' }
            );
        } else {
            const p1 = createPlayerFigure(jerseyRed);
            p1.group.position.set(-1.2, 0, -2.2);
            courtGroup.add(p1.group);

            const p2 = createPlayerFigure(jerseyRed);
            p2.group.position.set(1.2, 0, -4.8);
            courtGroup.add(p2.group);

            const p3 = createPlayerFigure(jerseyBlue);
            p3.group.position.set(1.2, 0, 2.2);
            p3.group.rotation.y = Math.PI;
            courtGroup.add(p3.group);

            const p4 = createPlayerFigure(jerseyBlue);
            p4.group.position.set(-1.2, 0, 4.8);
            p4.group.rotation.y = Math.PI;
            courtGroup.add(p4.group);

            animatedPlayers.push(
                { player: p1, courtX: x, courtZ: z, side: -1, origZ: -2.2, matchType: 'doubles' },
                { player: p2, courtX: x, courtZ: z, side: -1, origZ: -4.8, matchType: 'doubles' },
                { player: p3, courtX: x, courtZ: z, side: 1, origZ: 2.2, matchType: 'doubles' },
                { player: p4, courtX: x, courtZ: z, side: 1, origZ: 4.8, matchType: 'doubles' }
            );
        }

        activeShuttlecocks.push({ mesh: shuttle, courtX: x, courtZ: z });
        scene.add(courtGroup);
    }

    // 6. Layout 6 Badminton Courts
    const courtSpacingX = 12.5;
    const courtSpacingZ = 19.5;

    buildCourtWithMatch(-courtSpacingX, -courtSpacingZ / 2, 'singles', 0xef4444, 0x3b82f6);
    buildCourtWithMatch(0, -courtSpacingZ / 2, 'doubles', 0x10b981, 0xf59e0b);
    buildCourtWithMatch(courtSpacingX, -courtSpacingZ / 2, 'singles', 0x8b5cf6, 0xec4899);

    buildCourtWithMatch(-courtSpacingX, courtSpacingZ / 2, 'doubles', 0x06b6d4, 0xef4444);
    buildCourtWithMatch(0, courtSpacingZ / 2, 'singles', 0x3b82f6, 0x10b981);
    buildCourtWithMatch(courtSpacingX, courtSpacingZ / 2, 'doubles', 0xf59e0b, 0x8b5cf6);

    // 7. Shimmer Particles
    const particleCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 60;
        posArray[i + 1] = Math.random() * 16 + 0.5;
        posArray[i + 2] = (Math.random() - 0.5) * 60;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: 0xffd700, size: 0.25, transparent: true, opacity: 0.6 }));
    scene.add(particles);

    // 8. Continuous Cutscene Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // A. Animate Mass Crowd Cheering on Stepped Bleachers
        crowdMembers.forEach(c => {
            const wave = Math.sin(elapsedTime * c.animSpeed + c.animOffset);
            c.group.position.y = c.baseY + Math.max(0, wave * 0.15);
            c.armL.rotation.z = Math.PI / 3 + wave * 0.3;
            c.armR.rotation.z = -Math.PI / 3 - wave * 0.3;
        });

        // B. Animate Players & Racket Swings
        animatedPlayers.forEach((ap, idx) => {
            const p = ap.player;
            const swingTime = elapsedTime * 3.5 + idx;
            
            p.group.position.x = Math.sin(swingTime * 0.8) * 1.4;
            p.group.position.z = ap.origZ + Math.cos(swingTime * 0.6) * 0.6;
            
            p.racketArm.rotation.x = Math.sin(swingTime) * 0.85;
            p.racketArm.rotation.y = Math.cos(swingTime * 0.5) * 0.5;
        });

        // C. Animate Active Shuttlecock Volleys
        activeShuttlecocks.forEach((sc, idx) => {
            const rallyTime = elapsedTime * 2.2 + idx * 1.5;
            sc.mesh.position.z = Math.sin(rallyTime) * 4.2;
            sc.mesh.position.y = 1.2 + Math.abs(Math.cos(rallyTime)) * 2.2;
            sc.mesh.position.x = Math.cos(rallyTime * 0.5) * 0.8;
            sc.mesh.rotation.x = rallyTime * 2;
        });

        // D. Wide Sweeping 360 Camera Orbit Cutscene
        const radius = 30 + Math.sin(elapsedTime * 0.15) * 5;
        const angle = elapsedTime * 0.14;
        const camX = Math.cos(angle) * radius;
        const camZ = Math.sin(angle) * radius;
        const camY = 10.5 + Math.sin(elapsedTime * 0.22) * 4.5;

        camera.position.set(camX, camY, camZ);

        const targetX = Math.sin(elapsedTime * 0.1) * 4;
        const targetY = 3.0 + Math.cos(elapsedTime * 0.18) * 1.5;
        const targetZ = Math.cos(elapsedTime * 0.1) * 4;
        camera.lookAt(targetX, targetY, targetZ);

        particles.rotation.y = elapsedTime * 0.02;

        renderer.render(scene, camera);
    }

    animate();

    // 9. Resize Listener
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};
