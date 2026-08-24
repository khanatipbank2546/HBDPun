/**
 * jigsaw.js - 7x7 Jigsaw Puzzle Engine for Khao Pun Birthday App
 * Supports 7x7 grid (49 pieces), any-slot placement, position swapping,
 * return to tray, and completion detection ONLY when all pieces match their correct slots.
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
        this.gridEdges = { h: [], v: [] };
        this.selectedPiece = null;
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
        this.checkWinCondition();

        window.addEventListener('resize', () => this.handleResize());
    }

    calculateDimensions() {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const maxBoardSize = Math.min(screenW - 32, screenH * 0.50, 440);
        
        this.boardWidth = maxBoardSize;
        this.boardHeight = maxBoardSize * (this.img.height / this.img.width);
        
        if (this.boardHeight > screenH * 0.50) {
            this.boardHeight = screenH * 0.50;
            this.boardWidth = this.boardHeight * (this.img.width / this.img.height);
        }

        this.pieceWidth = this.boardWidth / this.cols;
        this.pieceHeight = this.boardHeight / this.rows;

        this.boardContainer.style.width = `${this.boardWidth}px`;
        this.boardContainer.style.height = `${this.boardHeight}px`;

        // Ghost Image preview (faint 0.05 opacity)
        const ghostImg = document.getElementById('ghost-image');
        if (ghostImg) {
            ghostImg.src = this.imageSrc;
            ghostImg.style.width = `${this.boardWidth}px`;
            ghostImg.style.height = `${this.boardHeight}px`;
            ghostImg.style.opacity = '0.05';
        }
    }

    generateInterlockingEdges() {
        this.gridEdges.h = [];
        for (let r = 0; r < this.rows - 1; r++) {
            this.gridEdges.h[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.gridEdges.h[r][c] = Math.random() < 0.5 ? 1 : -1;
            }
        }

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

    drawJigsawPiecePath(ctx, w, h, topEdge, rightEdge, bottomEdge, leftEdge) {
        const tabSize = Math.min(w, h) * 0.22;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);

        if (topEdge === 0) {
            ctx.lineTo(w, 0);
        } else {
            ctx.lineTo(w * 0.38, 0);
            ctx.bezierCurveTo(w * 0.36, -topEdge * tabSize, w * 0.64, -topEdge * tabSize, w * 0.62, 0);
            ctx.lineTo(w, 0);
        }

        if (rightEdge === 0) {
            ctx.lineTo(w, h);
        } else {
            ctx.lineTo(w, h * 0.38);
            ctx.bezierCurveTo(w + rightEdge * tabSize, h * 0.36, w + rightEdge * tabSize, h * 0.64, w, h * 0.62);
            ctx.lineTo(w, h);
        }

        if (bottomEdge === 0) {
            ctx.lineTo(0, h);
        } else {
            ctx.lineTo(w * 0.62, h);
            ctx.bezierCurveTo(w * 0.64, h + bottomEdge * tabSize, w * 0.36, h + bottomEdge * tabSize, w * 0.38, h);
            ctx.lineTo(0, h);
        }

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

                const topEdge = (r === 0) ? 0 : -this.gridEdges.h[r - 1][c];
                const bottomEdge = (r === this.rows - 1) ? 0 : this.gridEdges.h[r][c];
                const leftEdge = (c === 0) ? 0 : -this.gridEdges.v[r][c - 1];
                const rightEdge = (c === this.cols - 1) ? 0 : this.gridEdges.v[r][c];

                const canvas = document.createElement('canvas');
                const canvasW = this.pieceWidth + padding * 2;
                const canvasH = this.pieceHeight + padding * 2;
                canvas.width = canvasW * 2;
                canvas.height = canvasH * 2;
                canvas.className = 'jigsaw-piece';
                canvas.style.width = `${canvasW}px`;
                canvas.style.height = `${canvasH}px`;
                canvas.dataset.id = id;

                const ctx = canvas.getContext('2d');
                ctx.scale(2, 2);

                ctx.save();
                ctx.translate(padding, padding);

                this.drawJigsawPiecePath(ctx, this.pieceWidth, this.pieceHeight, topEdge, rightEdge, bottomEdge, leftEdge);
                ctx.clip();

                ctx.drawImage(
                    this.img,
                    c * sourceW, r * sourceH, sourceW, sourceH,
                    0, 0, this.pieceWidth, this.pieceHeight
                );

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                ctx.restore();

                const pieceData = {
                    id: id,
                    row: r,
                    col: c,
                    currentBoardRow: null,
                    currentBoardCol: null,
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
            if (this.selectedPiece === piece) {
                this.selectPiece(null);
            } else {
                this.selectPiece(piece);
            }
        });

        // Touch & Drag Support
        let isDragging = false;
        let startX, startY, origLeft, origTop;

        const onStart = (e) => {
            isDragging = true;
            this.selectPiece(piece);

            const pt = e.touches ? e.touches[0] : e;
            startX = pt.clientX;
            startY = pt.clientY;

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

            const boardRect = this.boardContainer.getBoundingClientRect();
            
            if (
                pieceCenterX >= boardRect.left &&
                pieceCenterX <= boardRect.right &&
                pieceCenterY >= boardRect.top &&
                pieceCenterY <= boardRect.bottom
            ) {
                let col = Math.floor((pieceCenterX - boardRect.left) / this.pieceWidth);
                let row = Math.floor((pieceCenterY - boardRect.top) / this.pieceHeight);

                row = Math.max(0, Math.min(this.rows - 1, row));
                col = Math.max(0, Math.min(this.cols - 1, col));

                this.placePieceInSlot(piece, row, col);
                return;
            }

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
        if (piece) {
            piece.canvas.classList.add('selected');
        }
    }

    handleSlotClick(row, col) {
        if (!this.selectedPiece) return;
        this.placePieceInSlot(this.selectedPiece, row, col);
    }

    placePieceInSlot(piece, targetRow, targetCol) {
        const oldRow = piece.currentBoardRow;
        const oldCol = piece.currentBoardCol;
        const wasPlaced = piece.isPlaced;

        // Check if another piece is already at target (targetRow, targetCol)
        const existingPiece = this.pieces.find(p => p !== piece && p.isPlaced && p.currentBoardRow === targetRow && p.currentBoardCol === targetCol);

        if (existingPiece) {
            if (wasPlaced && oldRow !== null && oldCol !== null) {
                // Swap positions! Existing piece moves to piece's old spot
                existingPiece.currentBoardRow = oldRow;
                existingPiece.currentBoardCol = oldCol;
                existingPiece.canvas.style.left = `${oldCol * this.pieceWidth - existingPiece.padding}px`;
                existingPiece.canvas.style.top = `${oldRow * this.pieceHeight - existingPiece.padding}px`;
            } else {
                // Return existing piece to tray
                this.returnToTray(existingPiece);
            }
        }

        // Place piece at target (targetRow, targetCol)
        piece.isPlaced = true;
        piece.currentBoardRow = targetRow;
        piece.currentBoardCol = targetCol;

        piece.canvas.classList.remove('selected');
        piece.canvas.classList.add('placed');

        piece.canvas.style.position = 'absolute';
        piece.canvas.style.left = `${targetCol * this.pieceWidth - piece.padding}px`;
        piece.canvas.style.top = `${targetRow * this.pieceHeight - piece.padding}px`;
        piece.canvas.style.zIndex = 10;

        this.boardContainer.appendChild(piece.canvas);

        if (window.playSnapSound) window.playSnapSound();

        this.selectedPiece = null;
        this.checkWinCondition();
    }

    returnToTray(piece) {
        piece.isPlaced = false;
        piece.currentBoardRow = null;
        piece.currentBoardCol = null;

        piece.canvas.classList.remove('selected', 'placed');
        piece.canvas.style.position = 'relative';
        piece.canvas.style.left = '0px';
        piece.canvas.style.top = '0px';
        piece.canvas.style.zIndex = '1';
        this.trayContainer.appendChild(piece.canvas);

        if (this.selectedPiece === piece) {
            this.selectedPiece = null;
        }

        this.checkWinCondition();
    }

    showHint() {
        const incorrectOrUnplaced = this.pieces.filter(p => !p.isPlaced || p.currentBoardRow !== p.row || p.currentBoardCol !== p.col);
        if (incorrectOrUnplaced.length === 0) return;

        const hintPiece = incorrectOrUnplaced[Math.floor(Math.random() * incorrectOrUnplaced.length)];
        this.placePieceInSlot(hintPiece, hintPiece.row, hintPiece.col);
    }

    autoSolve() {
        this.pieces.forEach((piece, idx) => {
            setTimeout(() => {
                this.placePieceInSlot(piece, piece.row, piece.col);
            }, idx * 30);
        });
    }

    checkWinCondition() {
        const placedCount = this.pieces.filter(p => p.isPlaced).length;
        this.onProgress(placedCount, this.totalPieces);

        // Win ONLY if all 49 pieces are placed AND every piece is in its exact correct slot!
        const allPlaced = this.pieces.length === this.totalPieces && this.pieces.every(p => p.isPlaced);
        const allCorrect = this.pieces.every(p => p.isPlaced && p.currentBoardRow === p.row && p.currentBoardCol === p.col);

        if (allPlaced && allCorrect) {
            setTimeout(() => this.onComplete(), 450);
        }
    }

    handleResize() {
        this.calculateDimensions();
        this.createBoardSlots();
        
        this.pieces.forEach(piece => {
            if (piece.isPlaced && piece.currentBoardRow !== null && piece.currentBoardCol !== null) {
                piece.canvas.style.width = `${this.pieceWidth + piece.padding * 2}px`;
                piece.canvas.style.height = `${this.pieceHeight + piece.padding * 2}px`;
                piece.canvas.style.left = `${piece.currentBoardCol * this.pieceWidth - piece.padding}px`;
                piece.canvas.style.top = `${piece.currentBoardRow * this.pieceHeight - piece.padding}px`;
            }
        });
    }
}
