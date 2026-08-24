/**
 * app.js - Main Application Controller & Web Audio Sound Engine
 * Handles UI screen switching, sound synthesis (snap sound, temple bell),
 * confetti fireworks, and interactive events.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize 3D Badminton Court Background
    if (window.initCourt3D) {
        window.initCourt3D();
    }

    // 2. Background Music (newmusic.mp4) & Web Audio API Synthesizer
    const bgMusic = document.getElementById('bg-music');
    let audioCtx = null;
    let isMuted = false;

    function playBgMusic() {
        if (bgMusic && bgMusic.paused && !isMuted) {
            bgMusic.play().then(() => {
                console.log('Background music started playing automatically!');
            }).catch(e => {
                console.log('Autoplay deferred, waiting for user touch:', e);
            });
        }
    }

    // Try playing music immediately on load
    playBgMusic();

    // Start music immediately on first touch/click anywhere on the screen
    const startMusicOnInteraction = () => {
        playBgMusic();
        getAudioContext();
    };

    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evtType => {
        window.addEventListener(evtType, startMusicOnInteraction, { once: true });
    });

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Play Piece Snap Sound
    window.playSnapSound = function() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } catch (e) { console.error(e); }
    };

    // Play Temple Bell / Gong Sound (สำหรับบทสวดพระ)
    function playTempleBell() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            
            // Fundamental tone + harmonics
            const freqs = [329.63, 659.25, 987.77];
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                const duration = 2.5 + idx * 0.5;
                gain.gain.setValueAtTime(0.35 / (idx + 1), ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + duration);
            });
        } catch (e) { console.error(e); }
    }

    // Play Victory Fanfare Sound
    function playVictoryFanfare() {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((note, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.value = note;

                const startTime = ctx.currentTime + idx * 0.12;
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.4);
            });
        } catch (e) { console.error(e); }
    }

    // Audio Toggle Handler (Music & SFX)
    const audioBtn = document.getElementById('audio-toggle');
    audioBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        if (isMuted) {
            if (bgMusic) bgMusic.pause();
            audioBtn.textContent = '🔇';
            audioBtn.style.opacity = '0.5';
        } else {
            if (bgMusic) bgMusic.play();
            audioBtn.textContent = '🎵';
            audioBtn.style.opacity = '1';
        }
    });

    // 3. Screen Navigation
    const screens = {
        intro: document.getElementById('screen-intro'),
        game: document.getElementById('screen-game'),
        blessing: document.getElementById('screen-blessing')
    };

    function showScreen(screenName) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }
    }

    // 4. Jigsaw Game Engine Instance (7x7 Grid)
    let jigsawInstance = null;

    function startJigsawGame() {
        getAudioContext();
        playBgMusic();
        showScreen('game');

        const boardEl = document.getElementById('jigsaw-board');
        const trayEl = document.getElementById('piece-tray');

        jigsawInstance = new JigsawEngine({
            rows: 7,
            cols: 7,
            imageSrc: 'pun.png',
            boardContainer: boardEl,
            trayContainer: trayEl,
            onProgress: (placed, total) => {
                document.getElementById('placed-count').textContent = placed;
            },
            onComplete: () => {
                handleJigsawComplete();
            }
        });
    }

    // 5. Victory & Blessing Flow
    function handleJigsawComplete() {
        playVictoryFanfare();

        // Fire Confetti Fireworks
        if (window.confetti) {
            const count = 220;
            const defaults = { origin: { y: 0.7 } };

            function fire(particleRatio, opts) {
                confetti(Object.assign({}, defaults, opts, {
                    particleCount: Math.floor(count * particleRatio)
                }));
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        }

        // Switch to Blessing Screen after slight delay
        setTimeout(() => {
            showScreen('blessing');
            playTempleBell();

            const scrollBox = document.querySelector('.blessing-scroll-box');
            if (scrollBox) {
                scrollBox.scrollTop = 0;
            }
        }, 1200);
    }

    // 6. Interactive Event Listeners
    // Start Button
    document.getElementById('btn-start').addEventListener('click', () => {
        startJigsawGame();
    });

    // Hint Button
    document.getElementById('btn-hint').addEventListener('click', () => {
        if (jigsawInstance) jigsawInstance.showHint();
    });

    // Shuffle Button
    document.getElementById('btn-shuffle').addEventListener('click', () => {
        if (jigsawInstance) jigsawInstance.shuffleTray();
    });

    // Auto Solve Button
    document.getElementById('btn-auto-solve').addEventListener('click', () => {
        if (jigsawInstance) jigsawInstance.autoSolve();
    });

    // Sathu 99 Button
    let sathuCount = 99;
    document.getElementById('btn-sathu').addEventListener('click', (e) => {
        sathuCount += 1;
        document.getElementById('sathu-count').textContent = sathuCount;
        playTempleBell();

        // Spawn floating "🙏 สาธุ 99" animation
        const sathuTag = document.createElement('div');
        sathuTag.className = 'floating-sathu';
        sathuTag.textContent = `🙏 สาธุ ${sathuCount}`;
        
        // Position near click or random horizontal
        const posX = e.clientX || (window.innerWidth / 2 + (Math.random() * 200 - 100));
        const posY = e.clientY || (window.innerHeight / 2);

        sathuTag.style.left = `${posX - 40}px`;
        sathuTag.style.top = `${posY - 30}px`;

        document.body.appendChild(sathuTag);

        setTimeout(() => sathuTag.remove(), 2000);
    });

    // Copy Blessing Text Button
    document.getElementById('btn-copy-blessing').addEventListener('click', () => {
        const chantText = document.getElementById('chant-text-content').innerText;
        navigator.clipboard.writeText(chantText).then(() => {
            const btn = document.getElementById('btn-copy-blessing');
            const orig = btn.innerHTML;
            btn.innerHTML = '✅ คัดลอกเรียบร้อย!';
            setTimeout(() => btn.innerHTML = orig, 2000);
        }).catch(err => {
            alert('คัดลอกบทสวดเรียบร้อยแล้ว!');
        });
    });

    // Replay Button
    document.getElementById('btn-replay').addEventListener('click', () => {
        showScreen('intro');
    });
});
