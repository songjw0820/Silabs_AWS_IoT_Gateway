import { SET_GROWSECTIONS, SET_GROWSECTIONS_BY_GROWAREA_ID } from "./actionTypes";
import { uiStartLoading, uiStopLoading, authGetToken, refreshSession, sessionExpired, sessionEstablished } from "./rootActions";
import { AsyncStorage } from 'react-native';
import * as Urls from "../../Urls";
import { apiDebug } from '../../../app.json';

export const setGrowSections = (growsections) => {
    growsections.sort(function (a, b) { return b.id - a.id })
    return {
        type: SET_GROWSECTIONS,
        growsections: growsections
    };
};

export const setGrowSectionsByGrowAreaId = (growAreaId, growsectionsByGrowAreaId) => {
    growsectionsByGrowAreaId.sort(function (a, b) { return b.id - a.id })
    return {
        type: SET_GROWSECTIONS_BY_GROWAREA_ID,
        growsectionsByGrowAreaId: growsectionsByGrowAreaId,
        growAreaId: growAreaId
    }
}

export const getGrowSections = (growAreaId, inBackground) => {

    if (apiDebug) {
        if (growAreaId) {
            return dispatch => {
                if (!inBackground) dispatch(uiStartLoading());
                let parsedRes = [{ "id": 101, "grow_section_name": "MyGrowSection" }, { "id": 102, "grow_section_name": "MyGrowSection2" }]
                for (var i = 0; i > parsedRes.length; i++) {
                    parsedRes[i].growarea.id = growAreaId;
                }
                setTimeout(() => {
                    dispatch(setGrowSectionsByGrowAreaId(growAreaId, parsedRes));
                    if (!inBackground) dispatch(uiStopLoading());
                }, 1500);
            }
        }
        else {
            return dispatch => {
                if (!inBackground) dispatch(uiStartLoading());
                let parsedRes = [{ "id": 101, "grow_section_name": "MyGrowSection" }, { "id": 102, "grow_section_name": "MyGrowSection2" }, { "id": 103, "grow_section_name": "MyGrowSection3" }, { "id": 104, "grow_section_name": "MyGrowSection4" }]
                setTimeout(() => {
                    dispatch(setGrowSections(parsedRes));
                    if (!inBackground) dispatch(uiStopLoading());
                }, 1500);
            }
        }
    }

    let url = Urls.GET_ALL_GROW_SECTIONS
    if (growAreaId) {
        url = url + "/growareas/" + growAreaId;
    }

    return (dispatch, getState) => {
        AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN']).then(response => {
            let token = response[0][1];
            let appleKey = response[1][1]
            console.log('getFacilities called:' + token);
            if (!inBackground) dispatch(uiStartLoading());
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
            } : {
                    Authorization: token
                };
            fetch(url,
                {
                    method: "GET",
                    headers

                })
                .catch((error) => {
                    throw new Error("Network error!");
                })
                .then(res => {
                    if (res.ok) {
                        if (res.status === 204) {
                            return [];
                        }
                        console.log(url);
                        return res.json();
                    }
                    else if (res.status === 401) {
                        throw new Error("Session Expired")
                    } else {
                        throw new Error("Something went wrong while fetching GrowSections.. \nStatusCode:" + res.status);
                    }
                })
                .then(parsedRes => {
                    console.log(url);
                    console.log(JSON.stringify(parsedRes));
                    if (growAreaId) {
                        dispatch(setGrowSectionsByGrowAreaId(growAreaId, parsedRes));
                    }
                    else {
                        dispatch(setGrowSections(parsedRes));
                    }
                    if (!inBackground) dispatch(uiStopLoading());
                    dispatch(sessionEstablished())
                })
                .catch(error => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(uiStopLoading());
                            return null
                        } else {
                            if (appleKey === 'false') {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(getGrowSections(growAreaId, inBackground))
                            } 
                        }
                    } else {
                        if (!inBackground) alert(error.message);
                        console.log(error);
                        if (!inBackground) dispatch(uiStopLoading());
                    }

                });
        });
    }
};