import {StormPlayerCore} from "../StormPlayerCore";
import {Logger} from "../logger/Logger";
import {StormLibraryEvent} from "../events/StormLibraryEvent";
import {Trend} from "../enum/Trend";
import {Stability} from "../enum/Stability";
import {PlaybackState} from "./enum/PlaybackState";
import {ISourceItem} from "../model/ISourceItem";
import {QualityControlMode} from "../enum/QualityControlMode";
import {UserCapabilities} from "../utilities/UserCapabilities";
import {QualityItem} from "../model/QualityItem";
import {CooldownMonitor} from "./CooldownMonitor";
import debounce from "lodash.debounce";
import {StreamState} from "./enum/StreamState";

export class QualityController {

    //------------------------------------------------------------------------//
    // UPGRADE/DOWNGRADE TIMING
    //------------------------------------------------------------------------//

    private _initialUpgradeTimeout: number = 0;
    private _maxUpgradeTimeout: number = 0;
    private _upgradeTimeout: number = 0;
    private _lastDowngradeTime: number = 0;
    private _lastUpgradeTime: number = 0;
    private _failedUpgradeAttempts: number = 0;
    private _upgradeAttempts: number = 0;
    private _rapidFailure: number = 0;

    //------------------------------------------------------------------------//
    // CORE REFERENCES
    //------------------------------------------------------------------------//

    private readonly _main: StormPlayerCore;
    protected _logger: Logger;

    //------------------------------------------------------------------------//
    // QUALITY STATE
    //------------------------------------------------------------------------//

    private _qualityControlMode: QualityControlMode = QualityControlMode.PASSIVE;
    private _bandwidthCapValue: number = 0;
    private _preselectedResolution: number = 0;
    private _sourceListSize: number = 0;

    private _qualityItemList: Array<QualityItem>;
    private _autoQualityItem!: QualityItem;

    //------------------------------------------------------------------------//
    // RESOLUTION TRACKING (for PASSIVE mode)
    //------------------------------------------------------------------------//

    private _savedResolutionWidth: number = 0;
    private _savedResolutionHeight: number = 0;

    //------------------------------------------------------------------------//
    // RESOLUTION-AWARE SELECTION DEFAULTS
    //------------------------------------------------------------------------//

    /**
     * Desktop thresholds - more conservative, CSS pixels ≈ physical pixels
     * minScale 0.9 = source can be max ~1.1x larger than player
     * maxScale 1.1 = allow up to 10% upscale
     */
    private _minScaleThresholdDesktop: number = 0.9;
    private _maxScaleThresholdDesktop: number = 1.1;

    /**
     * Mobile thresholds - more aggressive, CSS pixels are scaled (high DPI screens)
     * minScale 0.4 = source can be max ~2.5x larger than player (compensates for devicePixelRatio)
     * maxScale 1.0 = no upscaling on mobile
     */
    private _minScaleThresholdMobile: number = 0.75;
    private _maxScaleThresholdMobile: number = 1.1;

    private _resizeCooldown: CooldownMonitor = new CooldownMonitor(30);
    private _debug: boolean = false;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    constructor(main: StormPlayerCore) {
        this._main = main;
        this._logger = main.getLogger();
        this._logger.info(this, "Creating new QualityController");

        this._qualityItemList = new Array<QualityItem>();
        this._qualityControlMode = this._main.getConfigManager()?.getSettingsData().getQualityData().qualityControlMode ?? QualityControlMode.PASSIVE;
        this._initialUpgradeTimeout = this._main.getConfigManager()?.getSettingsData().getQualityData().initialUpgradeTimeout ?? 30;
        this._maxUpgradeTimeout = this._main.getConfigManager()?.getSettingsData().getQualityData().maxUpgradeTimeout ?? 3600;
        this._upgradeTimeout = this._initialUpgradeTimeout;

        this._debug = this._main.getConfigManager()?.getSettingsData().getDebugData().qualityControllerDebug ?? this._debug;

        // Resolution-aware selection thresholds (can be overridden via config)
        const qualityData = this._main.getConfigManager()?.getSettingsData().getQualityData();
        //if (qualityData) {
           // this._minScaleThresholdDesktop = qualityData.minScaleThresholdDesktop ?? this._minScaleThresholdDesktop;
           // this._maxScaleThresholdDesktop = qualityData.maxScaleThresholdDesktop ?? this._maxScaleThresholdDesktop;
           // this._minScaleThresholdMobile = qualityData.minScaleThresholdMobile ?? this._minScaleThresholdMobile;
           // this._maxScaleThresholdMobile = qualityData.maxScaleThresholdMobile ?? this._maxScaleThresholdMobile;
        //}

        this.initialize();
    }

    public initialize(): void {
        this._autoQualityItem = new QualityItem(0, "Auto", "");
        this._autoQualityItem.isAuto = true;

        this.loadQualityData();

        this._main.addEventListener("authorizationComplete", this.onAuthorizationComplete, false);
        this._main.addEventListener("subscriptionComplete", this.onSubscribeComplete, false);
        this._main.addEventListener("playbackProgress", this.onProgressEvent, false);
        this._main.addEventListener("sourceDowngrade", this.downgradeSourceItem, false);
        this._main.addEventListener("sourceListUpdate", this.createQualityList, false);
        this._main.addEventListener("resizeUpdate", debounce(() => { this.onLibraryResize() }, 2000, { leading: false, trailing: true }), false);

        this._preselectedResolution = Number(this._main.getStorageManager()?.getField("preselectedResolution"));
        if (this._preselectedResolution == 0)
            this._autoQualityItem.isSelected = true;
    }

    //------------------------------------------------------------------------//
    // RESOLUTION-AWARE SELECTION ALGORITHM
    //------------------------------------------------------------------------//

    /**
     * Returns current scale thresholds based on device type.
     */
    private getScaleThresholds(): { min: number, max: number } {
        if (UserCapabilities.isMobile()) {
            const isLandscape = window.innerWidth > window.innerHeight;

            if (isLandscape) {
                // Landscape - niższy próg żeby przepuścić 1080p
                return {
                    min: 0.30,
                    max: 1.1
                };
            }
            // Portrait
            return {
                min: this._minScaleThresholdMobile,
                max: this._maxScaleThresholdMobile
            };
        }
        return {
            min: this._minScaleThresholdDesktop,
            max: this._maxScaleThresholdDesktop
        };
    }

    /**
     * Calculates the scale factor needed to fit video into player.
     * For "contain/letterbox" mode - video must fit in BOTH axes.
     *
     * @returns scale factor where:
     *   - scale < 1.0 means downscale (video larger than player) - PREFERRED
     *   - scale = 1.0 means perfect fit
     *   - scale > 1.0 means upscale (video smaller than player) - AVOID
     */
    private calculateFitScale(
        playerWidth: number,
        playerHeight: number,
        videoWidth: number,
        videoHeight: number
    ): number {
        if (videoWidth <= 0 || videoHeight <= 0)
            return Infinity;

        const scaleX = playerWidth / videoWidth;
        const scaleY = playerHeight / videoHeight;
        return Math.min(scaleX, scaleY);
    }

    /**
     * Selects best source based on target resolution (player dimensions).
     *
     * Strategy (aggressive quality - prefers higher resolution for better downscaling):
     * 1. Ideal range: scale 0.5–1.0 (source is 1x to 2x larger than player)
     *    → Pick SMALLEST scale (largest source in range = best quality)
     * 2. All sources too large (scale < 0.5):
     *    → Pick LARGEST scale (least oversized, saves bandwidth)
     * 3. All sources too small (scale > 1.0):
     *    → Pick largest source (best quality when upscaling)
     *
     * Example for 812×474 player with 480p/720p/1080p:
     *   - 480p: scale=0.95 (in range)
     *   - 720p: scale=0.63 (in range) ← WINNER (smallest scale in range)
     *   - 1080p: scale=0.42 (below range)
     */
    private selectByResolution(sourceList: ISourceItem[], targetWidth: number, targetHeight: number): ISourceItem {
        if (sourceList.length === 0)
            throw new Error("Cannot select from empty source list");

        if (targetWidth <= 0 || targetHeight <= 0) {
            return this.selectLowestQualitySource(sourceList);
        }

        const scored = sourceList.map(source => {
            const scale = this.calculateFitScale(
                targetWidth,
                targetHeight,
                source.getStreamInfo().getWidth(),
                source.getStreamInfo().getHeight()
            );
            return { source, scale };
        });

        const thresholds = this.getScaleThresholds();

        // Ideal: sources in the "sweet spot" range
        const idealSources = scored.filter(s =>
            s.scale >= thresholds.min && s.scale <= thresholds.max
        );

        let selected: ISourceItem;
        let selectionReason: string;

        if (idealSources.length > 0) {
            // Pick smallest scale = largest source in range = best quality
            selected = idealSources.reduce((best, curr) =>
                curr.scale < best.scale ? curr : best
            ).source;
            selectionReason = "ideal range";
        } else {
            // All sources are too large (scale < min) - pick least oversized
            const oversizedSources = scored.filter(s => s.scale < thresholds.min);

            if (oversizedSources.length > 0) {
                // Pick largest scale = smallest source = least bandwidth waste
                selected = oversizedSources.reduce((best, curr) =>
                    curr.scale > best.scale ? curr : best
                ).source;
                selectionReason = "oversized (least oversized)";
            } else {
                // All sources require upscaling (scale > 1.0) - pick largest for best quality
                selected = this.selectHighestQualitySource(sourceList);
                selectionReason = "undersized (largest available)";
            }
        }

        // Diagnostic logging

            const selectedScale = scored.find(s => s.source === selected)?.scale ?? 0;
            const isMobile = UserCapabilities.isMobile();

            /*
            console.log(
                `Quality Selection:\n` +
                `  Container: ${targetWidth}x${targetHeight}\n` +
                `  Device: ${isMobile ? 'Mobile' : 'Desktop'}\n` +
                `  Thresholds: min=${thresholds.min}, max=${thresholds.max}\n` +
                `  Selected: ${selected.getStreamInfo().getLabel()} (${selected.getStreamInfo().getWidth()}x${selected.getStreamInfo().getHeight()})\n` +
                `  Scale: ${selectedScale.toFixed(3)}\n` +
                `  Reason: ${selectionReason}\n` +
                `  All scales: ${scored.map(s => `${s.source.getStreamInfo().getLabel()}=${s.scale.toFixed(3)}`).join(', ')}`,
                "dark-yellow"
            );

             */

        return selected;
    }

    //------------------------------------------------------------------------//
    // MAIN SOURCE SELECTION
    //------------------------------------------------------------------------//

    /**
     * Selects best source for playback based on current mode and constraints.
     */
    public selectSource(withBandwidthCap: boolean = true): ISourceItem | null {
        // Sync with storage before selection (for multi-player scenarios)

        const storedResolution = Number(this._main.getStorageManager()?.getField("preselectedResolution"));
        if (!isNaN(storedResolution)) {
            this._preselectedResolution = storedResolution;
            this._autoQualityItem.isSelected = (this._preselectedResolution === 0);
        }

        if (this._debug) {
            this._logger.decoratedLog(
                `selectSource called:\n` +
                `  Mode: ${this._qualityControlMode}\n` +
                `  PreselectedResolution: ${this._preselectedResolution} (${this._preselectedResolution === 0 ? 'AUTO' : 'MANUAL'})\n` +
                `  BandwidthCap: ${this._bandwidthCapValue > 0 ? this._bandwidthCapValue + ' kbps' : 'none'}`,
                "dark-yellow"
            );
        }

        const sourceList: ISourceItem[] | undefined = this._main.getConfigManager()?.getStreamData().getSourceList();

        if (!sourceList || sourceList.length === 0)
            return null;

        // Manual resolution mode (user selected specific quality)
        if (this._preselectedResolution !== 0)
            return this.selectManualSource(sourceList);

        // Auto mode
        return this.selectAutoSource(sourceList, withBandwidthCap);
    }

    /**
     * Auto source selection based on quality control mode.
     */
    private selectAutoSource(sourceList: ISourceItem[], withBandwidthCap: boolean = true): ISourceItem {
        // Apply bandwidth cap filter if needed
        let filteredSources = withBandwidthCap ? this.filterByBandwidth(sourceList) : [...sourceList];
        if (filteredSources.length === 0)
            filteredSources = [...sourceList];

        let selected: ISourceItem;

        switch (this._qualityControlMode) {
            case QualityControlMode.PASSIVE:
                if (this._debug) {
                    this._logger.decoratedLog(
                        `Quality Mode: PASSIVE (using saved: ${this._savedResolutionWidth}x${this._savedResolutionHeight})`,
                        "dark-yellow"
                    );
                }
                selected = this.selectByResolution(
                    filteredSources,
                    this._savedResolutionWidth,
                    this._savedResolutionHeight
                );
                break;

            case QualityControlMode.RESOLUTION_AWARE:
                if (this._debug) {
                    this._logger.decoratedLog(
                        `Quality Mode: RESOLUTION_AWARE (using current: ${this._main.getWidth()}x${this._main.getHeight()})`,
                        "dark-yellow"
                    );
                }
                selected = this.selectByResolution(
                    filteredSources,
                    this._main.getWidth(),
                    this._main.getHeight()
                );
                break;

            case QualityControlMode.LOWEST_QUALITY:
                if (this._debug) {
                    this._logger.decoratedLog(`Quality Mode: LOWEST_QUALITY`, "dark-yellow");
                }
                selected = this.selectLowestQualitySource(sourceList);
                break;

            case QualityControlMode.HIGHEST_QUALITY:
                if (this._debug) {
                    this._logger.decoratedLog(`Quality Mode: HIGHEST_QUALITY`, "dark-yellow");
                }
                selected = this.selectHighestQualitySource(filteredSources);
                break;

            default:
                selected = this.selectLowestQualitySource(sourceList);
                break;
        }

        if (withBandwidthCap)
            this.updateAutoQualityItem(selected);

        return selected;
    }

    /**
     * Selects source in manual mode based on user's preferred resolution.
     */
    private selectManualSource(sourceList: ISourceItem[]): ISourceItem {
        // Find source closest to target height
        const sortedSources = [...sourceList].sort((a, b) => {
            const diffA = Math.abs(a.getStreamInfo().getHeight() - this._preselectedResolution);
            const diffB = Math.abs(b.getStreamInfo().getHeight() - this._preselectedResolution);
            return diffA - diffB;
        });

        const selectedSource = sortedSources[0];

        if (this._debug) {
            this._logger.decoratedLog(
                `Manual Quality Selection:\n` +
                `  Requested height: ${this._preselectedResolution}p\n` +
                `  Selected: ${selectedSource.getStreamInfo().getLabel()} (${selectedSource.getStreamInfo().getWidth()}x${selectedSource.getStreamInfo().getHeight()})`,
                "dark-yellow"
            );
        }

        // Update UI state
        this._autoQualityItem.isSelected = false;
        this._autoQualityItem.label = "Auto";

        // Clear bandwidth cap in manual mode
        this._bandwidthCapValue = 0;
        this._main.getStorageManager()?.saveField("bandwidthCapValue", "0");

        // Update quality items selection
        this._qualityItemList.forEach(item => {
            if (!item.isAuto) {
                item.isSelected = (item.label === selectedSource.getStreamInfo().getLabel());
            }
        });

        this.dispatchQualityListUpdate();
        return selectedSource;
    }

    //------------------------------------------------------------------------//
    // QUALITY LIST MANAGEMENT
    //------------------------------------------------------------------------//

    public createQualityList = () => {
        this._qualityItemList = new Array<QualityItem>();
        this._qualityItemList.push(this._autoQualityItem);
        this._autoQualityItem.isSelected = (this._preselectedResolution === 0);
        let lastID = 0;

        let currentSourceItem: ISourceItem | null = this._main?.getPlaybackController()?.getCurrentSourceItem() ?? null;
        const sourceItemList: Array<ISourceItem> = [...(this._main.getConfigManager()?.getStreamData()?.getSourceList() ?? [])]
            .sort((a, b) => b.getStreamInfo().getHeight() - a.getStreamInfo().getHeight());

        // Check if current source still exists
        let currentSourceExists: boolean = true;
        if (currentSourceItem != null) {
            currentSourceExists = sourceItemList.some(
                source => source.getStreamKey() === currentSourceItem!.getStreamKey()
            );

            if (!currentSourceExists) {
                currentSourceItem = this.selectSource();
                this._main.getPlaybackController()?.setSelectedStream(currentSourceItem);

                if (this._main.getPlaybackController()?.getStreamState() == StreamState.PUBLISHED) {
                    if (this._main.getPlaybackController()?.wasPlayingLastTime()) {
                        this._main.getPlaybackController()?.createPlayTask(currentSourceItem);
                    }
                }
            }
        }

        // Handle new sources added
        if (sourceItemList.length > this._sourceListSize) {
            let newSource: ISourceItem | null = this.selectSource();
            if (newSource?.getStreamKey() != currentSourceItem?.getStreamKey()) {
                currentSourceItem = newSource;

                if (this._main.getPlaybackController()?.getStreamState() == StreamState.PUBLISHED) {
                    if (this._main.getPlaybackController()?.wasPlayingLastTime()) {
                        this._main.getPlaybackController()?.createPlayTask(currentSourceItem);
                    }
                }
            }
        }

        // Build quality item list (deduplicated by label)
        const addedLabels = new Set<string>();
        for (const source of sourceItemList) {
            const sourceLabel = source.getStreamInfo().getLabel();
            const sourceMonogram = source.getStreamInfo().getMonogram();

            if (!addedLabels.has(sourceLabel)) {
                lastID++;
                this._qualityItemList.push(new QualityItem(lastID, sourceLabel, sourceMonogram));
                addedLabels.add(sourceLabel);
            }
        }

        // Mark current selection
        if (currentSourceItem != null && currentSourceItem.getStreamInfo() != null && !this._autoQualityItem.isSelected) {
            for (const item of this._qualityItemList) {
                if (item.label === currentSourceItem.getStreamInfo().getLabel()) {
                    item.isSelected = true;
                    break;
                }
            }
        }

        this._sourceListSize = sourceItemList.length;
        this.dispatchQualityListUpdate();
    }

    public updateAutoQualityItem(source: ISourceItem): void {
        if (this._autoQualityItem && this._preselectedResolution === 0) {
            this._autoQualityItem.isSelected = true;
            this._autoQualityItem.label = `Auto (${source.getStreamInfo().getLabel()})`;
            this._autoQualityItem.monogram = source.getStreamInfo().getMonogram();

            // Reset innych itemów
            this._qualityItemList.forEach(item => {
                if (!item.isAuto) {
                    item.isSelected = false;
                }
            });
        }
        this.dispatchQualityListUpdate();
    }

    public playQualityItemByID(id: number): boolean {
        const sourceItemList: Array<ISourceItem> = this._main.getConfigManager()?.getStreamData().getSourceList() ?? [];
        let selectedQuality: QualityItem | null = null;

        // Update selection state
        for (const item of this._qualityItemList) {
            if (item.id === id) {
                selectedQuality = item;
                item.isSelected = true;
            } else {
                item.isSelected = false;
            }
        }

        if (selectedQuality == null)
            return false;

        this._main.getStageController()?.getScreenElement()?.createBlackBackground();

        if (selectedQuality.isAuto) {
            // Switch to auto mode
            this._preselectedResolution = 0;
            this._main.getStorageManager()?.saveField("preselectedResolution", "0");
            this._autoQualityItem.isSelected = true;
            this._main.getPlaybackController()?.createPlayTask(this.selectSource());
        } else {
            // Switch to manual mode with selected quality
            const matchingSource = sourceItemList.find(
                source => source.getStreamInfo().getLabel() === selectedQuality!.label
            );

            if (matchingSource) {
                this._autoQualityItem.label = "Auto";
                this._preselectedResolution = matchingSource.getStreamInfo().getHeight();
                this._main.getStorageManager()?.saveField("preselectedResolution", this._preselectedResolution.toString());
                this._main.getPlaybackController()?.createPlayTask(matchingSource);
            }
        }

        this.dispatchQualityListUpdate();
        return true;
    }

    //------------------------------------------------------------------------//
    // EVENTS
    //------------------------------------------------------------------------//

    public onLibraryResize(): void {

        if (this._qualityControlMode !== QualityControlMode.RESOLUTION_AWARE)
            return;

        const playbackState: PlaybackState = this._main.getPlaybackState();

        // Save current dimensions for PASSIVE mode
        this._savedResolutionWidth = this._main.getWidth();
        this._savedResolutionHeight = this._main.getHeight();

        if (this._debug) {
            this._logger.decoratedLog(
                `Updating Quality to resolution: ${this._savedResolutionWidth}x${this._savedResolutionHeight}`,
                "dark-yellow"
            );
        }

        this._main.getStorageManager()?.saveField("resolutionWidth", this._savedResolutionWidth.toString());
        this._main.getStorageManager()?.saveField("resolutionHeight", this._savedResolutionHeight.toString());

        // Only react to resize during playback in auto mode
        if (playbackState !== PlaybackState.PLAYING && playbackState !== PlaybackState.BUFFERING)
            return;

        if (this._preselectedResolution !== 0)
            return;

        const newSource = this.selectSource();
        const finalTargetSource: ISourceItem | null = this.selectSource(false);
        const currentSourceItem: ISourceItem | null = this._main?.getPlaybackController()?.getCurrentSourceItem() ?? null;

        // Check if we're bandwidth-limited from reaching target
        if (newSource !== finalTargetSource) {
            if (this.getTimeToNextUpgrade() === 0) {
                const currentTime = Math.round(new Date().getTime() / 1000);
                this._lastDowngradeTime = currentTime;
                this._upgradeTimeout = this._initialUpgradeTimeout;
                this.saveQualityData();
            }
        }

        // Switch source if needed
        if (newSource != null && newSource !== currentSourceItem) {
            this.updateAutoQualityItem(newSource);
            this._main.getStageController()?.getScreenElement()?.createBlackBackground();
            this._main?.getPlaybackController()?.createPlayTask(newSource);
        }
    }

    private downgradeSourceItem = (event: StormLibraryEvent["sourceDowngrade"]) => {
        this._bandwidthCapValue = event.bandwidthCap;
        this._main.getStorageManager()?.saveField("bandwidthCapValue", this._bandwidthCapValue.toString());
        this._main.getStorageManager()?.saveField("bandwidthCapTime", new Date().getTime().toString());

        const currentTime = Math.round(new Date().getTime() / 1000);
        const timeSinceLastUpgrade = currentTime - this._lastUpgradeTime;
        const timeSinceLastDowngrade = currentTime - this._lastDowngradeTime;

        this.calculateNewUpgradeTimeout(timeSinceLastUpgrade, timeSinceLastDowngrade);

        this._lastDowngradeTime = currentTime;
        this.saveQualityData();

        this.executeDowngrade();
    }

    /**
     * Calculates new upgrade timeout based on failure patterns.
     */
    private calculateNewUpgradeTimeout(timeSinceLastUpgrade: number, timeSinceLastDowngrade: number): void {
        // First downgrade ever
        if (this._lastDowngradeTime === 0) {
            this._upgradeTimeout = this._initialUpgradeTimeout;
            this._upgradeAttempts = 0;
            this._failedUpgradeAttempts = 0;
            this._rapidFailure = 0;
            return;
        }

        // Long time since last downgrade - reset state
        if (timeSinceLastDowngrade > this._upgradeTimeout) {
            this._upgradeAttempts = 0;
            this._failedUpgradeAttempts = 0;
            this._upgradeTimeout = this._initialUpgradeTimeout;
            this._rapidFailure = 0;
            return;
        }

        // Recent upgrade failed - exponential backoff
        if (this._lastUpgradeTime !== 0 && timeSinceLastUpgrade < this._upgradeTimeout) {
            this._failedUpgradeAttempts++;
            this._rapidFailure = 0;
            this._upgradeTimeout = Math.pow(2, this._failedUpgradeAttempts + 3) * this._initialUpgradeTimeout;
            this._lastUpgradeTime = 0;
            return;
        }

        // Rapid failures without upgrade attempts
        if (this._rapidFailure < 5) {
            this._rapidFailure++;
        } else {
            this._rapidFailure = 0;
            this._failedUpgradeAttempts++;
            this._upgradeTimeout = Math.pow(2, this._failedUpgradeAttempts + 3) * this._initialUpgradeTimeout;
        }

        // Cap at maximum
        if (this._upgradeTimeout > this._maxUpgradeTimeout) {
            this._upgradeTimeout = this._maxUpgradeTimeout;
        }
    }

    /**
     * Executes the actual downgrade to a lower quality source.
     */
    private executeDowngrade(): void {
        const sourceList = this._main.getConfigManager()?.getStreamData().getSourceList() ?? [];
        if (sourceList.length === 0)
            return;

        const lowestBitrateSource = this.selectLowestBitrateSource(sourceList);
        const currentSourceItem: ISourceItem | null = this._main?.getPlaybackController()?.getCurrentSourceItem() ?? null;

        // Already at lowest - nothing to do
        if (currentSourceItem) {
            if (currentSourceItem.getStreamInfo().getBitrate() <= lowestBitrateSource.getStreamInfo().getBitrate()) {
                this._logger.info(this, "Already playing lowest bitrate source, skipping downgrade");
                return;
            }
        }

        if (this._main.getPlaybackState() !== PlaybackState.PLAYING && this._main.getPlaybackState() !== PlaybackState.BUFFERING)
            return;

        // Find best source under bandwidth cap
        const availableSources = sourceList.filter(source =>
            source.getStreamInfo().getBitrate() <= this._bandwidthCapValue
        );

        let targetSource: ISourceItem;
        if (availableSources.length > 0) {
            targetSource = this.selectHighestBitrateSource(availableSources);
        } else {
            targetSource = lowestBitrateSource;
        }

        if (this._debug) {
            this._logger.decoratedLog(
                `Quality Downgrade Triggered: ${targetSource.getStreamInfo().getLabel()}, cap: ${this._bandwidthCapValue.toFixed(0)}kbps`,
                "dark-yellow"
            );
        }

        this._main.getStageController()?.getScreenElement()?.createBlackBackground();
        this._main.getPlaybackController()?.createPlayTask(targetSource);

        if (availableSources.length > 0) {
            this._main.getNetworkController()?.restart(true);
        }
    }

    private onAuthorizationComplete = (event: StormLibraryEvent["authorizationComplete"]) => {
        const savedIP: string | null = this._main.getStorageManager()?.getField("savedLocalIP") ?? null;

        // IP changed - reset quality state
        if (savedIP != null && savedIP !== event.clientIP) {
            this._main.getStorageManager()?.saveField("upgradeTimeout", "0");
            this._main.getStorageManager()?.saveField("lastDowngradeTime", "0");
            this._main.getStorageManager()?.saveField("failedUpgradeAttempts", "0");
            this._main.getStorageManager()?.saveField("bandwidthCapValue", "0");
            this._main.getStorageManager()?.saveField("upgradeAttempts", "0");
        }

        this._main.getStorageManager()?.saveField("savedLocalIP", event.clientIP);
    }

    private onSubscribeComplete = () => {
        this.loadQualityData();
        this._resizeCooldown.reset();
    }

    private onProgressEvent = (event: StormLibraryEvent["playbackProgress"]): void => {
        if (this._bandwidthCapValue <= 0 || this._preselectedResolution !== 0 || this._lastDowngradeTime <= 0)
            return;

        const currentTime = Math.round(new Date().getTime() / 1000);
        const timeSinceDowngrade = currentTime - this._lastDowngradeTime;

        if (timeSinceDowngrade < this._upgradeTimeout)
            return;

        const stabilityTrend = this._main.getBandwidthAnalyser()?.currentTrend ?? Trend.RISING;
        const bufferStability = this._main.getBufferAnalyser()?.stability ?? Stability.BAD;

        if (stabilityTrend !== Trend.STABLE)
            return;

        if (bufferStability !== Stability.GOOD && bufferStability !== Stability.MEDIUM)
            return;

        this.attemptUpgrade(currentTime);
    }

    /**
     * Attempts to upgrade to a higher quality source.
     */
    private attemptUpgrade(currentTime: number): void {
        const sourceList = this._main.getConfigManager()?.getStreamData().getSourceList();
        const currentSourceItem: ISourceItem | null = this._main?.getPlaybackController()?.getCurrentSourceItem() ?? null;
        const targetSourceItem: ISourceItem | null = this.selectSource(false);

        if (!sourceList || !currentSourceItem)
            return;

        const sortedSources = [...sourceList].sort((a, b) =>
            a.getStreamInfo().getBitrate() - b.getStreamInfo().getBitrate()
        );

        const currentIndex = sortedSources.findIndex(source =>
            source.getStreamInfo().getBitrate() === currentSourceItem.getStreamInfo().getBitrate()
        );

        if (currentIndex === -1 || currentIndex >= sortedSources.length - 1) {
            this._logger.info(this, "Quality Upgrade :: No higher quality found - aborting...");
            return;
        }

        const nextSource = sortedSources[currentIndex + 1];
        const nextBitrate = nextSource.getStreamInfo().getBitrate();

        // Check if upgrade is valid
        if (targetSourceItem == null || nextBitrate === 0)
            return;

        if (nextSource.getStreamInfo().getHeight() > targetSourceItem.getStreamInfo().getHeight()) {
            this._logger.info(this, "Quality Upgrade :: Next quality exceeds target resolution - aborting...");
            this._lastDowngradeTime = 0;
            this._upgradeTimeout = 0;
            return;
        }

        if (this._debug)
            this._logger.decoratedLog(`Quality Upgrade Triggered: ${nextSource.getStreamInfo().getLabel()}`, "dark-yellow");

        // Execute upgrade
        this._bandwidthCapValue = nextBitrate * 1.2;
        this._main.getStorageManager()?.saveField("bandwidthCapValue", this._bandwidthCapValue.toString());
        this._logger.info(this, `Quality Upgrade :: bandwidthCap increased to: ${this._bandwidthCapValue}`);

        this._lastDowngradeTime = currentTime;
        this._upgradeTimeout = this._initialUpgradeTimeout;
        this._upgradeAttempts++;
        this._lastUpgradeTime = currentTime;

        this.saveQualityData();

        if (this._main.getPlaybackState() === PlaybackState.PLAYING || this._main.getPlaybackState() === PlaybackState.BUFFERING) {
            this.updateAutoQualityItem(nextSource);
            this._main.getPlaybackController()?.createPlayTask(nextSource);
        }
    }

    //------------------------------------------------------------------------//
    // PERSISTENCE
    //------------------------------------------------------------------------//

    private saveQualityData(): void {
        if (this._qualityControlMode === QualityControlMode.PASSIVE)
            return;

        this._main.getStorageManager()?.saveField("upgradeTimeout", this._upgradeTimeout.toString());
        this._main.getStorageManager()?.saveField("lastDowngradeTime", this._lastDowngradeTime.toString());
        this._main.getStorageManager()?.saveField("lastUpgradeTime", this._lastUpgradeTime.toString());
        this._main.getStorageManager()?.saveField("upgradeAttempts", this._upgradeAttempts.toString());
        this._main.getStorageManager()?.saveField("failedUpgradeAttempts", this._failedUpgradeAttempts.toString());
        this._main.getStorageManager()?.saveField("bandwidthCapValue", this._bandwidthCapValue.toString());
    }

    private loadQualityData(): void {
        const storage = this._main.getStorageManager();
        if (!storage)
            return;

        const upgradeTimeout = storage.getField("upgradeTimeout");
        if (upgradeTimeout) this._upgradeTimeout = Number(upgradeTimeout);

        const lastDowngradeTime = storage.getField("lastDowngradeTime");
        if (lastDowngradeTime) this._lastDowngradeTime = Number(lastDowngradeTime);

        const lastUpgradeTime = storage.getField("lastUpgradeTime");
        if (lastUpgradeTime) this._lastUpgradeTime = Number(lastUpgradeTime);

        const upgradeAttempts = storage.getField("upgradeAttempts");
        if (upgradeAttempts) this._upgradeAttempts = Number(upgradeAttempts);

        const failedUpgradeAttempts = storage.getField("failedUpgradeAttempts");
        if (failedUpgradeAttempts) this._failedUpgradeAttempts = Number(failedUpgradeAttempts);

        const bandwidthCapValue = storage.getField("bandwidthCapValue");
        if (bandwidthCapValue) this._bandwidthCapValue = Number(bandwidthCapValue);

        const savedResolutionWidth = Number(storage.getField("resolutionWidth"));
        if (savedResolutionWidth) this._savedResolutionWidth = savedResolutionWidth;

        const savedResolutionHeight = Number(storage.getField("resolutionHeight"));
        if (savedResolutionHeight) this._savedResolutionHeight = savedResolutionHeight;
    }

    //------------------------------------------------------------------------//
    // SOURCE FILTERS & SELECTORS
    //------------------------------------------------------------------------//

    private filterByBandwidth(sourceList: ISourceItem[]): ISourceItem[] {
        if (this._bandwidthCapValue === 0)
            return [...sourceList];

        return sourceList.filter(source =>
            source.getStreamInfo().getBitrate() <= this._bandwidthCapValue
        );
    }

    private selectHighestQualitySource(sourceList: ISourceItem[]): ISourceItem {
        return sourceList.reduce((max, curr) =>
            max.getStreamInfo().getHeight() < curr.getStreamInfo().getHeight() ? curr : max
        );
    }

    private selectLowestQualitySource(sourceList: ISourceItem[]): ISourceItem {
        return sourceList.reduce((min, curr) =>
            min.getStreamInfo().getHeight() > curr.getStreamInfo().getHeight() ? curr : min
        );
    }

    private selectHighestBitrateSource(sourceList: ISourceItem[]): ISourceItem {
        return sourceList.reduce((max, curr) =>
            max.getStreamInfo().getBitrate() < curr.getStreamInfo().getBitrate() ? curr : max
        );
    }

    private selectLowestBitrateSource(sourceList: ISourceItem[]): ISourceItem {
        return sourceList.reduce((min, curr) =>
            min.getStreamInfo().getBitrate() > curr.getStreamInfo().getBitrate() ? curr : min
        );
    }

    //------------------------------------------------------------------------//
    // UTILITIES
    //------------------------------------------------------------------------//

    private dispatchQualityListUpdate(): void {
        this._main.dispatchEvent("qualityListUpdate", {
            ref: this._main,
            qualityList: this._qualityItemList
        });
    }

    public reduceUpgradeTimeout(seconds: number): void {
        this._upgradeTimeout = Math.max(1, this._upgradeTimeout - seconds);
        this.saveQualityData();
    }

    //------------------------------------------------------------------------//
    // GETTERS & SETTERS
    //------------------------------------------------------------------------//

    public getBandwidthCap(): number {
        return this._bandwidthCapValue;
    }

    public getQualityItemList(): Array<QualityItem> {
        return this._qualityItemList;
    }

    public getQualityControlMode(): QualityControlMode {
        return this._qualityControlMode;
    }

    public setQualityControlMode(newQualityControlMode: QualityControlMode, forceReload: boolean = false): void {
        this._qualityControlMode = newQualityControlMode;

        if (this._debug)
            this._logger.decoratedLog(`Quality Control Mode: ${newQualityControlMode}`, "dark-yellow");

        if (forceReload) {
            const newSource: ISourceItem | null = this.selectSource();
            if (newSource != null && newSource !== this._main.getPlaybackController()?.getCurrentSourceItem()) {
                this.updateAutoQualityItem(newSource);
                this._main.getPlaybackController()?.createPlayTask(newSource);
            }
        }
    }

    public getTimeToNextUpgrade(): number {
        if (this._lastDowngradeTime === 0)
            return 0;

        const currentTime = Math.round(new Date().getTime() / 1000);
        const timeSinceDowngrade = currentTime - this._lastDowngradeTime;
        return Math.max(0, this._upgradeTimeout - timeSinceDowngrade);
    }

    // Desktop threshold getters/setters
    public getMinScaleThresholdDesktop(): number {
        return this._minScaleThresholdDesktop;
    }

    public setMinScaleThresholdDesktop(value: number): void {
        this._minScaleThresholdDesktop = Math.max(0, Math.min(value, this._maxScaleThresholdDesktop));
    }

    public getMaxScaleThresholdDesktop(): number {
        return this._maxScaleThresholdDesktop;
    }

    public setMaxScaleThresholdDesktop(value: number): void {
        this._maxScaleThresholdDesktop = Math.max(this._minScaleThresholdDesktop, value);
    }

    // Mobile threshold getters/setters
    public getMinScaleThresholdMobile(): number {
        return this._minScaleThresholdMobile;
    }

    public setMinScaleThresholdMobile(value: number): void {
        this._minScaleThresholdMobile = Math.max(0, Math.min(value, this._maxScaleThresholdMobile));
    }

    public getMaxScaleThresholdMobile(): number {
        return this._maxScaleThresholdMobile;
    }

    public setMaxScaleThresholdMobile(value: number): void {
        this._maxScaleThresholdMobile = Math.max(this._minScaleThresholdMobile, value);
    }

    /**
     * Sets desktop scale thresholds.
     */
    public setDesktopScaleThresholds(min: number, max: number): void {
        this._minScaleThresholdDesktop = Math.max(0, min);
        this._maxScaleThresholdDesktop = Math.max(this._minScaleThresholdDesktop, max);
    }

    /**
     * Sets mobile scale thresholds.
     */
    public setMobileScaleThresholds(min: number, max: number): void {
        this._minScaleThresholdMobile = Math.max(0, min);
        this._maxScaleThresholdMobile = Math.max(this._minScaleThresholdMobile, max);
    }

    /**
     * Returns current thresholds based on device type.
     */
    public getCurrentScaleThresholds(): { min: number, max: number } {
        return this.getScaleThresholds();
    }
}