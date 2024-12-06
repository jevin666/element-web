/*
Copyright 2024 New Vector Ltd.
Copyright 2022 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only
Please see LICENSE files in the repository root for full details.
*/

import { createContext, Dispatch, ReducerState } from "react";

import type { AuthHeaderAction, AuthHeaderReducer } from "./AuthHeaderProvider";

interface AuthHeaderContextType {
    state: ReducerState<AuthHeaderReducer>;
    dispatch: Dispatch<AuthHeaderAction>;
}

export const AuthHeaderContext = createContext<AuthHeaderContextType | undefined>(undefined);
