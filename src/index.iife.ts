import { StormPlayerCore } from "./StormPlayerCore";
import { StormStreamConfig } from "./types/StormStreamConfig";

export default function(config:StormStreamConfig):StormPlayerCore{
    return new StormPlayerCore(config);
}