import type { Types } from "mongoose"

export interface T {
    [key: string]: any
}

export interface StatisticModify {
    _id: Types.ObjectId;
    targetKey: string;
    modifier: number;
}