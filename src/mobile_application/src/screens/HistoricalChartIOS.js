import React, { Component } from "react";
import { View, StyleSheet, ScrollView, Text, AsyncStorage, ActivityIndicator, Alert } from "react-native";
import { connect } from 'react-redux';
import DateTimePicker from 'react-native-modal-datetime-picker';
import * as Constant from '../Constant';
import { getHistoricalData, getDeviceProperty } from '../store/actions/deviceActions';
import Chart from 'react-native-chartjs';
import { Button } from "react-native-elements";
import { Picker } from 'react-native-picker-dropdown';
import { Navigation } from "react-native-navigation";

class HistoricalChart extends Component {

    dataList = []
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            token: '',
            dateRange: ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month", "Custom Range"],
            isShowChart: false,
            selectedProp: "",
            selectedDateRange: "",
            toDate: "",
            fromDate: "",
            customeDatePickerShow: false,
            isFromDateTimePickerVisible: false,
            isToDateTimePickerVisible: false,
            appleKey: false

        };
    }

    componentDidAppear() {
        AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN']).then(response => {
            let token = response[0][1];
            let appleKey = response[1][1]
            this.setState({ token, appleKey })
            this.props.getDeviceProperty(this.state.token, this.props.deviceId);
        });
    }

    //getting specific date format for api payload
    getSpecificDate(days) {
        var date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    };


    //for customise datepicker modal
    getCustomeDate() {
        if (this.state.customeDatePickerShow)
            return (
                <View style={{ margin: 10, marginTop: 15, elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <View style={{ flexDirection: 'row', margin: 10, justifyContent: 'center' }}>
                        <Button
                            onPress={() => this.setState({ isFromDateTimePickerVisible: true })}
                            title='From Date'
                            buttonStyle={{ backgroundColor: Constant.PRIMARY_COLOR }} />

                        <DateTimePicker
                            isVisible={this.state.isFromDateTimePickerVisible}
                            onConfirm={(date) => {
                                console.log('date from', date, this.state.fromDate);
                                var fromDate = this.convertIsoDate(date, true);
                                console.log('fromDate', fromDate);

                                this.setState({ isFromDateTimePickerVisible: false, fromDate })
                            }}
                            onCancel={() => this.setState({ isFromDateTimePickerVisible: false })}
                            titleIOS='Pick a From date'
                        />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        <Button
                            onPress={() => this.setState({ isToDateTimePickerVisible: true })}
                            title='To Date'
                            buttonStyle={{ backgroundColor: Constant.PRIMARY_COLOR }} />
                        <DateTimePicker
                            isVisible={this.state.isToDateTimePickerVisible}
                            onConfirm={(date) => {
                                console.log('date to', date, this.state.toDate, this.state.fromDate);
                                date.setHours(23, 59, 59);
                                var toDate = this.convertIsoDate(date, false)
                                console.log('todate', toDate);
                                this.setState({ isToDateTimePickerVisible: false, toDate })
                            }}
                            onCancel={() => this.setState({ isToDateTimePickerVisible: false })}
                            titleIOS='Pick a To date'
                        />
                    </View>
                    <Button
                        onPress={() => {
                            this.setState({ customeDatePickerShow: !this.state.customeDatePickerShow })
                            this.Validation(this.state.selectedProp, this.state.selectedDateRange, this.state.toDate, this.state.fromDate)
                            console.log("this.state.from", this.state.fromDate);
                        }}
                        title='ok'
                        buttonStyle={{ marginTop: 10, backgroundColor: Constant.PRIMARY_COLOR }} />

                </View>
            );
    }

    //cheaking property and daterange to hit the api
    Validation(property, date, toDate, fromDate) {

        const { selectedDateRange, token } = this.state;
        if (property == "" && date != "") {
            Alert.alert("Please Select Property First");
            this.setState({ selectedDateRange: '', toDate: '', fromDate: '', customeDatePickerShow: false })
        }
        if (property != "" && date != "") {
            console.log("selectedDateRange", selectedDateRange);

            this.props.getHistoricalData(toDate, fromDate, this.props.deviceHid, property, token, this.state.appleKey);
            this.setState({ isShowChart: true })

        }
    }
    //displaying data in mm/dd/yyyy formate
    getDisplayDate(date) {
        var dateString = `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}/${new Date(date).getFullYear()}`;
        return dateString;
    }

    renderDate() {
        if (this.state.selectedDateRange === 'Yesterday') {
            return (
                `${this.state.fromDate ? this.getDisplayDate(this.state.fromDate) : ""} - ${this.state.toDate ? this.getDisplayDate(this.state.fromDate) : ""}`
            );
        }
        return (
            `${this.state.fromDate ? this.getDisplayDate(this.state.fromDate) : ""} - ${this.state.toDate ? this.getDisplayDate(this.state.toDate) : ""}`
        );

    }

    // rendering chart
    renderChart() {

        if (this.props.loading || this.props.HistoricalChart) {
            return (
                <View style={{ margin: 10, paddingTop: 10, paddingBottom: 10, flex: 1, justifyContent: 'center', elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <ActivityIndicator size='large' />
                </View>
            );
        } else if (this.props.historicalData.length == 1) {
            return (
                <View style={{ margin: 10, paddingTop: 10, paddingBottom: 10, flex: 1, justifyContent: 'center', elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <Text style={{ alignSelf: 'center' }}> Device telementry not available. </Text>
                </View>
            );
        } else {
            this.dataList = this.props.historicalData[1].dataList;
            chartConfiguration = {
                type: 'line',
                data: {
                    labels: this.props.historicalData[0].labels,
                    datasets: [
                        {
                            data: this.dataList,
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

            return (
                <View style={{ margin: 10, paddingTop: 10, marginBottom: 10, paddingBottom: 10, elevation: 5, flex: 1, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <Chart
                        chartConfiguration={chartConfiguration}
                        defaultFontSize={12}
                        height={10000}
                    />
                </View>

            );
        }


    }

    //conveting date into isodate
    convertIsoDate(date, setDate) {
        console.log('flag', setDate);
        if (setDate) {
            date.setHours(0)

            date.setMinutes(0);
            date.setSeconds(0);
            return date.toISOString();
        }
        else {
            return date.toISOString();
        }
    }


    //redreing device property and showed into picker item
    renderDeviceProperty(propertyList) {
        return propertyList.map((property, i) => {
            return (
                <Picker.Item value={property.property_name} label={property.display_property_name ? property.display_property_name : property.property_name} />
            );
        });
    }


    render() {

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
                <View style={{ margin: 10, marginTop: 15, elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <Text style={{ marginLeft: 10, marginTop: 5 }}>Property : </Text>
                    <Picker
                        selectedValue={this.state.selectedProp}
                        style={(this.props.deviceProperty.length !== 0) ? { width: '100%', height: 40 } : { width: '100%', height: 40, }}
                        disabled={(this.props.deviceProperty.length !== 0) ? false : true}
                        textStyle={(this.props.deviceProperty.length !== 0) ? { fontSize: 15 } : { fontSize: 15, color: '#DCDCDC' }}
                        onValueChange={(itemValue) => {
                            if (itemValue) {
                                this.setState({ selectedProp: itemValue })
                                console.log('item0-0-0-0-0-0-0', itemValue);
                                console.log("this.state.selectedDateRange", this.state.selectedDateRange);
                                console.log("this.state.selectedProp  date", this.state.selectedProp);
                                this.Validation(itemValue, this.state.selectedDateRange, this.state.toDate, this.state.fromDate)
                            }
                        }
                        }>
                        <Picker.Item label="Select Property" value="" />
                        {this.renderDeviceProperty(this.props.deviceProperty)}

                    </Picker>
                </View>
                <View style={{ margin: 10, marginTop: 15, elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <Text style={{ marginLeft: 10, marginTop: 5 }}>Date Range ({this.renderDate()}) :</Text>
                    <Picker
                        selectedValue={this.state.selectedDateRange}
                        style={{ width: '100%', height: 40 }}
                        textStyle={{ fontSize: 15 }}
                        onValueChange={(itemValue) => {
                            if (itemValue) {
                                this.setState({ selectedDateRange: itemValue })
                                if (itemValue == "Today") {
                                    console.log('--', this.getSpecificDate(0));
                                    var toDate = this.getSpecificDate(0);
                                    var fromDate = this.getSpecificDate(0);
                                    toDate = this.convertIsoDate(toDate, false)
                                    fromDate = this.convertIsoDate(fromDate, true)
                                    console.log('todate', toDate);
                                    console.log('fromdate', fromDate);

                                    this.setState({ toDate, fromDate, customeDatePickerShow: false })
                                    this.Validation(this.state.selectedProp, itemValue, toDate, fromDate)

                                } else if (itemValue == "Yesterday") {
                                    var toDate = this.getSpecificDate(0);
                                    var fromDate = this.getSpecificDate(1);
                                    toDate = this.convertIsoDate(toDate, true);
                                    fromDate = this.convertIsoDate(fromDate, true);
                                    console.log('todate', toDate);
                                    console.log('fromdate', fromDate);

                                    this.setState({ toDate, fromDate, customeDatePickerShow: false })
                                    this.Validation(this.state.selectedProp, itemValue, toDate, fromDate)
                                } else if (itemValue == "Last 7 Days") {
                                    var toDate = this.getSpecificDate(0)
                                    var fromDate = this.getSpecificDate(6)
                                    toDate = this.convertIsoDate(toDate, false);
                                    fromDate = this.convertIsoDate(fromDate, true);
                                    console.log('todate', toDate);
                                    console.log('fromdate', fromDate);

                                    this.setState({ toDate, fromDate, customeDatePickerShow: false })
                                    this.Validation(this.state.selectedProp, itemValue, toDate, fromDate)
                                } else if (itemValue == "Last 30 Days") {
                                    var toDate = this.getSpecificDate(0);
                                    var fromDate = this.getSpecificDate(31);
                                    toDate = this.convertIsoDate(toDate, false);
                                    fromDate = this.convertIsoDate(fromDate, true)
                                    console.log('todate', toDate);
                                    console.log('fromdate', fromDate);

                                    this.setState({ toDate, fromDate, customeDatePickerShow: false })
                                    this.Validation(this.state.selectedProp, itemValue, toDate, fromDate)
                                } else if (itemValue == "This Month") {
                                    var date = new Date();
                                    console.log(date.getDate());

                                    var fromDate = this.getSpecificDate(date.getDate() - 1);
                                    var toDate = this.getSpecificDate(0);
                                    console.log('todate', toDate.toISOString());
                                    console.log('fromdate', fromDate.toISOString());
                                    toDate = this.convertIsoDate(toDate, false);
                                    fromDate = this.convertIsoDate(fromDate, true);
                                    console.log('todate', toDate);
                                    console.log('fromdate', fromDate);

                                    this.setState({ toDate, fromDate, customeDatePickerShow: false })
                                    this.Validation(this.state.selectedProp, itemValue, toDate, fromDate)
                                } else if (itemValue == "Custom Range") {
                                    console.log("pressed");
                                    this.setState({ customeDatePickerShow: !this.state.customeDatePickerShow });

                                }
                            }
                        }
                        }>
                        <Picker.Item label="Select Date Range" value="" />
                        {this.state.dateRange.map((daterange, i) => {
                            return <Picker.Item key={i} value={daterange} label={daterange} />
                        })}
                    </Picker>
                </View>
                {this.getCustomeDate()}
                {this.state.isShowChart ? this.renderChart() : null}

            </View>


        );
    }
}

const styles = StyleSheet.create({
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

const mapStateToProps = ({ device }) => {
    const { historicalData, deviceProperty, loading } = device;

    return { historicalData, deviceProperty, loading };
};


export default connect(mapStateToProps, { getHistoricalData, getDeviceProperty })(HistoricalChart);
