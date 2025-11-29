
export interface WaveData {
    wave: number;
    duration: number;
    totalCount: number;
    composition: Record<string, number>;
    flag?: 'HORDE' | 'ELITE' | 'BOSS';
}

export const WAVE_DATA: WaveData[] = [
    { "wave": 1, "duration": 30, "totalCount": 100, "composition": { "baby_alien": 1.0 } },
    { "wave": 2, "duration": 40, "totalCount": 120, "composition": { "baby_alien": 0.8, "chaser": 0.2 } },
    { "wave": 3, "duration": 40, "totalCount": 140, "composition": { "baby_alien": 0.5, "chaser": 0.5 } },
    { "wave": 4, "duration": 50, "totalCount": 170, "composition": { "baby_alien": 0.4, "chaser": 0.4, "spitter": 0.2 } },
    { "wave": 5, "duration": 50, "totalCount": 175, "composition": { "chaser": 0.6, "spitter": 0.3, "helmet_alien": 0.1 } },
    { "wave": 6, "duration": 60, "totalCount": 200, "composition": { "chaser": 0.4, "charger": 0.3, "helmet_alien": 0.3 } },
    { "wave": 7, "duration": 60, "totalCount": 220, "composition": { "charger": 0.5, "bruiser": 0.3, "spitter": 0.2 } },
    { "wave": 8, "duration": 60, "totalCount": 350, "flag": "HORDE", "composition": { "baby_alien": 0.7, "chaser": 0.3 } },
    { "wave": 9, "duration": 60, "totalCount": 260, "composition": { "bruiser": 0.4, "helmet_alien": 0.4, "spitter": 0.2, "looter": 0.05 } },
    { "wave": 10, "duration": 60, "totalCount": 280, "flag": "ELITE", "composition": { "bruiser": 0.3, "helmet_alien": 0.3, "chaser": 0.3, "rhino": 0.1 } },
    { "wave": 11, "duration": 60, "totalCount": 320, "composition": { "chaser": 0.5, "spitter": 0.5 } },
    { "wave": 12, "duration": 60, "totalCount": 360, "composition": { "baby_alien": 0.2, "bruiser": 0.4, "helmet_alien": 0.4 } },
    { "wave": 13, "duration": 60, "totalCount": 400, "composition": { "helmet_alien": 0.5, "charger": 0.3, "spitter": 0.2 } },
    { "wave": 14, "duration": 60, "totalCount": 440, "flag": "ELITE", "composition": { "charger": 0.4, "spitter": 0.4, "monk": 0.2 } },
    { "wave": 15, "duration": 60, "totalCount": 600, "flag": "HORDE", "composition": { "baby_alien": 0.5, "chaser": 0.5 } },
    { "wave": 16, "duration": 70, "totalCount": 500, "composition": { "helmet_alien": 0.4, "charger": 0.3, "bruiser": 0.3 } },
    { "wave": 17, "duration": 70, "totalCount": 560, "composition": { "bruiser": 0.6, "spitter": 0.4 } },
    { "wave": 18, "duration": 70, "totalCount": 640, "composition": { "chaser": 0.3, "spitter": 0.3, "looter": 0.05, "charger": 0.35 } },
    { "wave": 19, "duration": 80, "totalCount": 1000, "flag": "HORDE", "composition": { "helmet_alien": 0.3, "charger": 0.2, "bruiser": 0.1, "baby_alien": 0.4 } },
    { "wave": 20, "duration": 90, "totalCount": 81, "flag": "BOSS", "composition": { "boss_predator": 0.0125, "bruiser": 0.4, "charger": 0.3, "helmet_alien": 0.2875 } }
];
