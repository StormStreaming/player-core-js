export type StatisticsInfo = {
    connectionCompletionTime:number;
    authenticateRequestTime:number;
    subscriptionRequestTime: number;
    playbackRequestTime:number;
    totalRequestTime:number;
    playbackStartTime:number;
    currentBandwidth:number;
    currentBufferSize:number;
}