import { JsonObject, JsonReader } from "config_file.js";
import StarRail from "../../../client/StarRail";
import TextAssets from "../../assets/TextAssets";
import AssetsNotFoundError from "../../../errors/AssetsNotFoundError";
import ImageAssets from "../../assets/ImageAssets";
import CombatType, { CombatTypeId } from "../../CombatType";
import SkillLevel from "./SkillLevel";
import DynamicTextAssets from "../../assets/DynamicTextAssets";

/** @typedef */
export type SkillType = "Normal" | "Ultra" | "MazeNormal" | "Maze" | "BPSkill" | "Talent";

/** @typedef */
export type EffectType = "SingleAttack" | "AoEAttack" | "MazeAttack" | "Enhance" | "Blast" | "Impair" | "Bounce" | "Support" | "Defence" | "Restore";

/**
 * @en Skill
 */
class Skill {
    /**  */
    readonly id: number;
    /**  */
    readonly client: StarRail;

    /**  */
    readonly name: TextAssets;
    /**  */
    readonly effectTypeText: TextAssets;
    /**  */
    readonly skillTypeText: TextAssets;
    /**  */
    readonly combatType: CombatType | null;
    /**  */
    readonly skillType: SkillType;
    /**  */
    readonly effectType: EffectType;
    /**  */
    readonly maxLevel: number;
    /**  */
    readonly skillIcon: ImageAssets;
    /** Available only when [skillType](#skillType) is "Ultra" */
    readonly ultraSkillIcon: ImageAssets;

    readonly _skillsData: JsonObject[];

    /**
     * @param id
     * @param client
     * @param skillIndexToUse
     */
    constructor(id: number, client: StarRail, skillIndexToUse = 0) {
        this.id = id;
        this.client = client;

        const _data: JsonObject | undefined = client.cachedAssetsManager.getStarRailCacheData("AvatarSkillConfig")[this.id];
        if (!_data) throw new AssetsNotFoundError("Skill", this.id);
        this._skillsData = Object.values(_data) as JsonObject[];

        const json = new JsonReader(this._skillsData[skillIndexToUse]);

        this.name = new TextAssets(json.getAsNumber("SkillName", "Hash"), this.client);

        const combatTypeId = json.getAsStringWithDefault(undefined, "StanceDamageType") as CombatTypeId | undefined;
        this.combatType = combatTypeId ? new CombatType(combatTypeId, this.client) : null;

        this.skillType = json.getAsStringWithDefault("Talent", "AttackType") as SkillType;
        this.skillTypeText = new TextAssets(json.getAsNumber("SkillTypeDesc", "Hash"), this.client);

        this.effectType = json.getAsString("SkillEffect") as EffectType;
        this.effectTypeText = new TextAssets(json.getAsNumber("SkillTag", "Hash"), this.client);

        this.maxLevel = json.getAsNumber("MaxLevel");

        this.skillIcon = new ImageAssets(json.getAsString("SkillIcon"), this.client);
        this.ultraSkillIcon = new ImageAssets(json.getAsString("UltraSkillIcon"), this.client);

    }

    /**
     * @param level
     */
    getSkillByLevel(level: SkillLevel): LeveledSkill {
        return new LeveledSkill(this._skillsData[level.value - 1], level, this.client);
    }
}

export default Skill;

/**
 * @en LeveledSkill
 * @extends {Skill}
 */
export class LeveledSkill extends Skill {
    /**  */
    readonly level: SkillLevel;
    /**  */
    readonly paramList: number[];
    /**  */
    readonly simpleParamList: number[];
    /**  */
    readonly description: TextAssets;
    /**  */
    readonly simpleDescription: TextAssets;

    readonly _data: JsonObject;

    /**
     * @param data
     * @param client
     */
    constructor(data: JsonObject, level: SkillLevel, client: StarRail) {
        const json = new JsonReader(data);
        const id = json.getAsNumber("SkillID");
        const totalLevel = json.getAsNumber("Level");
        if (totalLevel !== level.value) throw new Error("data[\"Level\"] must be the same as `level.value`.");

        super(id, client, totalLevel - 1);

        this._data = data;

        this.level = level;

        this.paramList = json.get("ParamList").mapArray((_, v) => v.getAsNumber("Value"));
        this.simpleParamList = json.get("SimpleParamList").mapArray((_, v) => v.getAsNumber("Value"));

        this.description = new DynamicTextAssets(json.getAsNumber("SkillDesc", "Hash"), { paramList: this.paramList }, this.client);
        this.simpleDescription = new DynamicTextAssets(json.getAsNumber("SimpleSkillDesc", "Hash"), { paramList: this.simpleParamList }, this.client);
    }
}