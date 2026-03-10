import type { ObjectId } from "mongoose"

export interface T {
    [key: string]: any
}

export interface StatisticModify {
    _id: ObjectId;
    targetKey: string;
    modifier: number;
}