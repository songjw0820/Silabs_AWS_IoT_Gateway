import React, { Component } from "react";
import { View, StyleSheet, TextInput, Button, Text, ScrollView, Picker } from "react-native";
import * as Constant from '../Constant';
import * as Urls from '../Urls';
import LineChart from "react-native-responsive-linechart";

class LiveChart2 extends Component {

    static navigatorStyle = Constant.DEFAULT_NAVIGATOR_STYLE;
    ws = null;
    labels= [];
    dataList= [0,0];

    constructor(props) {
        super(props);
        this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent);
        this.state = {
            websocketConnected : false,
            properties: {},
            connectionStatus: '',
            offset: 0
        }
    }

    onNavigatorEvent = event => {
        if (event.id === "bottomTabReselected") {
            this.props.navigator.popToRoot();
        }
    };

    componentDidMount() {
        console.log("Websocket mount called");
        console.log("Connecting to "+ Urls.WEB_SOCKET_URL);
        this.ws = new WebSocket(Urls.WEB_SOCKET_URL);
        this.setState({
            connectionStatus: "Connecting..."
        })
        this.ws.onopen = () => {
            this.setState({
                websocketConnected: true
            })
            this.setState({
                connectionStatus: "Connected..."
            })
            // connection opened
            console.log("Connection opened with "+ Urls.WEB_SOCKET_URL);
            let subscriptionMessage = {
                topic : this.props.subscriptionKey,
                status : 'subscribe'
            }
            console.log("Sending subscription request:"+JSON.stringify(subscriptionMessage));
            this.ws.send(JSON.stringify(subscriptionMessage)); // send a message
            this.setState({
                connectionStatus: "Waiting for messages..."
            })
        };

        this.ws.onmessage = (e) => {
            // a message was received
            console.log("Message received:");
            try{
                let prevProps = this.state.properties;
                let addedNewProp = false;
                console.log(JSON.stringify(prevProps));
                Object.keys(JSON.parse(e.data)).forEach(function (item) {
                    let parts = item.split('|');
                    if(parts.length > 1 && Object.keys(prevProps).indexOf(parts[1]) < 0){
                    if(parts[0] === 'i' || parts[0] === 'f'){
                        prevProps[parts[1]] = parts[0];
                        console.log('Added new property..');
                        addedNewProp = true;
                    }
                    }
                });
                if(addedNewProp){
                    this.setState({
                        properties: prevProps
                    })
                }
            }catch(error){
                console.log("Parse error:"+error.message);
            }
            try{
                let message = JSON.parse(e.data);
                console.log(message['_|timestamp']);
                console.log(this.state.selectedProp);
                if (Object.keys(message).indexOf('_|timestamp') >= 0 && this.state.selectedProp) {                    
                    let propValue = message[this.state.properties[this.state.selectedProp] + '|' + this.state.selectedProp];
                    if(propValue){
                        const d = new Date(message['_|timestamp']);
                        let second = Math.ceil(d.getSeconds()/5)*5;
                        let dateLable = (d.getHours() > 12 ? d.getHours() - 12 : d.getHours()) +':'+ (second === 60 ? d.getMinutes() +1 : d.getMinutes())+':'+ (second === 60 ? 0 : second) +' '+ (d.getHours() >= 12 ? 'PM' : 'AM');
                        console.log(dateLable);
                        console.log(propValue);

                        if(this.dataList[0] === 0){
                            this.dataList.shift();
                        }

                        if(this.labels.includes(dateLable))  this.labels.push('');
                        else this.labels.push(dateLable);
                        this.dataList.push(propValue);

                        if(this.labels.length > 30){
                            this.labels.shift();
                            this.dataList.shift(); 
                        }
                        
                        this.setState({ connectionStatus: "" })
                    }
                  }
                  else{
                    this.setState({ connectionStatus: "" })
                  }
            }catch(error){
                console.log("Error:"+error.message);
            }         
        };

        this.ws.onerror = (e) => {
            // an error occurred
            console.log("Error in websocket connection:");
            this.setState({
                connectionStatus: "Error in connection."
            })
            console.log(e.message);
        };

        this.ws.onclose = (e) => {
            // connection closed
            this.setState({
                websocketConnected: false
            })
            this.setState({
                connectionStatus: "Connection failed."
            })
            console.log("Connection closed:");
            console.log(e.code, e.reason);
        };
    }

    componentWillUnmount() {
        console.log("Websocket unmounting..")
        try{
            let unSubscriptionMessage = {
                topic : this.props.subscriptionKey,
                status : 'unsubscribe'
            }
            this.ws.send(JSON.stringify(unSubscriptionMessage));
            console.log("Unsubscribed...");
            this.ws.close();
        }
        catch(Error){
            console.log("Error while closing websocket connection..");
        }
    }

    _onScroll(e) {
        this.setState({ offset: e.nativeEvent.contentOffset.x });
    }

    render() {

        chartConfiguration = {
            line: {
              visible: true,
              strokeWidth: 1,
              strokeColor: Constant.CHART_COLOR  //"#54a0ff"
            },
            area: {
              visible: false
            },
            yAxis: {
              labelColor: Constant.CHART_COLOR, //"#54a0ff",
              labelFormatter: v => Math.round(v).toString()
            },
            xAxis: {
                visible: true,
                labelFontSize: 6,
                labelColor: Constant.CHART_COLOR, //"#54a0ff"
            },
            interpolation: "spline",
            insetY: 10,
            insetX: 10
          };

        getDetailBlockTitleStyle = function (title) {
            var fontSize = 36;
            var multiplier = 2.5 - (title.length - 16) * 0.125;

            if (title.length > 15 && title.length <= 25) fontSize = fontSize - multiplier * (title.length - 15);
            else if (title.length > 25) fontSize = 19.5;

            return {
                marginLeft: 10,
                marginRight: 10,
                fontSize: fontSize,
                color: Constant.WHITE_TEXT_COLOR
            }
        }

        let webSocketStatusContainer = <View/>

        if(this.state.connectionStatus){
            webSocketStatusContainer = (
            <View style={{ margin: 10, marginBottom: 5, elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                <Text style={{marginLeft:10, marginTop: 5}}>Websocket Status: </Text>
                <Text style={{margin:10, fontWeight:"bold" , fontSize:20}}>{this.state.connectionStatus}</Text>
            </View>
            )
        }


        return (
            <View style={styles.mainContainer}>
                <View style={styles.greenBackgroundContainer} />
                <View style={styles.detailBlock}>
                    <Text style={styles.detailBlockTitleInfo}>Device Name</Text>
                    <Text numberOfLines={1} style={getDetailBlockTitleStyle(this.props.deviceName)}>{this.props.deviceName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: "center", marginBottom: 10 }}>
                        <Text style={styles.locationTitleInfo}>Device Type:</Text>
                        <Text style={styles.locationInfo}>{this.props.deviceType}</Text>
                    </View>
                </View>
                { webSocketStatusContainer }
                <View style={{ margin: 10, marginTop:15, elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <Text style={{marginLeft:10, marginTop: 5}}>Property : </Text>
                    <Picker
                        selectedValue={this.state.selectedProp}
                        style={{ width: '100%' }}
                        onValueChange={(itemValue) => {
                            if(itemValue){
                                this.setState({ selectedProp: itemValue })
                                this.labels = [];
                                this.dataList = [0, 0];
                            }
                        }
                        }>
                        <Picker.Item label="Select Property" value="" />
                        {Object.keys(this.state.properties).map((property, i) => {
                            return <Picker.Item key={i} value={property} label={property} />
                        })}
                    </Picker>
                </View>
                <View style={{ margin: 10, paddingTop:10, paddingBottom:10, height: 200, elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <LineChart 
                        style={{ flex: 1 }} 
                        config={chartConfiguration} 
                        xLabels = {this.labels}
                        data={this.dataList} />
                    
                    {this.dataList.length > 2 && <Text style={{marginLeft:30, color: Constant.CHART_COLOR }}>Currentvalue : {this.dataList[this.dataList.length - 1]}</Text>}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1
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

export default LiveChart2;