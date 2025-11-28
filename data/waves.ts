
export interface WaveData {
    wave: number;
    duration: number;
    totalCount: number;
    composition: Record<string, number>;
    flag?: 'HORDE' | 'ELITE' | 'BOSS';
}

export const WAVE_DATA: WaveData[] = [
    { "wave": 1, "duration": 30, "totalCount": 20, "composition": { "baby_alien": 10 } },
    { "wave": 2, "duration": 40, "totalCount": 30, "composition": { "baby_alien": 8, "fly": 2 } },
    { "wave": 3, "duration": 40, "totalCount": 45, "composition": { "baby_alien": 5, "chaser": 3, "fly": 2 } },
    { "wave": 4, "duration": 50, "totalCount": 60, "composition": { "baby_alien": 4, "chaser": 4, "spitter": 2 } },
    { "wave": 5, "duration": 50, "totalCount": 80, "composition": { "chaser": 5, "spitter": 3, "fly": 2 } },
    { "wave": 6, "duration": 60, "totalCount": 100, "composition": { "chaser": 4, "charger": 2, "fly": 4 } },
    { "wave": 7, "duration": 60, "totalCount": 120, "composition": { "charger": 3, "fly": 3, "bruiser": 2 } },
    { "wave": 8, "duration": 60, "totalCount": 150, "flag": "HORDE", "composition": { "baby_alien": 20, "chaser": 20, "fly": 10 } },
    { "wave": 9, "duration": 60, "totalCount": 140, "composition": { "bruiser": 4, "helmet_alien": 4, "spitter": 2 } },
    { "wave": 10, "duration": 60, "totalCount": 160, "flag": "ELITE", "composition": { "bruiser": 3, "helmet_alien": 5, "chaser": 5, "rhino": 1 } },
    { "wave": 11, "duration": 60, "totalCount": 180, "composition": { "chaser": 10, "spitter": 5, "fly": 5 } },
    { "wave": 12, "duration": 60, "totalCount": 200, "composition": { "baby_alien": 20, "bruiser": 5, "helmet_alien": 5 } },
    { "wave": 13, "duration": 60, "totalCount": 220, "composition": { "helmet_alien": 8, "charger": 4, "spitter": 4 } },
    { "wave": 14, "duration": 60, "totalCount": 240, "flag": "ELITE", "composition": { "spitter": 6, "fly": 6, "monk": 1 } },
    { "wave": 15, "duration": 60, "totalCount": 300, "flag": "HORDE", "composition": { "fly": 40, "baby_alien": 40, "chaser": 20 } },
    { "wave": 16, "duration": 70, "totalCount": 280, "composition": { "helmet_alien": 10, "charger": 5, "bruiser": 5 } },
    { "wave": 17, "duration": 70, "totalCount": 320, "composition": { "fly": 15, "bruiser": 8, "spitter": 8 } },
    { "wave": 18, "duration": 70, "totalCount": 360, "composition": { "chaser": 10, "spitter": 10, "looter": 1, "charger": 5 } },
    { "wave": 19, "duration": 80, "totalCount": 500, "flag": "HORDE", "composition": { "helmet_alien": 10, "charger": 10, "bruiser": 10, "baby_alien": 70 } },
    { "wave": 20, "duration": 90, "totalCount": 200, "flag": "BOSS", "composition": { "boss_predator": 1, "chaser": 20, "fly": 10, "bruiser": 5 } }
];
