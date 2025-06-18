import { Entity } from "./entity.interface";

interface UpdateMessage {
    actionId: string;
    entityType: string;
    rows: Entity[];
}

export { UpdateMessage };