
export interface WaveData {
    wave: number;
    duration: number;
    totalCount: number;
    composition: Record<string, number>;
    flag?: 'HORDE' | 'ELITE' | 'BOSS';
}

export const WAVE_DATA: WaveData[] = [
    { "wave": 1, "duration": 30, "totalCount": 8, "composition": { "baby_alien": 10 } },
    { "wave": 2, "duration": 40, "totalCount": 12, "composition": { "baby_alien": 8 } },
    { "wave": 3, "duration": 40, "totalCount": 18, "composition": { "baby_alien": 5, "chaser": 3 } },
    { "wave": 4, "duration": 50, "totalCount": 24, "composition": { "baby_alien": 4, "chaser": 4, "spitter": 2 } },
    { "wave": 5, "duration": 50, "totalCount": 32, "composition": { "chaser": 5, "spitter": 3 } },
    { "wave": 6, "duration": 60, "totalCount": 40, "composition": { "chaser": 4, "charger": 2 } },
    { "wave": 7, "duration": 60, "totalCount": 48, "composition": { "charger": 3, "bruiser": 2 } },
    { "wave": 8, "duration": 60, "totalCount": 60, "flag": "HORDE", "composition": { "baby_alien": 20, "chaser": 20 } },
    { "wave": 9, "duration": 60, "totalCount": 56, "composition": { "bruiser": 4, "helmet_alien": 4, "spitter": 2 } },
    { "wave": 10, "duration": 60, "totalCount": 64, "flag": "ELITE", "composition": { "bruiser": 3, "helmet_alien": 5, "chaser": 5, "rhino": 1 } },
    { "wave": 11, "duration": 60, "totalCount": 72, "composition": { "chaser": 10, "spitter": 5 } },
    { "wave": 12, "duration": 60, "totalCount": 80, "composition": { "baby_alien": 20, "bruiser": 5, "helmet_alien": 5 } },
    { "wave": 13, "duration": 60, "totalCount": 88, "composition": { "helmet_alien": 8, "charger": 4, "spitter": 4 } },
    { "wave": 14, "duration": 60, "totalCount": 96, "flag": "ELITE", "composition": { "spitter": 6, "monk": 1 } },
    { "wave": 15, "duration": 60, "totalCount": 120, "flag": "HORDE", "composition": { "baby_alien": 40, "chaser": 20 } },
    { "wave": 16, "duration": 70, "totalCount": 112, "composition": { "helmet_alien": 10, "charger": 5, "bruiser": 5 } },
    { "wave": 17, "duration": 70, "totalCount": 128, "composition": { "bruiser": 8, "spitter": 8 } },
    { "wave": 18, "duration": 70, "totalCount": 144, "composition": { "chaser": 10, "spitter": 10, "looter": 1, "charger": 5 } },
    { "wave": 19, "duration": 80, "totalCount": 200, "flag": "HORDE", "composition": { "helmet_alien": 10, "charger": 10, "bruiser": 10, "baby_alien": 70 } },
    { "wave": 20, "duration": 90, "totalCount": 80, "flag": "BOSS", "composition": { "boss_predator": 1, "chaser": 20, "bruiser": 5 } }
];