import React, { Component } from 'react';
import {
  RefreshControl, StyleSheet, Text, View, FlatList, ActivityIndicator, ScrollView,
  TouchableOpacity, Modal, Image, Picker, Alert, Platform, AsyncStorage
} from 'react-native';
import * as Constant from '../Constant';
import { debug } from './../../app.json';
import { connect } from 'react-redux';
import { getLEDGrpoupList, findDevices, createLedGroup, stopProccessing, deleteGroup, updateGroup } from '../store/actions/rootActions';
import { TextField } from 'react-native-material-textfield';
import { SearchBar, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CheckBox from 'react-native-check-box';
import IosPicker from 'react-native-picker-dropdown';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import { Navigation } from 'react-native-navigation';




class LEDGroupsList extends Component {

  gatewayCharacteristics = {};
  visible = false;
  bleDevice = null;
  alreadyRegistredGateways = [];
  reteyConnection = 0;
  ConnectedDevice = null;

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
      showDevicesView: false,
      searching: true,
      filterKey: ''

    };

    this.LEDChannelConfrugration = [
      { id: '1', displayChannel: 'R', value: 'R' },
      { id: '2', displayChannel: 'G', value: 'G' },
      { id: '3', displayChannel: 'B', value: 'B' },
      { id: '4', displayChannel: 'UV A', value: 'UV A' },
      { id: '5', displayChannel: 'UV B', value: 'UV B' },
      { id: '6', displayChannel: 'UV C', value: 'UV C' },
      { id: '7', displayChannel: 'RB  ', value: 'RB' },
      { id: '8', displayChannel: 'CW', value: 'CW' },
      { id: '9', displayChannel: 'NW', value: 'NW' },
      { id: '10', displayChannel: 'Y', value: 'Y' },
      { id: '11', displayChannel: 'A', value: 'A' },
      { id: '12', displayChannel: 'O', value: 'O' },
      { id: '13', displayChannel: 'WW', value: 'WW' },
      { id: '14', displayChannel: 'DR', value: 'DR' },
      { id: '15', displayChannel: 'FR', value: 'FR' },
      { id: '16', displayChannel: 'IR', value: 'IR' },
      { id: '17', displayChannel: 'NC', value: 'NC' }
    ]

  }



  componentDidAppear() {
    this._onRefresh();
  }

  componentDidDisappear() {
    this.visible = false;
    this.setState({ modalVisible: false });
  }

  _onRefresh = () => {
    this.setState({ refreshing: true, searching: true, filterKey: '' });
    if (this.search) this.search.clear();
    AsyncStorage.getItem('accessToken').then((accessToken) => {
      Promise.resolve(this.props.onGetLEDGrpoupList(accessToken, this.props.growAreaId)).then((res) => {
        this.getListData()
        this.setState({ refreshing: false, searching: true, token: accessToken });
      });
    });
  }






  onViewLEDGroup(group) {
    console.log('growArea', group);
    console.log('------------going into indevidual screen----------', this.props.info)

    Navigation.push(this.props.componentId, {
      component: {
        name: 'IndividualLedScreen',
        passProps: {
          groupId: group.id,
          info: this.props.info
        },
        options: {
          topBar: {
            title: {
              text: group.group_name,
              color: '#fff',
            }
          },
        }
      }
    });


  }


  onClearSearch = () => {
    this.setState({
      filterKey: ''
    })
  }



  onSelectedItemsChange = selectedUsers => {
    console.log("OnSelectedItemsChange called");
    this.setState({ selectedUsers });
    console.log(selectedUsers);
  };

  showCanselButtonMethod() {
    if (this.state.showCancelButton) {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={[styles.roundButton, styles.cancelButton]} onPress={() => this.showGatewayDiscoveryModal(false)}>
            <Text style={[styles.buttonText, { marginLeft: 0 }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      )
    }
  }

  showCancelInRegistrationModal() {
    if (this.state.bleError) {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={[styles.roundButton, styles.cancelButton]} onPress={() => this.setRegistrationModalVisible(false)}>
            <Text style={[styles.buttonText, { marginLeft: 0 }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      )
    }
  }

  findDevicesCalled() {
    console.log('called!!!');

    this.setState({ showDevicesView: true }, () => {
    })


    let payload = {
      CH1: this.state.ch1,
      CH2: this.state.ch2,
      CH3: this.state.ch3,
      CH4: this.state.ch4,
      CH5: this.state.ch5,
      CH6: this.state.ch6
    }
    console.log('payload------->', payload);
    this.props.onFindDevices(this.state.token, this.props.growAreaId, payload);
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
      const newData = this.props.LEDGroupList.filter(item => {
        const itemData = `${item.group_name.toUpperCase()}`;
        const searchDescription = item.description ? `${item.description.toUpperCase()}` : '';
        console.log('-----------------------------itemdata-------------------------', itemData, searchDescription, this.state.filterKey);
        return itemData.indexOf(this.state.filterKey.toUpperCase()) > -1 || searchDescription.indexOf(this.state.filterKey.toUpperCase()) > -1;
      });
      return newData;
    }
    return this.props.LEDGroupList;
  }



  renderListData(listData) {
    if (!this.props.isScreenLoading) {

      if (listData.length !== 0) {

        return (
          <FlatList
            data={listData}
            renderItem={({ item, index }) => (
              <View style={(index === listData.length - 1) ? [styles.listItem, {
                borderBottomWidth: 2
              }] : styles.listItem}>
                <View style={{ width: '80%' }}>
                  <TouchableOpacity onPress={() => this.onViewLEDGroup(item)}>
                    <View style={{ paddingLeft: 10 }}>
                      <Text style={{ fontWeight: 'bold', }}>{debug ? item.id + '-' : ''}{item.group_name} </Text>
                      <Text numberOfLines={1} style={{}}>{item.description}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={{ flex: 1, height: 35 }} onPress={() => { }} />
                <View style={{ flexDirection: 'row' }}>
                  <IconFontAwesome name="edit" onPress={() => {
                    console.log('pressed edit!!!', item.channel_configuration.CH1);
                    let devices = [];
                    item.added_devices.forEach(LEDdevice => {
                      return devices.push(LEDdevice.deviceUId)
                    });
                    this.setRegistrationModalVisible(true);
                    this.setState({
                      groupName: item.group_name,
                      groupDescription: item.description || '',
                      ch1: item.channel_configuration.CH1,
                      ch2: item.channel_configuration.CH2,
                      ch3: item.channel_configuration.CH3,
                      ch4: item.channel_configuration.CH4,
                      ch5: item.channel_configuration.CH5,
                      ch6: item.channel_configuration.CH6,
                      editGroup: true,
                      added_devices: devices,
                      groupId: item.id,
                      already_Added_devices: item.added_devices
                    }, () => {
                      console.log('stats', this.state.groupName, item.group_name);
                      console.log('stats', this.state.groupName, item.group_name);


                    });

                  }} size={24} style={{ paddingHorizontal: 10, color: 'grey' }} />
                  <Icon name="delete" size={24} style={{ paddingRight: 10, color: 'grey' }} onPress={() => {
                    Alert.alert('Delete Group', 'Are you sure you want to delete ' + item.group_name + '?',
                      [
                        {
                          text: 'Cancel', onPress: () => {
                            console.log('delete operation was canceled.');
                          }, style: 'cancel'
                        },
                        {
                          text: 'Delete', onPress: () => {
                            console.log('delete operation start');
                            this.props.onDeleteGroup(this.state.token, item.id);
                          }
                        },
                      ],
                      { cancelable: true }
                    )
                  }} />
                </View>
              </View>
            )}
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
        return (
          <ScrollView contentContainerStyle={styles.activityIndicator}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this._onRefresh}
                colors={['red', 'green', 'blue']}
              />
            }>
            <Text color="#00ff00">No LED Group found.</Text>
          </ScrollView>
        );
      }
    } else {
      return <View style={styles.activityIndicator}><ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /></View>;
    }
  }

  showFindDevices() {
    console.log('added devices', typeof (this.state.added_devices), this.state.added_devices);

    let devices = [{ eui64: '00099900FFAARA31', ledName: 'roseLedvvfvdvdfvdvfdvdfvdfvdfvdfsvsvfsvcvscs dwedcs ww' }, { eui64: "00099900FFAARA81", ledName: 'RodeLEd' }]
    if (!this.props.findDevicesLoader) {
      if (this.props.LEDDeviceList.length !== 0) {
        return (
          <FlatList
            data={this.props.LEDDeviceList}
            extraData={this.state.added_devices}
            renderItem={(info) => (
              <View style={styles.deviceItem}>
                <View style={{ flexDirection: "row-reverse", justifyContent: 'center', alignItems: "center" }}>
                  {console.log('check-----', JSON.stringify(this.state.added_devices).includes(info.item.deviceUId.toString()), typeof (info.item.deviceUId), 'tostrung', info.item.deviceUId.toString(), this.state.added_devices.includes('000D6FFFFECCCCCC'), this.state.added_devices.includes(info.item.deviceUId.toString()))
                  }
                  <CheckBox
                    style={{ flex: 1, padding: 5 }}
                    onClick={() => {
                      tempDevices = JSON.parse(JSON.stringify(this.state.added_devices));
                      console.log('added devices', this.state.added_devices, tempDevices, this.state.added_devices.length, tempDevices.length);

                      console.log('tempDevices.includes(info.item.deviceUId', tempDevices, tempDevices.includes(info.item.deviceUId));
                      if (tempDevices.includes(info.item.deviceUId)) {
                        tempDevices.splice(tempDevices.indexOf(info.item.deviceUId), 1)
                        this.setState({ added_devices: tempDevices });
                        console.log('added_devices----------- if condition', this.state.added_devices, this.state.added_devices.length);
                      } else {
                        tempDevices.push(info.item.deviceUId);
                        this.setState({ added_devices: tempDevices });
                        console.log('added_devices-----------else condition', this.state.added_devices, this.state.added_devices.length);
                      }


                    }}
                    checkBoxColor='green'
                    rightText={info.item.device_name + ':' + info.item.deviceUId}
                    tightTextStyle={{ color: Constant.GREY_TEXT_COLOR }}
                    isChecked={this.state.added_devices.includes(info.item.deviceUId)}
                  />
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        )
      } else {
        return (
          <View style={styles.deviceItem}>
            <View style={{ flexDirection: "row-reverse", justifyContent: 'center', alignItems: "center" }}>
              <Text> No Devices found. </Text>
            </View>
          </View>

        )

      }
    } else {
      return (
        <ActivityIndicator size='large' color={Constant.PRIMARY_COLOR} style={{ marginTop: 5 }}></ActivityIndicator>
      )
    }
  }




  renderGroupeModal() {

    return (
      <ScrollView>
        <Text style={{ fontWeight: "bold", fontSize: 20, padding: 10, borderBottomWidth: 1 }}> {this.state.editGroup ? 'Edit Group' : 'Create New Group '}</Text>
        <ScrollView contentContainerStyle={styles.inputContainer}>
          <TextField label='Group Name' onChangeText={(groupName) => this.setState({ groupName })} value={this.state.groupName} labelHeight={18} />
          <TextField label='Description' onChangeText={(groupDescription) => this.setState({ groupDescription })} value={this.state.groupDescription} labelHeight={18} />

          <Text style={{ marginTop: 5 }} >CH 1:</Text>
          <View style={{ borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 5 : -5, borderColor: Constant.LIGHT_SILVER_COLOR }}>
            {Platform.OS === 'ios' ?
              <IosPicker.Picker
                disabled={this.state.editGroup}
                selectedValue={this.state.ch1}
                style={{ width: '100%', height: 30, }}
                textStyle={{ fontSize: 15, alignSelf: 'center', color: this.state.editGroup ? Constant.GREY_TEXT_COLOR : '' }} onValueChange={(itemValue) => {
                  this.setState({ ch1: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </IosPicker.Picker>
              :
              <Picker
                enabled={!this.state.editGroup}
                selectedValue={this.state.ch1}
                style={{ width: '100%' }}
                onValueChange={(itemValue) => {
                  this.setState({ ch1: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </Picker>
            }

          </View>
          <Text style={{ marginTop: 5, }}>CH 2:</Text>
          <View style={{ borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 5 : -5, borderColor: Constant.LIGHT_SILVER_COLOR }}>
            {Platform.OS === 'ios' ?
              <IosPicker.Picker
                disabled={this.state.editGroup}
                selectedValue={this.state.ch2}
                style={{ width: '100%', height: 30, }}
                textStyle={{ fontSize: 15, alignSelf: 'center', color: this.state.editGroup ? Constant.GREY_TEXT_COLOR : '' }} onValueChange={(itemValue) => {
                  this.setState({ ch2: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </IosPicker.Picker>
              :
              <Picker
                enabled={!this.state.editGroup}
                selectedValue={this.state.ch2}
                style={{ width: '100%' }}
                onValueChange={(itemValue) => {
                  this.setState({ ch2: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </Picker>
            }
          </View>

          <Text style={{ marginTop: 5 }} >CH 3:</Text>
          <View style={{ borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 5 : -5, borderColor: Constant.LIGHT_SILVER_COLOR }}>
            {Platform.OS === 'ios' ?
              <IosPicker.Picker
                disabled={this.state.editGroup}
                selectedValue={this.state.ch3}
                style={{ width: '100%', height: 30, }}
                textStyle={{ fontSize: 15, alignSelf: 'center', color: this.state.editGroup ? Constant.GREY_TEXT_COLOR : '' }} onValueChange={(itemValue) => {
                  this.setState({ ch3: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </IosPicker.Picker>
              :
              <Picker
                enabled={!this.state.editGroup}
                selectedValue={this.state.ch3}
                style={{ width: '100%', }}
                onValueChange={(itemValue) => {
                  this.setState({ ch3: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </Picker>
            }
          </View>

          <Text style={{ marginTop: 5 }} >CH 4:</Text>
          <View style={{ borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 5 : -5, borderColor: Constant.LIGHT_SILVER_COLOR }}>
            {Platform.OS === 'ios' ?
              <IosPicker.Picker
                disabled={this.state.editGroup}
                selectedValue={this.state.ch4}
                style={{ width: '100%', height: 30, }}
                textStyle={{ fontSize: 15, alignSelf: 'center', color: this.state.editGroup ? Constant.GREY_TEXT_COLOR : '' }} onValueChange={(itemValue) => {
                  this.setState({ ch4: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </IosPicker.Picker>
              :
              <Picker
                enabled={!this.state.editGroup}
                selectedValue={this.state.ch4}
                style={{ width: '100%' }}
                onValueChange={(itemValue) => {
                  this.setState({ ch4: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </Picker>
            }
          </View>

          <Text style={{ marginTop: 5 }} >CH 5:</Text>
          <View style={{ borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 5 : -5, borderColor: Constant.LIGHT_SILVER_COLOR }}>
            {Platform.OS === 'ios' ?
              <IosPicker.Picker
                disabled={this.state.editGroup}
                selectedValue={this.state.ch5}
                style={{ width: '100%', height: 30, }}
                textStyle={{ fontSize: 15, alignSelf: 'center', color: this.state.editGroup ? Constant.GREY_TEXT_COLOR : '' }} onValueChange={(itemValue) => {
                  this.setState({ ch5: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </IosPicker.Picker>
              :
              <Picker
                enabled={!this.state.editGroup}
                selectedValue={this.state.ch5}
                style={{ width: '100%' }}
                onValueChange={(itemValue) => {
                  this.setState({ ch5: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </Picker>
            }
          </View>

          <Text style={{ marginTop: 5 }} >CH 6:</Text>
          <View style={{ borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 5 : -5, borderColor: Constant.LIGHT_SILVER_COLOR }}>
            {Platform.OS === 'ios' ?
              <IosPicker.Picker
                disabled={this.state.editGroup}
                selectedValue={this.state.ch6}
                style={{ width: '100%', height: 30, }}
                textStyle={{ fontSize: 15, alignSelf: 'center', color: this.state.editGroup ? Constant.GREY_TEXT_COLOR : '' }}

                onValueChange={(itemValue) => {
                  this.setState({ ch6: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </IosPicker.Picker>
              :
              <Picker
                enabled={!this.state.editGroup}
                selectedValue={this.state.ch6}
                style={{ width: '100%' }}
                onValueChange={(itemValue) => {
                  this.setState({ ch6: itemValue })
                }}>
                <Picker.Item label="Select channel configuration" value='' />
                {this.LEDChannelConfrugration.map((ch, i) => {
                  return <Picker.Item key={i} value={ch.value} label={ch.displayChannel} />
                })}
              </Picker>
            }
          </View>
          <Button title="Find Devices"
            disabled={(this.state.ch1 === '' || this.state.ch2 === '' || this.state.ch3 === '' || this.state.ch4 === '' || this.state.ch5 === '' || this.state.ch6 === '')}
            buttonStyle={{ backgroundColor: Constant.PRIMARY_COLOR, paddingHorizontal: 5, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              this.findDevicesCalled();
            }}
          />
          {this.state.showDevicesView ?
            this.showFindDevices()
            : <View />}

        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 10, marginBottom: 10 }}>
          <Button title="Cancel" onPress={() => this.setRegistrationModalVisible(false)} buttonStyle={{ backgroundColor: Constant.PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center' }} />
          <Button onPress={this.onSubmitPressed.bind(this)} title="Done"
            buttonStyle={{ backgroundColor: Constant.PRIMARY_COLOR, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center' }} />
        </View>
      </ScrollView>
    )
  }


  onSubmitPressed() {
    let payload = {
      growarea_id: this.props.growAreaId,
      group_name: '',
      description: '',
      channel_configuration: {},
      added_devices: []
    }
    let regEx = /^[a-zA-Z][a-zA-Z_.]{0,1}[ a-z|A-Z|0-9|_.]*$/;
    console.log(regEx.test(this.state.groupName.trim()), 'condition', this.state.groupName.trim(), this.state.groupName, this.state.groupName.trim() !== '' && this.state.groupName.trim().length <= 25 && regEx.test(this.state.groupName.trim()));

    if (this.state.groupName.trim() !== '' && this.state.groupName.trim().length <= 25 && regEx.test(this.state.groupName.trim())) payload.group_name = this.state.groupName.trim();
    else { Alert.alert("Please provide valid group name.", 'Invalid Group name! Maximum length is 25 charachers. Name should start with alphabet and may contain dot, underscore, space and numeric value.'); return; }
    if (this.state.groupDescription.length <= 200) payload.description = this.state.groupDescription.trim();
    else { alert("Please provide valid group description.(Maximum length 200)"); return; }

    if (this.state.ch1.trim()) payload.channel_configuration['CH1'] = this.state.ch1;
    else { alert("Please provide valid channel 1 configuration."); return; }
    if (this.state.ch2.trim()) payload.channel_configuration['CH2'] = this.state.ch2;
    else { alert("Please provide valid channel 2 configuration."); return; }
    if (this.state.ch3.trim()) payload.channel_configuration['CH3'] = this.state.ch3;
    else { alert("Please provide valid channel 3 configuration."); return; }
    if (this.state.ch4.trim()) payload.channel_configuration['CH4'] = this.state.ch4;
    else { alert("Please provide valid channel 4 configuration."); return; }
    if (this.state.ch5.trim()) payload.channel_configuration['CH5'] = this.state.ch5;
    else { alert("Please provide valid channel 5 configuration."); return; }
    if (this.state.ch6.trim()) payload.channel_configuration['CH6'] = this.state.ch6;
    else { alert("Please provide valid channel 6 configuration."); return; }

    if (this.state.added_devices.length !== 0) {
      if (this.state.showDevicesView) {
        added_Devices_For_Payload = []
        this.props.LEDDeviceList.map((device) => {
          if (this.state.added_devices.includes(device.deviceUId)) {
            return added_Devices_For_Payload.push(device);
          }
        });
        payload.added_devices = added_Devices_For_Payload;
      }
      else {
        payload.added_devices = this.state.already_Added_devices;
      }
    }

    if (this.state.editGroup) {
      payload.id = this.state.groupId
      console.log('[][][][][][][][][', payload);

      Promise.resolve(this.props.onUpdateGroup(this.state.token, payload)).then(() => {
        console.log("Done");
        this.setRegistrationModalVisible(false)
      });
    } else {
      console.log('[][][][][][][][][', payload);
      Promise.resolve(this.props.onCreateGroup(this.state.token, payload)).then(() => {
        console.log("Done");
        this.setRegistrationModalVisible(false)
      });
    }

  }

  render() {
    if (this.props.retry401Count === 20 && !this.state.enabled401) {
      this.setState({ modalVisible: false, enabled401: true })
    }

    let listData = this.getListData() || [];


    if (this.props.proccessing) {
      console.log('-------------------');
      this._onRefresh();
      this.props.onStopProccessing(false);
    }




    return (
      <View style={styles.container}>

        <View style={styles.greenBackgroundContainer} />
        <View style={styles.listContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.listTitle}> Groups</Text>
            <TouchableOpacity style={[styles.roundButton, styles.addNewButton]} onPress={() => {
              this.setRegistrationModalVisible(true);
            }
            }>
              <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-evenly', }} >

                <Text style={styles.buttonText}>Group</Text>
                <Image source={require('../../assets/images/add_24.png')} style={styles.detailIcon} />
              </View>

            </TouchableOpacity>
          </View>
          {this.state.searching && (listData.length > 0 || this.state.filterKey.length > 0) &&
            <SearchBar
              ref={search => this.search = search}
              lightTheme
              value={this.state.filterKey}
              onChangeText={(filterKey) => this.setState({ filterKey })}
              onClear={() => this.onClearSearch()}
              placeholder='Search LED Groups...'
              containerStyle={{ backgroundColor: Constant.LIGHT_GREY_COLOR, padding: 2, maxHeight: 32 }}
              inputContainerStyle={{ backgroundColor: Constant.WHITE_BACKGROUND_COLOR, maxHeight: 32 }}
              inputStyle={{ fontSize: 16 }} />
          }
          {this.renderListData(listData)}
        </View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.setRegistrationModalVisible(false);
          }}
        >
          <View style={styles.fullModalContainer}>
            <View style={styles.registrationModalContainer}>
              {this.renderGroupeModal()}
            </View>
          </View>
        </Modal>
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
    borderRadius: 16,
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
    borderColor: Constant.LIGHT_GREY_COLOR,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 6,
    height: 50,
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
    LEDGroupList: state.LEDGroup.LEDGroupList,
    isScreenLoading: state.LEDGroup.isScreenLoading,
    findDevicesLoader: state.LEDGroup.findDevicesLoader,
    LEDDeviceList: state.LEDGroup.LEDDeviceList,
    proccessing: state.LEDGroup.proccessing,
    retry401Count: state.auth.retry401Count

  }

};

mapDispatchToProps = dispatch => {
  return {
    onGetLEDGrpoupList: (token, growareaId) => dispatch(getLEDGrpoupList(token, growareaId)),
    onFindDevices: (token, growareaId, payload) => dispatch(findDevices(token, growareaId, payload)),
    onCreateGroup: (token, payload) => dispatch(createLedGroup(token, payload)),
    onStopProccessing: (flag) => dispatch(stopProccessing(flag)),
    onDeleteGroup: (token, id) => dispatch(deleteGroup(token, id)),
    onUpdateGroup: (token, payload) => dispatch(updateGroup(token, payload))
  }
};


export default connect(mapStatesToProps, mapDispatchToProps)(LEDGroupsList);
