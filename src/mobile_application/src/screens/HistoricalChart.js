import React, { Component } from "react";
import { View, StyleSheet, ScrollView, Text, AsyncStorage, ActivityIndicator, Picker, Alert } from "react-native";
import { connect } from 'react-redux';
import DateTimePicker from 'react-native-modal-datetime-picker';
import * as Constant from '../Constant';
import { Navigation } from "react-native-navigation";
import { WebView } from 'react-native-webview';

class HistoricalChart extends Component {

    dataList = []
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            token: '',
        };
    }

    componentDidAppear() {
        AsyncStorage.getItem('accessToken').then(authToken => {
            this.setState({ token: authToken })
        });
    }

    ActivityIndicatorLoadingView() {
        //making a view to show to while loading the webpage
        return (
        <View style={styles.activityIndicator}>
        <ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /><Text style={{ margin: 4, fontWeight: "bold" }}>Data Loading...</Text>
       </View>
        );
      }

    showData()
    {
        gatewayId=this.props.gatewayId;
        console.log("gatewayId"+gatewayId)
        sensorId=this.props.deviceId;
        const initialUrl = 'https://d1h5qdpe8s159w.cloudfront.net/index.html?dashboardid=69f3d390-b095-435d-b9ba-469e287fc573&userarn=arn:aws:quicksight:us-east-1:454143665149:user/default/viren.moradiya@einfochips.com&apigurl=https%3A%2F%2F57heepvsia.execute-api.us-east-2.amazonaws.com%2Fprod%2FgetDashboardEmbedURL%3F';
        const finalUrl=initialUrl+'&gatewayId='+gatewayId+'&sensorId='+sensorId;
        console.log(finalUrl);
       return (
            
            <WebView 
              style={styles.WebViewStyle}
              source={{ uri: finalUrl }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              renderLoading={this.ActivityIndicatorLoadingView}
              startInLoadingState={true}
              //style={{ marginTop: 20 }}
            />
          );
    }

    

    render() {

        return (
            this.showData()
          );
       
    }
}

const styles = StyleSheet.create({
    WebViewStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        marginTop: 10,
        marginLeft:30

      },
      activityIndicator: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
      },
    mainContainer: {
        flex: 2
    },
    greenBackgroundContainer: {
        backgroundColor: Constant.PRIMARY_COLOR,
        width: '100%',
        height: '15%',
        position: 'absolute'
    },
    detailBlock: {
        backgroundColor: '#636363',
        marginLeft: 10,
        marginRight: 10,
        borderRadius: 5,
        flexDirection: "column",
        maxHeight: '50%'
    },
    detailBlockTitleInfo: {
        marginLeft: 10,
        marginTop: 10,
        color: Constant.WHITE_TEXT_COLOR
    },
    detailBlockTitle: {
        marginLeft: 10,
        marginRight: 10,
        fontSize: 36,
        color: Constant.WHITE_TEXT_COLOR
    },
    locationTitleInfo: {
        marginLeft: 10,
        fontSize: 10,
        color: Constant.GREY_TEXT_COLOR
    },
    locationInfo: {
        marginLeft: 4,
        marginRight: 10,
        fontSize: 12,
        fontWeight: "bold",
        color: Constant.WHITE_TEXT_COLOR
    }
});

export default connect()(HistoricalChart);
