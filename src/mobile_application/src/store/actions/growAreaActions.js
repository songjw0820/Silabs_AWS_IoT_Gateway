import { SET_GROWAREAS, SET_GROWAREAS_BY_CONTAINER_ID, DELETE_GATEWAY, GET_ALL_GATEWAYS, SET_GROWAREA_TYPES, SET_COUNT_BY_GROWAREA_ID } from "./actionTypes";
import { uiStartLoading, uiStopLoading, countUiStartLoading, countUiStopLoading, refreshSession, sessionExpired, sessionEstablished } from "./rootActions";
import { AsyncStorage } from 'react-native';
import * as Urls from '../../Urls';
import { apiDebug } from '../../../app.json';


export const setGrowAreas = (growareas) => {
    growareas.sort(function (a, b) { return b.id - a.id })
    return {
        type: SET_GROWAREAS,
        growareas: growareas
    };
};

export const setGrowAreasByContainerId = (containerId, growareasByContainerId) => {
    growareasByContainerId.sort(function (a, b) { return b.id - a.id })
    return {
        type: SET_GROWAREAS_BY_CONTAINER_ID,
        growareasByContainerId: growareasByContainerId,
        containerId: containerId
    }
}

export const setGrowAreaTypes = (growAreaTypes) => {
    growAreaTypes.sort(function (a, b) { return b.id - a.id })
    return {
        type: SET_GROWAREA_TYPES,
        growAreaTypes: growAreaTypes
    }
}

export const setCountsByGrowAreaId = (growAreaId, countsByGrowAreaId) => {
    return {
        type: SET_COUNT_BY_GROWAREA_ID,
        growAreaId: growAreaId,
        countsByGrowAreaId: countsByGrowAreaId
    }
}

export const getGrowAreas = (containerId, inBackground, isLessThenVersion4, token, appleKey) => {

    if (apiDebug) {
        if (containerId) {
            return dispatch => {
                if (!inBackground) dispatch(uiStartLoading());
                let parsedRes = [{ "id": 101, "container": { "id": 59, "description": "asdf", "container_name": "aaaaaaaacccc", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 1, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 1" }, "grow_areas": null }, "description": "MyGrowArea", "layout": null, "grow_area_name": "Grow_house_cloud_1", "grow_area_type": { "id": 1, "grow_area_type_name": "Standard" }, "mac_id": "6B:6F:D8:55:F0:1E", "grow_area_hid": "c86311ce650353004e7ba2283fe2a33f6444fa98", "grow_area_uid": "6B:6F:D8:55:F0:1E" }, { "id": 102, "container": { "id": 59, "description": "asdf", "container_name": "aaaaaaaacccc", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 1, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 1" }, "grow_areas": null }, "description": "Description", "layout": null, "grow_area_name": "Grow_house_cloud_2", "grow_area_type": { "id": 1, "grow_area_type_name": "Standard" }, "mac_id": "6B:6F:D8:55:F0:1E", "grow_area_hid": "c86311ce650353004e7ba2283fe2a33f6444fa98", "grow_area_uid": "6B:6F:D8:55:F0:1E" }, { "id": 103, "container": { "id": 59, "description": "asdf", "container_name": "aaaaaaaacccc", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 1, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 1" }, "grow_areas": null }, "description": "Description", "layout": null, "grow_area_name": "Grow_house_cloud_2", "grow_area_type": { "id": 1, "grow_area_type_name": "Standard" }, "mac_id": "6B:6F:D8:55:F0:1E", "grow_area_hid": "c86311ce650353004e7ba2283fe2a33f6444fa98", "grow_area_uid": "6B:6F:D8:55:F0:1E" }, { "id": 104, "container": { "id": 59, "description": "asdf", "container_name": "aaaaaaaacccc", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 1, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 1" }, "grow_areas": null }, "description": "Description", "layout": null, "grow_area_name": "Grow_house_cloud_3", "grow_area_type": { "id": 1, "grow_area_type_name": "Standard" }, "mac_id": "6B:6F:D8:55:F0:1E", "grow_area_hid": "c86311ce650353004e7ba2283fe2a33f6444fa98", "grow_area_uid": "6B:6F:D8:55:F0:1E" }]
                for (var i = 0; i > parsedRes.length; i++) {
                    parsedRes[i].container.id = containerId;
                }
                setTimeout(() => {
                    dispatch(setGrowAreasByContainerId(containerId, parsedRes));
                    if (!inBackground) dispatch(uiStopLoading());
                }, 1000);
            }
        }
        else {
            return dispatch => {
                if (!inBackground) dispatch(uiStartLoading());
                let parsedRes = [{ "id": 101, "container": { "id": 41, "description": "ASFDGFHB", "container_name": "contaiaSFDF", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 6, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 6" }, "grow_areas": null }, "description": "Description", "layout": null, "grow_area_name": "KB 3rd Floor Bay 1", "grow_area_type": { "id": 1, "grow_area_type_name": "Standard" }, "mac_id": "6C:95:D5:30:86:E9", "grow_area_hid": "4a900469799e06452e8319cd04626074ced4cb12", "grow_area_uid": "6C:95:D5:30:86:E9" }, { "id": 102, "container": { "id": 41, "description": "ASFDGFHB", "container_name": "contaiaSFDF", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 6, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 6" }, "grow_areas": null }, "description": "Description", "layout": null, "grow_area_name": "KB 3rd Floor Bay 2", "grow_area_type": { "id": 1, "grow_area_type_name": "Standard" }, "mac_id": "4F:21:8E:18:E1:41", "grow_area_hid": "9aacdabd1e0397ae5c608b103be98eaa153c77c5", "grow_area_uid": "4F:21:8E:18:E1:41" }, { "id": 72, "container": { "id": 41, "description": "ASFDGFHB", "container_name": "contaiaSFDF", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 6, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 6" }, "grow_areas": null }, "description": "Description", "layout": null, "grow_area_name": "AP Bldg 1 Ground Floor", "grow_area_type": { "id": 1, "grow_area_type_name": "Standard" }, "mac_id": "57:B4:53:72:0B:49", "grow_area_hid": "7b2141834613e3415537cdf37fce3a59c936618c", "grow_area_uid": "57:B4:53:72:0B:49" }, { "id": 74, "container": { "id": 41, "description": "ASFDGFHB", "container_name": "contaiaSFDF", "container_type": { "id": 1, "container_type_name": "Standard" }, "facility": { "id": 6, "country": "USA", "state": "CA", "locality": { "id": 783, "name": "Ahmedabad", "state": { "id": 12, "name": "Gujarat", "country": { "id": 101, "name": "India", "sort_name": "IN" } } }, "zip": 235641, "longitude": 5462.23, "latitude": 10.23, "admin": { "id": 1, "username": "ewrty", "token": null, "user_role": { "id": 5, "role_name": "NormalUser" }, "organization_id": 1, "email_id": "a@dgh.fdgh" }, "description": "demo desc", "containers": null, "facility_name": "Facility 6" }, "grow_areas": null }, "description": "Description", "layout": null, "grow_area_name": "MP 5th Floor Bay 3", "grow_area_type": { "id": 1, "grow_area_type_name": "Standard" }, "mac_id": "7D:07:0B:65:2B:A0", "grow_area_hid": "0542dabfa9e4b477eb4d3bf54b8e6312cedd95ef", "grow_area_uid": "7D:07:0B:65:2B:A0" }]
                setTimeout(() => {
                    dispatch(setGrowAreas(parsedRes));
                    if (!inBackground) dispatch(uiStopLoading());
                }, 1000);
            }
        }
    }

    let url = Urls.GET_ALL_GROW_AREAS
    if (containerId) {
        url = url + "/containers/" + containerId;
    }

    return (dispatch) => {
        AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN']).then(response => {
            let token = response[0][1];
            let appleKey = response[1][1]

            console.log('getGrowAreas called:' + token + ' sdcszcx' + appleKey);
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
            } : {
                    Authorization: token
                };
            if (!inBackground) dispatch(uiStartLoading());
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
                        throw new Error("Something went wrong while getting GrowAreas.. \nStatusCode:" + res.status);
                    }
                })
                .then(parsedRes => {
                    console.log(url);
                    if (isLessThenVersion4) {
                        dispatch({ type: GET_ALL_GATEWAYS, payload: parsedRes })
                        console.log('in isLessThenVersion4', parsedRes.length);

                    }
                    if (containerId) {
                        dispatch(setGrowAreasByContainerId(containerId, parsedRes));
                    }
                    else {
                        dispatch(setGrowAreas(parsedRes));
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
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(getGrowAreas(containerId, inBackground, isLessThenVersion4, token, appleKey));
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

export const getGrowAreaTypes = (inBackground, token, appleKey) => {
    setTimeout(() => {
    }, 1000)
    if (apiDebug) {
        return dispatch => {
            if (!inBackground) dispatch(uiStartLoading());
            let parsedRes = [{ "id": 1, "grow_area_type_name": "Standard" }]
            setTimeout(() => {
                dispatch(setGrowAreaTypes(parsedRes));
                if (!inBackground) dispatch(uiStopLoading());
            }, 1000);
        }
    }

    let url = Urls.GET_ALL_GROW_AREA_TYPES

    return (dispatch) => {
        AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN']).then(response => {
            let token = response[0][1];
            let appleKey = response[1][1]

            console.log('getFacilities called:' + token);
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
            } : {
                    Authorization: token
                };
            if (!inBackground) dispatch(uiStartLoading());
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
                        throw new Error("Something went wrong while getting GrowArea Types.. \nStatusCode:" + res.status);
                    }
                })
                .then(parsedRes => {
                    console.log(url);
                    dispatch(setGrowAreaTypes(parsedRes));
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
                                    dispatch(getGrowAreaTypes(inBackground, token, appleKey))
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


export const getGrowAreaCounts = (growAreaId, inBackground) => {

    if (apiDebug) {
        return dispatch => {
            if (!inBackground) dispatch(countUiStartLoading());
            let parsedRes = { "accounts_count": 0, "facilities_count": 0, "containers_count": 0, "grow_areas_count": 0, "grow_sections_count": 0, "devices_count": { "total": 0, "devicetype_count": { "scms_count": 0, "soil_nodes_count": 0, "light_nodes_count": 0, "humidity_nodes_count": 0, "light_shields_count": 0 } } }
            setTimeout(() => {
                dispatch(setCountsByGrowAreaId(growAreaId, parsedRes));
                if (!inBackground) dispatch(countUiStopLoading());
            }, 1000);
        }
    }

    let url = Urls.GET_ALL_GROW_AREA_COUNTS + '/' + growAreaId;

    return (dispatch) => {
        AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN']).then(response => {
            let token = response[0][1];
            let appleKey = response[1][1]

            console.log('getGrowAreaCounts called:' + token);
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
            } : {
                    Authorization: token
                };
            if (!inBackground) dispatch(countUiStartLoading());
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
                            return {};
                        }
                        return res.json();
                    }

                    else if (res.status === 401) {
                        throw new Error("Session Expired")
                    }
                    else {
                        throw new Error("Something went wrong while getting counts by GrowAreaId.. \nStatusCode:" + res.status);
                    }
                })
                .then(parsedRes => {
                    console.log(url);
                    console.log(JSON.stringify(parsedRes));
                    dispatch(setCountsByGrowAreaId(growAreaId, parsedRes));
                    if (!inBackground) dispatch(countUiStopLoading());
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
                                dispatch(getGrowAreaCounts(growAreaId, inBackground))
                            }  
                        }
                    } else {
                        if (!inBackground) {
                            alert(error.message);
                        }
                        console.log(error);
                        if (!inBackground) dispatch(countUiStopLoading());
                    }
                });
        });
    }
};

export const deleteLedNodeProfile = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_ALL_PROFILES + `/${gatewayId}`;
    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };
        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers
            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    throw new Error("Something went wrong while getting Deleting Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {


                console.log('deleted growarea\'s All profile', res);
                dispatch(deleteLEDNodeDesiredValue(token, gatewayId, appleKey))
                dispatch(sessionEstablished())

            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteLedNodeProfile(token, gatewayId, appleKey))
                            })
                        } 
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteLEDNodeDesiredValue = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_ALL_DESIRED_VALUE + `/${gatewayId}`;

    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };
        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers
            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    throw new Error("Something went wrong while Deleting Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {


                console.log('deleted  growarea\' desired value', res.body);
                dispatch(deleteLEDNodeChannelConfing(token, gatewayId, appleKey))
                dispatch(sessionEstablished())
            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteLEDNodeDesiredValue(token, gatewayId, appleKey))
                            })
                        } 
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteLEDNodeChannelConfing = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_ALL_CHANNEL_CONFIG + `/${gatewayId}`;
    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };
        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers

            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    throw new Error("Something went wrong while getting counts Deleting Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {


                console.log('deleted  growarea\' channel config ', res);
                dispatch(deleteDevicePropertyMapping(token, gatewayId, appleKey))
                dispatch(sessionEstablished())
            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteLEDNodeChannelConfing(token, gatewayId, appleKey))
                            })
                        } 
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteDevicePropertyMapping = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_ALL_MAPPING + `/${gatewayId}`;
    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };
        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers

            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    throw new Error("Something went wrong while Deleting Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {


                console.log('deleted growarea\'s mapping', res);
                dispatch(deleteDeviceSection(token, gatewayId, appleKey))
                dispatch(sessionEstablished())
            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteDevicePropertyMapping(token, gatewayId, appleKey))
                            })
                        } 
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteDeviceSection = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_DEVICE_SECTION + `/${gatewayId}`;
    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };
        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers
            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    throw new Error("Something went wrong while Deletinf Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {


                console.log('deleted growarea\'s devices section ', res);
                dispatch(deleteDevicesGateway(token, gatewayId, appleKey))
                dispatch(sessionEstablished())
            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteDeviceSection(token, gatewayId, appleKey))
                            })
                        }
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteDevicesGateway = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_DEVICE_GATEWAY + `/${gatewayId}`;
    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };
        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers
            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    console.log('body', res, res.message);

                    throw new Error("Something went wrong while Deleting Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {
                console.log('deleted  growarea\'s gateway device', res._bodyText);
                dispatch(deleteProfileAlert(token, gatewayId, appleKey))
                dispatch(sessionEstablished())
            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteDevicesGateway(token, gatewayId, appleKey))
                            })
                        }  
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteProfileAlert = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_ALL_PROFILE_ALERTS + `/${gatewayId}`;
    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };
        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers
            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    throw new Error("Something went wrong while Deleting Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {


                console.log('deleted  growarea\' all profile alerts.', res);
                dispatch(deleteAllProfile(token, gatewayId, appleKey))
                dispatch(sessionEstablished())
            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteProfileAlert(token, gatewayId, appleKey))
                            })
                        }  
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteAllProfile = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_ALL_GROWAREA_PROFILE + `/${gatewayId}`;
    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };

        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers
            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    throw new Error("Something went wrong while Deleting Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {


                console.log('deleted  growarea\'s all profiles ', res);
                dispatch(deleteGrowSection(token, gatewayId, appleKey))
                dispatch(sessionEstablished())
            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteAllProfile(token, gatewayId, appleKey))
                            })
                        }  
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteGrowSection = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_ALL_GROW_SECTION + `/${gatewayId}`;
    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };
        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers

            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    throw new Error("Something went wrong while Deleting Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {


                console.log('deleted assignee growarea', res);
                dispatch(deleteGroups(token, gatewayId, appleKey))
                dispatch(sessionEstablished())
            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteGrowSection(token, gatewayId, appleKey))
                            })
                        }  
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteGroups = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_GROWAREA_GROUPS + `/${gatewayId}/groups`;
    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };
        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers
            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    throw new Error("Something went wrong while Deleting Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {


                console.log('deleted growarea\'s groups', res);
                dispatch(deleteAssigneeGateway(token, gatewayId, appleKey))
                dispatch(sessionEstablished())
            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteGroups(token, gatewayId, appleKey))
                            })
                        }  
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteAssigneeGateway = (token, gatewayId, appleKey) => {
    let url = Urls.DELETE_ASSIGNEE_GROWAREA + `/${gatewayId}`;
    return (dispatch) => {
        let headers = appleKey === 'true' ? {
            Authorization: token,
            appleKey,
        } : {
                Authorization: token
            };
        dispatch(uiStartLoading());
        fetch(url,
            {
                method: "DELETE",
                headers
            }).catch((error) => {
                throw new Error("Network error!");
            })
            .then(res => {
                if (res.ok) {
                    if (res.status === 204) {
                        return {};
                    }
                    return res;
                }

                else if (res.status === 401) {
                    throw new Error("Session Expired")
                }
                else {
                    throw new Error("Something went wrong while Deleting Grow Area.. \nStatusCode:" + res.status);
                }
            }).then(res => {


                console.log('deleted assignee growarea', res);
                dispatch(deleteGateway(token, gatewayId, appleKey))
                dispatch(sessionEstablished())
            }).catch(error => {

                if (error.message === "Session Expired") {
                    if (token === 'sign out') {
                        dispatch(uiStopLoading());
                        return null
                    } else {
                        if (appleKey === 'false') {
                            AsyncStorage.getItem('authToken').then((token) => {
                                dispatch(sessionExpired());
                                dispatch(refreshSession(appleKey))
                                dispatch(deleteAssigneeGateway(token, gatewayId, appleKey))
                            })
                        }  
                    }
                } else {
                    dispatch(uiStopLoading());
                    setTimeout(() => {
                        alert(error.message);
                    }, 100)
                    console.log(error);
                }
            });
    }
}

export const deleteGateway = (token, gatewayId) => {
    let url = Urls.DELETE_GROWAREA + `/${gatewayId}`;
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
            } : {
                    Authorization: token
                };
            fetch(url,
                {
                    method: "DELETE",
                    headers
                }).catch((error) => {
                    throw new Error("Network error!");
                })
                .then(res => {
                    if (res.ok) {
                        if (res.status === 204) {
                            return {};
                        }
                        return res;
                    }

                    else if (res.status === 401) {
                        throw new Error("Session Expired")
                    }
                    else {
                        throw new Error("Something went wrong while Deleting Grow Area.. \nStatusCode:" + res.status);
                    }
                }).then((res) => {
                    console.log('Gateway was successfully deleted', DELETE_GATEWAY, res);
                    dispatch(deleteGatewayResponse(true));
                    dispatch(sessionEstablished())
                }).catch(error => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(uiStopLoading());
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(deleteGateway(token, gatewayId, appleKey))
                                })
                            }  
                        }
                    } else {
                        dispatch(uiStopLoading());
                        console.log('error in gateway deletion', error);
                        setTimeout(() => {
                            alert('Something went wrong while deleting Gateway');
                        }, 200);
                    }
                });
        }).catch((e) => {
            console.log('errorr', e);

        })
    }
}





export const deleteGatewayResponse = (flag) => {
    return {
        type: DELETE_GATEWAY,
        payload: flag
    }
}