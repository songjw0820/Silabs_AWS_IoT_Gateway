import React, { Component } from "react";
import { View, StyleSheet, Text, Image, Modal, ActivityIndicator, Platform, } from "react-native";
import * as Constant from '../Constant';
import { version as appVersion } from '../../app.json';
import { connect } from 'react-redux';
import { authSetUser, verifyUser, authLogout, uiStartLoading } from '../store/actions/rootActions';
import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';
import { Navigation } from "react-native-navigation";
import * as AppleAuthentication from '@pontusab/react-native-apple-authentication';




class Login extends Component {

    static navigatorStyle = {
        navBarHidden: true
    };


    OS = Platform.OS;
    majorVersionIOS = parseInt(Platform.Version, 10);

    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            proccesing: false,
        };
    }

    componentDidAppear() {
        console.log('retry401Count', this.props.retry401Count);
        if (this.props.retry401Count === 20) {
            this.props.onInvalidUser(false);
        }
        GoogleSignin.configure({
            forceConsentPrompt: true,
        })
    }

    signIn = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            this.props.onSetUser(userInfo);
            console.log(userInfo.accessToken, '-------', JSON.stringify(userInfo));
            this.OS === 'ios' ? this.setState({ proccesing: true }) : null;
            await this.props.onVerifyUser(userInfo.accessToken)
        } catch (error) {
            console.log("Error:" + error + "\nErrorCode:" + error.code);
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log("SIGN_IN_CANCELLED") // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                console.log("IN_PROGRESS")  // operation (f.e. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                console.log("PLAY_SERVICES_NOT_AVAILABLE")  // play services not available or outdated
                alert("Play services not available in your device.");
            } else {
                console.log("OTHER_REASON", error)     // some other error happened
                alert("Error: " + error.message + "\nErrorCode: " + error.code);
            }
        }
    };
    appleSignIn = (result) => {
        console.log('Resssult', result);
    };

    async  signInAsync() {

        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            await this.props.onVerifyUser(credential.identityToken, false, 'appleKey')
        } catch (e) {
            console.log(e);
        }
    }

    renderButtons() {
        if (this.props.isLoading) {
            return (
                <View style={styles.loginContainer}>
                    <Image
                        source={require('../../assets/images/growhouse.png')}
                        style={styles.logoImage}
                    />
                    <ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} />

                    <Text>  Verifying user... </Text>
                </View>
            )
        }
        return (
            <View style={styles.loginContainer}>
                <Image
                    source={require('../../assets/images/growhouse.png')}
                    style={styles.logoImage}
                />
                <GoogleSigninButton
                    style={{ width: 312, height: 48, marginTop: 20 }}
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Dark}
                    disabled={this.props.isLoading}
                    onPress={() => { this.signIn() }} />
                {this.OS === 'ios' && this.majorVersionIOS >= 13 && <Text style={{ fontSize: 20, marginVertical: 20 }}> ---------- OR ---------- </Text>  }
                {this.OS === 'ios' && this.majorVersionIOS >= 13 && <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    style={{ height: 48, width: 305, }}
                    cornerRadius={0}
                    disabled={this.props.isLoading}
                    onPress={this.signInAsync.bind(this)}
                />}
            </View>
        )
    }

    render() {

        return (
            <View style={styles.mainContainer}>
                {this.renderButtons()}

                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Version {appVersion}</Text>
                </View>
                <View style={styles.bottomContainer} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1
    },
    bottomContainer: {
        height: 12.5,
        backgroundColor: '#FFBA00'
    },
    versionContainer: {
        height: 37.5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',

    },
    versionText: {
        textAlign: 'center',
        color: Constant.DARK_GREY_COLOR
    },
    logoImage: {
        width: '80%',
        height: '20%',
        resizeMode: 'contain'
    },
    fullModalContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#75757595'
    },
    appleBtn: { height: 44, width: 200 },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

mapDispatchToProps = dispatch => {
    return {
        onSetUser: (user, appleKey) => dispatch(authSetUser(user, appleKey)),
        onVerifyUser: (accessToken, inBackground, appleKey) => dispatch(verifyUser(accessToken, inBackground, appleKey)),
        onInvalidUser: (inBackground) => dispatch(authLogout(inBackground)),
        onStatrLoading: () => dispatch(uiStartLoading())
    }
};

mapStatesToProps = state => {
    return {
        currentUser: state.root.currentUser,
        isLoading: state.ui.isLoading,
        alertApeared: state.auth.alertApeared,
        retry401Count: state.auth.retry401Count
    }
};

export default connect(mapStatesToProps, mapDispatchToProps)(Login);
