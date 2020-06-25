import React from "react"
import { StyleSheet, Text, View,Button,AsyncStorage } from "react-native"
import Amplify from '@aws-amplify/core';
import Auth from '@aws-amplify/auth';
import config from "../../aws-exports"
import App from "../../App";

// New ----
import { withAuthenticator } from "aws-amplify-react-native"

//Amplify.configure(config)
Amplify.configure({
  ...config,
  Analytics: {
    disabled: true,
  },
});

class Login extends React.Component {
 state = {
     isLoading: true
   };

   async componentDidMount() {
        const userInfo = await Auth.currentAuthenticatedUser();
        console.log('-------',JSON.stringify(userInfo.signInUserSession.accessToken.jwtToken));
        AsyncStorage.setItem('accessToken',JSON.stringify(userInfo.signInUserSession.accessToken.jwtToken)).then((token) => {
        this.setState({
           isLoading: false
        }); App();
        }).catch((error) => {
               console.log('error in saving name', error);

           })
   }
   render() {
     if (this.state.isLoading) {
       return <View style={styles.container}><Text>Loading...</Text></View>;
     }
     // this is the content you want to show after the promise has resolved
     return <View/>;
   }
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center"
	}
})

// New ----
export default withAuthenticator(Login, false)