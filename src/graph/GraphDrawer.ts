export class GraphDrawer {

    private _canvas: HTMLCanvasElement;
    private _ctx: CanvasRenderingContext2D;
    private _width: number;
    private _height: number;
    private _valueRanges: number[];
    private _colors: string[];
    private _currentX: number = 0;
    private _isFullyDrawn: boolean = false;
    private _lastTimestamp: number | null = null;
    private _isTimemarkLine: boolean = false;
    private _lineWidth: number;
    private _borderWidth: number = 1;
    private _effectiveWidth: number;  // width minus borders
    private _effectiveHeight: number; // height minus borders

    constructor(
        containerIdOrElement: string | HTMLElement,
        valueRanges: number[],
        colors: string[],
        lineWidth: number = 1
    ) {
        // Validate input arrays
        if (colors.length !== valueRanges.length + 1) {
            throw new Error(`Colors array must have exactly ${valueRanges.length + 1} elements (one more than valueRanges)`);
        }

        // Validate that valueRanges are in ascending order
        for (let i = 1; i < valueRanges.length; i++) {
            if (valueRanges[i] <= valueRanges[i - 1]) {
                throw new Error('ValueRanges must be in ascending order');
            }
        }

        // Validate colors format
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (!colors.every(color => hexColorRegex.test(color))) {
            throw new Error('All colors must be in valid hex format (e.g., #FF0000)');
        }

        // Find container
        let container: HTMLElement;
        if (typeof containerIdOrElement === 'string') {
            const foundElement = document.getElementById(containerIdOrElement);
            if (!foundElement) {
                throw new Error(`Container element with id ${containerIdOrElement} not found`);
            }
            container = foundElement;
        } else {
            container = containerIdOrElement;
        }

        // Get container dimensions
        const containerRect = container.getBoundingClientRect();
        this._width = Math.floor(containerRect.width);
        this._height = Math.floor(containerRect.height);

        // Calculate effective dimensions (accounting for border)
        this._effectiveWidth = this._width - (this._borderWidth * 2);
        this._effectiveHeight = this._height - (this._borderWidth * 2);

        // Create canvas element
        this._canvas = document.createElement('canvas');
        container.appendChild(this._canvas);

        // Get context
        const context = this._canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
            throw new Error('Failed to get canvas context');
        }
        this._ctx = context;

        this._valueRanges = [0, ...valueRanges]; // Add 0 at the beginning
        this._colors = colors;
        this._lineWidth = lineWidth;

        // Set canvas size
        this._canvas.width = this._width;
        this._canvas.height = this._height;

        // Set canvas style to ensure it displays at the correct size
        this._canvas.style.width = `${this._width}px`;
        this._canvas.style.height = `${this._height}px`;

        // Initial background and border
        this.clear();
    }

    private drawBorder(): void {
        this._ctx.strokeStyle = '#000000';
        this._ctx.lineWidth = this._borderWidth;
        this._ctx.strokeRect(
            this._borderWidth / 2,
            this._borderWidth / 2,
            this._width - this._borderWidth,
            this._height - this._borderWidth
        );
    }

    private clear(): void {
        // Clear entire canvas
        this._ctx.clearRect(0, 0, this._width, this._height);

        // Fill background within border
        this._ctx.fillStyle = this._colors[0];
        this._ctx.fillRect(
            this._borderWidth,
            this._borderWidth,
            this._effectiveWidth,
            this._effectiveHeight
        );

        // Draw border
        this.drawBorder();

        this._isFullyDrawn = false;
        this._currentX = this._borderWidth; // Start after left border
        this._lastTimestamp = null;
        this._isTimemarkLine = false;
    }

    private getColorIndices(value: number): { lowerIndex: number, upperIndex: number } {
        for (let i = 0; i < this._valueRanges.length - 1; i++) {
            if (value >= this._valueRanges[i] && value <= this._valueRanges[i + 1]) {
                return {
                    lowerIndex: i,
                    upperIndex: i + 1
                };
            }
        }
        // If value is greater than the last range
        return {
            lowerIndex: this._valueRanges.length - 2,
            upperIndex: this._valueRanges.length - 1
        };
    }

    private calculateHeightRatio(value: number, lowerBound: number, upperBound: number): number {
        return (value - lowerBound) / (upperBound - lowerBound);
    }

    private shiftCanvasLeft(shiftAmount: number): void {
        // Get the content within the borders
        const imageData = this._ctx.getImageData(
            this._borderWidth + shiftAmount,
            this._borderWidth,
            this._effectiveWidth - shiftAmount,
            this._effectiveHeight
        );

        // Clear the area within borders
        this._ctx.fillStyle = this._colors[0];
        this._ctx.fillRect(
            this._borderWidth,
            this._borderWidth,
            this._effectiveWidth,
            this._effectiveHeight
        );

        // Draw shifted content
        this._ctx.putImageData(
            imageData,
            this._borderWidth,
            this._borderWidth
        );

        // Redraw border as it might have been affected
        this.drawBorder();
    }

    private applyOverlayEffect(baseColor: string, overlayOpacity: number = 0.5): string {
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);

        const overlayChannel = (base: number) => {
            const normalized = base / 255;
            let result;
            if (normalized <= 0.5) {
                result = (2 * normalized * 1);
            } else {
                result = 1 - 2 * (1 - normalized) * (1 - 1);
            }
            return Math.round(((result * 255) * overlayOpacity + base * (1 - overlayOpacity)));
        };

        const newR = overlayChannel(r);
        const newG = overlayChannel(g);
        const newB = overlayChannel(b);

        const toHex = (n: number) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }

    public addEntry(value: number): void {
        value = Math.round(value * 100) / 100;

        const currentTime = Date.now();
        if (this._lastTimestamp === null) {
            this._lastTimestamp = currentTime;
            this._isTimemarkLine = false;
        } else {
            const timeDiff = currentTime - this._lastTimestamp;
            if (timeDiff >= 1000) {
                this._isTimemarkLine = true;
                this._lastTimestamp = currentTime;
            } else {
                this._isTimemarkLine = false;
            }
        }

        const drawWidth = this._isTimemarkLine ? 1 : this._lineWidth;

        if (!this._isFullyDrawn && this._currentX >= this._width - this._borderWidth) {
            this._isFullyDrawn = true;
        }

        if (this._isFullyDrawn) {
            this.shiftCanvasLeft(drawWidth);
            this.drawLine(this._width - this._borderWidth - drawWidth, value, drawWidth);
        } else {
            this.drawLine(this._currentX, value, drawWidth);
            this._currentX += drawWidth;
        }
    }

    private drawLine(x: number, value: number, width: number): void {
        const { lowerIndex, upperIndex } = this.getColorIndices(value);
        const ratio = this.calculateHeightRatio(
            value,
            this._valueRanges[lowerIndex],
            this._valueRanges[upperIndex]
        );

        let lowerColor = this._colors[lowerIndex];
        let upperColor = this._colors[upperIndex];

        if (this._isTimemarkLine) {
            lowerColor = this.applyOverlayEffect(lowerColor, 0.3);
            upperColor = this.applyOverlayEffect(upperColor, 0.3);
        }

        // Calculate heights accounting for borders
        const upperHeight = Math.round(this._effectiveHeight * ratio);
        const lowerHeight = this._effectiveHeight - upperHeight;

        // Draw lower part
        this._ctx.fillStyle = lowerColor;
        this._ctx.fillRect(
            x,
            this._height - this._borderWidth - lowerHeight,
            width,
            lowerHeight
        );

        // Draw upper part
        this._ctx.fillStyle = upperColor;
        this._ctx.fillRect(
            x,
            this._borderWidth,
            width,
            upperHeight
        );
    }

    public clearGraph(): void {
        this._currentX = this._borderWidth; // Reset to after left border
        this._isFullyDrawn = false;
        this._lastTimestamp = null;
        this._isTimemarkLine = false;
        this.clear();
    }

    public destroy(): void {
        if (this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
    }
}