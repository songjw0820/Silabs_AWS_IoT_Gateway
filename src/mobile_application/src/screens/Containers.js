import React, { Component } from 'react';
import {
  RefreshControl, StyleSheet, Text, View, FlatList, ActivityIndicator,
  TouchableOpacity, ScrollView, Platform, AsyncStorage
} from 'react-native';
import * as Constant from '../Constant';
import { connect } from 'react-redux';
import { getContainers, setContainers } from '../store/actions/rootActions';
import { debug } from './../../app.json';
import { SearchBar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Navigation } from 'react-native-navigation';

class Containers extends Component {

  static get options() {
    return Constant.DEFAULT_NAVIGATOR_STYLE;
  }
  
  facilityId = null;
  visible = false;

  constructor(props) {
    super(props);
    this.state = {
      refreshing: false
    };
    Navigation.events().bindComponent(this);
    if (this.props.selectedFacility) {
      this.facilityId = this.props.selectedFacility.id;
    }
  }

  componentDidAppear() {
    this.visible = true;
    this.forceUpdate();
    this._onRefresh();
  }

  componentDidDisappear() {
    this.visible = false;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.visible);
  }

  _onRefresh = () => {
    this.setState({ refreshing: true, searching: false, filterKey: '' });
    
      AsyncStorage.multiGet(['accessToken', 'APPLE_LOGGED_IN']).then(response => {
        let token = response[0][1];
        let appleKey = response[1][1]
    Promise.resolve(this.props.onGetContainers(this.facilityId,false, false, token, appleKey)).then(() => {
      this.setState({ refreshing: false });
    });
  }).catch((e) => {
    console.log('error in componentDidAppearr in container', e.message);
    
  })
  }

  onListItemClickHandler = container => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'GrowAreasScreen',
        passProps: {
          selectedContainer: {
            id: container.id,
            name: container.container_name,
            facilityId: container.facility.id
          },
          selectedFacility: this.props.selectedFacility,
          visible: true
        },
        options: {
          topBar: {
            title: {
              text: container.container_name
            }
          }
        }
      }
    });

  }

  getListData() {
    let facilityId = this.facilityId;
    let data = facilityId ? this.props.containersByFacilityId[facilityId] : this.props.containers;
    if (this.state.filterKey) {
      const newData = data.filter(item => {
        const itemData = `${item.container_name.toUpperCase()}`;
        return itemData.indexOf(this.state.filterKey.toUpperCase()) > -1;
      });
      return newData;
    }
    return data;
  }

  onClearSearch = () => {
    this.setState({
      searching: false,
      filterKey: ''
    })
  }

  render() {
    console.log("Rendering containers");
    let facilityId = this.facilityId;
    let listData = this.getListData() || [];

    let containersList = (
      <FlatList
        data={listData}
        renderItem={(info) => (
          <TouchableOpacity onPress={() => this.onListItemClickHandler(info.item)}>
            <View style={(info.index === listData.length - 1) ? [styles.listItem, {
              borderBottomWidth: 2
            }] : styles.listItem}>
              <Text>{debug ? info.item.id + '-' : ''}{info.item.container_name}</Text>
            </View>
          </TouchableOpacity>
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

    if (this.props.isLoading) {
      containersList = <View style={styles.activityIndicator}><ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /></View>;
    } else if (listData.length === 0) {
      containersList = (
        <ScrollView contentContainerStyle={styles.activityIndicator}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh}
              colors={['red', 'green', 'blue']}
            />
          }>
          <Text color="#00ff00">No containers found.</Text>
        </ScrollView>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.greenBackgroundContainer} />
        <View style={styles.listContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.listTitle, { flex: 1 }]}> Containers</Text>
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
          {this.state.searching &&
            <SearchBar
              ref={search => this.search = search}
              value={this.state.filterKey}
              lightTheme
              onChangeText={(filterKey) => this.setState({ filterKey })}
              onClear={() => this.onClearSearch()}
              placeholder='Search container...'
              containerStyle={{ backgroundColor: Constant.LIGHT_GREY_COLOR, padding: 2 }}
              inputContainerStyle={{ backgroundColor: Constant.WHITE_BACKGROUND_COLOR }}
              inputStyle={{ fontSize: 16 }} />
          }
          {containersList}
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
  listTitle: {
    padding: 10,
    fontWeight: 'bold',
    borderBottomColor: Constant.LIGHT_GREY_COLOR
  },
  listItem: {
    width: "100%",
    borderTopWidth: 2,
    borderColor: Constant.LIGHT_GREY_COLOR,
    padding: 10,
    flexDirection: "row",
    alignItems: "center"
  },
  activityIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});

mapStatesToProps = state => {
  return {
    containers: state.root.containers,
    containersByFacilityId: state.root.containersByFacilityId,
    isLoading: state.ui.isLoading
  }
};

mapDispatchToProps = dispatch => {
  return {
    onGetContainers: (facilityId, inBackground, showAlert,token, appleKey) => dispatch(getContainers(facilityId, inBackground, showAlert,token, appleKey))
  }
};

export default connect(mapStatesToProps, mapDispatchToProps)(Containers);