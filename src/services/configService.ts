import fs from "fs";
import path from "path";
import { repoDir } from "../helpers/pathHelper.ts";
import { args } from "../helpers/commandLineArguments.ts";
import { Inbox } from "../models/inboxModel.ts";
import type { Request } from "express";
import { Account } from "../models/loginModel.ts";
import { z } from "zod";

const regionIdSchema = z.enum(["ASIA", "OCEANIA", "EUROPE", "RUSSIA", "NORTH_AMERICA", "SOUTH_AMERICA"]);

const hubServerSchema = z.object({
    address: z.string(),
    regions: z.array(regionIdSchema).optional(),
    dtlsUnsupported: z.boolean().optional()
});

const worldStateSchema = z.object({
    creditBoost: z.boolean().optional(),
    affinityBoost: z.boolean().optional(),
    resourceBoost: z.boolean().optional(),
    tennoLiveRelay: z.boolean().optional(),
    baroTennoConRelay: z.boolean().optional(),
    baroAlwaysAvailable: z.boolean().optional(),
    baroFullyStocked: z.boolean().optional(),
    baroRelayOverride: z.number().optional(),
    evilBaroStage: z.number().optional(),
    varziaFullyStocked: z.boolean().optional(),
    vanguardVaultRelics: z.boolean().optional(),
    wolfHunt: z.number().optional(),
    scarletSpear: z.boolean().optional(),
    orphixVenom: z.boolean().optional(),
    bloodOfPerita: z.boolean().optional(),
    longShadow: z.boolean().optional(),
    hallowedFlame: z.boolean().optional(),
    anniversary: z.number().optional(),
    hallowedNightmares: z.boolean().optional(),
    hallowedNightmaresRewardsOverride: z.number().optional(),
    naberusNightsOverride: z.boolean().optional(),
    proxyRebellion: z.boolean().optional(),
    proxyRebellionRewardsOverride: z.number().optional(),
    voidCorruption2025Week1: z.boolean().optional(),
    voidCorruption2025Week2: z.boolean().optional(),
    voidCorruption2025Week3: z.boolean().optional(),
    voidCorruption2025Week4: z.boolean().optional(),
    dagathAlerts2026Week1: z.boolean().optional(),
    dagathAlerts2026Week2: z.boolean().optional(),
    dagathAlerts2026Week3: z.boolean().optional(),
    dagathAlerts2026Week4: z.boolean().optional(),
    starDaysAlerts2026Week1: z.boolean().optional(),
    starDaysAlerts2026Week2: z.boolean().optional(),
    starDaysAlerts2026Week3: z.boolean().optional(),
    starDaysAlerts2026Week4: z.boolean().optional(),
    qtccAlerts: z.boolean().optional(),
    galleonOfGhouls: z.number().optional(),
    ghoulEmergenceOverride: z.boolean().optional(),
    plagueStarOverride: z.boolean().optional(),
    starDaysOverride: z.boolean().optional(),
    saintPatrickOverride: z.boolean().optional(),
    dogDaysOverride: z.boolean().optional(),
    dogDaysRewardsOverride: z.number().optional(),
    bellyOfTheBeast: z.boolean().optional(),
    bellyOfTheBeastProgressOverride: z.number().optional(),
    eightClaw: z.boolean().optional(),
    eightClawProgressOverride: z.number().optional(),
    thermiaFracturesOverride: z.boolean().optional(),
    thermiaFracturesProgressOverride: z.number().optional(),
    eidolonOverride: z.string().optional(),
    vallisOverride: z.string().optional(),
    duviriOverride: z.string().optional(),
    nightwaveOverride: z.string().optional(),
    nightwaveEpisode: z.number().optional(),
    allTheFissures: z.string().optional(),
    varziaOverride: z.string().optional(),
    circuitGameModes: z.array(z.string()).optional(),
    darvoStockMultiplier: z.number().optional()
});

const configSchema = z.object({
    mongodbUrl: z.string(),
    logger: z.object({
        files: z.boolean(),
        level: z.string()
    }),
    myAddress: z.string(),
    bindAddress: z.string().optional(),
    httpPort: z.number().optional(),
    httpsPort: z.number().optional(),
    httpsCertFile: z.string().optional(),
    httpsKeyFile: z.string().optional(),
    ircExecutable: z.string().optional(),
    ircAddress: z.string().optional(),
    hubExecutable: z.string().optional(),
    hubAddress: z.string().optional(),
    hubServers: z.array(hubServerSchema).optional(),
    noHubDiscrimination: z.boolean().optional(),
    nrsAddress: z.string().optional(),
    nrsAddresses: z.array(z.string()).optional(),
    dtls: z.number().optional(),
    administratorNames: z.array(z.string()).optional(),
    autoCreateAccount: z.boolean().optional(),
    skipTutorial: z.boolean().optional(),
    fullyStockedVendors: z.boolean().optional(),
    skipClanKeyCrafting: z.boolean().optional(),
    webui: z
        .object({
            enabled: z.boolean().optional(),
            defaultLanguage: z.string().optional()
        })
        .optional(),
    unfaithfulBugFixes: z
        .object({
            ignore1999LastRegionPlayed: z.boolean().optional(),
            fixXtraCheeseTimer: z.boolean().optional(),
            useAnniversaryTagForOldGoals: z.boolean().optional()
        })
        .optional(),
    worldState: worldStateSchema.optional(),
    tunables: z
        .object({
            useLoginToken: z.boolean().optional(),
            prohibitSkipMissionStartTimer: z.boolean().optional(),
            prohibitDisableProfanityFilter: z.boolean().optional(),
            prohibitFovOverride: z.boolean().optional(),
            prohibitFreecam: z.boolean().optional(),
            prohibitTeleport: z.boolean().optional(),
            prohibitScripts: z.boolean().optional(),
            motd: z.string().optional(),
            udpProxyUpstream: z.string().optional()
        })
        .optional(),
    dev: z
        .object({
            keepVendorsExpired: z.boolean().optional()
        })
        .optional()
});

export type IHubServer = z.infer<typeof hubServerSchema>;
export type IConfig = z.infer<typeof configSchema>;

export const configRemovedOptionsKeys = [
    "unlockallShipFeatures",
    "testQuestKey",
    "lockTime",
    "starDays",
    "platformCDNs",
    "completeAllQuests",
    "worldSeed",
    "unlockAllQuests",
    "unlockAllMissions",
    "version",
    "matchmakingBuildId",
    "buildLabel",
    "infiniteResources",
    "testMission",
    "skipStoryModeChoice",
    "NRS",
    "myIrcAddresses",
    "skipAllDialogue",
    "infiniteCredits",
    "infinitePlatinum",
    "infiniteEndo",
    "infiniteRegalAya",
    "infiniteHelminthMaterials",
    "claimingBlueprintRefundsIngredients",
    "dontSubtractPurchaseCreditCost",
    "dontSubtractPurchasePlatinumCost",
    "dontSubtractPurchaseItemCost",
    "dontSubtractPurchaseStandingCost",
    "dontSubtractVoidTraces",
    "dontSubtractConsumables",
    "universalPolarityEverywhere",
    "unlockDoubleCapacityPotatoesEverywhere",
    "unlockExilusEverywhere",
    "unlockArcanesEverywhere",
    "unlockAllProfitTakerStages",
    "unlockAllSimarisResearchEntries",
    "unlockAllScans",
    "unlockAllShipFeatures",
    "unlockAllCapturaScenes",
    "noDailyStandingLimits",
    "noDailyFocusLimit",
    "noArgonCrystalDecay",
    "noMasteryRankUpCooldown",
    "noVendorPurchaseLimits",
    "noDecoBuildStage",
    "noDeathMarks",
    "noKimCooldowns",
    "syndicateMissionsRepeatable",
    "instantFinishRivenChallenge",
    "instantResourceExtractorDrones",
    "noResourceExtractorDronesDamage",
    "baroAlwaysAvailable",
    "baroFullyStocked",
    "missionsCanGiveAllRelics",
    "exceptionalRelicsAlwaysGiveBronzeReward",
    "flawlessRelicsAlwaysGiveSilverReward",
    "radiantRelicsAlwaysGiveGoldReward",
    "disableDailyTribute",
    "noDojoRoomBuildStage",
    "noDojoDecoBuildStage",
    "fastDojoRoomDestruction",
    "noDojoResearchCosts",
    "noDojoResearchTime",
    "fastClanAscension",
    "unlockAllSkins",
    "unlockAllFlavourItems",
    "unlockAllShipDecorations",
    "unlockAllDecoRecipes",
    "spoofMasteryRank",
    "relicRewardItemCountMultiplier",
    "nightwaveStandingMultiplier"
];
if (args.docker) {
    configRemovedOptionsKeys.push("bindAddress");
    configRemovedOptionsKeys.push("httpPort");
    configRemovedOptionsKeys.push("httpsPort");
}

export const configPath = path.join(repoDir, args.configPath ?? "config.json");

export const config: IConfig = {
    mongodbUrl: "mongodb://127.0.0.1:27017/openWF",
    logger: {
        files: true,
        level: "trace"
    },
    myAddress: "localhost"
};

export const loadConfig = (): void => {
    const rawConfig: unknown = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const parsedConfig = configSchema.safeParse(rawConfig);

    if (!parsedConfig.success) {
        const validationErrors = parsedConfig.error.errors
            .map(error => `${error.path.join(".") || "<root>"}: ${error.message}`)
            .join("; ");
        throw new Error(`Invalid config schema: ${validationErrors}`);
    }

    const newConfig = parsedConfig.data;

    // Set all values to undefined now so if the new config.json omits some fields that were previously present, it's correct in-memory.
    for (const key of Object.keys(config)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (config as any)[key] = undefined;
    }

    Object.assign(config, newConfig);
};

export const syncConfigWithDatabase = (): void => {
    // Event messages are deleted after endDate. Since we don't use beginDate/endDate and instead have config toggles, we need to delete the messages once those bools are false.
    // Also, for some reason, I can't just do `Inbox.deleteMany(...)`; - it needs this whole circus.
    if (!config.worldState?.creditBoost) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_creditBoost: 1 } }).then(() => {});
        void Inbox.deleteMany({ globaUpgradeId: "5b23106f283a555109666672" }).then(() => {});
    }
    if (!config.worldState?.affinityBoost) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_affinityBoost: 1 } }).then(() => {});
        void Inbox.deleteMany({ globaUpgradeId: "5b23106f283a555109666673" }).then(() => {});
    }
    if (!config.worldState?.resourceBoost) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_resourceBoost: 1 } }).then(() => {});
        void Inbox.deleteMany({ globaUpgradeId: "5b23106f283a555109666674" }).then(() => {});
    }
    if (!config.worldState?.galleonOfGhouls) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_galleonOfGhouls: 1 } }).then(() => {});
        void Inbox.deleteMany({ goalTag: "GalleonRobbery" }).then(() => {});
    }
    if (!config.worldState?.longShadow) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_longShadow: 1 } }).then(() => {});
        void Inbox.deleteMany({ goalTag: "NightwatchTacAlert" }).then(() => {});
    }
};

export const getReflexiveAddress = (request: Request): { myAddress: string; myUrlBase: string } => {
    let myAddress: string;
    let myUrlBase: string = request.protocol + "://";
    if (request.host.indexOf("warframe.com") == -1) {
        // Client request was redirected cleanly, so we know it can reach us how it's reaching us now.
        myAddress = request.hostname;
        myUrlBase += request.host;
    } else {
        // Don't know how the client reached us, hoping the config does.
        myAddress = config.myAddress;
        myUrlBase += myAddress;
        const port: number = request.protocol == "http" ? config.httpPort || 80 : config.httpsPort || 443;
        if (port != (request.protocol == "http" ? 80 : 443)) {
            myUrlBase += ":" + port;
        }
    }
    return { myAddress, myUrlBase };
};

export interface IWebServerParams {
    address: string;
    httpPort: number;
    httpsPort: number;
    certFile: string;
    keyFile: string;
}

export const getWebServerParams = (): IWebServerParams => {
    return {
        address: config.bindAddress || "0.0.0.0",
        httpPort: config.httpPort || 80,
        httpsPort: config.httpsPort || 443,
        certFile: config.httpsCertFile || "static/cert/cert.pem",
        keyFile: config.httpsKeyFile || "static/cert/key.pem"
    };
};

export const getNrsAddresses = (): [string, number][] => {
    return (config.nrsAddresses ?? []).map(nrsAddr => {
        nrsAddr = nrsAddr.split("%THIS_MACHINE%").join("127.0.0.1");
        let nrsPort = 4950;
        const colon = nrsAddr.indexOf(":");
        if (colon != -1) {
            nrsPort = parseInt(nrsAddr.substring(colon + 1));
            nrsAddr = nrsAddr.substring(0, colon);
        }
        return [nrsAddr, nrsPort];
    });
};
