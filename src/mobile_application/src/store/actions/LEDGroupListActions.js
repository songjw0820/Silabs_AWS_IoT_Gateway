import { FIND_LEDNODE_FOR_GROUP, GET_GROUP_DETAILS, GET_LEDNODE_GROUP_LIST, IS_GROUP_PROFILE_DETAILS_LOADING, FIND_DEVICES_LOADER, GROUPE_LIST_PROCEESSING, IS_LED_GROUP_INDIVIDUAL_GROUP_LOADING, IS_LED_GROUP_LIST_LOADING } from "./actionTypes";
import { uiStartLoading, uiStopLoading, refreshSession, sessionExpired, sessionEstablished } from "./rootActions";
import { apiDebug } from '../../../app.json';
import { AsyncStorage } from 'react-native';
import * as Urls from '../../Urls';

export const getLEDGrpoupList = (token, id) => {

    return (dispatch, getState) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
            dispatch(isLEDGroupLoading(true));
            let url = Urls.GET_LEDNODE_GROUP_LIST + `/${id}`;
            console.log('url:------------------->', url);
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
                        return res.json();
                    }
                    else if (res.status === 401) {
                        throw new Error("Session Expired")
                    }
                    else {
                        throw new Error("Something went wrong while fetching LED Groups.. \nStatusCode:" + res.status);
                    }
                })
                .then(parsedRes => {
                    console.log('parsedRes', JSON.stringify(parsedRes));
                    dispatch({ type: GET_LEDNODE_GROUP_LIST, payload: parsedRes });
                    dispatch(sessionEstablished())
                })
                .catch(error => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(isLEDGroupLoading(false));
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(getLEDGrpoupList(token, id));
                                })
                            } 
                        }
                    } else {
                        dispatch(isLEDGroupLoading(false));
                        console.log('error in gateway deletion', error);
                        setTimeout(() => {
                            alert(error.message);
                        }, 200);
                    }
                });
        }).catch((e) => {
            console.log('errorr', e);

        })
    }
}

export const isLEDGroupLoading = (flag) => {
    console.log('flag-------->', flag);
    return {
        type: IS_LED_GROUP_LIST_LOADING,
        payload: flag
    }
}

export const findDevices = (token, id, reqData) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
            let url = Urls.FIND_DEVICES_FOR_GROUP + `/${id}`;
            let payload = JSON.stringify(reqData);
            console.log('url for ------>', url);
            console.log('payload', payload);
            console.log('token', token);
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
                'accept': "application/json",
                'Content-Type': 'application/json'
            } : {
                    Authorization: token,
                    'accept': "application/json",
                    'Content-Type': 'application/json'
                };
            console.log('body', headers)

            dispatch({ type: FIND_DEVICES_LOADER, payload: true });
            fetch(url,
                {
                    method: "PUT",
                    headers,
                    body: payload

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
                        throw new Error("Something went wrong while fetching LED Devices.. \nStatusCode:" + res.status);
                    }
                })
                .then((parsedRes) => {
                    console.log('parsed res', parsedRes.length);
                    dispatch({ type: FIND_LEDNODE_FOR_GROUP, payload: parsedRes })
                    dispatch(sessionEstablished())
                })
                .catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch({ type: FIND_DEVICES_LOADER, payload: true });
                            return null
                        } else {
                            dispatch(sessionExpired());
                            dispatch({ type: FIND_DEVICES_LOADER, payload: true });
                            AsyncStorage.getItem('accessToken').then((token) => {
                                dispatch(findDevices(token, id, reqData));
                            });
                        }
                    } else {
                        dispatch(uiStopLoading());
                        console.log('error in finding devices', error);
                        setTimeout(() => {
                            alert(error.message);
                        }, 200);
                    }
                })
        }).catch((e) => {
            console.log('errorr', e);

        })
    }
}

export const createLedGroup = (token, reqData) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {

            let url = Urls.CREATE_LED_GROUP;
            let payload = JSON.stringify(reqData);
            console.log('url for ------>', url);
            console.log('payload', payload);
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
                'accept': "application/json",
                'Content-Type': 'application/json'
            } : {
                    Authorization: token,
                    'accept': "application/json",
                    'Content-Type': 'application/json'
                };
            dispatch(isLEDGroupLoading(true));
            fetch(url,
                {
                    method: "POST",
                    headers,
                    body: payload

                })
                .catch((error) => {
                    throw new Error("Network error!");
                })
                .then(async res => {
                    if (res.ok) {
                        if (res.status === 204) {
                            return [];
                        }
                        return res.json();
                    }
                    else if (res.status === 401) {
                        throw new Error("Session Expired")
                    } else if (res.status === 400) {
                        let errorJson = await res.json()
                        dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false });
                        let message = await errorJson.message;
                        throw new Error(`${message}`);
                    }
                    else {
                        throw new Error("Something went wrong while creating LED group.. \nStatusCode:" + res.status);
                    }
                })
                .then((parsedRes) => {
                    console.log('parsed res', parsedRes);
                    dispatch(stopProccessing(true));
                    dispatch(isLEDGroupLoading(false));
                    dispatch(sessionEstablished())

                })
                .catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(isLEDGroupLoading(false));
                            return null
                        } else {
                            dispatch(sessionExpired());
                            dispatch(isLEDGroupLoading(false));
                            AsyncStorage.getItem('accessToken').then((token) => {
                                dispatch(createLedGroup(token, reqData));
                            });
                        }
                    } else {
                        dispatch(isLEDGroupLoading(false));
                        console.log('error in finding devices', error);
                        setTimeout(() => {
                            alert(error.message);
                        }, 200);
                    }
                })
        }).catch((e) => {
            console.log('errorr', e);

        })
    }
}

export const stopProccessing = (flag) => {
    return {
        type: GROUPE_LIST_PROCEESSING,
        payload: flag
    }
}

export const deleteGroup = (token, groupId) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {

            let url = Urls.DELETE_LED_GROUP + `/${groupId}`;
            console.log('url for ------>', url);
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,

            } : {
                    Authorization: token,

                };
            dispatch(isLEDGroupLoading(true));
            fetch(url,
                {
                    method: "DELETE",
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
                        throw new Error("Something went wrong while creating LED group.. \nStatusCode:" + res.status);
                    }
                })
                .then((parsedRes) => {
                    console.log('parsed res', parsedRes);
                    dispatch(stopProccessing(true));
                    dispatch(isLEDGroupLoading(false));
                    dispatch(sessionEstablished())
                })
                .catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(isLEDGroupLoading(false));
                            return null
                        } else {
                            dispatch(sessionExpired());
                            dispatch(isLEDGroupLoading(false));
                            AsyncStorage.getItem('accessToken').then((token) => {
                                dispatch(deleteGroup(token, groupId));
                            });
                        }
                    } else {
                        dispatch(isLEDGroupLoading(false));
                        console.log('error in finding devices', error);
                        setTimeout(() => {
                            alert(error.message);
                        }, 200);
                    }
                })
        }).catch((e) => {
            console.log('errorr', e);
        })
    }
}

export const updateGroup = (token, reqData) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {

            let url = Urls.UPDATE_LED_GROUP;
            let payload = JSON.stringify(reqData);
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
                'accept': "application/json",
                'Content-Type': 'application/json'
            } : {
                    Authorization: token,
                    'accept': "application/json",
                    'Content-Type': 'application/json'
                };
            dispatch(isLEDGroupLoading(true));
            fetch(url,
                {
                    method: "PUT",
                    headers,
                    body: payload

                })
                .catch((error) => {
                    throw new Error("Network error!");
                })
                .then(async res => {
                    if (res.ok) {
                        if (res.status === 204) {
                            return [];
                        }
                        return res.json();
                    }
                    else if (res.status === 401) {
                        throw new Error("Session Expired")
                    } else if (res.status === 400) {
                        let errorJson = await res.json()
                        dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false });
                        let message = await errorJson.message;
                        throw new Error(`${message}`);
                    }
                    else {
                        throw new Error("Something went wrong while updating LED group.. \nStatusCode:" + res.status);
                    }
                })
                .then((parsedRes) => {
                    console.log('parsed res', parsedRes);
                    dispatch(stopProccessing(true));
                    dispatch(isLEDGroupLoading(false));
                    dispatch(sessionEstablished())
                })
                .catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(uiStopLoading());
                            return null
                        } else {
                            dispatch(sessionExpired());
                            dispatch(isLEDGroupLoading(false));
                            AsyncStorage.getItem('accessToken').then((token) => {
                                dispatch(updateGroup(token, reqData));
                            });
                        }
                    } else {
                        dispatch(isLEDGroupLoading(false));
                        console.log('error in finding devices', error);
                        setTimeout(() => {
                            alert(error.message);
                        }, 200);
                    }
                })
        }).catch((e) => {
            console.log('errorr', e);

        })
    }
}

export const getGroupDetails = (token, id) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
            dispatch({ type: IS_LED_GROUP_INDIVIDUAL_GROUP_LOADING, payload: true });
            let url = Urls.GET_INDIVIDUAL_GROUP + `/${id}`;
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
            } : {
                    Authorization: token,
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
                        throw new Error("Something went wrong while fetching LED Groups.. \nStatusCode:" + res.status);
                    }
                })
                .then(parsedRes => {
                    console.log('parsedRes', JSON.stringify(parsedRes));
                    dispatch({ type: GET_GROUP_DETAILS, payload: parsedRes })
                    dispatch({ type: IS_LED_GROUP_INDIVIDUAL_GROUP_LOADING, payload: false });
                    dispatch(sessionEstablished())
                })
                .catch(error => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch({ type: IS_LED_GROUP_INDIVIDUAL_GROUP_LOADING, payload: false });
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(getGroupDetails(token, id));
                                })
                            }
                        }
                    } else {
                        dispatch({ type: IS_LED_GROUP_INDIVIDUAL_GROUP_LOADING, payload: false });
                        console.log('error in fetching group details', error);
                        setTimeout(() => {
                            alert(error.message);
                        }, 200);
                    }
                });
        }).catch((e) => {
            console.log('errorr', e);
        })
    }
}