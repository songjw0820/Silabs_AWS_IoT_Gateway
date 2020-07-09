import React from "react"
import { StyleSheet,Dimensions, Text, View,Button,AsyncStorage } from "react-native"
import Amplify from '@aws-amplify/core';
import Auth from '@aws-amplify/auth';
import config from "../../aws-exports"
import App from "../../App";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";

// New ----
import { AmplifyTheme } from 'aws-amplify-react-native';
const {width,height} = Dimensions.get('window');
import { withAuthenticator } from "aws-amplify-react-native"

//Amplify.configure(config)
Amplify.configure({
  ...config,
  Analytics: {
    disabled: true,
  },
});

const new_theme = {
  ...AmplifyTheme,

  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    width: '100%',
    marginTop: '2%',
  },

  button: {
    alignItems: 'center',
    padding: '1%',
    backgroundColor: '#ff9900',
    marginTop: height * 0.03,
  },

  buttonText: {
      fontSize: RFPercentage(2.5),
      textAlign: 'center',
      color: '#ffffff',
  },
  errorRowText: {
  		fontSize: RFPercentage(1.9),
  	},

   inputLabel: {
      marginTop: height * 0.01,
      fontSize: RFPercentage(2),
      color: "#000000",
    },
   input: {
      margin: height * 0.01,
      marginTop:height * 0.02,
      height: height * 0.05,
      borderColor: '#D3D3D3',
      backgroundColor: '#FFFFFF',
      borderWidth: 3,
      padding: '1%',
      fontSize : RFPercentage(1.6),
   },
   phoneInput: {
         margin: height * 0.01,
         marginTop:height * 0.02,
         height: height * 0.05,
         width: width * 0.56,
         borderColor: '#D3D3D3',
         backgroundColor: '#FFFFFF',
         borderWidth: 3,
         padding: '1%',
         fontSize : RFPercentage(1.6),
   },
   picker: {
    ...AmplifyTheme.picker,
   		height: height * 0.05,
   		marginLeft : width * 0.040,
   		margin: height * 0.01,
   		marginTop:height * 0.02,

   	},
   buttonDisabled: {
   	...AmplifyTheme.buttonDisabled,
   	    alignItems: 'center',
        padding: '1%',
        marginTop: height * 0.03,
   	},

    sectionHeaderText:
    {
        ...AmplifyTheme.sectionHeaderText,
       fontSize : RFPercentage(2.5),
    },

    sectionFooterLink: {
         ...AmplifyTheme.sectionFooterLink,
		fontSize: RFPercentage(1.8),
	},
	sectionFooterLinkDisabled: {
	        ...AmplifyTheme.sectionFooterLinkDisabled,
    		fontSize: RFPercentage(1.8),
    },
}


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
export default withAuthenticator(Login, includeGreetings = false,authenticatorComponents = [], federated = null, theme = new_theme, signUpConfig = {})

