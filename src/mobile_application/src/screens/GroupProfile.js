import React, {Component} from 'react';
import RN, {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Text,
  Platform,
  AsyncStorage,
  ActivityIndicator,
} from 'react-native';
import {Button, Slider} from 'react-native-elements';
import {connect} from 'react-redux';
import * as Constant from '../Constant';
import {
  getProfileDetails,
  applyNowGroupProfile,
  eventGroupProfile,
} from '../store/actions/rootActions';
import DateTimePicker from 'react-native-modal-datetime-picker';
import MultiSelect from 'react-native-multiple-select';
import {Navigation} from 'react-native-navigation';

class GroupProfileControl extends Component {
  static get options() {
    return Constant.DEFAULT_NAVIGATOR_STYLE;
  }
  constructor(props) {
    super(props);
    Navigation.events().bindComponent(this);
    this.state = {
      token: '',
      selectedProfileName: '',
      newProfileName: '',
      newProfileDescription: '',
      channel1Value: 0,
      channel2Value: 0,
      channel3Value: 0,
      channel4Value: 0,
      channel5Value: 0,
      channel6Value: 0,
      presetValue: 0,
      profileDetails: {},
      showSchedualModal: false,
      startDate: 'Select a start date',
      startTime: 'Select a start time',
      endDate: 'Select a end date',
      showStartDate: false,
      showStartTime: false,
      showEndDate: false,
      repeatOccurence: [
        {repeatValue: 'Everyday'},
        {repeatValue: 'Every Monday'},
        {repeatValue: 'Every Tuesday'},
        {repeatValue: 'Every Wednesday'},
        {repeatValue: 'Every Thursday'},
        {repeatValue: 'Every Friday'},
        {repeatValue: 'Every Saturday'},
        {repeatValue: 'Every Sunday'},
      ],
      selectedRepeatOptions: [],
      everydaySelected: [
        'Everyday',
        'Every Monday',
        'Every Tuesday',
        'Every Wednesday',
        'Every Thursday',
        'Every Friday',
        'Every Saturday',
        'Every Sunday',
      ],
    };
  }

  onNavigatorEvent = event => {
    if (event.id === 'bottomTabReselected') {
      this.props.navigator.popToRoot();
    } else if (event.id === 'didAppear') {
    }
  };

  componentDidAppear() {
    AsyncStorage.getItem('accessToken').then(authToken => {
      this.setState({token: authToken});
      console.log('token0-0-0-0-0-0-', authToken);
      console.log('id', this.props.profileId);
      this.props.getProfileDetails(authToken, this.props.profileId);
    });
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.profileDetails !== prevState.profileDetails) {
      return {profileDetails: nextProps.profileDetails};
    } else return null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.profileDetails !== this.props.profileDetails) {
      this.displayCurrentData(this.props.profileDetails);
    }
  }

  // // setting current telementry for LED node
  displayCurrentData(currentData) {
    console.log('currentDataiu09u0uk;hlkhohklhlk', currentData);
    this.setState({
      channel1Value: currentData.channel_values.CH1,
      channel2Value: currentData.channel_values.CH2,
      channel3Value: currentData.channel_values.CH3,
      channel4Value: currentData.channel_values.CH4,
      channel5Value: currentData.channel_values.CH5,
      channel6Value: currentData.channel_values.CH6,
      presetValue: currentData.preset,
    });
  }

  formatStandardTime = date => {
    let time = new Date(date).toLocaleTimeString();
    console.log('time string', time);
    time = time.split(':'); // convert to array

    // fetch
    var hours = Number(time[0]);
    var minutes = Number(time[1]);
    var seconds = Number(time[2]);
    console.log('second', seconds, time);

    // calculate
    var timeValue;

    if (hours > 0 && hours <= 12) {
      timeValue = '' + hours;
    } else if (hours > 12) {
      timeValue = '' + (hours - 12);
    } else if (hours == 0) {
      timeValue = '12';
    }
    timeValue += minutes < 10 ? ':0' + minutes : ':' + minutes; // get minutes
    timeValue +=
      Platform.OS === 'ios'
        ? ':' + time[2]
        : seconds < 10
        ? ':0' + seconds
        : ':' + seconds; // get seconds
    timeValue += Platform.OS === 'ios' ? '' : hours >= 12 ? ' PM' : ' AM'; // get AM/PM

    return timeValue;
  };

  renderLEDControls() {
    if (!this.props.profileDetails.channel_values) {
      return (
        <View style={{flex: 1, justifyContent: 'center'}}>
          <View style={{height: 100}}>
            <ActivityIndicator
              size="large"
              color={Constant.PRIMARY_COLOR}
              style={{marginTop: 10}}
            />
            <Text style={{alignSelf: 'center', marginTop: 20}}>
              Please Wait....
            </Text>
          </View>
        </View>
      );
    } else {
      return (
        <ScrollView style={{marginTop: 10, flex: 1}}>
          <View style={{flexDirection: 'row', margin: 5}}>
            <Text>CH 1: </Text>
            <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
              {this.props.profileDetails.channel_configuration.CH1}
            </Text>
            {Platform.OS === 'ios' ? (
              <RN.Slider
                value={this.state.channel1Value}
                maximumValue={100}
                minimumValue={0}
                disabled
                onValueChange={value =>
                  this.setState({channel1Value: parseInt(value)})
                }
                style={{
                  width: '57%',
                  color: 'red',
                  marginLeft: '1%',
                  marginTop: -10,
                }}
                thumbTintColor="#acd373"
                trackStyle={{color: 'red'}}
                minimumTrackTintColor="#3F3F3F"
                maximumTrackTintColor="#B3B3B3"
              />
            ) : (
              <Slider
                value={this.state.channel1Value}
                maximumValue={100}
                minimumValue={0}
                disabled
                onValueChange={value =>
                  this.setState({channel1Value: parseInt(value)})
                }
                style={{
                  width: '57%',
                  color: 'red',
                  marginLeft: '1%',
                  marginTop: -10,
                }}
                thumbTintColor="#acd373"
                trackStyle={{color: 'red'}}
              />
            )}
            <Text style={{marginLeft: '1%'}}>{this.state.channel1Value}%</Text>
          </View>
          <View style={{flexDirection: 'row', margin: 5}}>
            <Text>CH 2: </Text>
            <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
              {this.props.profileDetails.channel_configuration.CH2}
            </Text>
            {Platform.OS === 'ios' ? (
              <RN.Slider
                value={this.state.channel2Value}
                maximumValue={100}
                disabled
                minimumValue={0}
                onValueChange={value =>
                  this.setState({channel2Value: parseInt(value)})
                }
                style={{width: '57%', marginLeft: '1%', marginTop: -10}}
                thumbTintColor="#acd373"
                minimumTrackTintColor="#3F3F3F"
                maximumTrackTintColor="#B3B3B3"
              />
            ) : (
              <Slider
                value={this.state.channel2Value}
                maximumValue={100}
                disabled
                minimumValue={0}
                onValueChange={value =>
                  this.setState({channel2Value: parseInt(value)})
                }
                style={{width: '57%', marginLeft: '1%', marginTop: -10}}
                thumbTintColor="#acd373"
              />
            )}

            <Text style={{marginLeft: '1%', width: '20%'}}>
              {this.state.channel2Value}%
            </Text>
          </View>
          <View style={{flexDirection: 'row', margin: 5}}>
            <Text>CH 3: </Text>
            <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
              {this.props.profileDetails.channel_configuration.CH3}
            </Text>

            {Platform.OS === 'ios' ? (
              <RN.Slider
                value={this.state.channel3Value}
                maximumValue={100}
                disabled
                minimumValue={0}
                onValueChange={value =>
                  this.setState({channel3Value: parseInt(value)})
                }
                style={{width: '57%', marginLeft: '1%', marginTop: -10}}
                thumbTintColor="#acd373"
                minimumTrackTintColor="#3F3F3F"
                maximumTrackTintColor="#B3B3B3"
              />
            ) : (
              <Slider
                value={this.state.channel3Value}
                maximumValue={100}
                disabled
                minimumValue={0}
                onValueChange={value =>
                  this.setState({channel3Value: parseInt(value)})
                }
                style={{width: '57%', marginLeft: '1%', marginTop: -10}}
                thumbTintColor="#acd373"
              />
            )}

            <Text style={{marginLeft: 5, width: '20%'}}>
              {this.state.channel3Value}%
            </Text>
          </View>
          <View style={{flexDirection: 'row', margin: 5}}>
            <Text>CH 4: </Text>
            <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
              {this.props.profileDetails.channel_configuration.CH4}
            </Text>

            {Platform.OS === 'ios' ? (
              <RN.Slider
                value={this.state.channel4Value}
                maximumValue={100}
                disabled
                minimumValue={0}
                onValueChange={value =>
                  this.setState({channel4Value: parseInt(value)})
                }
                style={{width: '57%', marginLeft: '1%', marginTop: -10}}
                thumbTintColor="#acd373"
                minimumTrackTintColor="#3F3F3F"
                maximumTrackTintColor="#B3B3B3"
              />
            ) : (
              <Slider
                value={this.state.channel4Value}
                maximumValue={100}
                disabled
                minimumValue={0}
                onValueChange={value =>
                  this.setState({channel4Value: parseInt(value)})
                }
                style={{width: '57%', marginLeft: '1%', marginTop: -10}}
                thumbTintColor="#acd373"
              />
            )}

            <Text style={{marginLeft: '1%', width: '20%'}}>
              {this.state.channel4Value}%
            </Text>
          </View>
          <View style={{flexDirection: 'row', margin: 5}}>
            <Text>CH 5: </Text>
            <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
              {this.props.profileDetails.channel_configuration.CH5}
            </Text>

            {Platform.OS === 'ios' ? (
              <RN.Slider
                value={this.state.channel5Value}
                maximumValue={100}
                disabled
                minimumValue={0}
                onValueChange={value =>
                  this.setState({channel5Value: parseInt(value)})
                }
                style={{width: '57%', marginLeft: '1%', marginTop: -10}}
                thumbTintColor="#acd373"
                minimumTrackTintColor="#3F3F3F"
                maximumTrackTintColor="#B3B3B3"
              />
            ) : (
              <Slider
                value={this.state.channel5Value}
                maximumValue={100}
                disabled
                minimumValue={0}
                onValueChange={value =>
                  this.setState({channel5Value: parseInt(value)})
                }
                style={{width: '57%', marginLeft: '1%', marginTop: -10}}
                thumbTintColor="#acd373"
              />
            )}

            <Text style={{marginLeft: '1%', width: '20%'}}>
              {this.state.channel5Value}%
            </Text>
          </View>
          <View style={{flexDirection: 'row', margin: 5}}>
            <Text>CH 6: </Text>
            <Text style={{color: Constant.PRIMARY_COLOR, width: 40}}>
              {this.props.profileDetails.channel_configuration.CH6}
            </Text>
            {Platform.OS === 'ios' ? (
              <RN.Slider
                value={this.state.channel6Value}
                maximumValue={100}
                minimumValue={0}
                disabled
                onValueChange={value =>
                  this.setState({channel6Value: parseInt(value)})
                }
                style={{width: '57%', marginLeft: '1%', marginTop: -10}}
                thumbTintColor="#acd373"
                minimumTrackTintColor="#3F3F3F"
                maximumTrackTintColor="#B3B3B3"
              />
            ) : (
              <Slider
                value={this.state.channel6Value}
                maximumValue={100}
                minimumValue={0}
                disabled
                onValueChange={value =>
                  this.setState({channel6Value: parseInt(value)})
                }
                style={{width: '57%', marginLeft: '1%', marginTop: -10}}
                thumbTintColor="#acd373"
              />
            )}
            <Text style={{marginLeft: '1%', width: '20%'}}>
              {this.state.channel6Value}%
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              margin: 10,
              flex: 1,
            }}>
            <Button
              onPress={() => {
                reqData = {
                  profile_details: this.props.profileDetails,
                  CH1: this.state.channel1Value,
                  CH2: this.state.channel2Value,
                  CH3: this.state.channel3Value,
                  CH4: this.state.channel4Value,
                  CH5: this.state.channel5Value,
                  CH6: this.state.channel6Value,
                  preset: this.state.presetValue,
                  facility_id: this.props.info.gateway.facility.id,
                  facility_name: this.props.info.gateway.facility.facility_name,
                  container_id: this.props.info.gateway.container.id,
                  container_name: this.props.info.gateway.container
                    .container_name,
                  growarea_id: this.props.info.gateway.id,
                  growarea_name: this.props.info.gateway.grow_area_name,
                };

                console.log('reqData', reqData);
                this.props.applyNowGroupProfile(this.state.token, reqData);
              }}
              title="Apply now"
              buttonStyle={{
                marginTop: 0,
                marginLeft: 5,
                backgroundColor: Constant.PRIMARY_COLOR,
              }}
            />
            <Button
              onPress={() => {
                this.setState({
                  showSchedualModal: true,
                  startDate: 'Select a start date',
                  startTime: 'Select a start time',
                  endDate: 'Select a end date',
                  showStartDate: false,
                  showStartTime: false,
                  showEndDate: false,
                  selectedRepeatOptions: [],
                });
                console.log(
                  'this.state------------',
                  this.state.channel1Value,
                  this.state.channel2Value,
                  this.state.channel3Value,
                  this.state.channel4Value,
                  this.state.channel5Value,
                  this.state.channel6Value,
                );
              }}
              title="Schedule"
              buttonStyle={{
                marginTop: 0,
                marginLeft: 5,
                backgroundColor: Constant.PRIMARY_COLOR,
              }}
            />
          </View>
        </ScrollView>
      );
    }
  }

  formatDate = value => {
    let month =
      value.getMonth() + 1 < 10
        ? '0' + `${value.getMonth() + 1}`
        : `${value.getMonth() + 1}`; // get month
    let date =
      value.getDate() < 10 ? '0' + `${value.getDate()}` : `${value.getDate()}`;
    return month + '/' + date + '/' + value.getFullYear();
  };
  getTime = date => {
    return new Date(date).getUTCHours() + ':' + new Date(date).getUTCMinutes();
  };
  compareTime(date1, date2) {
    let time1 = new Date(date1).toLocaleTimeString();
    let time2 = new Date(date2).toLocaleTimeString();
    console.log('time string', time1, time2);
    time1 = time1.split(':'); // convert to array
    time2 = time2.split(':');

    // fetch
    var hours1 = Number(time1[0]);
    var hours2 = Number(time2[0]);
    var minutes1 = Number(time1[1]);
    var minutes2 = Number(time2[1]);
    console.log('second', hours1, hours2, minutes1, minutes2);

    if (hours1 === hours2) {
      console.log('step 1 in compare time');
      if (minutes1 === minutes2) {
        console.log('step 2 in compare time');
        return false;
      } else if (minutes1 < minutes2) {
        console.log('step 3 in compare time');
        return false;
      } else {
        console.log('step 4 in compare time');
        return true;
      }
    } else if (
      hours1 < hours2 &&
      this.compareDate(this.state.startDate, Date.now())
    ) {
      console.log('step 5 in compare time');
      return false;
    } else {
      console.log('step 6 in compare time');
      return true;
    }
  }

  compareDate(date1, date2) {
    date1 = new Date(date1).toLocaleDateString();
    date2 = new Date(date2).toLocaleDateString();

    let startDate = date1.split('/');
    let endDate = date2.split('/');

    console.log('stratdate----', startDate, endDate);

    let startDateMonth = Number(startDate[0]);
    let startDateDay = Number(startDate[1]);
    let startDateYear = Number(startDate[2]);
    let endDateMonth = Number(endDate[0]);
    let endDateDay = Number(endDate[1]);
    let endDateYear = Number(endDate[2]);

    if (startDateYear <= endDateYear) {
      console.log('step 1----------', startDateYear <= endDateYear);

      if (startDateMonth <= endDateMonth) {
        console.log(
          'step 2----------',
          startDateMonth <= endDateMonth,
          startDateYear <= endDateYear,
        );

        if (startDateDay <= endDateDay) {
          console.log(
            'step 3------------',
            startDateDay <= endDateDay,
            startDateMonth <= endDateMonth,
            startDateYear <= endDateYear,
          );
          return true;
        } else {
          console.log(
            'step 4------------',
            startDateDay <= endDateDay,
            startDateMonth <= endDateMonth,
            startDateYear <= endDateYear,
          );

          return false;
        }
      } else {
        console.log(
          'step 5------------',
          startDateDay <= endDateDay,
          startDateMonth <= endDateMonth,
          startDateYear <= endDateYear,
        );

        return true;
      }
    } else {
      console.log(
        'step 6------------',
        startDateDay <= endDateDay,
        startDateMonth <= endDateMonth,
        startDateYear <= endDateYear,
      );

      return true;
    }
  }

  compareDateAndTime(date1, date2, startTimeArg, endTimeArg) {
    date1 = new Date(date1).toLocaleDateString();
    date2 = new Date(date2).toLocaleDateString();

    let startDate = date1.split('/');
    let endDate = date2.split('/');

    console.log('stratdate----', startDate, endDate);

    let startDateMonth = Number(startDate[0]);
    let startDateDay = Number(startDate[1]);
    let startDateYear = Number(startDate[2]);
    let endDateMonth = Number(endDate[0]);
    let endDateDay = Number(endDate[1]);
    let endDateYear = Number(endDate[2]);

    let time1 = new Date(startTimeArg).toLocaleTimeString();
    let time2 = new Date(endTimeArg).toLocaleTimeString();
    console.log('time string', time1, time2);
    time1 = time1.split(':'); // convert to array
    time2 = time2.split(':');

    // fetch
    var hours1 = Number(time1[0]);
    var hours2 = Number(time2[0]);
    var minutes1 = Number(time1[1]);
    var minutes2 = Number(time2[1]);
    console.log('second', hours1, hours2, minutes1, minutes2);
    if (startDateYear === endDateYear) {
      console.log('step 1----------', startDateYear <= endDateYear);

      if (startDateMonth === endDateMonth) {
        console.log(
          'step 2----------',
          startDateMonth <= endDateMonth,
          startDateYear <= endDateYear,
        );

        if (startDateDay === endDateDay) {
          console.log(
            'step 3------------',
            startDateDay <= endDateDay,
            startDateMonth <= endDateMonth,
            startDateYear <= endDateYear,
          );

          if (hours1 === hours2) {
            console.log('step 1 in compare date and time');
            if (minutes1 === minutes2) {
              console.log('step 2 in compare  date and time');
              return true;
            } else if (minutes1 < minutes2) {
              console.log('step 3 in compare date and  time');
              return true;
            } else {
              console.log('step 4 in compare date and  time');
              return false;
            }
          } else if (
            hours1 < hours2 &&
            this.compareDate(this.state.startDate, Date.now())
          ) {
            console.log('step 5 in compare date and  time');
            return true;
          } else {
            console.log('step 6 in compare date and  time');
            return false;
          }
        } else if (startDateDay < endDateDay) {
          console.log(
            'step 7------------',
            startDateDay <= endDateDay,
            startDateMonth <= endDateMonth,
            startDateYear < endDateYear,
          );

          return false;
        } else {
          console.log(
            'step 4------------',
            startDateDay <= endDateDay,
            startDateMonth <= endDateMonth,
            startDateYear <= endDateYear,
          );

          return false;
        }
      }
      if (startDateMonth > endDateMonth) {
        console.log(
          'step 7------------',
          startDateDay <= endDateDay,
          startDateMonth <= endDateMonth,
          startDateYear < endDateYear,
        );

        return false;
      } else {
        console.log(
          'step 5------------',
          startDateDay <= endDateDay,
          startDateMonth <= endDateMonth,
          startDateYear <= endDateYear,
        );

        return true;
      }
    } else if (startDateYear > endDateYear) {
      return false;
    } else {
      console.log(
        'step 6------------',
        startDateDay <= endDateDay,
        startDateMonth <= endDateMonth,
        startDateYear <= endDateYear,
      );

      return true;
    }
  }

  schedualEvent() {
    console.log(
      'else part of start date === current date',
      +new Date(this.state.startDate) === +new Date(Date.now()),
    );

    let start_date = this.formatDate(new Date(this.state.startDate));
    let end_date =
      this.state.selectedRepeatOptions.length !== 0
        ? this.formatDate(new Date(this.state.endDate))
        : null;

    reqData = {
      profile_details: this.props.profileDetails,
      start_date,
      start_time: this.getTime(this.state.startTime),
      repeat_time: this.state.selectedRepeatOptions,
      end_date,
      end_time: null,
      CH1: this.state.channel1Value,
      CH2: this.state.channel2Value,
      CH3: this.state.channel3Value,
      CH4: this.state.channel4Value,
      CH5: this.state.channel5Value,
      CH6: this.state.channel6Value,
      preset: this.state.presetValue,
      facility_id: this.props.info.gateway.facility.id,
      facility_name: this.props.info.gateway.facility.facility_name,
      container_id: this.props.info.gateway.container.id,
      container_name: this.props.info.gateway.container.container_name,
      growarea_id: this.props.info.gateway.id,
      growarea_name: this.props.info.gateway.grow_area_name,
    };

    this.setState({
      showSchedualModal: false,
    });
    console.log('l;l;l;l;');

    console.log('paylaod----', reqData);
    this.props.eventGroupProfile(this.state.token, reqData);
  }

  renderModal() {
    return (
      <Modal
        animationType="slide"
        transparent
        visible={this.state.showSchedualModal}
        onRequestClose={() => {
          this.setState({showSchedualModal: false});
        }}>
        <View
          style={{
            backgroundColor: '#rgba(0,0,0,0.75)',
            justifyContent: 'center',
            flex: 1,
            position: 'relative',
          }}>
          <View style={{backgroundColor: '#fff'}}>
            <View style={{marginTop: 20, backgroundColor: '#fff'}}>
              <Text style={{color: '#000', fontSize: 24, padding: 5}}>
                Schedule Profile
              </Text>
              <View
                style={{height: 1, marginTop: 10, backgroundColor: '#000'}}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 5,
                }}>
                <View style={{width: '45%'}}>
                  <Text>Start Date:</Text>
                  <Button
                    title={
                      this.state.startDate === 'Select a start date'
                        ? 'Select a start date'
                        : this.formatDate(new Date(this.state.startDate))
                    }
                    onPress={() => {
                      this.setState({
                        showStartDate: true,
                      });
                    }}
                    buttonStyle={{backgroundColor: Constant.GREY_TEXT_COLOR}}
                  />
                  <DateTimePicker
                    isVisible={this.state.showStartDate}
                    titleIOS="Pick a start date"
                    minimumDate={new Date(Date.now())}
                    date={
                      typeof this.state.startDate === 'string'
                        ? new Date(Date.now())
                        : this.state.startDate
                    }
                    onConfirm={date => {
                      console.log(
                        'start date',
                        typeof 'date',
                        typeof date,
                        date,
                      );
                      this.setState({
                        startDate: date,
                        showStartDate: false,
                        endDate: 'Select a end date',
                      });
                    }}
                    onCancel={() => {
                      this.setState({
                        showStartDate: false,
                      });
                    }}
                  />
                </View>
                <View style={{width: '45%'}}>
                  <Text>Start Time:</Text>
                  <Button
                    title={
                      this.state.startTime === 'Select a start time'
                        ? this.state.startTime
                        : this.formatStandardTime(this.state.startTime)
                    }
                    onPress={() => {
                      this.setState({
                        showStartTime: true,
                      });
                    }}
                    buttonStyle={{backgroundColor: Constant.GREY_TEXT_COLOR}}
                  />
                  <DateTimePicker
                    isVisible={this.state.showStartTime}
                    titleIOS="Pick a start time"
                    onConfirm={date => {
                      console.log(
                        'start time',
                        date,
                        new Date(date).toLocaleTimeString(),
                      );

                      this.setState({startTime: date, showStartTime: false});
                    }}
                    onCancel={() => {
                      this.setState({
                        showStartTime: false,
                      });
                    }}
                    mode={'time'}
                    is24Hour={true}
                  />
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: 5,
                }}>
                <Text style={{marginBottom: 5}}>Repeat:</Text>
                <MultiSelect
                  ref={component => {
                    this.multiSelect = component;
                  }}
                  items={
                    this.state.repeatOccurence.length > 0
                      ? this.state.repeatOccurence
                      : []
                  }
                  uniqueKey="repeatValue"
                  hideTags
                  onSelectedItemsChange={repeatOptions => {
                    if (repeatOptions.includes('Everyday')) {
                      if (
                        repeatOptions.length ===
                          this.state.repeatOccurence.length - 1 &&
                        this.state.repeatOccurence.length ===
                          this.state.selectedRepeatOptions.length
                      ) {
                        repeatOptions.splice(
                          repeatOptions.indexOf('Everyday'),
                          1,
                        );
                        this.setState({selectedRepeatOptions: repeatOptions});
                      } else {
                        this.setState({
                          selectedRepeatOptions: this.state.everydaySelected,
                        });
                      }
                    } else if (
                      !repeatOptions.includes('Everyday') &&
                      this.state.selectedRepeatOptions.includes('Everyday') &&
                      this.state.selectedRepeatOptions.length ===
                        this.state.repeatOccurence.length &&
                      repeatOptions.length ===
                        this.state.repeatOccurence.length - 1
                    ) {
                      this.setState({selectedRepeatOptions: []});
                    } else {
                      if (
                        repeatOptions.length ===
                        this.state.repeatOccurence.length - 1
                      ) {
                        this.setState({
                          selectedRepeatOptions: this.state.everydaySelected,
                        });
                      } else {
                        this.setState({selectedRepeatOptions: repeatOptions});
                      }
                    }
                  }}
                  selectedItems={this.state.selectedRepeatOptions}
                  selectText="Pick repeat option"
                  searchInputPlaceholderText="Search..."
                  onAddItem={text => {
                    console.log('OnAddItem called');
                    console.log(text);
                  }}
                  tagRemoveIconColor="#CCC"
                  tagBorderColor="#CCC"
                  tagTextColor="#CCC"
                  selectedItemTextColor="#CCC"
                  selectedItemIconColor="#CCC"
                  itemTextColor="#000"
                  displayKey="repeatValue"
                  hideSubmitButton
                  searchInputStyle={{color: '#CCC'}}
                />
              </View>
              {this.state.selectedRepeatOptions.length !== 0 ? (
                <View style={{padding: 5, width: '45%'}}>
                  <Text>End Date: </Text>
                  <Button
                    title={
                      this.state.endDate === 'Select a end date'
                        ? this.state.endDate
                        : this.formatDate(new Date(this.state.endDate))
                    }
                    onPress={() => {
                      this.setState({
                        showEndDate: true,
                      });
                    }}
                    buttonStyle={{backgroundColor: Constant.GREY_TEXT_COLOR}}
                  />
                  <DateTimePicker
                    titleIOS="Pick a end date"
                    isVisible={this.state.showEndDate}
                    date={
                      typeof this.state.startDate === 'string'
                        ? new Date(Date.now())
                        : this.state.startDate
                    }
                    minimumDate={
                      typeof this.state.startDate === 'string'
                        ? new Date(Date.now())
                        : this.state.startDate
                    }
                    onConfirm={date => {
                      console.log('end date', typeof 'date', typeof date, date);
                      this.setState({endDate: date, showEndDate: false});
                    }}
                    onCancel={() => {
                      this.setState({
                        showEndDate: false,
                      });
                    }}
                  />
                </View>
              ) : (
                <View />
              )}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  margin: 5,
                  alignItems: 'center',
                }}>
                <Button
                  onPress={() => {
                    console.log(
                      'current date ',
                      this.compareDate(this.state.startDate, Date.now()),
                      'current time ',
                      +new Date(this.state.startDate) ===
                        +new Date(Date.now()) &&
                        this.compareTime(this.state.startTime, Date.now()),
                      'same time',
                      new Date(this.state.startTime),
                      new Date(Date.now()),
                      this.compareTime(this.state.startTime, Date.now()),
                    );
                    if (typeof this.state.startDate === 'string') {
                      alert('Please select start date.');
                    } else if (typeof this.state.startTime === 'string') {
                      alert('please select start time');
                    } else if (this.state.selectedRepeatOptions.length !== 0) {
                      if (typeof this.state.endDate === 'string') {
                        alert('Please select end date.');
                      } else {
                        this.schedualEvent();
                      }
                    } else if (
                      this.compareDateAndTime(
                        this.state.startDate,
                        Date.now(),
                        this.state.startTime,
                        Date.now(),
                      )
                    ) {
                      alert(
                        'Please select greater value then current Date & Time',
                      );
                    } else {
                      this.schedualEvent();
                    }
                  }}
                  title="Apply"
                  buttonStyle={{
                    marginHorizontal: 5,
                    paddingHorizontal: 15,
                    backgroundColor: Constant.PRIMARY_COLOR,
                  }}
                />
                <Button
                  onPress={() => {
                    this.setState({showSchedualModal: false});
                  }}
                  title="Cancel"
                  buttonStyle={{backgroundColor: Constant.PRIMARY_COLOR}}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  render() {
    if (this.props.retry401Count === 20 && !this.state.enabled401) {
      this.setState({showSchedualModal: false, enabled401: true});
    }
    getDetailBlockTitleStyle = function(title) {
      var fontSize = 36;
      var multiplier = 2.5 - (title.length - 16) * 0.125;

      if (title.length > 15 && title.length <= 25)
        fontSize = fontSize - multiplier * (title.length - 15);
      else if (title.length > 25) fontSize = 19.5;

      return {
        marginLeft: 10,
        marginRight: 10,
        fontSize: fontSize,
        color: Constant.WHITE_TEXT_COLOR,
      };
    };

    if (this.props.profileDetailsLoader) {
      if (!this.state.isProfileDetailsLoaderSetted) {
        this.setState({
          profileDetailsLoader: true,
          isProfileDetailsLoaderSetted: true,
        });
      }
    } else {
      if (this.state.isProfileDetailsLoaderSetted) {
        this.setState({
          profileDetailsLoader: false,
          isProfileDetailsLoaderSetted: false,
        });
      }
    }

    return (
      <View style={styles.mainContainer}>
        <View style={styles.greenBackgroundContainer} />
        <View style={styles.detailBlock}>
          <Text style={styles.detailBlockTitleInfo}>Profile Name</Text>
          <Text
            numberOfLines={1}
            style={getDetailBlockTitleStyle(this.props.profileName)}>
            {this.props.profileName}
          </Text>
          <Text numberOfLines={3} style={styles.locationTitleInfo}>
            Description: {this.props.description}
            {console.log(
              'loader',
              this.props.profileDetailsLoader,
              this.state.profileDetailsLoader,
              this.state.isProfileDetailsLoaderSetted,
            )}
          </Text>
        </View>
        <View
          style={{
            margin: 10,
            marginTop: 15,
            elevation: 5,
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: 'black',
            shadowOpacity: 1,
          }}>
          <View
            style={{
              flexDirection: 'row',
              margin: 5,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{color: Constant.PRIMARY_COLOR}}>Preset: </Text>

            {Platform.OS === 'ios' ? (
              <RN.Slider
                value={this.state.presetValue}
                maximumValue={100}
                minimumValue={0}
                onValueChange={value => {
                  let ch1 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH1,
                      )) /
                    100;
                  let ch2 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH2,
                      )) /
                    100;
                  let ch3 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH3,
                      )) /
                    100;
                  let ch4 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH4,
                      )) /
                    100;
                  let ch5 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH5,
                      )) /
                    100;
                  let ch6 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH6,
                      )) /
                    100;

                  console.log(
                    'ch1 ----->  value * this.props.profileDetails.channel_values.CH1) /100',
                    value,
                    this.props.profileDetails.channel_values.CH1,
                    ch1,
                  );

                  this.setState({
                    presetValue: Math.round(value),
                    channel1Value: Math.round(ch1),
                    channel2Value: Math.round(ch2),
                    channel3Value: Math.round(ch3),
                    channel4Value: Math.round(ch4),
                    channel5Value: Math.round(ch5),
                    channel6Value: Math.round(ch6),
                  });
                }}
                style={{
                  width: '65%',
                  color: 'red',
                  marginLeft: 10,
                  marginTop: 0,
                }}
                thumbTintColor="#acd373"
                trackStyle={{color: 'red'}}
                minimumTrackTintColor="#3F3F3F"
                maximumTrackTintColor="#B3B3B3"
              />
            ) : (
              <Slider
                value={this.state.presetValue}
                maximumValue={100}
                minimumValue={0}
                onValueChange={value => {
                  let ch1 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH1,
                      )) /
                    100;
                  let ch2 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH2,
                      )) /
                    100;
                  let ch3 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH3,
                      )) /
                    100;
                  let ch4 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH4,
                      )) /
                    100;
                  let ch5 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH5,
                      )) /
                    100;
                  let ch6 =
                    (Math.round(value) *
                      Math.round(
                        this.props.profileDetails.channel_values.CH6,
                      )) /
                    100;

                  console.log(
                    'ch1 ----->  value * this.props.profileDetails.channel_values.CH1) /100',
                    value,
                    this.props.profileDetails.channel_values.CH1,
                    ch1,
                  );

                  this.setState({
                    presetValue: Math.round(value),
                    channel1Value: Math.round(ch1),
                    channel2Value: Math.round(ch2),
                    channel3Value: Math.round(ch3),
                    channel4Value: Math.round(ch4),
                    channel5Value: Math.round(ch5),
                    channel6Value: Math.round(ch6),
                  });
                }}
                style={{
                  width: '65%',
                  color: 'red',
                  marginLeft: 10,
                  marginTop: 0,
                }}
                thumbTintColor="#acd373"
                trackStyle={{color: 'red'}}
              />
            )}
            <Text style={{marginLeft: 5}}>{this.state.presetValue}%</Text>
          </View>
        </View>
        <View
          style={{
            margin: 10,
            paddingTop: 10,
            paddingBottom: 10,
            flex: 2,
            elevation: 5,
            backgroundColor: '#fff',
            shadowColor: 'black',
            shadowOpacity: 1,
          }}>
          <Text style={{marginLeft: 20}}>Channel Configuration</Text>

          {this.props.profileDetailsLoader ? (
            <View
              style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
              <ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} />
            </View>
          ) : (
            this.renderLEDControls()
          )}
          {this.renderModal()}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  greenBackgroundContainer: {
    backgroundColor: Constant.PRIMARY_COLOR,
    width: '100%',
    height: '15%',
    position: 'absolute',
  },
  detailBlock: {
    backgroundColor: '#636363',
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 5,
    flexDirection: 'column',
    maxHeight: '50%',
  },
  detailBlockTitleInfo: {
    marginLeft: 10,
    marginTop: 10,
    color: Constant.WHITE_TEXT_COLOR,
  },
  detailBlockTitle: {
    marginLeft: 10,
    marginRight: 10,
    fontSize: 36,
    color: Constant.WHITE_TEXT_COLOR,
  },
  locationTitleInfo: {
    marginLeft: 10,
    marginBottom: 10,
    color: Constant.GREY_TEXT_COLOR,
  },
  detailIcon: {
    backgroundColor: '#78787878',
    height: 24,
    width: 24,
    borderRadius: 12,
    marginLeft: 5,
  },
  locationInfo: {
    marginLeft: 4,
    marginRight: 10,
    fontSize: 12,
    fontWeight: 'bold',
    color: Constant.WHITE_TEXT_COLOR,
  },
  roundButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    borderRadius: 16,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 12,
    marginLeft: 7,
    color: Constant.WHITE_TEXT_COLOR,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const mapStateToProps = state => {
  const {profileDetails, profileDetailsLoader} = state.LEDGroupProfile;
  const {retry401Count} = state.auth;

  return {profileDetails, profileDetailsLoader, retry401Count};
};

export default connect(
  mapStateToProps,
  {getProfileDetails, applyNowGroupProfile, eventGroupProfile},
)(GroupProfileControl);
