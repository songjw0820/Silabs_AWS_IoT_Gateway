import React, { Component } from "react";
import { View, StyleSheet, Text, AsyncStorage } from "react-native";
import { connect } from 'react-redux';
import { getDeviceProperty } from '../store/actions/deviceActions';
import * as Constant from '../Constant';
import * as Urls from '../Urls';
import Chart from 'react-native-chartjs';
import { StompEventTypes, withStomp } from 'react-stompjs'
import { Picker } from 'react-native-picker-dropdown';
import { Navigation } from "react-native-navigation";

class LiveChart extends Component {

    ws = null;
    rootSubscribed = null;
    labels = [];
    dataList = [];


    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            websocketConnected: false,
            properties: {},
            connectionStatus: 'Connecting...',
            isWebSocketConnected: false,
            dataList: [],
            selectedProp: '',
            uKey: ''
        };
    }

    componentDidAppear() {
        console.log("Websocket mount called", this.state.uKey);
        console.log("Connecting to " + Urls.WEB_SOCKET_URL);
        this.connectToWebSocket();
    }

    componentDidDisappear() {
        console.log("Websocket willDisappear..")
        this.disConnectToWebSocket();
    }




    connectToWebSocket() {
        this.props.stompContext.newStompClient(
            Urls.WEB_SOCKET_URL,  // https://www.example.com/stomp
            {},  // loming
            {},  // 12345678
            {})  // it's '/' most likely

        this.props.stompContext.addStompEventListener(
            StompEventTypes.Connect,
            () => {
                this.setState({ connectionStatus: 'Waiting for data...', uKey: this.getUniqKey() });
                let subscriptionPayload = {
                    destination: '/growhouse/listen',
                    body: JSON.stringify({
                        "topic": this.props.subscriptionKey,
                        "status": "subscribe",
                        "sessionId": this.state.uKey
                    })
                }
                this.props.stompContext.getStompClient().publish(subscriptionPayload);


                this.rootSubscribed = this.props.stompContext.getStompClient().subscribe('/topic/' + this.props.subscriptionKey + '/' + this.state.uKey,
                    (webSocketMessage) => {
                        console.log(this.state.uKey, '--=-=-==-=-==', webSocketMessage.body, this.state.selectedProp)
                        // a message was received

                        try {
                            let message = JSON.parse(webSocketMessage.body).filter(propValueInMessage => {
                                return propValueInMessage['name'] === this.state.selectedProp;
                            });

                            console.log('message', message, message[0]);
                            if (message[0]['name'] && this.state.selectedProp) {
                                let propValue = message[0]['floatValue'];
                                if (propValue != undefined) {
                                    const d = new Date(parseInt(message[0]['timestamp']));
                                    let second = d.getSeconds();
                                    let dateLable = (d.getHours() > 12 ? d.getHours() - 12 : d.getHours()) + ':' + d.getMinutes() + ':' + second + ' ' + (d.getHours() >= 12 ? 'PM' : 'AM');
                                    console.log(dateLable);

                                    if (this.dataList[0] === 0) {
                                        this.dataList.shift();
                                        this.setState({ dataList: this.dataList });

                                    }

                                    if (this.labels.includes(dateLable)) {
                                        this.labels.push('');
                                        this.setState({ labels: this.labels });
                                    }

                                    else {
                                        this.labels.push(dateLable);
                                        this.setState({ labels: this.labels });
                                    }
                                    this.dataList.push(propValue);
                                    this.setState({ dataList: this.dataList });


                                    if (this.labels.length > 30) {
                                        this.labels.shift();
                                        this.dataList.shift();
                                        this.setState({ labels: this.labels, dataList: this.dataList });

                                    }

                                    this.setState({ connectionStatus: "", isWebSocketConnected: true })
                                }
                            }
                            else {
                                this.setState({ connectionStatus: "", isWebSocketConnected: true })
                            }
                        } catch (error) {
                            console.log("Error:" + error.message);
                        }
                    })
            }, '', true);
        this.props.stompContext.addStompEventListener(
            StompEventTypes.Disconnect,
            () => { this.setState({ connectionStatus: 'Connection failed.' }) }, '', true
        )

        this.props.stompContext.addStompEventListener(
            StompEventTypes.Error,
            () => { this.setState({ connectionStatus: 'Connection failed.' }) }, '', true
        )
        this.props.stompContext.addStompEventListener(
            StompEventTypes.WebSocketClose,
            (e) => {
                console.log('in WebSocket close ', e);
                this.props.stompContext.removeStompClient();
                this.setState({
                    connectionStatus: "Error in connection.",
                    isWebSocketConnected: false
                })
            }, '', true
        )

        this.props.stompContext.addStompEventListener(
            StompEventTypes.WebSocketError,
            (e) => {
                console.log('in WebSocket Error ', e);
                this.props.stompContext.removeStompClient();
                this.setState({
                    connectionStatus: "Error in connection.",
                    isWebSocketConnected: false
                })

            }, '', true
        )
    }
    disConnectToWebSocket() {
        try {
            console.log("Websocket willDisappear.. 1")
            let subscriptionPayload = {
                destination: '/growhouse/listen',
                body: JSON.stringify({
                    "topic": this.props.subscriptionKey,
                    "status": "unsubscribe",
                    "sessionId": this.state.uKey
                })
            }
            this.props.stompContext.getStompClient().publish(subscriptionPayload);
            this.rootSubscribed.unsubscribe();
            this.props.stompContext.removeStompEventListener(
                StompEventTypes.Connect,
                () => {
                    console.log('remove listner Connect');
                }
            )
            this.props.stompContext.removeStompEventListener(
                StompEventTypes.Disconnect,
                () => { console.log('remove listner Disconnect'); }
            )
            this.props.stompContext.removeStompEventListener(
                StompEventTypes.Error,
                () => { console.log('remove listner Error'); }
            )
            this.props.stompContext.removeStompEventListener(
                StompEventTypes.WebSocketClose,
                () => { console.log('remove listner WebSocketClose'); }
            )

            this.props.stompContext.removeStompEventListener(
                StompEventTypes.WebSocketError,
                () => { console.log('remove listner WebSocketError'); }
            )
            this.props.stompContext.removeStompClient()
        }
        catch (Error) {
            console.log("Error while closing websocket connection..", Error);
        }
    }
    generateUniqId(count) {
        let out = ''
        for (let index = 0; index < count; index++) {
            out += (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
        }
        return out
    }

    getUniqKey() {
        // return '';  
        return [this.generateUniqId(2), this.generateUniqId(1), this.generateUniqId(1), this.generateUniqId(1), this.generateUniqId(3)].join('-');
    }

    componentDidMount() {
        AsyncStorage.getItem('accessToken').then(authToken => {
            this.props.getDeviceProperty(authToken, this.props.deviceId);
        });
    }

    render() {

        chartConfiguration = {
            type: 'line',
            data: {
                labels: this.state.labels,
                datasets: [
                    {
                        data: this.state.dataList,
                        borderColor: '#3cba9f',
                        fill: false
                    }
                ]
            },
            options: {
                animation: {
                    duration: 0, // general animation time
                },
                responsive: true,
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: false
                        }
                    }]
                }
            }
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

        let webSocketStatusContainer = <View />

        if (!this.state.isWebSocketConnected) {
            webSocketStatusContainer = (
                <View style={{ margin: 10, marginBottom: 5, elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <Text style={{ marginLeft: 10, marginTop: 5 }}> Status: </Text>
                    <Text style={{ margin: 10, fontWeight: "bold", fontSize: 20 }}>{this.state.connectionStatus}</Text>
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
                {webSocketStatusContainer}
                <View style={{ margin: 10, marginTop: 15, elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <Text style={{ marginLeft: 10, marginTop: 5 }}>Property : </Text>
                    <Picker
                        selectedValue={this.state.selectedProp}
                        style={{ width: '100%', height: 40 }}
                        disabled={(this.props.deviceProperty.length !== 0) ? false : true}
                        textStyle={(this.props.deviceProperty.length !== 0) ? { fontSize: 15 } : { fontSize: 15, color: '#DCDCDC' }}
                        onValueChange={(itemValue) => {
                            if (itemValue) {
                                this.setState({ selectedProp: itemValue, dataList: [], labels: [] });
                                this.dataList = [],
                                    this.labels = []
                            }
                        }
                        }>
                        <Picker.Item label="Select Property" value="" />
                        {this.props.deviceProperty.map((property, i) => {
                            return <Picker.Item key={i} value={property.property_name} label={property.display_property_name ? property.display_property_name : property.property_name} />
                        })}
                    </Picker>
                </View>
                <View style={{ margin: 10, paddingTop: 10, paddingBottom: 10, height: '42%', elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <Chart
                        chartConfiguration={chartConfiguration}
                        defaultFontSize={12}
                    />
                    {this.state.dataList.length > 2 && <Text style={{ marginLeft: 30, color: '#3cba9f' }}>Currentvalue : {this.state.dataList[this.state.dataList.length - 1]}</Text>}
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


const mapStateToProps = ({ device }) => {
    const { deviceProperty } = device;
    return { deviceProperty };
};


export default withStomp(connect(mapStateToProps, { getDeviceProperty })(LiveChart));
