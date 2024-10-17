import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { logger } from "@/src/utils/logger";

const rootDir = path.join(__dirname, "../..");
const repoDir = path.basename(rootDir) == "build" ? path.join(rootDir, "..") : rootDir;
const configPath = path.join(repoDir, "config.json");
export const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as IConfig;

let amnesia = false;
fs.watchFile(configPath, () => {
    if (amnesia) {
        amnesia = false;
    } else {
        logger.info("Detected a change to config.json, reloading its contents.");
        Object.assign(config, JSON.parse(fs.readFileSync(configPath, "utf-8")));
    }
});

interface IConfig {
    mongodbUrl: string;
    logger: ILoggerConfig;
    myAddress: string;
    httpPort?: number;
    httpsPort?: number;
    myIrcAddresses?: string[];
    autoCreateAccount?: boolean;
    skipStoryModeChoice?: boolean;
    skipTutorial?: boolean;
    skipAllDialogue?: boolean;
    unlockAllScans?: boolean;
    unlockAllMissions?: boolean;
    unlockAllQuests?: boolean;
    completeAllQuests?: boolean;
    infiniteResources?: boolean;
    unlockAllShipFeatures?: boolean;
    unlockAllShipDecorations?: boolean;
    unlockAllFlavourItems?: boolean;
    unlockAllSkins?: boolean;
    universalPolarityEverywhere?: boolean;
    spoofMasteryRank?: number;
}

interface ILoggerConfig {
    files: boolean;
    level: string; // "fatal" | "error" | "warn" | "info" | "http" | "debug" | "trace";
}

export const updateConfig = async (data: string): Promise<void> => {
    amnesia = true;
    await fsPromises.writeFile(configPath, data);
    Object.assign(config, JSON.parse(data));
};
