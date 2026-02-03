# StormPlayer Core

Headless low-latency video player engine for [Storm Streaming Server](https://stormstreaming.com) & Cloud. No UI included — designed for custom player implementations.

For a ready-to-use player with controls, see [@stormstreaming/player-ui](https://github.com/StormStreaming/player-ui-js).

## Installation

```bash
npm install @stormstreaming/player-core
```

Also available: [yarn](https://yarnpkg.com/package/@stormstreaming/player-core) | [CDN](https://cdn.stormstreaming.com/player-core/latest/iife/index.js)

## Quick Start

```javascript
import { StormPlayerCore } from "@stormstreaming/player-core";

const player = new StormPlayerCore({
  stream: {
    serverList: [
      { host: "your-server.com", application: "live", port: 443, ssl: true }
    ],
    streamKey: "your-stream"
  },
  settings: {
    autoStart: true,
    video: {
      containerID: "video-container",
      aspectRatio: "16:9",
      width: "100%"
    }
  }
});

player.addEventListener("playbackStart", () => console.log("Playing!"));
player.initialize();
```

```html
<div id="video-container"></div>
```

## Module Formats

Available as **ESM**, **IIFE**, **UMD**, and **CJS**. TypeScript definitions included.

## Documentation

- [Configuration](https://docs.stormstreaming.com/player-core/configuration)
- [API Reference](https://docs.stormstreaming.com/player-core/api)
- [Events](https://docs.stormstreaming.com/player-core/events)
- [Examples](https://docs.stormstreaming.com/player-core/examples)

## Browser Support

Chrome 31+ · Firefox 42+ · Safari 13+ · Edge 12+ · Opera 15+

Legacy browsers fall back to HLS mode.

## Related Packages

| Package | Description |
|---------|-------------|
| [@stormstreaming/player-ui](https://github.com/StormStreaming/player-ui-js) | Full player with UI controls |
| [@stormstreaming/player-react](https://github.com/StormStreaming/player-react-js) | React wrapper |

## License

See [LICENSE](LICENSE.txt)