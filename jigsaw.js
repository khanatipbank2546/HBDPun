/**
 * jigsaw.js - 5x5 Jigsaw Puzzle Engine for Khao Pun Birthday App
 * Generates 25 interlocking jigsaw puzzle pieces from pun.png,
 * supports Drag & Drop, Touch, Click Placement, Hints, and Snap Logic.
 */

class JigsawEngine {
    constructor(options) {
        this.rows = options.rows || 7;
        this.cols = options.cols || 7;
        this.imageSrc = options.imageSrc || 'pun.png';
        this.boardContainer = options.boardContainer;
        this.trayContainer = options.trayContainer;
        this.onProgress = options.onProgress || function() {};
        this.onComplete = options.onComplete || function() {};

        this.pieces = [];
        this.gridEdges = { h: [], v: [] }; // Stores tab orientations (+1, -1) for interlocking edges
        this.selectedPiece = null;
        this.placedCount = 0;
        this.totalPieces = this.rows * this.cols;

        this.img = new Image();
        this.img.src = this.imageSrc;
        this.img.onload = () => this.init();
    }

    init() {
        this.generateInterlockingEdges();
        this.calculateDimensions();
        this.createBoardSlots();
        this.renderPieces();
        this.shuffleTray();
        this.updateProgress();

        window.addEventListener('resize', () => this.handleResize());
    }

    calculateDimensions() {
        // Measure board dimensions based on container or default responsive square
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const maxBoardSize = Math.min(screenW - 32, screenH * 0.50, 440);
        
        // Maintain aspect ratio of original image
        this.boardWidth = maxBoardSize;
        this.boardHeight = maxBoardSize * (this.img.height / this.img.width);
        
        // Clamp height for mobile screens
        if (this.boardHeight > screenH * 0.50) {
            this.boardHeight = screenH * 0.50;
            this.boardWidth = this.boardHeight * (this.img.width / this.img.height);
        }

        this.pieceWidth = this.boardWidth / this.cols;
        this.pieceHeight = this.boardHeight / this.rows;

        // Set CSS variables or direct styling on board
        this.boardContainer.style.width = `${this.boardWidth}px`;
        this.boardContainer.style.height = `${this.boardHeight}px`;

        // Update Ghost Image preview (faint 0.10 opacity)
        const ghostImg = document.getElementById('ghost-image');
        if (ghostImg) {
            ghostImg.src = this.imageSrc;
            ghostImg.style.width = `${this.boardWidth}px`;
            ghostImg.style.height = `${this.boardHeight}px`;
            ghostImg.style.opacity = '0.10';
        }
    }

    generateInterlockingEdges() {
        // Horizontal internal edges: (rows - 1) * cols
        this.gridEdges.h = [];
        for (let r = 0; r < this.rows - 1; r++) {
            this.gridEdges.h[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.gridEdges.h[r][c] = Math.random() < 0.5 ? 1 : -1;
            }
        }

        // Vertical internal edges: rows * (cols - 1)
        this.gridEdges.v = [];
        for (let r = 0; r < this.rows; r++) {
            this.gridEdges.v[r] = [];
            for (let c = 0; c < this.cols - 1; c++) {
                this.gridEdges.v[r][c] = Math.random() < 0.5 ? 1 : -1;
            }
        }
    }

    createBoardSlots() {
        this.boardContainer.querySelectorAll('.jigsaw-slot').forEach(el => el.remove());
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const slot = document.createElement('div');
                slot.className = 'jigsaw-slot';
                slot.dataset.row = r;
                slot.dataset.col = c;
                slot.style.width = `${this.pieceWidth}px`;
                slot.style.height = `${this.pieceHeight}px`;
                slot.style.left = `${c * this.pieceWidth}px`;
                slot.style.top = `${r * this.pieceHeight}px`;

                // Click slot to place selected piece
                slot.addEventListener('click', () => this.handleSlotClick(r, c));
                this.boardContainer.appendChild(slot);
            }
        }
    }

    // Draw interlocking jigsaw tab path on Canvas
    drawJigsawPiecePath(ctx, w, h, topEdge, rightEdge, bottomEdge, leftEdge) {
        const tabSize = Math.min(w, h) * 0.22;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);

        // Top Edge
        if (topEdge === 0) {
            ctx.lineTo(w, 0);
        } else {
            ctx.lineTo(w * 0.38, 0);
            ctx.bezierCurveTo(w * 0.36, -topEdge * tabSize, w * 0.64, -topEdge * tabSize, w * 0.62, 0);
            ctx.lineTo(w, 0);
        }

        // Right Edge
        if (rightEdge === 0) {
            ctx.lineTo(w, h);
        } else {
            ctx.lineTo(w, h * 0.38);
            ctx.bezierCurveTo(w + rightEdge * tabSize, h * 0.36, w + rightEdge * tabSize, h * 0.64, w, h * 0.62);
            ctx.lineTo(w, h);
        }

        // Bottom Edge
        if (bottomEdge === 0) {
            ctx.lineTo(0, h);
        } else {
            ctx.lineTo(w * 0.62, h);
            ctx.bezierCurveTo(w * 0.64, h + bottomEdge * tabSize, w * 0.36, h + bottomEdge * tabSize, w * 0.38, h);
            ctx.lineTo(0, h);
        }

        // Left Edge
        if (leftEdge === 0) {
            ctx.lineTo(0, 0);
        } else {
            ctx.lineTo(0, h * 0.62);
            ctx.bezierCurveTo(-leftEdge * tabSize, h * 0.64, -leftEdge * tabSize, h * 0.36, 0, h * 0.38);
            ctx.lineTo(0, 0);
        }

        ctx.closePath();
    }

    renderPieces() {
        this.pieces = [];
        this.trayContainer.innerHTML = '';

        const sourceW = this.img.width / this.cols;
        const sourceH = this.img.height / this.rows;
        const padding = Math.min(this.pieceWidth, this.pieceHeight) * 0.35;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const id = r * this.cols + c;

                // Determine edges (-1, 0, 1)
                const topEdge = (r === 0) ? 0 : -this.gridEdges.h[r - 1][c];
                const bottomEdge = (r === this.rows - 1) ? 0 : this.gridEdges.h[r][c];
                const leftEdge = (c === 0) ? 0 : -this.gridEdges.v[r][c - 1];
                const rightEdge = (c === this.cols - 1) ? 0 : this.gridEdges.v[r][c];

                // Create Canvas for piece
                const canvas = document.createElement('canvas');
                const canvasW = this.pieceWidth + padding * 2;
                const canvasH = this.pieceHeight + padding * 2;
                canvas.width = canvasW * 2; // HiDPI
                canvas.height = canvasH * 2;
                canvas.className = 'jigsaw-piece';
                canvas.style.width = `${canvasW}px`;
                canvas.style.height = `${canvasH}px`;
                canvas.dataset.id = id;

                const ctx = canvas.getContext('2d');
                ctx.scale(2, 2);

                ctx.save();
                ctx.translate(padding, padding);

                // Clip path for jigsaw shape
                this.drawJigsawPiecePath(ctx, this.pieceWidth, this.pieceHeight, topEdge, rightEdge, bottomEdge, leftEdge);
                ctx.clip();

                // Draw source image section
                ctx.drawImage(
                    this.img,
                    c * sourceW, r * sourceH, sourceW, sourceH,
                    0, 0, this.pieceWidth, this.pieceHeight
                );

                // Draw subtle piece border highlight & shadow
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                ctx.restore();

                const pieceData = {
                    id: id,
                    row: r,
                    col: c,
                    canvas: canvas,
                    padding: padding,
                    isPlaced: false,
                    topEdge, rightEdge, bottomEdge, leftEdge
                };

                this.attachPieceEvents(pieceData);
                this.pieces.push(pieceData);
            }
        }
    }

    shuffleTray() {
        this.trayContainer.innerHTML = '';
        // Shuffle pieces randomly
        const unplaced = this.pieces.filter(p => !p.isPlaced);
        const shuffled = [...unplaced].sort(() => Math.random() - 0.5);

        shuffled.forEach(p => {
            p.canvas.style.position = 'relative';
            p.canvas.style.left = '0px';
            p.canvas.style.top = '0px';
            p.canvas.classList.remove('placed', 'selected');
            this.trayContainer.appendChild(p.canvas);
        });
    }

    attachPieceEvents(piece) {
        const el = piece.canvas;

        // Click to select
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (piece.isPlaced) return;
            this.selectPiece(piece);
        });

        // Touch & Drag Support
        let isDragging = false;
        let startX, startY, origLeft, origTop;

        const onStart = (e) => {
            if (piece.isPlaced) return;
            isDragging = true;
            this.selectPiece(piece);

            const pt = e.touches ? e.touches[0] : e;
            startX = pt.clientX;
            startY = pt.clientY;

            // Float element to body during drag
            const rect = el.getBoundingClientRect();
            origLeft = rect.left;
            origTop = rect.top;

            el.style.position = 'fixed';
            el.style.left = `${origLeft}px`;
            el.style.top = `${origTop}px`;
            el.style.zIndex = 10000;
            document.body.appendChild(el);
        };

        const onMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const pt = e.touches ? e.touches[0] : e;
            const dx = pt.clientX - startX;
            const dy = pt.clientY - startY;

            el.style.left = `${origLeft + dx}px`;
            el.style.top = `${origTop + dy}px`;
        };

        const onEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;

            const rect = el.getBoundingClientRect();
            const pieceCenterX = rect.left + rect.width / 2;
            const pieceCenterY = rect.top + rect.height / 2;

            // Check if dropped near correct slot or any slot
            const boardRect = this.boardContainer.getBoundingClientRect();
            
            if (
                pieceCenterX >= boardRect.left &&
                pieceCenterX <= boardRect.right &&
                pieceCenterY >= boardRect.top &&
                pieceCenterY <= boardRect.bottom
            ) {
                // Calculate target cell
                const col = Math.floor((pieceCenterX - boardRect.left) / this.pieceWidth);
                const row = Math.floor((pieceCenterY - boardRect.top) / this.pieceHeight);

                // If correct cell OR within snap radius
                const targetLeft = boardRect.left + (piece.col * this.pieceWidth) + this.pieceWidth / 2;
                const targetTop = boardRect.top + (piece.row * this.pieceHeight) + this.pieceHeight / 2;

                const dist = Math.hypot(pieceCenterX - targetLeft, pieceCenterY - targetTop);

                if (dist < 50 || (row === piece.row && col === piece.col)) {
                    this.placePieceInBoard(piece);
                    return;
                }
            }

            // Return to tray if missed
            this.returnToTray(piece);
        };

        el.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        el.addEventListener('touchstart', onStart, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
    }

    selectPiece(piece) {
        if (this.selectedPiece) {
            this.selectedPiece.canvas.classList.remove('selected');
        }
        this.selectedPiece = piece;
        piece.canvas.classList.add('selected');
        this.highlightTargetSlot(piece);
    }

    highlightTargetSlot(piece) {
        this.boardContainer.querySelectorAll('.jigsaw-slot').forEach(s => s.classList.remove('target-hint'));
        if (!piece) return;

        const targetSlot = this.boardContainer.querySelector(`.jigsaw-slot[data-row="${piece.row}"][data-col="${piece.col}"]`);
        if (targetSlot) {
            targetSlot.classList.add('target-hint');
        }
    }

    handleSlotClick(row, col) {
        if (!this.selectedPiece || this.selectedPiece.isPlaced) return;

        if (this.selectedPiece.row === row && this.selectedPiece.col === col) {
            this.placePieceInBoard(this.selectedPiece);
        } else {
            // Optional: wrong placement flash
            const slot = this.boardContainer.querySelector(`.jigsaw-slot[data-row="${row}"][data-col="${col}"]`);
            if (slot) {
                slot.classList.add('wrong-flash');
                setTimeout(() => slot.classList.remove('wrong-flash'), 400);
            }
        }
    }

    placePieceInBoard(piece) {
        piece.isPlaced = true;
        piece.canvas.classList.remove('selected');
        piece.canvas.classList.add('placed');
        
        // Remove from document body or tray, attach directly to board container
        piece.canvas.style.position = 'absolute';
        piece.canvas.style.left = `${piece.col * this.pieceWidth - piece.padding}px`;
        piece.canvas.style.top = `${piece.row * this.pieceHeight - piece.padding}px`;
        piece.canvas.style.zIndex = 10;

        this.boardContainer.appendChild(piece.canvas);

        // Snap animation flash
        piece.canvas.animate([
            { transform: 'scale(1.18)', filter: 'brightness(1.5)' },
            { transform: 'scale(1)', filter: 'brightness(1)' }
        ], { duration: 250, easing: 'ease-out' });

        // Play snap audio
        if (window.playSnapSound) window.playSnapSound();

        this.selectedPiece = null;
        this.highlightTargetSlot(null);

        this.placedCount++;
        this.updateProgress();

        if (this.placedCount >= this.totalPieces) {
            setTimeout(() => this.onComplete(), 450);
        }
    }

    returnToTray(piece) {
        piece.canvas.classList.remove('selected');
        piece.canvas.style.position = 'relative';
        piece.canvas.style.left = '0px';
        piece.canvas.style.top = '0px';
        piece.canvas.style.zIndex = '1';
        this.trayContainer.appendChild(piece.canvas);
        
        if (this.selectedPiece === piece) {
            this.selectedPiece = null;
            this.highlightTargetSlot(null);
        }
    }

    showHint() {
        const unplaced = this.pieces.filter(p => !p.isPlaced);
        if (unplaced.length === 0) return;

        const hintPiece = unplaced[Math.floor(Math.random() * unplaced.length)];
        this.selectPiece(hintPiece);

        // Scroll piece into view in tray if needed
        hintPiece.canvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    autoSolve() {
        const unplaced = this.pieces.filter(p => !p.isPlaced);
        let delay = 0;
        unplaced.forEach(piece => {
            setTimeout(() => {
                this.placePieceInBoard(piece);
            }, delay);
            delay += 60;
        });
    }

    updateProgress() {
        this.onProgress(this.placedCount, this.totalPieces);
    }

    handleResize() {
        this.calculateDimensions();
        this.createBoardSlots();
        
        // Reposition placed pieces
        this.pieces.forEach(piece => {
            if (piece.isPlaced) {
                piece.canvas.style.width = `${this.pieceWidth + piece.padding * 2}px`;
                piece.canvas.style.height = `${this.pieceHeight + piece.padding * 2}px`;
                piece.canvas.style.left = `${piece.col * this.pieceWidth - piece.padding}px`;
                piece.canvas.style.top = `${piece.row * this.pieceHeight - piece.padding}px`;
            }
        });
    }
}
