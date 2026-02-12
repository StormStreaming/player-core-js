# Change Log

## 1.0.2

- improved subscribe lifecycle: debounce, stale streamKey guards, and retry limits to prevent race conditions during rapid stream switching,

## 1.0.1

- minor fixes related to MSE/MME

## 1.0.0
- Initial release (previously known as StormLibrary 5.0.0)

- methods "getRole()", "restart()" and "getIfAttached()" were removed,
- methods "subscribe()", "unsubscribe()", "play()" "pause()" work now asynchronously inside a task queue,
- method "attachToContainer()" now accepts both a string parameter (an id of a container) or HTMLElement reference,
- new method "updateToSize()" was added, it will force library to resize inside current container,
- mechanism for auto-scaling to parent container was greatly improved,
- parameter "connectionType" was dropped, as gateway is the only available connection type now,
- library can be auto-initialized though additional parameter in the constructor,
- event "playerCoreReady" was renamed to "playerReady", it'll fire now directly after initialize method is executed,
- mute/unmute logic has been changed. Library will mute playback only if specified by the configuration or forced by a browser,
- muted parameter was added to volume settings,
- getSourceList method was renamed to getSourceItemList,
- playSource method was renamed to playSourceItem,
- library will not utilize cookie API anymore, localStorage is now being used instead,
- library size was reduced by over 40%,
- StreamInfo object now contains new field called "monogram", which is assigned based on a video resolution (e.g. "sd", "hd", "2k")
- serverConnect, serverDisconnect & serverConnectionError events now include "sequenceNum" parameter which tells which connection sequence it is
- getStreamState() and getPlaybackState() use separate sets of enums,
- new event qualityListUpdate was added,
- new event containerChange was added,
- new method getQualityItemList() was added,
- new method playQualityItem(qualityID:number) was added,
- new method makeScreenshot() was added,
- new method getServerInfo() was added,
- change in volume mechanics - setting volume to 0 will automatically trigger mute,
- buffer and bandwidth data can now be accessed though methods "getBandwidthAnalyser()", "getBandwidthMeter()" and "getBufferAnalyser()",
- dynamic graphs can now be spawned using "createBufferGraph()", "createBandwidthGraph()" and "createBufferStabilityGraph()",
- quality control modes were added to the library, these can be controlled via "getQualityControlMode()" & "setQualityControlMode(...)",
- new stylised console logs were added for Stage, Playback & Quality controllers,
- JSDoc is now included in types,
- Dedicated test page (index.html) to allow familiarization with the library API.