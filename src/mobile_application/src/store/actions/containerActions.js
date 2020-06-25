import { SET_CONTAINERS, SET_CONTAINERS_BY_FACILITY_ID } from "./actionTypes";
import { uiStartLoading, uiStopLoading, refreshSession, sessionExpired, sessionEstablished } from "./rootActions";
import { apiDebug } from '../../../app.json';
import { AsyncStorage, Alert } from 'react-native';
import * as Urls from '../../Urls';

export const setContainers = (containers) => {
    containers.sort(function (a, b) { return b.id - a.id })
    return {
        type: SET_CONTAINERS,
        containers: containers
    };
};

export const setContainersByFacilityId = (facilityId, containersByFacilityId, showAlertFlag) => {
    containersByFacilityId.sort(function (a, b) { return b.id - a.id })
    console.log("Setting " + containersByFacilityId.length + " containers in facility " + facilityId, showAlertFlag);
    return {
        type: SET_CONTAINERS_BY_FACILITY_ID,
        containersByFacilityId: containersByFacilityId,
        facilityId: facilityId,
        showAlert: containersByFacilityId.length === 0 && showAlertFlag ? true : false
    }
}

export const getContainers = (facilityId, inBackground, showAlert, token, appleKey) => {
    if (apiDebug) {
        if (facilityId) {
            return dispatch => {
                if (!inBackground) dispatch(uiStartLoading());
                let parsedRes = [{ "id": 59, "description": "asdf", "container_name": "KB Floor 1 Container", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 1, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "KB Facility" }, "grow_areas": null }, { "id": 60, "description": "asdf", "container_name": "KB Floor 2 Container", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 1, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "KB Facility" }, "grow_areas": null }]
                for (var i = 0; i > parsedRes.length; i++) {
                    parsedRes[i].facility.id = facilityId;
                }
                setTimeout(() => {
                    dispatch(setContainersByFacilityId(facilityId, parsedRes));
                    if (!inBackground) dispatch(uiStopLoading());
                }, 1000);
            }
        }
        else {
            return dispatch => {
                if (!inBackground) dispatch(uiStartLoading());
                let parsedRes = [{ "id": 59, "description": "asdf", "container_name": "KB Floor 1 Container", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 1, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "KB Facility" }, "grow_areas": null }, { "id": 60, "description": "asdf", "container_name": "KB Floor 2 Container", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 1, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "KB Facility" }, "grow_areas": null }, { "id": 41, "description": "ASFDGFHB", "container_name": "MP Floor 5 Container", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 6, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 6" }, "grow_areas": null }, { "id": 53, "description": "asdgfghh", "container_name": "MP Floor 7 Container", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 5, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 2" }, "grow_areas": null }, { "id": 58, "description": "sdf", "container_name": "AP 1st bldg Container", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 5, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 2" }, "grow_areas": null }, { "id": 61, "description": "asdf", "container_name": "AP 7th bldg Container", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 1, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 1" }, "grow_areas": null }]
                setTimeout(() => {
                    dispatch(setContainers(parsedRes));
                    if (!inBackground) dispatch(uiStopLoading());
                }, 1000);
            }
        }
    }

    let url = Urls.GET_ALL_CONTAINERS
    if (facilityId) {
        url = url + "/facilities/" + facilityId;
    }
    console.log("Calling " + url);
    return (dispatch) => {
        AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN']).then(response => {
            let token = response[0][1];
            let appleKey = response[1][1]
            console.log('getContainers called:' + token);
            console.log('Url:' + url);
            if (!inBackground) dispatch(uiStartLoading());
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey
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
                        return res.json();
                    }
                    else if (res.status === 401) {
                        throw new Error("Session Expired")
                    }
                    else {
                        throw new Error("Something went wrong while fetching Containers.. \nStatusCode:" + res.status);
                    }
                })
                .then(parsedRes => {
                    console.log(url);
                    if (facilityId) {
                        dispatch(setContainersByFacilityId(facilityId, parsedRes, showAlert, token, appleKey));
                    }
                    else {
                        dispatch(setContainers(parsedRes));
                    }
                    if (!inBackground) dispatch(uiStopLoading());
                    dispatch(sessionEstablished())
                })
                .catch(error => {
                    if (error.message === "Session Expired") {
                        console.log('token-==-=-=-=', token);

                        if (token === 'sign out') {
                            dispatch(uiStopLoading());
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(getContainers(facilityId, inBackground, token, appleKey))
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
        });
    }
};