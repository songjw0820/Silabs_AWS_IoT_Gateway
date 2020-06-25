import { PROFILE_LIST_PROCEESSING, IS_GROUP_PROFILE_DETAILS_LOADING, GET_LEDNODE_GROUP_PROFILE_LIST, GET_GROUP_PROFILE_DETAILS, IS_LED_GROUP_PROFILE_LIST_LOADING } from "./actionTypes";
import { uiStartLoading, uiStopLoading, refreshSession, sessionExpired, sessionEstablished } from "./rootActions";
import { apiDebug } from '../../../app.json';
import { AsyncStorage, Alert } from 'react-native';
import * as Urls from '../../Urls';

export const getLEDGroupProfiles = (token, groupId) => {
    console.log('------------------------cacacac-----------');

    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {

            let url = Urls.GET_LEDNODE_GROUP_PROFILE_LIST + `/${groupId}/profiles`;
            console.log('url ----------------opopopopop', url);
            dispatch(isLEDGroupProfileLoading(true));
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
                    } else if (res.status === 401) {
                        throw new Error("Session Expired")
                    }
                    else {
                        throw new Error("Something went wrong while fetching LED Group profile Data.. \nStatusCode:" + res.status);
                    }
                })
                .then((parsedRes) => {
                    console.log("parsedRes  GET_LEDNODE_GROUP_PROFILE_LIST", parsedRes);

                    dispatch({ type: GET_LEDNODE_GROUP_PROFILE_LIST, payload: parsedRes });
                    dispatch(sessionEstablished())
                }).catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(isLEDGroupProfileLoading(false));
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(getLEDGroupProfiles(token, groupId))
                                })
                            } 
                        }

                    } else {
                        alert(error.message);
                        dispatch(isLEDGroupProfileLoading(false));

                    }
                });
        }).catch((e) => {
            console.log('errorr', e);

        })
    }
}

export const createProfile = (token, reqData) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {

            let url = Urls.CREATE_GROUP_PROFILE;
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
            console.log('url for ------>', url);
            console.log('payload', payload);

            dispatch(isLEDGroupProfileLoading(true));
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
                    dispatch(stopProccessingForProfileList(true));
                    dispatch(isLEDGroupProfileLoading(false));
                    dispatch(sessionEstablished())

                })
                .catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(isLEDGroupProfileLoading(false));
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(createProfile(token, reqData));
                                })
                            } 
                        }
                    } else {
                        dispatch(isLEDGroupProfileLoading(false));
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

export const updateProfile = (token, reqData) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
            let url = Urls.CREATE_GROUP_PROFILE;
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
            console.log('url for ------>', url);
            console.log('payload', payload);

            dispatch(isLEDGroupProfileLoading(true));
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
                        throw new Error("Something went wrong while updating LED group profile.. \nStatusCode:" + res.status);
                    }
                })
                .then((parsedRes) => {
                    console.log('parsed res', parsedRes);
                    dispatch(stopProccessingForProfileList(true));
                    dispatch(isLEDGroupProfileLoading(false));
                    dispatch(sessionEstablished())

                })
                .catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(isLEDGroupProfileLoading(false));
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(updateProfile(token, reqData));
                                })
                            } 
                        }
                    } else {
                        dispatch(isLEDGroupProfileLoading(false));
                        console.log('error in  updating LED group profile.', error);
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

export const deleteGroupProfile = (token, id) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
            let url = Urls.CREATE_GROUP_PROFILE + `/${id}`;
            console.log('url for ------>', url);
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
            } : {
                    Authorization: token,
                };
            dispatch(isLEDGroupProfileLoading(true));
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
                        throw new Error("Something went wrong while deleting LED group profile.. \nStatusCode:" + res.status);
                    }
                })
                .then((parsedRes) => {
                    console.log('parsed res', parsedRes);
                    dispatch(stopProccessingForProfileList(true));
                    dispatch(isLEDGroupProfileLoading(false));
                    dispatch(sessionEstablished())
                })
                .catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch(isLEDGroupProfileLoading(false));
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(deleteGroupProfile(token, id));
                                })
                            } 
                        }
                    } else {
                        dispatch(isLEDGroupProfileLoading(true));
                        console.log('error in  deleting LED group profile.', error);
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

export const isLEDGroupProfileLoading = (flag) => {
    return {
        type: IS_LED_GROUP_PROFILE_LIST_LOADING,
        payload: flag
    }
}

export const stopProccessingForProfileList = (flag) => {
    return {
        type: PROFILE_LIST_PROCEESSING,
        payload: flag
    }
}

export const getProfileDetails = (token, id) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {

            let url = Urls.CREATE_GROUP_PROFILE + `/${id}`;
            console.log('url ----------------opopopopop', url);
            let headers = appleKey === 'true' ? {
                Authorization: token,
                appleKey,
            } : {
                    Authorization: token,
                };
            dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: true })
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
                    } else if (res.status === 401) {
                        throw new Error("Session Expired")
                    }
                    else {
                        throw new Error("Something went wrong while fetching LED Group profile Data.. \nStatusCode:" + res.status);
                    }
                })
                .then((parsedRes) => {
                    console.log("parsedRes  GET_GROUP_PROFILE_DETAILS", parsedRes);

                    dispatch({ type: GET_GROUP_PROFILE_DETAILS, payload: parsedRes });
                    setTimeout(() => {
                        dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false });
                    }, 5000)
                    dispatch(sessionEstablished())
                }).catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false });
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(getProfileDetails(token, id))
                                })
                            } 
                        }

                    } else {
                        alert(error.message);
                        dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: true });
                    }
                });
        }).catch((e) => {
            console.log('errorr', e);

        })
    }
}

export const applyNowGroupProfile = (token, reqData) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {

            dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: true })
            let url = Urls.CREATE_GROUP_PROFILE + '/now';
            let payload = JSON.stringify(reqData);
            console.log('url', url);
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
            fetch(url,
                {
                    method: "POST",
                    headers,
                    body: payload

                }).catch((error) => {
                    console.log('network error in apply now group profile', error);
                    throw new Error("Network error!");
                }).then(async (res) => {

                    if (res.ok) {
                        if (res.status === 204) {
                            return [];
                        }
                        return res;
                    } else if (res.status === 401) {
                        throw new Error("Session Expired")
                    } else if (res.status === 400) {
                        let errorJson = await res.json()
                        dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false });
                        let message = await errorJson.message;
                        throw new Error(`${message}`);

                    }
                    else {
                        throw new Error("Something went wrong while applying profile.. \nStatusCode:" + res.status);
                    }
                }).then((parsedRes) => {
                    console.log('parsedRes', parsedRes);
                    dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false })
                    setTimeout(() => {
                        Alert.alert('Apply Profile', 'Profile applied successfully!!')
                    }, 500);
                    dispatch(sessionEstablished())
                }).catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false });
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(applyNowGroupProfile(token, reqData))
                                })
                            } 
                        }

                    } else {
                        console.log('error', error, error.message);

                        dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false })
                        alert(error.message);
                    }
                })
        }).catch((e) => {
            console.log('errorr', e);

        })
    }
}

export const eventGroupProfile = (token, reqData) => {
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
            dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: true })
            let url = Urls.CREATE_GROUP_PROFILE + '/event';
            let payload = JSON.stringify(reqData);
            console.log('url', url);
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
            fetch(url,
                {
                    method: "POST",
                    headers,
                    body: payload

                }).catch((error) => {
                    console.log('network error in apply event group profile', error);
                    throw new Error("Network error!");
                }).then(async (res) => {

                    if (res.ok) {
                        if (res.status === 204) {
                            return [];
                        }
                        return JSON.stringify(res.json());
                    } else if (res.status === 401) {
                        throw new Error("Session Expired")
                    } else if (res.status === 400) {
                        let errorJson = await res.json()
                        dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false });
                        let message = await errorJson.message;
                        throw new Error(`${message}`);
                    }
                    else {
                        console.log('res', res);
                        console.log('res', res.json().message);

                        throw new Error("Something went wrong while applying event.. \nStatusCode:" + res.status);
                    }
                }).then((parsedRes) => {
                    console.log('parsedRes', parsedRes);
                    dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false })
                    setTimeout(() => {
                        Alert.alert('Apply Profile', 'Profile Scheduled successfully!!')
                    }, 500);
                    dispatch(sessionEstablished())
                }).catch((error) => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false })
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(eventGroupProfile(token, reqData))
                                })
                            }
                        }

                    } else {
                        dispatch({ type: IS_GROUP_PROFILE_DETAILS_LOADING, payload: false });
                        console.log('error', error, error.message);

                        alert(error.message);
                    }
                })
        }).catch((e) => {
            console.log('errorr', e);

        })
    }
}