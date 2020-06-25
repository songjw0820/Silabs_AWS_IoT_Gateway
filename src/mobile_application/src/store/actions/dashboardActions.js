import { GET_DASHBOARD_COUNT, GET_DASHBOARD_ALERT, } from './actionTypes';
import { sessionExpired, sessionEstablished } from './rootActions';
import * as Urls from "../../Urls";
import { AsyncStorage } from 'react-native';
import { refreshSession } from './authActions';


export const getDashboardCount = (token) => {
    let url = Urls.GET_DASHBOARD_COUNT;
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
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
                    } else {
                        throw new Error("Something went wrong while fetching dashboard count.. \nStatusCode:" + res.status);
                    }
                })
                .then(parsedRes => {
                    console.log(url);
                    console.log(JSON.stringify(parsedRes));
                    dispatch({ type: GET_DASHBOARD_COUNT, payload: parsedRes });
                    dispatch(sessionEstablished());

                })
                .catch(async error => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(getDashboardCount(token));
                                })
                            } 
                        }
                    }
                    else {
                        alert(error.message);
                        console.log(error);
                    }
                });
        }).catch((e) => {
            console.log('error', e);

        })

    }
}

export const getAlerts = (token) => {
    let url = Urls.GET_DASHBOARD_ALERT;
    return (dispatch) => {
        AsyncStorage.getItem('APPLE_LOGGED_IN').then((appleKey) => {
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
                    } else {
                        throw new Error("Something went wrong while fetching alerts.. \nStatusCode:" + res.status);
                    }
                })
                .then(parsedRes => {
                    console.log(url);
                    console.log(JSON.stringify(parsedRes));
                    dispatch({ type: GET_DASHBOARD_ALERT, payload: parsedRes });
                    dispatch(sessionEstablished())
                })
                .catch(async error => {
                    if (error.message === "Session Expired") {
                        if (token === 'sign out') {
                            return null
                        } else {
                            if (appleKey === 'false') {
                                AsyncStorage.getItem('authToken').then((token) => {
                                    dispatch(sessionExpired());
                                    dispatch(refreshSession(appleKey))
                                    dispatch(getAlerts(token));
                                })
                            }
                        }
                    }
                    else {
                        alert(error.message);
                        console.log(error);
                    }
                });
        }).catch((e) => {
            console.log('error', e);

        })
    }
}