/*
Copyright 2024 New Vector Ltd.
Copyright 2022 The Matrix.org Foundation C.I.C.
Copyright 2021 Šimon Brandner <simon.bra.ag@gmail.com>

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import { fireEvent, screen } from "jest-matrix-react";
import { RoomMember, User } from "matrix-js-sdk/src/matrix";
import { KnownMembership } from "matrix-js-sdk/src/types";
import { mocked } from "jest-mock";

import { shouldShowComponent } from "../../../../../../src/customisations/helpers/UIComponents";
import defaultDispatcher from "../../../../../../src/dispatcher/dispatcher";
import { Rendered, renderMemberList } from "./common";

jest.mock("../../../../../../src/customisations/helpers/UIComponents", () => ({
    shouldShowComponent: jest.fn(),
}));

type Children = (args: { height: number; width: number }) => React.JSX.Element;
jest.mock("react-virtualized", () => {
    const ReactVirtualized = jest.requireActual("react-virtualized");
    return {
        ...ReactVirtualized,
        AutoSizer: ({ children }: { children: Children }) => children({ height: 1000, width: 1000 }),
    };
});
jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(1500);
jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(1500);

describe("MemberListHeaderView", () => {
    let rendered: Rendered;

    beforeEach(async function () {
        rendered = await renderMemberList(true);
    });

    it("Shows the correct member count", async () => {
        expect(await screen.findByText("6 Members")).toBeVisible();
    });

    it("Does not show search box when there's less than 20 members", async () => {
        expect(screen.queryByPlaceholderText("Filter People...")).toBeNull();
    });

    it("Shows search box when there's more than 20 members", async () => {
        const { memberListRoom, client, reRender } = rendered;
        // Memberlist already has 6 members, add 14 more to make the total 20
        for (let i = 0; i < 14; ++i) {
            const newMember = new RoomMember(memberListRoom.roomId, `@new${i}:localhost`);
            newMember.membership = KnownMembership.Join;
            newMember.powerLevel = 0;
            newMember.user = User.createUser(newMember.userId, client);
            newMember.user.currentlyActive = true;
            newMember.user.presence = "online";
            newMember.user.lastPresenceTs = 1000;
            newMember.user.lastActiveAgo = 10;
            memberListRoom.currentState.members[newMember.userId] = newMember;
        }
        await reRender();
        expect(screen.queryByPlaceholderText("Filter People...")).toBeVisible();
    });

    describe("Invite button functionality", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("Does not render invite button when user is not a member", async () => {});

        it("does not render invite button UI customisation hides invites", async () => {});

        it("Renders disabled invite button when current user is a member but does not have rights to invite", async () => {
            const { memberListRoom, reRender } = rendered;
            jest.spyOn(memberListRoom, "getMyMembership").mockReturnValue(KnownMembership.Join);
            jest.spyOn(memberListRoom, "canInvite").mockReturnValue(false);
            mocked(shouldShowComponent).mockReturnValue(true);
            await reRender();
            expect(screen.getByRole("button", { name: "Invite" })).toHaveAttribute("aria-disabled", "true");
        });

        it("Renders enabled invite button when current user is a member and has rights to invite", async () => {
            const { memberListRoom, reRender } = rendered;
            jest.spyOn(memberListRoom, "getMyMembership").mockReturnValue(KnownMembership.Join);
            jest.spyOn(memberListRoom, "canInvite").mockReturnValue(true);
            mocked(shouldShowComponent).mockReturnValue(true);
            await reRender();
            expect(screen.getByRole("button", { name: "Invite" })).not.toHaveAttribute("aria-disabled", "true");
        });

        it("Opens room inviter on button click", async () => {
            const { memberListRoom, reRender } = rendered;
            jest.spyOn(defaultDispatcher, "dispatch");
            jest.spyOn(memberListRoom, "getMyMembership").mockReturnValue(KnownMembership.Join);
            jest.spyOn(memberListRoom, "canInvite").mockReturnValue(true);
            mocked(shouldShowComponent).mockReturnValue(true);
            await reRender();

            fireEvent.click(screen.getByRole("button", { name: "Invite" }));
            expect(defaultDispatcher.dispatch).toHaveBeenCalledWith({
                action: "view_invite",
                roomId: memberListRoom.roomId,
            });
        });
    });
});
