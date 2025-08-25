import { toOid } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Friendship } from "../../models/friendModel.ts";
import { addAccountDataToFriendInfo, addInventoryDataToFriendInfo } from "../../services/friendService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IFriendInfo } from "../../types/friendTypes.ts";
import type { RequestHandler } from "express";

export const addFriendController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<IAddFriendRequest>(String(req.body));
    const promises: Promise<void>[] = [];
    const newFriends: IFriendInfo[] = [];
    if (payload.friend == "all") {
        const [internalFriendships, externalFriendships] = await Promise.all([
            Friendship.find({ owner: accountId }, "friend"),
            Friendship.find({ friend: accountId }, "owner")
        ]);
        for (const externalFriendship of externalFriendships) {
            if (!internalFriendships.find(x => x.friend.equals(externalFriendship.owner))) {
                promises.push(
                    Friendship.insertOne({
                        owner: accountId,
                        friend: externalFriendship.owner,
                        Note: externalFriendship.Note // TOVERIFY: Should the note be copied when accepting a friend request?
                    }) as unknown as Promise<void>
                );
                newFriends.push({
                    _id: toOid(externalFriendship.owner)
                });
            }
        }
    } else {
        const externalFriendship = await Friendship.findOne({ owner: payload.friend, friend: accountId }, "Note");
        if (externalFriendship) {
            promises.push(
                Friendship.insertOne({
                    owner: accountId,
                    friend: payload.friend,
                    Note: externalFriendship.Note
                }) as unknown as Promise<void>
            );
            newFriends.push({
                _id: { $oid: payload.friend }
            });
        }
    }
    for (const newFriend of newFriends) {
        promises.push(addAccountDataToFriendInfo(newFriend));
        promises.push(addInventoryDataToFriendInfo(newFriend));
    }
    await Promise.all(promises);
    res.json({
        Friends: newFriends
    });
};

interface IAddFriendRequest {
    friend: string; // oid or "all" in which case all=1 is also a query parameter
}
