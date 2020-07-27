import React from "react"
import { StyleSheet,Dimensions, Text, View,Button,AsyncStorage } from "react-native"
import Amplify from '@aws-amplify/core';
import Auth from '@aws-amplify/auth';
import config from "../../aws-exports"
import App from "../../App";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import * as Urls from '../Urls';
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

    let email=JSON.stringify(userInfo.signInUserSession.idToken.payload.email);
    let url = Urls.GET_USER+userInfo.signInUserSession.idToken.payload.email;
    let gatewaylist=[];
    let sensorlist=[];
    try{
        const response = await fetch(url,{ method: "GET",headers: {'Accept': 'application/json','Content-Type' : 'application/json' }})
        if(response.ok)
          {
            const result = await response.json();
            console.log("response in json---"+result);
            AsyncStorage.setItem('listGateway',JSON.stringify(result['gateways']));
            AsyncStorage.setItem('sensorList',JSON.stringify(result['sensors']));
          }
        else
          {
            AsyncStorage.setItem('listGateway',JSON.stringify(gatewaylist));
            AsyncStorage.setItem('sensorList',JSON.stringify(sensorlist));
            alert('Error occured while featching user info');
          }
        AsyncStorage.setItem('email',email);
        AsyncStorage.setItem('accessToken',JSON.stringify(userInfo.signInUserSession.accessToken.jwtToken)).then((token) => {
            this.setState({
            isLoading: false
        }); App();
        }).catch((error) => {
              console.log('error in saving name', error);

        })
       }catch(err)
      {
        console.log(err.message);
      }
   }

   render() {
     if (this.state.isLoading) {
       return <View style={[styles.container,{color:'red'}]}><Text></Text></View>;
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
