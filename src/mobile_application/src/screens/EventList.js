import React, { Component } from 'react';
import {
    RefreshControl, StyleSheet, Text, View, FlatList, ActivityIndicator, ScrollView,
    Alert, AsyncStorage,
} from 'react-native';
import * as Constant from '../Constant';
import { debug } from './../../app.json';
import { connect } from 'react-redux';
import { getEventList, deleteEvent, stopEventProccessing } from '../store/actions/rootActions';
import { SearchBar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Navigation } from 'react-native-navigation';




class EventList extends Component {

    static get options() {
        return Constant.DEFAULT_NAVIGATOR_STYLE;
    }

    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            refreshing: false,
            modalVisible: false,
            groupName: '',
            groupDescription: '',
            ch1: '',
            ch2: '',
            ch3: '',
            ch4: '',
            ch5: '',
            ch6: '',
            added_devices: [],
            showDevicesView: false

        };
    }



    componentDidAppear() {
        this._onRefresh();
    }

    componentDidDisappear() {
        this.visible = false;
        this.setState({ modalVisible: false, registrationModalVisible: false })
    }





    _onRefresh = () => {
        this.setState({ refreshing: true, searching: true, filterKey: '' });
        if (this.search) this.search.clear();
        AsyncStorage.getItem('accessToken').then((accessToken) => {
            Promise.resolve(this.props.onGetEventList(accessToken, this.props.groupId)).then((res) => {
                this.getListData()
                this.setState({ refreshing: false });
            });
        });
    }

    setRegistrationModalVisible(visible) {
        if (visible) {
            this.setState({
                showDevicesView: false,
                modalVisible: true
            });
        } else {
            this.setState({
                groupName: '',
                groupDescription: '',
                ch1: '',
                ch2: '',
                ch3: '',
                ch4: '',
                ch5: '',
                ch6: '',
                showDevicesView: false,
                modalVisible: false,
                editGroup: false,
                added_devices: [],
                groupId: ''
            })
        }

    }



    getListData() {
        if (this.state.filterKey) {
            const newData = this.props.eventList.filter(item => {
                const itemData = `${item.profile_name.toUpperCase()}`;
                const end_date = item.end_date ? `${item.end_date.toString().toUpperCase()}` || '' : '';
                console.log('-----------------------------itemdata-------------------------', item);
                const returnData = itemData.indexOf(this.state.filterKey.toUpperCase()) > -1 ||
                    (`${item.preset.toString().toUpperCase()}` + '%').indexOf(this.state.filterKey.toUpperCase()) > -1 ||
                    `${item.start_date.toString().toUpperCase()}`.indexOf(this.state.filterKey.toUpperCase()) > -1 ||
                    end_date.indexOf(this.state.filterKey.toUpperCase()) > -1 ||
                    `${this.formatStandardTime(item.start_time).toUpperCase()}`.indexOf(this.state.filterKey.toUpperCase()) > -1;
                console.log('item datatype', returnData, this.state.filterKey.toUpperCase(), item.preset.toString().toUpperCase() + '%', `${item.preset.toString().toUpperCase()}` + '%'.indexOf(this.state.filterKey.toUpperCase()) > -1);
                return returnData;
            });
            return newData.sort();
        }
        return this.props.eventList;
    }

    formatDate = (value) => {
        let month = ((value.getMonth() + 1) < 10) ? "0" + (`${value.getMonth() + 1}`) : `${value.getMonth() + 1}`;  // get month
        let date = ((value.getDate()) < 10) ? "0" + (`${value.getDate()}`) : `${value.getDate()}`;

        return month + "/" + date + "/" + value.getFullYear();
    }

    formatStandardTime(date) {

        console.log('date------->', date);
        let utcTime = date.split(':');
        let showDate = new Date();
        showDate.setUTCHours(utcTime[0]);
        showDate.setUTCMinutes(utcTime[1]);
        console.log('set utc date', showDate)

        let time = showDate.toUTCString();
        time = time.split(':'); // convert to array

        // fetch
        var hours = showDate.getHours()
        var minutes = showDate.getMinutes();
        console.log('second', time, hours, minutes);

        // calculate
        var timeValue = hours + ":" + minutes;

        return timeValue
    }

    renderEvents(item, index) {
        timeStamp = this.formatDate(new Date(item.start_date)) + " | " + this.formatStandardTime(item.start_time);
        console.log('item, ', item);

        return (
            <View key={index} style={[styles.listItem,]}>
                <View style={{
                    flexDirection: 'row', width: '100%', marginVertical: '1%', paddingHorizontal
                        : '3%', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <Text style={{ fontWeight: 'bold', color: '#fff', alignSelf: 'center', backgroundColor: "#636363", marginVertical: "1%" }}>{debug ? item.id + '-' : ''}{item.profile_name} </Text>
                    <Icon name="delete" size={26} style={{ color: '#fff', alignSelf: 'center', marginTop: '1%' }} onPress={() => {
                        Alert.alert('Delete Event', 'Are you sure you want to delete ' + item.profile_name + ' event ?',
                            [
                                {
                                    text: 'Cancel', onPress: () => {
                                        console.log('delete operation was canceled.');
                                    }, style: 'cancel'
                                },
                                {
                                    text: 'Delete', onPress: () => {
                                        console.log('delete operation start');
                                        this.props.onDeleteEvent(this.state.token, item.job_name);
                                    }
                                },
                            ],
                            { cancelable: true }
                        )
                    }} />
                </View>
                <View style={{ height: 2, width: '95%', margin: '2%', backgroundColor: '#000', paddingLeft: -20, }} />
                <View horizontal style={{ justifyContent: 'flex-start', flexDirection: 'row', paddingLeft: -20, marginBottom: '2%', paddingHorizontal: 10 }}>


                    <View style={{ width: '15%' }}>
                        <Text style={{ color: '#fff', alignSelf: 'center', fontSize: 12 }}> Preset </Text>
                        <Text style={{ color: '#fff', alignSelf: 'center', fontSize: 12 }}> {item.preset}% </Text>
                    </View>

                    <View style={{ width: 2, height: '80%', backgroundColor: '#fff', margin: '1%' }} />

                    <View style={{ width: '25%' }}>
                        <Text style={{ color: '#fff', alignSelf: 'center', fontSize: 12 }}> Start Date </Text>
                        <Text style={{ color: '#fff', alignSelf: 'center', fontSize: 12 }}> {this.formatDate(new Date(item.start_date))} </Text>
                    </View>

                    <View style={{ width: 2, height: '80%', backgroundColor: '#fff', margin: '1%' }} />


                    <View style={{ width: '25%' }}>
                        <Text style={{ color: '#fff', alignSelf: 'center', fontSize: 12 }}> Start Time </Text>
                        <Text style={{ color: '#fff', alignSelf: 'center', fontSize: 12 }}> {this.formatStandardTime(item.start_time)} </Text>
                    </View>
                    {item.end_date ? (
                        <View style={{ width: 2, height: '80%', backgroundColor: '#fff', margin: '1%' }} />
                    ) : (
                            <View />
                        )}


                    {item.end_date ? (
                        <View style={{ width: '25%' }}>
                            <Text style={{ color: '#fff', alignSelf: 'center', fontSize: 12 }}> End Date </Text>
                            <Text style={{ color: '#fff', alignSelf: 'center', fontSize: 12 }}> {item.end_date} </Text>
                        </View>
                    ) : (
                            <View />
                        )}
                </View>
            </View>
        );
    }


    renderListData(listData) {
        if (!this.props.loading) {
            let data1 = [
                {
                    id: 1,
                    profile_name: 'test',
                    preset: '100',
                    start_date: '09/23/3322',
                    start_time: '10: 30 PM',
                    end_date: '08/31/2323'
                },
                {
                    id: 2,
                    profile_name: 'test',
                    preset: '100',
                    start_date: '09/23/3322',
                    start_time: '10: 30 PM',
                    end_date: '08/31/2323'
                }
            ]
            if (listData.length !== 0) {
                return (
                    <FlatList
                        data={listData}
                        renderItem={({ item, index }) => this.renderEvents(item, index)}
                        keyExtractor={(item) => item.id.toString()}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this._onRefresh}
                                colors={['red', 'green', 'blue']}
                            />
                        }
                    />
                );
            } else {
                console.log('no length11111111', listData);

                return (
                    <ScrollView contentContainerStyle={styles.activityIndicator}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this._onRefresh}
                                colors={['red', 'green', 'blue']}
                            />
                        }>
                        <Text color="#00ff00">No Event found.</Text>
                    </ScrollView>
                );
            }
        } else {

            return <View style={styles.activityIndicator}><ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /></View>;
        }
    }






    render() {
        let listData = this.getListData() || [];


        if (this.props.proccessing) {
            console.log('-------------------');
            this._onRefresh();
            this.props.onStopEventProccessing(false);
        }

        return (
            <View style={styles.container}>

                <View style={styles.greenBackgroundContainer} />
                <View style={styles.listContainer}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.listTitle}> Events </Text>
                        {!this.state.searching && listData.length > 0 &&
                            <Icon name="search" size={24} style={{ padding: 10 }} onPress={() => {
                                this.setState({
                                    searching: true
                                });
                                var myInterval = setInterval(() => {
                                    if (this.search) {
                                        this.search.focus();
                                        clearInterval(myInterval);
                                    }
                                }, 100);
                            }} />
                        }
                    </View>
                    {this.state.searching && (listData.length > 0 || this.state.filterKey.length > 0) &&
                        <SearchBar
                            ref={search => this.search = search}
                            lightTheme
                            onChangeText={(filterKey) => {
                                this.setState({ filterKey })
                            }}
                            value={this.state.filterKey}
                            onClear={() => { this.setState({ filterKey: '' }) }}
                            placeholder='Search LED Groups...'
                            containerStyle={{ backgroundColor: Constant.LIGHT_GREY_COLOR, padding: 2, maxHeight: 32 }}
                            inputContainerStyle={{ backgroundColor: Constant.WHITE_BACKGROUND_COLOR, maxHeight: 32 }}
                            inputStyle={{ fontSize: 16 }} />
                    }
                    {this.renderListData(listData)}
                </View>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: Constant.LIGHT_GREY_COLOR
    },
    greenBackgroundContainer: {
        backgroundColor: Constant.PRIMARY_COLOR,
        width: '100%',
        height: '25%',
        position: 'absolute'
    },
    listContainer: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: Constant.WHITE_BACKGROUND_COLOR,
        marginLeft: '5%',
        marginRight: '5%',
        borderRadius: 5
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: "center"
    },
    roundButton: {
        justifyContent: "center",
        padding: 6,
        borderRadius: 12,
        marginRight: 12
    },
    addNewButton: {
        backgroundColor: Constant.ADD_NEW_GATEWAY_BUTTON_COLOR,
    },
    registerButton: {
        backgroundColor: Constant.PRIMARY_COLOR,
    },
    cancelButton: {
        width: 80,
        margin: 10,
        marginLeft: 15,
        backgroundColor: Constant.DARK_GREY_COLOR
    },
    buttonText: {
        fontSize: 12,
        color: Constant.WHITE_TEXT_COLOR,
        fontWeight: "bold",
        textAlign: 'center'
    },
    fullModalContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#78787885'
    },
    modalContainer: {
        width: '94%',
        height: '56%',
        backgroundColor: Constant.WHITE_BACKGROUND_COLOR
    },
    modalTitle: {
        flexDirection: 'row',
        alignItems: "center"
    },
    modalTitleAddButton: {
        backgroundColor: Constant.ADD_NEW_GATEWAY_BUTTON_COLOR,
        height: 30,
        width: 30,
        borderRadius: 15,
        margin: 15
    },
    scanContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    scanImage: {
        height: 100,
        width: 100
    },
    scanText: {
        marginTop: 10,
        marginBottom: 30,
        color: Constant.DARK_GREY_COLOR
    },
    gatewayList: {
        flex: 1
    },
    gatewayListContainer: {
        flex: 1,
        height: 100,
        justifyContent: "center"
    },
    gatewayIcon: {
        backgroundColor: Constant.ADD_NEW_GATEWAY_BUTTON_COLOR,
        height: 30,
        width: 30,
        borderRadius: 15,
        margin: 5,
        marginLeft: 15,
    },
    listTitle: {
        flex: 1,
        padding: 10,
        fontWeight: 'bold',
        borderBottomColor: Constant.LIGHT_GREY_COLOR
    },
    listItem: {
        width: "100%",
        borderTopWidth: 2,
        borderColor: "#fff",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: 'flex-start',
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: '#636363',
        height: 100

    },
    gatewayItem: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Constant.LIGHT_GREY_COLOR,
    },
    activityIndicator: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    registrationModalContainer: {
        width: '84%',
        marginTop: 60,
        marginBottom: 60,
        backgroundColor: Constant.WHITE_TEXT_COLOR
    },
    detailIcon: {
        backgroundColor: '#78787878',
        height: 20,
        width: 20,
        borderRadius: 12,
        marginLeft: 5
    },
    inputContainer: {
        marginLeft: '5%',
        marginRight: '5%',
    },
    menuItem: { margin: 6 },
    deviceItem: {
        marginTop: 2,
        padding: 10,
        elevation: 5,
        width: "100%",
        backgroundColor: Constant.WHITE_BACKGROUND_COLOR
    }
});

mapStatesToProps = state => {
    return {

        eventList: state.EventReducer.eventList,
        loading: state.EventReducer.loading,
        proccessing: state.EventReducer.proccessing
    }

};

mapDispatchToProps = dispatch => {
    return {
        onGetEventList: (token, groupId) => dispatch(getEventList(token, groupId)),
        onDeleteEvent: (token, jobName) => dispatch(deleteEvent(token, jobName)),
        onStopEventProccessing: (flag) => dispatch(stopEventProccessing(flag))
    }
};


export default connect(mapStatesToProps, mapDispatchToProps)(EventList);
