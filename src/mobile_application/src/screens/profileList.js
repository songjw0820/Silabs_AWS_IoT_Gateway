import React, {Component} from 'react';
import RN, {
  RefreshControl,
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  Alert,
  AsyncStorage,
  Platform,
} from 'react-native';
import * as Constant from '../Constant';
import {Button, Slider, SearchBar} from 'react-native-elements';
import {debug} from './../../app.json';
import {connect} from 'react-redux';
import {
  getLEDGroupProfiles,
  createProfile,
  updateProfile,
  deleteGroupProfile,
  stopProccessingForProfileList,
} from '../store/actions/rootActions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import {Navigation} from 'react-native-navigation';

class ProfileList extends Component {
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
      profileName: '',
      profileDescription: '',
      id: 0,
      ch1: 0,
      ch2: 0,
      ch3: 0,
      ch4: 0,
      ch5: 0,
      ch6: 0,
      editProfile: false,
      searching: false,
      token: '',
    };
  }

  componentDidAppear() {
    this._onRefresh();
  }

  componentDidDisappear() {
    this.visible = false;
    this.setState({modalVisible: false, registrationModalVisible: false});
  }
  _onRefresh = () => {
    this.setState({refreshing: true, searching: true, filterKey: ''});
    if (this.search) this.search.clear();
    AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN'])
      .then(token => {
        Promise.resolve(
          this.props.onGetLEDGroupProfiles(token[0][1], this.props.groupId),
        ).then(() => {
          this.setState({
            refreshing: false,
            searching: true,
            token: token[0][1],
          });
        });
      })
      .catch(error => {
        console.log('error in getting token in profileList', error.message);
      });
  };

  showProfileModal(visible) {
    if (visible) {
      this.setState({
        modalVisible: visible,
      });
    } else {
      this.setState({
        modalVisible: visible,
        editProfile: false,
        id: '',
        profileName: '',
        profileDescription: '',
        ch1: 0,
        ch2: 0,
        ch3: 0,
        ch4: 0,
        ch5: 0,
        ch6: 0,
      });
    }
  }

  onViewLEDGroupProfile(profile) {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'GroupProfile',
        passProps: {
          profileId: profile.id,
          profileName: profile.led_profile_name,
          description: profile.description,
          info: this.props.info,
        },
        options: {
          topBar: {
            title: {
              text: profile.led_profile_name,
              color: '#fff',
            },
          },
        },
      },
    });
  }

  getListData() {
    if (this.state.filterKey) {
      const newData = this.props.LEDGroupProfileList.filter(item => {
        const itemData = `${item.led_profile_name.toUpperCase()}`;
        console.log(
          '-----------------------------itemdata-------------------------',
        );
        return (
          itemData.indexOf(this.state.filterKey.toUpperCase()) > -1 ||
          `${item.description.toUpperCase()}`.indexOf(
            this.state.filterKey.toUpperCase(),
          ) > -1
        );
      });
      console.log('--------------------newData---------------');
      return newData;
    }
    console.log('----------------------data----------------');
    return this.props.LEDGroupProfileList;
  }

  onClearSearch = () => {
    this.setState({
      filterKey: '',
    });
  };

  renderListData(listData) {
    if (!this.props.loading) {
      if (listData.length !== 0) {
        return (
          <FlatList
            data={listData}
            renderItem={({item, index}) => (
              <View
                style={
                  index === listData.length - 1
                    ? [
                        styles.listItem,
                        {
                          borderBottomWidth: 2,
                        },
                      ]
                    : styles.listItem
                }>
                <View style={{width: '80%', paddingLeft: 10}}>
                  <TouchableOpacity
                    onPress={() => this.onViewLEDGroupProfile(item)}>
                    <Text style={{fontWeight: 'bold'}}>
                      {' '}
                      {debug ? item.id + '-' : ''}
                      {item.led_profile_name}{' '}
                    </Text>
                    <Text numberOfLines={1} style={{}}>
                      {' '}
                      {item.description}{' '}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={{flex: 1, height: 35}}
                  onPress={() => {}}
                />
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                  <IconFontAwesome
                    name="edit"
                    onPress={() => {
                      this.showProfileModal(true);
                      this.setState({
                        editProfile: true,
                        profileName: item.led_profile_name,
                        profileDescription: item.description,
                        ch1: item.channel_values.CH1,
                        ch2: item.channel_values.CH2,
                        ch3: item.channel_values.CH3,
                        ch4: item.channel_values.CH4,
                        ch5: item.channel_values.CH5,
                        ch6: item.channel_values.CH6,
                        id: item.id,
                      });
                    }}
                    size={24}
                    style={{paddingHorizontal: 10, color: 'grey'}}
                  />
                  <Icon
                    name="delete"
                    size={24}
                    style={{paddingRight: 10, color: 'grey'}}
                    onPress={() => {
                      Alert.alert(
                        'Delete Group Profile',
                        'Are you sure you want to delete ' +
                          item.led_profile_name +
                          '?',
                        [
                          {
                            text: 'Cancel',
                            onPress: () => {
                              console.log('delete operation was canceled.');
                            },
                            style: 'cancel',
                          },
                          {
                            text: 'Delete',
                            onPress: () => {
                              console.log('delete operation start');
                              this.props.onDeleteGroupProfile(
                                this.state.token,
                                item.id,
                              );
                            },
                          },
                        ],
                        {cancelable: true},
                      );
                    }}
                  />
                </View>
              </View>
            )}
            keyExtractor={item => item.id.toString()}
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
          <ScrollView
            contentContainerStyle={styles.activityIndicator}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this._onRefresh}
                colors={['red', 'green', 'blue']}
              />
            }>
            <Text color="#00ff00">No LED Group profile found.</Text>
          </ScrollView>
        );
      }
    } else {
      return (
        <View style={styles.activityIndicator}>
          <ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} />
        </View>
      );
    }
  }

  render() {
    if (this.props.retry401Count === 20 && !this.state.enabled401) {
      this.setState({modalVisible: false, enabled401: true});
    }

    let listData = this.getListData() || [];
    console.log('listData in profile', listData);

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
            <Text style={styles.listTitle}> LED Group Profiles </Text>
            <TouchableOpacity
              style={[styles.roundButton, styles.addNewButton]}
              onPress={() => {
                this.showProfileModal(true);
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-evenly',
                }}>
                <Text style={styles.buttonText}>Profile</Text>
                <Image
                  source={require('../../assets/images/add_24.png')}
                  style={styles.detailIcon}
                />
              </View>
            </TouchableOpacity>
          </View>
          {this.state.searching &&
            (listData.length > 0 || this.state.filterKey.length > 0) && (
              <SearchBar
                ref={search => (this.search = search)}
                lightTheme
                onChangeText={filterKey => this.setState({filterKey})}
                onClear={() => this.onClearSearch()}
                placeholder="Search profile..."
                value={this.state.filterKey}
                containerStyle={{
                  backgroundColor: Constant.LIGHT_GREY_COLOR,
                  padding: 2,
                  maxHeight: 32,
                }}
                inputContainerStyle={{
                  backgroundColor: Constant.WHITE_BACKGROUND_COLOR,
                  maxHeight: 32,
                }}
                inputStyle={{fontSize: 16}}
              />
            )}
          {this.renderListData(listData)}
          <Modal
            animationType="slide"
            transparent
            visible={this.state.modalVisible}
            onRequestClose={() => {
              this.showProfileModal(false);
            }}>
            <View
              style={{
                backgroundColor: '#rgba(0,0,0,0.75)',
                justifyContent: 'center',
                flex: 1,
                position: 'relative',
              }}>
              <View
                style={{marginTop: 10, backgroundColor: '#000', marginTop: 50}}>
                <View style={{marginTop: 20, backgroundColor: '#000'}}>
                  <Text style={{color: '#fff', fontSize: 24, marginLeft: 10}}>
                    {this.state.editProfile
                      ? 'Edit  profile'
                      : 'Create New Profile'}
                  </Text>
                  <View
                    style={{height: 1, marginTop: 10, backgroundColor: '#fff'}}
                  />

                  <View
                    style={{
                      flexDirection: 'row',
                      height: 40,
                      marginLeft: 10,
                      marginTop: 10,
                      marginRight: 20,
                    }}>
                    <Text
                      style={{
                        paddingTop: 10,
                        color: '#fff',
                        justifyContent: 'space-around',
                      }}>
                      Profile Name:{' '}
                    </Text>
                    <TextInput
                      placeholder="Profile Name"
                      value={this.state.profileName}
                      onChangeText={text => {
                        console.log(text);
                        this.setState({profileName: text});
                      }}
                      style={{
                        backgroundColor: 'white',
                        marginLeft: 20,
                        width: '60%',
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      paddingTop: 20,
                      marginLeft: 10,
                      marginRight: 20,
                    }}>
                    <Text style={{paddingTop: 10, color: '#fff'}}>
                      Description:{' '}
                    </Text>
                    <TextInput
                      placeholder="Description"
                      value={this.state.profileDescription}
                      onChangeText={text => {
                        console.log(text);
                        this.setState({profileDescription: text});
                      }}
                      style={{
                        backgroundColor: 'white',
                        marginLeft: 30,
                        height: 50,
                        width: '60%',
                      }}
                    />
                  </View>
                </View>
                <View
                  style={{height: 1, marginTop: 10, backgroundColor: '#fff'}}
                />
                <View style={{marginTop: 20}}>
                  <View
                    style={{flexDirection: 'row', margin: 5, marginLeft: 10}}>
                    <Text style={{color: '#fff'}}>CH 1: </Text>
                    <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
                      {this.props.channel_configuration.CH1}
                    </Text>

                    {Platform.OS === 'ios' ? (
                      <RN.Slider
                        value={this.state.ch1}
                        maximumValue={100}
                        minimumValue={0}
                        disabled={
                          this.props.channel_configuration.CH1 === 'NC'
                            ? true
                            : false
                        }
                        onValueChange={value =>
                          this.setState({ch1: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                        minimumTrackTintColor="#3F3F3F"
                        maximumTrackTintColor="#FFFFFF"
                      />
                    ) : (
                      <Slider
                        value={this.state.ch1}
                        maximumValue={100}
                        minimumValue={0}
                        disabled={
                          this.props.channel_configuration.CH1 === 'NC'
                            ? true
                            : false
                        }
                        onValueChange={value =>
                          this.setState({ch1: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                      />
                    )}

                    <Text style={{marginLeft: 5, color: '#fff', width: '20%'}}>
                      {this.state.ch1}%
                    </Text>
                  </View>
                  <View
                    style={{flexDirection: 'row', margin: 5, marginLeft: 10}}>
                    <Text style={{color: '#fff'}}>CH 2: </Text>
                    <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
                      {this.props.channel_configuration.CH2}
                    </Text>

                    {Platform.OS === 'ios' ? (
                      <RN.Slider
                        value={this.state.ch2}
                        maximumValue={100}
                        minimumValue={0}
                        disabled={
                          this.props.channel_configuration.CH2 === 'NC'
                            ? true
                            : false
                        }
                        onValueChange={value =>
                          this.setState({ch2: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                        minimumTrackTintColor="#3F3F3F"
                        maximumTrackTintColor="#FFFFFF"
                      />
                    ) : (
                      <Slider
                        value={this.state.ch2}
                        maximumValue={100}
                        minimumValue={0}
                        disabled={
                          this.props.channel_configuration.CH2 === 'NC'
                            ? true
                            : false
                        }
                        onValueChange={value =>
                          this.setState({ch2: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                      />
                    )}
                    <Text style={{marginLeft: 5, color: '#fff', width: '20%'}}>
                      {this.state.ch2}%
                    </Text>
                  </View>
                  <View
                    style={{flexDirection: 'row', margin: 5, marginLeft: 10}}>
                    <Text style={{color: '#fff'}}>CH 3: </Text>
                    <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
                      {this.props.channel_configuration.CH3}
                    </Text>

                    {Platform.OS === 'ios' ? (
                      <RN.Slider
                        value={this.state.ch3}
                        maximumValue={100}
                        minimumValue={0}
                        disabled={
                          this.props.channel_configuration.CH3 === 'NC'
                            ? true
                            : false
                        }
                        onValueChange={value =>
                          this.setState({ch3: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                        minimumTrackTintColor="#3F3F3F"
                        maximumTrackTintColor="#FFFFFF"
                      />
                    ) : (
                      <Slider
                        value={this.state.ch3}
                        maximumValue={100}
                        minimumValue={0}
                        disabled={
                          this.props.channel_configuration.CH3 === 'NC'
                            ? true
                            : false
                        }
                        onValueChange={value =>
                          this.setState({ch3: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                        minimumTrackTintColor="#3F3F3F"
                        maximumTrackTintColor="#FFFFFF"
                      />
                    )}
                    <Text style={{marginLeft: 5, color: '#fff', width: '20%'}}>
                      {this.state.ch3}%
                    </Text>
                  </View>
                  <View
                    style={{flexDirection: 'row', margin: 5, marginLeft: 10}}>
                    <Text style={{color: '#fff'}}>CH 4: </Text>
                    <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
                      {this.props.channel_configuration.CH4}
                    </Text>

                    {Platform.OS === 'ios' ? (
                      <RN.Slider
                        value={this.state.ch4}
                        maximumValue={100}
                        minimumValue={0}
                        disabled={
                          this.props.channel_configuration.CH4 === 'NC'
                            ? true
                            : false
                        }
                        onValueChange={value =>
                          this.setState({ch4: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                        minimumTrackTintColor="#3F3F3F"
                        maximumTrackTintColor="#FFFFFF"
                      />
                    ) : (
                      <Slider
                        value={this.state.ch4}
                        maximumValue={100}
                        minimumValue={0}
                        disabled={
                          this.props.channel_configuration.CH4 === 'NC'
                            ? true
                            : false
                        }
                        onValueChange={value =>
                          this.setState({ch4: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                      />
                    )}
                    <Text style={{marginLeft: 5, color: '#fff', width: '20%'}}>
                      {this.state.ch4}%
                    </Text>
                  </View>
                  <View
                    style={{flexDirection: 'row', margin: 5, marginLeft: 10}}>
                    <Text style={{color: '#fff'}}>CH 5: </Text>
                    <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
                      {this.props.channel_configuration.CH5}
                    </Text>

                    {Platform.OS === 'ios' ? (
                      <RN.Slider
                        value={this.state.ch5}
                        maximumValue={100}
                        minimumValue={0}
                        disabled={
                          this.props.channel_configuration.CH5 === 'NC'
                            ? true
                            : false
                        }
                        onValueChange={value =>
                          this.setState({ch5: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                        minimumTrackTintColor="#3F3F3F"
                        maximumTrackTintColor="#FFFFFF"
                      />
                    ) : (
                      <Slider
                        value={this.state.ch5}
                        maximumValue={100}
                        minimumValue={0}
                        disabled={
                          this.props.channel_configuration.CH5 === 'NC'
                            ? true
                            : false
                        }
                        onValueChange={value =>
                          this.setState({ch5: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                      />
                    )}
                    <Text style={{marginLeft: 5, color: '#fff', width: '20%'}}>
                      {this.state.ch5}%
                    </Text>
                  </View>
                  <View
                    style={{flexDirection: 'row', margin: 5, marginLeft: 10}}>
                    <Text style={{color: '#fff'}}>CH 6: </Text>
                    <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
                      {this.props.channel_configuration.CH6}
                    </Text>
                    {Platform.OS === 'ios' ? (
                      <RN.Slider
                        value={this.state.ch6}
                        maximumValue={100}
                        disabled={
                          this.props.channel_configuration.CH6 === 'NC'
                            ? true
                            : false
                        }
                        minimumValue={0}
                        onValueChange={value =>
                          this.setState({ch6: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                        minimumTrackTintColor="#3F3F3F"
                        maximumTrackTintColor="#FFFFFF"
                      />
                    ) : (
                      <Slider
                        value={this.state.ch6}
                        maximumValue={100}
                        disabled={
                          this.props.channel_configuration.CH6 === 'NC'
                            ? true
                            : false
                        }
                        minimumValue={0}
                        onValueChange={value =>
                          this.setState({ch6: parseInt(value)})
                        }
                        style={{width: '60%', marginLeft: 5, marginTop: -10}}
                        thumbTintColor="#acd373"
                      />
                    )}
                    <Text style={{marginLeft: 5, color: '#fff', width: '20%'}}>
                      {this.state.ch6}%
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 10,
                    justifyContent: 'flex-end',
                    marginRight: 40,
                    marginBottom: 10,
                  }}>
                  <Button
                    onPress={() => {
                      let regEx = /^[a-zA-Z][a-zA-Z_.]{0,1}[ a-z|A-Z|0-9|_.]*$/;
                      console.log('hello pressed');
                      if (
                        this.state.profileName.trim() === '' ||
                        this.state.profileName.length > 25 ||
                        !regEx.test(this.state.profileName.trim())
                      ) {
                        return Alert.alert(
                          'Please Enter Valid Profile Name.',
                          'Invalid Profile name! Maximum length is 25. Name should start with alphabet and may contain dot, underscore, space and numeric value.',
                        );
                      } else if (this.state.profileDescription > 200) {
                        return alert(
                          'Please Enter Valid Description. (Maximum Length 200).',
                        );
                      } else {
                        if (this.state.editProfile) {
                          var reqData = {
                            id: this.state.id,
                            group_id: this.props.groupId,
                            led_profile_name: this.state.profileName.trim(),
                            description: this.state.profileDescription.trim(),
                            channel_configuration: this.props
                              .channel_configuration,
                            channel_values: {
                              CH1: this.state.ch1,
                              CH2: this.state.ch2,
                              CH3: this.state.ch3,
                              CH4: this.state.ch4,
                              CH5: this.state.ch5,
                              CH6: this.state.ch6,
                            },
                            preset: 100,
                          };
                          console.log('reqData update', reqData);
                          this.showProfileModal(false);

                          this.props.onUpdateProfile(this.state.token, reqData);
                        } else {
                          var reqData = {
                            group_id: this.props.groupId,
                            led_profile_name: this.state.profileName.trim(),
                            description: this.state.profileDescription.trim(),
                            channel_configuration: this.props
                              .channel_configuration,
                            channel_values: {
                              CH1: this.state.ch1,
                              CH2: this.state.ch2,
                              CH3: this.state.ch3,
                              CH4: this.state.ch4,
                              CH5: this.state.ch5,
                              CH6: this.state.ch6,
                            },
                            preset: 100,
                          };
                          console.log('reqData', reqData);
                          this.showProfileModal(false);

                          this.props.onCreateProfile(this.state.token, reqData);
                        }
                      }
                    }}
                    title="Done"
                    buttonStyle={{
                      backgroundColor: Constant.PRIMARY_COLOR,
                      paddingHorizontal: 15,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  />
                  <Button
                    onPress={() => {
                      this.showProfileModal(false);
                      console.log('hello pressed');
                      this.setState({showProfileModal: false});
                    }}
                    title="Cancel"
                    buttonStyle={{
                      backgroundColor: Constant.PRIMARY_COLOR,
                      marginLeft: 5,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: Constant.LIGHT_GREY_COLOR,
  },
  greenBackgroundContainer: {
    backgroundColor: Constant.PRIMARY_COLOR,
    width: '100%',
    height: '25%',
    position: 'absolute',
  },
  listContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: Constant.WHITE_BACKGROUND_COLOR,
    marginLeft: '5%',
    marginRight: '5%',
    borderRadius: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundButton: {
    justifyContent: 'center',
    padding: 6,
    borderRadius: 16,
    marginRight: 12,
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
    backgroundColor: Constant.DARK_GREY_COLOR,
  },
  buttonText: {
    fontSize: 12,
    color: Constant.WHITE_TEXT_COLOR,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fullModalContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#78787885',
  },
  modalContainer: {
    width: '94%',
    height: '56%',
    backgroundColor: Constant.WHITE_BACKGROUND_COLOR,
  },
  modalTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleAddButton: {
    backgroundColor: Constant.ADD_NEW_GATEWAY_BUTTON_COLOR,
    height: 30,
    width: 30,
    borderRadius: 15,
    margin: 15,
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanImage: {
    height: 100,
    width: 100,
  },
  scanText: {
    marginTop: 10,
    marginBottom: 30,
    color: Constant.DARK_GREY_COLOR,
  },
  gatewayList: {
    flex: 1,
  },
  gatewayListContainer: {
    flex: 1,
    height: 100,
    justifyContent: 'center',
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
    borderBottomColor: Constant.LIGHT_GREY_COLOR,
  },
  listItem: {
    width: '100%',
    borderTopWidth: 2,
    borderColor: Constant.LIGHT_GREY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 6,
    height: 50,
  },
  gatewayItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Constant.LIGHT_GREY_COLOR,
  },
  activityIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registrationModalContainer: {
    width: '84%',
    marginTop: 60,
    marginBottom: 60,
    backgroundColor: Constant.WHITE_TEXT_COLOR,
  },
  detailIcon: {
    backgroundColor: '#78787878',
    height: 20,
    width: 20,
    borderRadius: 12,
    marginLeft: 5,
  },
  inputContainer: {
    marginLeft: '5%',
    marginRight: '5%',
  },
  menuItem: {margin: 6},
});

mapStatesToProps = state => {
  return {
    LEDGroupProfileList: state.LEDGroupProfile.LEDGroupProfileList,
    loading: state.LEDGroupProfile.loading,
    proccessing: state.LEDGroupProfile.proccessing,
    retry401Count: state.auth.retry401Count,
  };
};

mapDispatchToProps = dispatch => {
  return {
    onGetLEDGroupProfiles: (token, groupId) =>
      dispatch(getLEDGroupProfiles(token, groupId)),
    onCreateProfile: (token, payload) =>
      dispatch(createProfile(token, payload)),
    onUpdateProfile: (token, payload) =>
      dispatch(updateProfile(token, payload)),
    onDeleteGroupProfile: (token, id) =>
      dispatch(deleteGroupProfile(token, id)),
    onStopProccessing: flag => dispatch(stopProccessingForProfileList(flag)),
  };
};

export default connect(
  mapStatesToProps,
  mapDispatchToProps,
)(ProfileList);
