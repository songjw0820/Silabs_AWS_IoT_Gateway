import React, { Component } from "react";
import {
    View, StyleSheet, Modal, TextInput, ScrollView,
    TouchableOpacity, Image, Text, AsyncStorage,
    Alert, ActivityIndicator , Slider
} from "react-native";
import { Button } from 'react-native-elements';
import { connect } from 'react-redux';
import * as Constant from '../Constant';
import { getLedProfiles, getLedChannels, setLedControls, getCurrentValue, addProfile, isProfileDeleted, deleteProfile, isScreenLoading } from '../store/actions/deviceActions';
import { Picker } from 'react-native-picker-dropdown'
import { Navigation } from "react-native-navigation";

// import Slider from '@react-native-community/slider';

class LedControl extends Component {

    static get options() {
        return Constant.DEFAULT_NAVIGATOR_STYLE
    }
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            showProfileModal: false,
            token: '',
            selectedProfileName: '',
            loading: false,
            newProfileName: '',
            newProfileDescription: '',
            channel1Value: 0,
            channel2Value: 0,
            channel3Value: 0,
            channel4Value: 0,
            channel5Value: 0,
            channel6Value: 0,
            channel1ValueForProfile: 0,
            channel2ValueForProfile: 0,
            channel3ValueForProfile: 0,
            channel4ValueForProfile: 0,
            channel5ValueForProfile: 0,
            channel6ValueForProfile: 0,
            presetValue: 100,
            noProfileDefaultValue: {},
            currentProfileLEDItencity: {},
            ledCurrentData: {}
        };
        this.deviceTypeList = [{ "id": 1, "device_type_name": "SoilNode", "device_type_display_name": "Soil Node" },
        { "id": 2, "device_type_name": "LightShield", "device_type_display_name": "Light Shield" },
        { "id": 3, "device_type_name": "LedNode", "device_type_display_name": "Led Node" },
        { "id": 4, "device_type_name": "SCMNode", "device_type_display_name": "SCM Node" }];
    }


    componentDidAppear() {
        this.onRefresh();
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.ledCurrentData !== prevState.ledCurrentData) {
            return { ledCurrentData: nextProps.ledCurrentData };
        }
        else return null;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.ledCurrentData !== this.props.ledCurrentData) {
            //Perform some operation here
            this.displayCurrentData(this.props.ledCurrentData);
        }
    }

    onRefresh() {
        this.setState({ loading: true })
        AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN']).then(response => {
            let token = response[0][1];
            let appleKey = response[1][1]
            this.setState({ token, appleKey })
            Promise.resolve((
                this.props.getLedProfiles(this.props.deviceId, token, appleKey)
            )).then(() => {
                this.props.getLedChannels(this.props.deviceId, token, appleKey);
                this.props.getCurrentValue(this.props.deviceHid, token, undefined, appleKey);
                this.setState({ loading: false });
            })

        });
    }



    // setting current telementry for LED node
    displayCurrentData(ledCurrentData) {
        console.log('currentDataiu09u0uk;hlkhohklhlk', ledCurrentData);
        console.log('led 1=============== in dispaly', ledCurrentData.led1);
        if (ledCurrentData.led1) {
            this.setState({
                channel1Value: parseInt(ledCurrentData.led1),
                channel2Value: parseInt(ledCurrentData.led2),
                channel3Value: parseInt(ledCurrentData.led3),
                channel4Value: parseInt(ledCurrentData.led4),
                channel5Value: parseInt(ledCurrentData.led5),
                channel6Value: parseInt(ledCurrentData.led6),
                noProfileDefaultValue: {
                    ch1: parseInt(ledCurrentData.led1),
                    ch2: parseInt(ledCurrentData.led2),
                    ch3: parseInt(ledCurrentData.led3),
                    ch4: parseInt(ledCurrentData.led4),
                    ch5: parseInt(ledCurrentData.led5),
                    ch6: parseInt(ledCurrentData.led6)
                }

            })
            console.log('type of led1', typeof (parseInt(ledCurrentData.led1)), parseInt(ledCurrentData.led1));

        }
    }





    // setting channel's value
    setChannelConfifuration(profileName) {
        this.props.ledProfiles.map((profile, i) => {
            if (profile.profile_name == profileName) {
                return this.setState({
                    channel1Value: JSON.parse(profile.channel_configuration).ch1, channel2Value: JSON.parse(profile.channel_configuration).ch2, channel3Value: JSON.parse(profile.channel_configuration).ch3, channel4Value: JSON.parse(profile.channel_configuration).ch4, channel5Value: JSON.parse(profile.channel_configuration).ch5,
                    channel6Value: JSON.parse(profile.channel_configuration).ch6, currentProfileLEDItencity: JSON.parse(profile.channel_configuration), selectedProfileId: profile.id, presetValue: 100
                });
            }

        })

    }

    renderLEDControls() {
        if (this.props.loading || this.state.loading) {
            return (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ height: 100 }}>
                        <ActivityIndicator size="large" style={{ marginTop: 10 }} />
                        <Text style={{ alignSelf: 'center', marginTop: 20 }}>Please Wait....</Text>
                    </View>
                </View>
            )
        } else {
            return (
                <View style={{ margin: 10, paddingTop: 10, paddingBottom: 10, flex: 2, elevation: 5, backgroundColor: "#fff", shadowColor: "black", shadowOpacity: 1 }}>
                    <Text style={{ marginLeft: 20 }}>Channel Configuration</Text>
                    <ScrollView style={{ marginTop: 10, flex: 1 }}>
                        <View style={{ flexDirection: 'row', margin: 5 }}>
                            <Text>CH 1: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led1}</Text>
                            <Slider
                                value={this.state.channel1Value}
                                maximumValue={100}
                                minimumValue={0}
                                disabled={this.props.ledChannelsData.led1 == 'NC' ? true : false || this.state.selectedProfileName !== ''}
                                onValueChange={(value) => this.setState({ channel1Value: parseInt(value) })}
                                style={{ width: '60%', color: 'red', marginLeft: 10, marginTop: -10 }}
                                thumbTintColor='#acd373'
                                trackStyle={{ color: 'red' }}
                                minimumTrackTintColor="#3F3F3F"
                                maximumTrackTintColor="#B3B3B3"

                            />
                            <Text style={{ marginLeft: 10 }}>{this.state.channel1Value}%</Text>
                        </View>
                        <View style={{ flexDirection: 'row', margin: 5 }}>
                            <Text>CH 2: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led2}</Text>
                            <Slider
                                value={this.state.channel2Value}
                                maximumValue={100}
                                disabled={this.props.ledChannelsData.led2 == 'NC' ? true : false || this.state.selectedProfileName !== ''}
                                minimumValue={0}
                                onValueChange={(value) => this.setState({ channel2Value: parseInt(value) })}
                                style={{ width: '60%', marginLeft: 10, marginTop: -10 }}
                                thumbTintColor='#acd373'
                                minimumTrackTintColor="#3F3F3F"
                                maximumTrackTintColor="#B3B3B3"
                            />
                            <Text style={{ marginLeft: 10, width: '20%' }}>{this.state.channel2Value}%</Text>
                        </View >
                        <View style={{ flexDirection: 'row', margin: 5 }}>
                            <Text>CH 3: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led3}</Text>
                            <Slider
                                value={this.state.channel3Value}
                                maximumValue={100}
                                disabled={this.props.ledChannelsData.led3 == 'NC' ? true : false || this.state.selectedProfileName !== ''}
                                minimumValue={0}
                                onValueChange={(value) => this.setState({ channel3Value: parseInt(value) })}
                                style={{ width: '60%', marginLeft: 10, marginTop: -10 }}
                                thumbTintColor='#acd373'
                                minimumTrackTintColor="#3F3F3F"
                                maximumTrackTintColor="#B3B3B3"
                            />
                            <Text style={{ marginLeft: 10, width: '20%' }}>{this.state.channel3Value}%</Text>
                        </View>
                        <View style={{ flexDirection: 'row', margin: 5 }}>
                            <Text>CH 4: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led4}</Text>
                            <Slider
                                value={this.state.channel4Value}
                                maximumValue={100}
                                disabled={this.props.ledChannelsData.led4 == 'NC' ? true : false || this.state.selectedProfileName !== ''}
                                minimumValue={0}
                                onValueChange={(value) => this.setState({ channel4Value: parseInt(value) })}
                                style={{ width: '60%', marginLeft: 10, marginTop: -10 }}
                                thumbTintColor='#acd373'
                                minimumTrackTintColor="#3F3F3F"
                                maximumTrackTintColor="#B3B3B3"
                            />
                            <Text style={{ marginLeft: 10, width: '20%' }}>{this.state.channel4Value}%</Text>
                        </View>
                        <View style={{ flexDirection: 'row', margin: 5 }}>
                            <Text>CH 5: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led5}</Text>
                            <Slider
                                value={this.state.channel5Value}
                                maximumValue={100}
                                disabled={this.props.ledChannelsData.led5 == 'NC' ? true : false || this.state.selectedProfileName !== ''}
                                minimumValue={0}
                                onValueChange={(value) => this.setState({ channel5Value: parseInt(value) })}
                                style={{ width: '60%', marginLeft: 10, marginTop: -10 }}
                                thumbTintColor='#acd373'
                                minimumTrackTintColor="#3F3F3F"
                                maximumTrackTintColor="#B3B3B3"
                            />
                            <Text style={{ marginLeft: 10, width: '20%' }}>{this.state.channel5Value}%</Text>
                        </View>
                        <View style={{ flexDirection: 'row', margin: 5 }}>
                            <Text>CH 6: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led6}</Text>
                            <Slider
                                value={this.state.channel6Value}
                                maximumValue={100}
                                minimumValue={0}
                                disabled={this.props.ledChannelsData.led6 == 'NC' ? true : false || this.state.selectedProfileName !== ''}
                                onValueChange={(value) => this.setState({ channel6Value: parseInt(value) })}
                                style={{ width: '60%', marginLeft: 10, marginTop: -10 }}
                                thumbTintColor='#acd373'
                                minimumTrackTintColor="#3F3F3F"
                                maximumTrackTintColor="#B3B3B3"
                            />
                            <Text style={{ marginLeft: 10, width: '20%' }}>{this.state.channel6Value}%</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', margin: 10, flex: 1 }}>
                            <Button
                                onPress={() => {
                                    console.log('this.state------------', this.state.channel1Value, this.state.channel2Value, this.state.channel3Value, this.state.channel4Value, this.state.channel5Value, this.state.channel6Value);
                                    if (!this.props.deviceStatus) {
                                        Alert.alert('Device set', 'Selected Device or Grow Area is currently out of network. Please try later.', [{
                                            text: 'Ok', onPress: () => {
                                                this.setState({
                                                    channel1Value: this.state.noProfileDefaultValue.ch1,
                                                    channel2Value: this.state.noProfileDefaultValue.ch2,
                                                    channel3Value: this.state.noProfileDefaultValue.ch3,
                                                    channel4Value: this.state.noProfileDefaultValue.ch4,
                                                    channel5Value: this.state.noProfileDefaultValue.ch5,
                                                    channel6Value: this.state.noProfileDefaultValue.ch6,

                                                })
                                            }
                                        }], { cancelable: true })

                                    } else {
                                        var reqBody = {
                                            "device_id": { "id": this.props.deviceId },
                                            "device_type": this.props.deviceType,
                                            "ch1": this.state.channel1Value,
                                            "ch2": this.state.channel2Value,
                                            "ch3": this.state.channel3Value,
                                            "ch4": this.state.channel4Value,
                                            "ch5": this.state.channel5Value,
                                            "ch6": this.state.channel6Value


                                        }
                                        this.props.setLedControls(reqBody, this.state.token, this.state.appleKey);
                                    }
                                }}
                                title="Set"
                                textStyle={{ alignSelf: 'center' }}
                                buttonStyle={{ marginTop: 0, marginLeft: 5, height: 40, width: 60, backgroundColor: Constant.PRIMARY_COLOR, alignItems: 'center' }} />
                            <Button
                                onPress={() => {
                                    this.setState({ channel1Value: 0, channel2Value: 0, channel3Value: 0, channel4Value: 0, channel5Value: 0, channel6Value: 0, selectedProfileName: "" })
                                    console.log('this.state------------', this.state.channel1Value, this.state.channel2Value, this.state.channel3Value, this.state.channel4Value, this.state.channel5Value, this.state.channel6Value);

                                }}
                                title="Clear"
                                textStyle={{ alignSelf: 'center' }}
                                buttonStyle={{ marginTop: 0, marginLeft: 5, height: 40, width: 60, backgroundColor: Constant.PRIMARY_COLOR, alignItems: 'center' }} />
                        </View>
                    </ScrollView>
                </View>
            )
        }
    }

    render() {

        if (this.props.isProfileDeletedLoader) {
            this.onRefresh();
            this.props.isProfileDeleted(false);
        }
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
                    <View style={{ marginTop: 15, backgroundColor: "#fff", flexDirection: 'row' }}>
                        <Text style={{ marginLeft: 15, marginTop: 5, height: 30, width: "20%" }}>Profile : </Text>
                        <Picker
                            selectedValue={this.state.selectedProfileName}
                            style={{ marginRight: 25, height: 30, width: '70%' }}
                            onValueChange={(itemValue) => {
                                this.setState({ selectedProfileName: itemValue });
                                this.setChannelConfifuration(itemValue)
                                if (itemValue === '' && this.state.selectedProfileName !== '') {
                                    this.setState({
                                        channel1Value: this.state.noProfileDefaultValue.ch1,
                                        channel2Value: this.state.noProfileDefaultValue.ch2,
                                        channel3Value: this.state.noProfileDefaultValue.ch3,
                                        channel4Value: this.state.noProfileDefaultValue.ch4,
                                        channel5Value: this.state.noProfileDefaultValue.ch5,
                                        channel6Value: this.state.noProfileDefaultValue.ch6
                                    });
                                }

                            }
                            }>
                            <Picker.Item label="Select Profile" value="" />
                            {this.props.ledProfiles.map((profile, i) => {
                                return <Picker.Item key={i} value={profile.profile_name || ''} label={profile.profile_name || ''} />
                            })}
                        </Picker>
                    </View>

                    <View style={{ flexDirection: 'row', marginTop: 5, alignItems: "center", justifyContent: 'flex-start', margin: 10 }}>
                        <TouchableOpacity style={[styles.roundButton, { backgroundColor: Constant.PRIMARY_COLOR }]} onPress={() =>
                            this.setState({
                                showProfileModal: true,
                                newProfileName: '',
                                newProfileDescription: '',
                                channel1ValueForProfile: 0,
                                channel2ValueForProfile: 0,
                                channel3ValueForProfile: 0,
                                channel4ValueForProfile: 0,
                                channel5ValueForProfile: 0,
                                channel6ValueForProfile: 0,

                            })}>
                            <Text style={styles.buttonText}>Add New Profile</Text>
                            <Image source={require('../../assets/images/add_24.png')} style={styles.detailIcon} />
                        </TouchableOpacity>
                        {this.state.selectedProfileName === '' ?
                            <View />
                            :
                            <TouchableOpacity style={[styles.roundButton, { backgroundColor: Constant.PRIMARY_COLOR }]} onPress={() => {
                                this.props.deleteProfile(this.state.token, this.state.selectedProfileId, this.state.appleKey)
                                this.setState({ selectedProfileName: '' })
                            }}>
                                <Text style={styles.buttonText}>Delete</Text>
                                <Image source={require('../../assets/images/delete_ios.png')} style={styles.detailIcon} />

                            </TouchableOpacity>
                        }
                        <View style={{ justifyContent: 'center', flex: 1 }} >
                            <Modal
                                animationType="slide"
                                transparent
                                visible={this.state.showProfileModal}
                                onRequestClose={() => { this.setState({ showProfileModal: false }); }}
                            >
                                <View style={{ backgroundColor: '#rgba(0,0,0,0.75)', justifyContent: 'center', flex: 1, position: 'relative', }}>
                                    <View style={{ marginTop: 10, backgroundColor: "#000", marginTop: 50 }}>


                                        <View style={{ marginTop: 20, backgroundColor: '#000' }}>
                                            <Text style={{ color: '#fff', fontSize: 24 }}>Create New Profile</Text>
                                            <View style={{ height: 1, marginTop: 10, backgroundColor: '#fff' }}></View>

                                            <View style={{ flexDirection: 'row', height: 40, marginLeft: 10, marginTop: 10, marginRight: 20 }}>
                                                <Text style={{ paddingTop: 10, color: '#fff', justifyContent: 'space-around' }}>Profile Name: </Text>
                                                <TextInput
                                                    placeholder='Profile Name'
                                                    onChangeText={(text) => {
                                                        console.log(text.length);
                                                        this.setState({ newProfileName: text })
                                                    }}
                                                    style={{ backgroundColor: 'white', marginLeft: 20, width: '60%' }}
                                                />
                                            </View>
                                            <View style={{ flexDirection: 'row', paddingTop: 20, marginLeft: 10, marginRight: 20 }}>
                                                <Text style={{ paddingTop: 10, color: '#fff' }}>Description: </Text>
                                                <TextInput
                                                    placeholder='Description'
                                                    onChangeText={(text) => {
                                                        console.log(text);
                                                        this.setState({ newProfileDescription: text })

                                                    }}
                                                    style={{ backgroundColor: 'white', marginLeft: 30, height: 50, width: '60%' }}
                                                />
                                            </View>
                                        </View>
                                        <View style={{ height: 1, marginTop: 10, backgroundColor: '#fff' }}></View>
                                        <View style={{ marginTop: 20 }} >
                                            <View style={{ flexDirection: 'row', margin: 5, marginLeft: 10 }}>
                                                <Text style={{ color: '#fff' }}>CH 1: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led1}</Text>
                                                <Slider
                                                    value={this.state.channel1ValueForProfile}
                                                    maximumValue={100}
                                                    minimumValue={0}
                                                    disabled={this.props.ledChannelsData.led1 == 'NC' ? true : false}
                                                    onValueChange={(value) => this.setState({ channel1ValueForProfile: parseInt(value) })}
                                                    style={{ width: '60%', marginLeft: 5, marginTop: -10 }}
                                                    thumbTintColor='#acd373'
                                                    minimumTrackTintColor="#3F3F3F"
                                                    maximumTrackTintColor="#FFFFFF"
                                                />
                                                <Text style={{ marginLeft: 5, color: '#fff', width: '20%' }}>{this.state.channel1ValueForProfile}%</Text>


                                            </View>
                                            <View style={{ flexDirection: 'row', margin: 5, marginLeft: 10 }}>
                                                <Text style={{ color: '#fff' }}>CH 2: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led2}</Text>
                                                <Slider
                                                    value={this.state.channel2ValueForProfile}
                                                    maximumValue={100}
                                                    minimumValue={0}
                                                    disabled={this.props.ledChannelsData.led2 == 'NC' ? true : false}
                                                    onValueChange={(value) => this.setState({ channel2ValueForProfile: parseInt(value) })}
                                                    style={{ width: '60%', marginLeft: 5, marginTop: -10 }}
                                                    thumbTintColor='#acd373'
                                                    minimumTrackTintColor="#3F3F3F"
                                                    maximumTrackTintColor="#FFFFFF"
                                                />
                                                <Text style={{ marginLeft: 5, color: '#fff', width: '20%' }}>{this.state.channel2ValueForProfile}%</Text>


                                            </View >
                                            <View style={{ flexDirection: 'row', margin: 5, marginLeft: 10 }}>
                                                <Text style={{ color: '#fff' }}>CH 3: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led3}</Text>
                                                <Slider
                                                    value={this.state.channel3ValueForProfile}
                                                    maximumValue={100}
                                                    minimumValue={0}
                                                    disabled={this.props.ledChannelsData.led3 == 'NC' ? true : false}
                                                    onValueChange={(value) => this.setState({ channel3ValueForProfile: parseInt(value) })}
                                                    style={{ width: '60%', marginLeft: 5, marginTop: -10 }}
                                                    thumbTintColor='#acd373'
                                                    minimumTrackTintColor="#3F3F3F"
                                                    maximumTrackTintColor="#FFFFFF"
                                                />
                                                <Text style={{ marginLeft: 5, color: '#fff', width: '20%' }}>{this.state.channel3ValueForProfile}%</Text>


                                            </View>
                                            <View style={{ flexDirection: 'row', margin: 5, marginLeft: 10 }}>
                                                <Text style={{ color: '#fff' }}>CH 4: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led4}</Text>
                                                <Slider
                                                    value={this.state.channel4ValueForProfile}
                                                    maximumValue={100}
                                                    minimumValue={0}
                                                    disabled={this.props.ledChannelsData.led4 == 'NC' ? true : false}
                                                    onValueChange={(value) => this.setState({ channel4ValueForProfile: parseInt(value) })}
                                                    style={{ width: '60%', marginLeft: 5, marginTop: -10 }}
                                                    thumbTintColor='#acd373'
                                                    minimumTrackTintColor="#3F3F3F"
                                                    maximumTrackTintColor="#FFFFFF"
                                                />
                                                <Text style={{ marginLeft: 5, color: '#fff', width: '20%' }}>{this.state.channel4ValueForProfile}%</Text>


                                            </View>
                                            <View style={{ flexDirection: 'row', margin: 5, marginLeft: 10 }}>
                                                <Text style={{ color: '#fff' }}>CH 5: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led5}</Text>
                                                <Slider
                                                    value={this.state.channel5ValueForProfile}
                                                    maximumValue={100}
                                                    minimumValue={0}
                                                    disabled={this.props.ledChannelsData.led5 == 'NC' ? true : false}
                                                    onValueChange={(value) => this.setState({ channel5ValueForProfile: parseInt(value) })}
                                                    style={{ width: '60%', marginLeft: 5, marginTop: -10 }}
                                                    thumbTintColor='#acd373'
                                                    minimumTrackTintColor="#3F3F3F"
                                                    maximumTrackTintColor="#FFFFFF"
                                                />
                                                <Text style={{ marginLeft: 5, color: '#fff', width: '20%' }}>{this.state.channel5ValueForProfile}%</Text>


                                            </View>
                                            <View style={{ flexDirection: 'row', margin: 5, marginLeft: 10 }}>
                                                <Text style={{ color: '#fff' }}>CH 6: </Text><Text style={{ color: Constant.PRIMARY_COLOR, width: 40 }}>{this.props.ledChannelsData.led6}</Text>
                                                <Slider
                                                    value={this.state.channel6ValueForProfile}
                                                    maximumValue={100}
                                                    disabled={this.props.ledChannelsData.led6 == 'NC' ? true : false}
                                                    minimumValue={0}
                                                    onValueChange={(value) => this.setState({ channel6ValueForProfile: parseInt(value) })}
                                                    style={{ width: '60%', marginLeft: 5, marginTop: -10 }}
                                                    thumbTintColor='#acd373'
                                                    minimumTrackTintColor="#3F3F3F"
                                                    maximumTrackTintColor="#FFFFFF"
                                                />
                                                <Text style={{ marginLeft: 5, color: '#fff', width: '20%' }}>{this.state.channel6ValueForProfile}%</Text>

                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'flex-end', alignItems: 'flex-end', marginRight: 40, marginBottom: 10 }}>
                                            <Button
                                                onPress={() => {
                                                    let regEx = /^[a-zA-Z][a-zA-Z_.]{0,1}[ a-z|A-Z|0-9|_.]*$/;

                                                    console.log("hello pressed");
                                                    if (this.state.newProfileName.trim() === '' || this.state.newProfileName.length > 25 || !regEx.test(this.state.newProfileName.trim())) {
                                                        return (
                                                            Alert.alert('Please Enter Valid Profile Name.', 'Invalid Profile name! Maximum length is 25. Name should start with alphabet and may contain dot, underscore, space and numeric value.')
                                                        );
                                                    }
                                                    else if (this.state.newProfileDescription.length > 200) {
                                                        return (
                                                            alert('Please Enter Valid Description. (Maximum length 200)')
                                                        );
                                                    }
                                                    else {
                                                        var reqData = {
                                                            "device": { "id": this.props.deviceId },
                                                            "device_type": this.props.deviceType,
                                                            "profile_name": this.state.newProfileName.trim(),
                                                            "description": this.state.newProfileDescription.trim(),
                                                            "channel_configuration": JSON.stringify({
                                                                "ch1": this.state.channel1ValueForProfile,
                                                                "ch2": this.state.channel2ValueForProfile,
                                                                "ch3": this.state.channel3ValueForProfile,
                                                                "ch4": this.state.channel4ValueForProfile,
                                                                "ch5": this.state.channel5ValueForProfile,
                                                                "ch6": this.state.channel6ValueForProfile
                                                            })
                                                        }
                                                        this.setState({ channel1ValueForProfile: 0, channel2ValueForProfile: 0, channel3ValueForProfile: 0, channel4ValueForProfile: 0, channel5ValueForProfile: 0, channel6ValueForProfile: 0, showProfileModal: false, newProfileName: '', newProfileDescription: '' });
                                                        this.props.addProfile(reqData, this.state.token, this.state.appleKey);
                                                    }
                                                }}
                                                title='Done'
                                                textStyle={{ alignSelf: 'center' }}
                                                buttonStyle={{ backgroundColor: Constant.PRIMARY_COLOR, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center' }} />
                                            <Button
                                                onPress={() => {
                                                    console.log("hello pressed");
                                                    this.setState({ showProfileModal: false })

                                                }}
                                                title='Cancel'
                                                textStyle={{ alignSelf: 'center' }}
                                                buttonStyle={{ marginLeft: 5, backgroundColor: Constant.PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center' }} />
                                        </View>
                                    </View>
                                </View>
                            </Modal>
                        </View>
                    </View>
                    {this.state.selectedProfileName === '' ?
                        <View />
                        :
                        <View>
                            <View style={{ height: 2, width: '100%', backgroundColor: '#000' }} />
                            <View style={{ flexDirection: 'row', margin: 5, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: Constant.PRIMARY_COLOR, }}>Preset: </Text>
                                <Slider
                                    value={this.state.presetValue}
                                    maximumValue={100}
                                    minimumValue={0}
                                    minimumTrackTintColor="#3F3F3F"
                                    maximumTrackTintColor="#B3B3B3"
                                    onValueChange={(value) => {
                                        console.log('--------->state<-------', this.state.currentProfileLEDItencity.ch1, this.state.currentProfileLEDItencity.ch2);

                                        let ch1 = (Math.round(value) * Math.round(this.state.currentProfileLEDItencity.ch1)) / 100;
                                        let ch2 = (Math.round(value) * Math.round(this.state.currentProfileLEDItencity.ch2)) / 100;
                                        let ch3 = (Math.round(value) * Math.round(this.state.currentProfileLEDItencity.ch3)) / 100;
                                        let ch4 = (Math.round(value) * Math.round(this.state.currentProfileLEDItencity.ch4)) / 100;
                                        let ch5 = (Math.round(value) * Math.round(this.state.currentProfileLEDItencity.ch5)) / 100;
                                        let ch6 = (Math.round(value) * Math.round(this.state.currentProfileLEDItencity.ch6)) / 100;

                                        console.log('ch1 ----->  value * this.state.currentLEDItencitya.led1) /100', value, this.state.currentProfileLEDItencity.ch1, ch1);

                                        this.setState({
                                            presetValue: Math.round(value),
                                            channel1Value: Math.round(ch1),
                                            channel2Value: Math.round(ch2),
                                            channel3Value: Math.round(ch3),
                                            channel4Value: Math.round(ch4),
                                            channel5Value: Math.round(ch5),
                                            channel6Value: Math.round(ch6),
                                        })
                                    }}
                                    style={{ width: '65%', color: 'red', marginLeft: 10, marginTop: 0 }}
                                    thumbTintColor='#acd373'
                                    trackStyle={{ color: 'red' }}
                                />
                                <Text style={{ marginLeft: 10 }}>{this.state.presetValue}%</Text>
                            </View>
                        </View>
                    }
                </View>
                {this.renderLEDControls()}
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
    detailIcon: {
        backgroundColor: '#78787878',
        height: 24,
        width: 24,
        borderRadius: 12,
        marginLeft: 5
    },
    locationInfo: {
        marginLeft: 4,
        marginRight: 10,
        fontSize: 12,
        fontWeight: "bold",
        color: Constant.WHITE_TEXT_COLOR
    },
    roundButton: {
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: 'center',
        padding: 5,
        borderRadius: 16,
        marginRight: 12
    },
    buttonText: {
        fontSize: 12,
        marginLeft: 7,
        color: Constant.WHITE_TEXT_COLOR,
        fontWeight: "bold",
        textAlign: 'center'
    }
});

const mapStateToProps = ({ device }) => {
    const { ledProfiles, loading, ledChannelsData, ledCurrentData, isProfileDeletedLoader } = device;
    return { ledProfiles, ledChannelsData, loading, ledCurrentData, isProfileDeletedLoader };
};


export default connect(mapStateToProps, { getLedProfiles, isProfileDeleted, getCurrentValue, getLedChannels, isScreenLoading, setLedControls, deleteProfile, addProfile })(LedControl);
