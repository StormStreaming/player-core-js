import {QualityControlMode} from "../enum/QualityControlMode";

export type QualityConfig = {
    controlMode?:QualityControlMode
    initialUpgradeTimeout?: number
    maxUpgradeTimeout?: number
}