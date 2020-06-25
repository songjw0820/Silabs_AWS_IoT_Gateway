import { GET_FACILITIES, SET_FACILITIES } from "./actionTypes";
import { uiStartLoading, uiStopLoading, getCurrentUser, sessionExpired, sessionEstablished } from "./rootActions";
import { apiDebug } from '../../../app.json';
import { AsyncStorage } from 'react-native';
import * as Urls from "../../Urls";
import { refreshSession } from "./authActions";

export const setFacilities = (facilities) => {
    facilities.sort(function (a, b) { return b.id - a.id })
    return {
        type: SET_FACILITIES,
        facilities: facilities
    };
};

export const getFacilities = (inBackground, token, appleKey) => {
    return (dispatch) => {
        if (apiDebug) {
            AsyncStorage.getItem('accessToken').then(token => {
                console.log('getFacilities called:' + token);
                if (!inBackground) dispatch(uiStartLoading());
                let parsedRes = [{ "id": 1, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "AP Facility" }, { "id": 5, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "MP Facility" }, { "id": 6, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "KB Facility" }, { "id": 10, "country": "India", "state": "Gujarat", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 123456, "longitude": 0, "latitude": 0, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "SDGFHJKL;", "containers": null, "facility_name": "NP Facility" }]
                setTimeout(() => {
                    dispatch(setFacilities(parsedRes));
                    if (!inBackground) dispatch(uiStopLoading());
                }, 1000);
            });
        }
        else {
            AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN']).then(response => {
                let token = response[0][1];
                let appleKey = response[1][1]
                console.log('Url:' + Urls.GET_ALL_FACILITIES);

                if (!inBackground) dispatch(uiStartLoading());
                let headers =
                    appleKey === 'true' ? {
                        Authorization: token,
                        appleKey
                    } : {
                            Authorization: token
                        }
                fetch(Urls.GET_ALL_FACILITIES,
                    {
                        method: "GET",
                        headers

                    })
                    .catch((error) => {
                        throw new Error("Network error!");
                    })
                    .then(async (res) => {
                        if (res.ok) {
                            if (res.status === 204) {
                                return [];
                            }
                            return res.json();
                        }
                        else if (res.status === 401) {
                            throw new Error("Session Expired")
                        }
                        else {
                            console.log("SESSION CODE----------------------", res.status);

                            if (res.status === 403) {
                                await refreshSession()
                                return [];
                            }
                            else {
                                console.log('--0-0-0-rers', res);

                                throw new Error("Something went wrong while fetching Facilities.. \nStatusCode:" + res.status);
                            }
                        }
                    })
                    .then(parsedRes => {
                        console.log(Urls.GET_ALL_FACILITIES);
                        console.log(JSON.stringify(parsedRes));
                        dispatch(setFacilities(parsedRes));
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
                                    AsyncStorage.getItem('authToken').then((token) => {
                                        dispatch(sessionExpired());
                                        dispatch(refreshSession(appleKey))
                                        dispatch(getFacilities(inBackground, token, appleKey))
                                    })
                                } 
                            }
                        } else {
                            if (!inBackground) {
                                alert(error.message);
                            }
                            console.log(error);
                            if (!inBackground) dispatch(uiStopLoading());
                        }
                    });
            }).catch(error => {
                if (debug) alert(error.message);
            });
        }
    }
};